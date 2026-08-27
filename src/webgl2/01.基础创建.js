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

void main() {
  gl_Position = aPosition;
}
`
const fragmentShaderSource = 
/* glsl */ `#version 300 es
precision highp float; // 高精度

out vec4 outColor;

void main() {
  outColor = vec4(1.0, 1.0, 0.0, 1.0); // 黄色
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
  0, 0.5,
  0.7, 0,
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

/**
 * 总结:
 * 这里得知道我们最终转换到了屏幕坐标空间[-1, 1],
 * 所以第一次画面中的三角形的直角顶点是在屏幕正中间,
 */