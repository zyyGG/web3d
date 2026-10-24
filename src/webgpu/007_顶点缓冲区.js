/**
 * 存储缓冲已经可以做到类似于顶点缓冲的效果了,
 * 但是传统中的顶点缓冲还是依然存在.
 * 顶点缓冲和其他的webGpu缓冲区起始差不多, 都是保存数据. 
 * 我们告诉webgpu缓冲区中的数据类型, 位置和组织方式. 然后, webgpu会从缓冲区中提取数据并提供给我们
 */

/**
 * 创建一个示例, 
 * 使用顶点缓冲区创建一个矩形
 */
(async () => {
  // dom
  const app = document.querySelector("#app");
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  app.appendChild(canvas);
  // 初始化
  const adaper = await navigator.gpu.requestAdapter()
  const device = await adaper.requestDevice()
  const context = canvas.getContext("webgpu")
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device: device,
    format: presentationFormat
  })

  // module
  const module = device.createShaderModule({
    code: /* wgsl */`
      struct Vertex {
        @location(0) position: vec2f,
      }
      struct VSOut {
        color: vec4f,
      }

      @group(0) @binding(0)
      var<uniform> vsOut: VSOut
    `
  })
})()
