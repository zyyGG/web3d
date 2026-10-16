async function main() {
  const adapter = await navigator.gpu?.requestAdapter()
  const device = await adapter?.requestDevice();
  if(!device) {
    console.warn("浏览器不支持gpu")
  }
  // 这里只是计算shader, 没到绘制画布的功能
  // const app = document.querySelector("#app")
  // const canvas = document.createElement("canvas")
  // canvas.width = window.innerWidth
  // canvas.height = window.innerHeight
  // app.appendChild(canvas)
  // const context = canvas.getContext('webgpu')
  // const prestationFormater = navigator.gpu.getPreferredCanvasFormat(); // 获取最适配的比例
  // context.configure({
  //   device: device, // 设置渲染器使用的设备
  //   prestationFormater: prestationFormater, // 设置canvas格式
  // })

  // 创建着色器模块
  const module = device.createShaderModule({
    label: "a demo computed shader",
    code: /* wgsl */`
      // 我们希望data变量类型是storage, 既能被读取, 也能被写入
      @group(0) @binding(0) var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3u
      ) {
        let i = id.x;
        data[i] = data[i] * 2.0;  
      }
    `,
  })

  // 创建流水线, 这里只使用了常见的着色器模块中的compute阶段
  const pipeline = device.createComputePipeline({
    label: 'doubling compute pipeline',
    layout: 'auto',
    compute: {
      module,
      entryPoint: 'computeSomething',
    }
  })

  // 创建一些数据
  const input = new Float32Array([1, 3, 5]); // 这个是js的数据, 

  // 在GPU上创建缓冲区来承载计算
  // input and output
  const workBuffer = device.createBuffer({
    label: 'work buffer',
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,  
  })
  // 数据复制到缓冲区
  // GPUBufferUsage.STOAGE: 表示希望这个缓冲区用作'storage'用途, shader中也写了类型是storage
  // GPUBufferUsage.COPY_DST: 表示希望能将数据复制到缓冲区
  // GPUBufferUsage.COPY_SRC: 表示希望能从缓冲区复制数据.
  device.queue.writeBuffer(workBuffer, 0, input)

  // 为了查看计算结果, 所以我们需要另外一个缓冲区
  // GPUBufferUsage.MAP_READ: 表示希望能够映射该缓冲区以读取数据.
  // GPUBufferUsage.COPY_DST: 表示希望能将数据复制到缓冲区
  const resultBuffer = device.createBuffer({
    label: "result buffer",
    size: input.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  })

  // 为了告诉着色器我们希望它在哪个缓冲区上工作, 我们需要创建一个bindGroup
  // 这里我们从管道中获取bindGroup的布局, 然后设置bindGroup的entries(入口)
  // 这里getBindGroupLayout(0) 对应着色器中的@group(0)
  // {binding: 0, ...} 对应着色器中的@group(0) @binding(0)
  const bindGroup = device.createBindGroup({
    label: "bindGroup for work buffer",
    layout: pipeline.getBindGroupLayout(0),
    entries: [{binding: 0, resource: workBuffer}],
  })

  // 开始对命令编码
  // 首先, 创建一个命令编码. 
  const encoder = device.createCommandEncoder({
    label: 'doubling encoder'
  })
  // 启动compute pass.
  const pass = encoder.beginComputePass({
    label: 'doubling compute pass'
  })
  // 给pass设置管道, bindGroup
  pass.setPipeline(pipeline)
  // 这里的0表示的是着色器重的@group(0)
  pass.setBindGroup(0, bindGroup)
  // 这里我们的input.length是3次, 所以就是告诉webgpu运行着色器3次
  pass.dispatchWorkgroups(input.length)
  // 结束compute pass
  pass.end()

  // 计算完毕, 然后就可以要求webgpu从workbuffer复制到resultbuffer中
  // 编码命令以复制结果到一个可映射的缓冲区
  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

  // 完成编码器以获取命令缓冲区, 然后提交该命令缓冲区
  const commandBuffer = encoder.finish()
  device.queue.submit([commandBuffer])

  // 映射结果缓冲区并获取数据副本
  // 想映射结果缓冲区, 得调用mapAsync并需要使用await 等待完成
  await resultBuffer.mapAsync(GPUMapMode.READ)
  // 映射完成后, 可以调用resultBuffer.getMappedRange()(无参数). 它会返回整个缓冲区的ArrayBuffer.
  // 我们把返回的结果放到Float32Array类型的数组视图中, 然后就可以查看数值了.
  // 有一个重要的细节是, getMappedRange返回的ArrayBuffer只在调用map之前有效. unmap之后,长度会被设置为0, 数据也就不可访问了
  const result = new Float32Array(resultBuffer.getMappedRange())

  console.log('input', input)
  console.log('result', result)
  resultBuffer.unmap()
}

main()