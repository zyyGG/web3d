import { checkGPU } from "./webgpu/utils"

/**
 * 基础知识的介绍,
 * Inter-stage变量是顶点着色器和片段着色器之间发挥作用
 * 当顶点着色器输出3个位置的时候, 一个三角形就会被光栅化. 顶点着色器可以在每个位置输出额外的值. 默认情况下, 这些值会在3个点之间插值
 */


async function main() {
  // 请求adapter
  const {adapter, device} = await checkGPU()
  // 创建渲染器
  const app = document.querySelector("#app")
  const canvas = document.createElement("canvas")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  app.appendChild(canvas)
  const context = canvas.getContext("webgpu")
  const presentationFormat  = navigator.gpu.getPreferredCanvasFormat() // 获取首选的canvas格式
  context.configure({
    device: device, // 设置渲染器使用的设备
    format: presentationFormat, // 设置canvas格式
  })

  // 创建着色器模块
  const module = device.createShaderModule({
    label: "our hardcoded rgb triangle shaders", // 着色器标题
    code: /* wgsl */`
      struct OurVertexShaderOutput{
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      }

      @vertex fn vs (
        @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        // 顶点
        let pos = array(
          vec2f(0.0, 0.5), // 顶部
          vec2f(-0.5, -0.5), // 左下
          vec2f(0.5, -0.5), // 右下
        );

        // 顶点颜色
        var color = array<vec4f, 3>(
          vec4f(1, 0, 0, 1), // red
          vec4f(0, 1, 0, 1), // green
          vec4f(0, 0, 1, 1), // blue
        )

        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        vsOutput.color = color[vertexIndex];
        return vsOutput
        // 返回顶点位置, 这里就像是在GLSL中使用gl_Position一样, 但是在wgsl中是返回值
        // return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
      
      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0); // 返回红色
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
    // 从当前画布上下文获取纹理并设置为目标纹理
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    // 创建命令编码器以开始编码命令
    const encoder = device.createCommandEncoder({label: "our encoder"})

    // 创建一个render pass 编码器来编码特定的命令
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline);
    pass.draw(3); // 3次调用我们的顶点着色器
    pass.end(); // 结束渲染通道编码

    // 
    const commandBuffer = encoder.finish(); // 完成编码并返回命令缓冲区
    device.queue.submit([commandBuffer]); // 提交命令缓冲区到GPU队列
  }

  // 执行渲染
  render()
}



main();