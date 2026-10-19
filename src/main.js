(async function() {
  // 初始化操作
  const adaper = await navigator.gpu.requestAdapter();
  const device = await adaper.requestDevice();
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

  
  // 创建着色器模块
  const module = device.createShaderModule({
    label: "our hardcoded red triangle shaders", // 着色器标题
    code: /* wgsl */`
      // 等下要使用的结构体
      struct OurStruct {
        color: vec4f,
        scale: vec2f,
        offset: vec2f,
      }

      // 声明传入的uniforms变量
      @group(0) @binding(0) var<uniform> ourStruct: OurStruct;

      @vertex fn vs (@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        // 顶点
        let pos = array(
          vec2f(0.0, 0.5), // 顶部
          vec2f(-0.5, -0.5), // 左下
          vec2f(0.5, -0.5), // 右下
        );
        // 返回顶点位置, 这里就像是在GLSL中使用gl_Position一样, 但是在wgsl中是返回值
        return vec4f(pos[vertexIndex] * ourStruct.scale + ourStruct.offset, 0.0, 1.0);
      }
      
      @fragment fn fs() -> @location(0) vec4f {
        return ourStruct.color;
      }
    `
  })

  // 制作渲染通道
  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red triangle pipeline", // 渲染管线标题
    layout: "auto", // 自动布局
    vertex: {
      module: module, // 顶点着色器模块
      entryPoint: "vs", // 顶点着色器入口点
    },
    fragment: {
      module: module, // 片段着色器模块
      entryPoint: "fs", // 片段着色器入口点
      // 设置渲染目标, 这里设置为canvas的首选格式
      targets: [
        { format: presentationFormat }
      ]
    }
  })

  // 创建缓冲区, 为其分配使用标志, 这样就可以与uniforms一起使用
  const uniformBufferSize = 
  4 * 4 + // color 是 4位32bits floats (4bytes/每个)
  2 * 4 + // scale 是 2位32bits floats (4bytes/每个)
  2 * 4 ; // offset 是2位32bits floats (4bytes/每个)
  const uniformBuffer = device.createBuffer({
    label: 'uniforms for triangle',
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const uniformValues = new Float32Array(uniformBufferSize / 4)

  // 创建
  const kColorOffset = 0;
  const kScaleOffset = 4;
  const kOffsetOffset = 6;

  uniformValues.set([0, 1, 0, 1], kColorOffset); // 设置颜色
  uniformValues.set([0, 0], kOffsetOffset); // 设置偏移

  // 如果想要着色器了解我们的缓冲区, 那么就需要创建一个绑定组,
  // 并且将缓冲区绑定到我们在着色器中设置的`@binding(?)`上
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: uniformBuffer}]
  })

  

  // 准备 GPURenderPassDescriptor, 用于描述渲染通道的配置
  const renderPassDescriptor = {
    label: "our basic canvas renderPass", // 渲染通道标题
    colorAttachments: [
      {
        // view: 
        clearValue: [0.3, 0.3, 0.3, 1], // 清除颜色
        loadOp: 'clear', // 加载操作, 清除颜色
        storeOp: 'store', // 存储操作, 存储颜色
      }
    ]
  }

  // 渲染操作
  function render() {
    // 在js侧设置uniform values
    const aspect = canvas.width / canvas.height;
    uniformValues.set([0.5 / aspect, 0.5], kScaleOffset); // 设置scale

    // 把js值复制到GPU
    // wrigeBuffer是数据复制到缓冲区的一种方法, 另外还有其他的方法,暂时不介绍
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues)


    // 从当前画布上下文获取纹理并设置为目标纹理
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    // 创建命令编码器以开始编码命令
    const encoder = device.createCommandEncoder({label: "our encoder"})

    // 创建一个render pass 编码器来编码特定的命令
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup); // 设置刚才创建的uniform 绑定组
    pass.draw(3); // 3次调用我们的顶点着色器
    pass.end(); // 结束渲染通道编码

    // 
    const commandBuffer = encoder.finish(); // 完成编码并返回命令缓冲区
    device.queue.submit([commandBuffer]); // 提交命令缓冲区到GPU队列
  }

  // 执行渲染
  render()
})()