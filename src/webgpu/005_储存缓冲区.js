(async function () {
  const adaper = await navigator.gpu.requestAdapter()
  const device = await adaper.requestDevice()
  if(!device) return;
  const app = document.querySelector("#app");
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  app.appendChild(canvas);
  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: presentationFormat,
  });

  // shader module
  // 在很多方面, storage和uniform都是类似的.
  const module = device.createShaderModule({
    label: "default shader module",
    code: /* wgsl */`
      @group(0) @binding(0) var<storage, read> s_struct: vec4f;

      @vertex
      fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fs() -> @location(0) vec4f {
        return s_struct;
      }
    `
  })

  // 创建渲染通道
  const pipeline = device.createRenderPipeline({
    label: "storage buffer like uniform",
    layout: "auto",
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    }
  })

  // 创建buffer
  const uniformBufferSize = 4 * 4;

  const uniformBuffer = device.createBuffer({
    label: "uniform Buffers",
    size: uniformBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })
  const uniformValues = new Float32Array(uniformBufferSize / 4)
  uniformValues.set([1.0, 0.0, 0.0, 1.0], 0); // 0 是offset,  
  device.queue.writeBuffer(uniformBuffer, 0, uniformValues); // 给buffer 写入数据

  // 绑定grou
  const bindGroup = device.createBindGroup({
    label: "bind group",
    layout: pipeline.getBindGroupLayout(0), //  
    entries: [
      { binding: 0, resource: uniformBuffer },
    ]
  })

  /**@type {GPURenderPassDescriptor}  */
  const renderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [{
      // view: <- to be filled out when we render
      view: context.getCurrentTexture().createView(),
      clearValue: [1.0, 1.0, 0.0, 1.0],
      loadOp: "clear",
      storeOp: 'store', 
    }]
  }

  // 创建编码器
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass(renderPassDescriptor)
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup);
  pass.draw(3) // 
  pass.end() // pass 结束

  const commandBuffer = encoder.finish() // 编码器编写结束
  device.queue.submit([commandBuffer]) // 把准备的命令提交


  // renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()

  // encod
})()

