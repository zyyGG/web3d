/**
 * 这里介绍并且展示, module是可以分离的.
 */

(async function () {
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

  // 创建vertex module
  const vsModule = device.createShaderModule({
    label: `default vsModule`,
    code: /* wgsl */`
      struct OurVertexShaderOutput{
        @builtin(position) position: vec4f,
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> OurVertexShaderOutput {
        let pos = array(
          vec2f(0.0, 0.5), // 顶部
          vec2f(-0.5, -0.5), // 左下
          vec2f(0.5, -0.5), // 右下
        );

        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex], 0.0, 1.0); // 这里1.0 是w分量,一般默认就是1.0
        return vsOutput;
      }
    `
  })

  // 创建 fragment module
  const fsModule = device.createShaderModule({
    label: 'default fragmentModule',
    code: /* wgsl */`
      @fragment fn fs(@builtin(position) pixelPosition: vec4f) -> @location(0) vec4f {
        let red = vec4f(1, 0, 0, 1);
        let cyan = vec4f(0, 1, 1, 1);

        let grid = vec2u(pixelPosition.xy) / 8; // 除以8来建立网格
        let checker = (grid.x + grid.y) % 2 == 1; // 网格判断, 给下面的select当作参数, 

        return select(red, cyan, checker);
      }
    `
  })

  // 创建渲染管道
  const pipeline = device.createRenderPipeline({
    label: "default pipeline", // 渲染管线标题
    layout: "auto", // 自动布局
    vertex: {
      module: vsModule, // 顶点着色器模块
    },
    fragment: {
      module: fsModule, // 片段着色器模块
      // 设置渲染目标, 这里设置为canvas的首选格式
      targets: [
        { format: presentationFormat }, 
      ]
    }
  })

  // 用于描述渲染通道的配置
  const renderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  }

  function render() {
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    const encoder = device.createCommandEncoder({label: 'default encoder'})
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    pass.draw(3)
    pass.end()

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  render()
})();
