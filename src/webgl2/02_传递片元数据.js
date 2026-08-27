import { createShader, createProgram } from "./webgl2/utils"

// 初始化canvas
const app = document.querySelector("#app")
const canvas = document.createElement("canvas")
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.aspectRatio = `${window.innerWidth} / ${window.innerHeight}`
const dpr = window.devicePixelRatio || 1
canvas.width = window.innerWidth * dpr
canvas.height = window.innerHeight * dpr
canvas.style.width = `${window.innerWidth}px`
canvas.style.height = `${window.innerHeight}px`
app.appendChild(canvas)

// 初始化webgl2上下文
const gl = canvas.getContext("webgl2")

// 准备屏幕相关的参数
gl.viewport(0, 0, gl.canvas.width , gl.canvas.height) // 设置视口
gl.clearColor(0, 0, 0, 1.0) // 设置清空颜色缓冲区的颜色
gl.clear(gl.COLOR_BUFFER_BIT) // 清空颜色缓冲区

const vertexShaderSource = 
/* glsl */ `#version 300 es
in vec4 aPosition;
out vec2 vPosition;

uniform vec2 uResolution;

void main() {
  vec2 clipPos = (aPosition.xy / uResolution) * 2.0 - 1.0; // 把[0, 1]区间转到[-1, 1]区间
  clipPos = clipPos + vec2(0.2, 0.5) * 2.0; // 平移
  vPosition = clipPos * 0.5 + 0.5;
  clipPos = clipPos * vec2(1.0, -1.0); // 翻转y轴, 因为WebGL的y轴是向上的, 而像素坐标的y轴是向下的
  // clipPos.y *= -1.0; // 翻转y轴, 因为WebGL的y轴是向上的, 而像素坐标的y轴是向下的
  gl_Position = vec4(clipPos, 0.0, 1.0);
}
`
const fragmentShaderSource = 
/* glsl */ `#version 300 es
precision highp float; // 高精度

out vec4 outColor;
in vec2 vPosition;

void main() {
  outColor = vec4(vPosition, 1.0, 1.0); // 黄色
}
`
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
const program = createProgram(gl, vertexShader, fragmentShader)

const positionAttributeLocation = gl.getAttribLocation(program, "aPosition")
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
// 创建buffer缓冲区数据
const positions = [
  0, 0,
  0, 200,
  300, 0,
  300, 0,
  0, 200,
  300, 200,
]
// gl.ARRAY_BUFFER: 用于顶点属性数据的缓冲区
// gl.STATIC_DRAW: 数据不会或几乎不会改变
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)


// 创建属性状态集合, 因为我们要告诉属性如何从状态缓冲区取出数据
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(positionAttributeLocation) // 得启用这个属性
gl.vertexAttribPointer(
  positionAttributeLocation, // 属性位置
  2, // 每个顶点属性的组件数量
  gl.FLOAT, // 数据类型
  false, // 是否归一化
  0, // 步长
  0 // 偏移量
)

// 准备绘制
gl.useProgram(program)
gl.bindVertexArray(vao) //用哪个缓冲区和如何从缓冲区取出数据给到属性
gl.drawArrays(gl.TRIANGLES, 0, 3) // 绘制三角形

// uniformbuffer
const resolutionUniformLocation = gl.getUniformLocation(program, "uResolution")
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

function animation() {
  requestAnimationFrame(animation)
  gl.clear(gl.COLOR_BUFFER_BIT) // 清空颜色缓冲区
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2) // 绘制三角形
}

animation()