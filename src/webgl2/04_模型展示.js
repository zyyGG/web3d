import { createShader, createProgram } from "./webgl2/utils"
import { createSampleShape } from "./webgl2/utils"

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
gl.enable(gl.DEPTH_TEST)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) // 清空颜色缓冲区

const vertexShaderSource = 
/* glsl */ `#version 300 es
in vec4 pos;
in vec3 normal;
in vec2 uv;

out vec3 vNormal;

void main() {
  float cameraDistance = 2.0;
  float near = 0.1;
  float far = 10.0;
  float d = cameraDistance - pos.z;

  float zClip =
    (far + near) / (far - near) * d
    - (2.0 * far * near) / (far - near);

  gl_Position = vec4(pos.x, pos.y, zClip, d);
  vNormal = normal;
}
`
const fragmentShaderSource = 
/* glsl */ `#version 300 es
precision highp float; // 高精度

out vec4 outColor;

in vec3 vNormal;

uniform float uTime;

void main() {
  // vec3 color = dot(vNormal, )
  float angle = uTime;
  vec3 lightDirection = vec3(cos(angle), 0.0, sin(angle)); // 平行光的传播方向
  float emLight = 0.1; // 环境光
  float diffuse = max(dot(normalize(vNormal), -lightDirection), emLight);
  vec3 color = vec3(1.0, 1.0, 0.0) * diffuse; //黄色 
  outColor = vec4(color, 1.0); 
}
`
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
const program = createProgram(gl, vertexShader, fragmentShader)

// 创建属性状态集合, 因为我们要告诉属性如何从状态缓冲区取出数据
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)



const model = createSampleShape(0.5, 1.5, 0.3)

const positionAttributeLocation = gl.getAttribLocation(program, "pos")
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.positions), gl.STATIC_DRAW)
gl.enableVertexAttribArray(positionAttributeLocation) // 得启用这个属性
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

const normalAttributeLocation = gl.getAttribLocation(program, "normal")
const normalBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normal), gl.STATIC_DRAW)
gl.enableVertexAttribArray(normalAttributeLocation) // 得启用这个属性
gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
// 创建buffer缓冲区数据

// uniform
const timeUniformLocation = gl.getUniformLocation(program, "uTime");
// gl.uniform1f(timeUniformLocation, 0.0)

// gl.ARRAY_BUFFER: 用于顶点属性数据的缓冲区
// gl.STATIC_DRAW: 数据不会或几乎不会改变

// 准备绘制
gl.useProgram(program)
gl.bindVertexArray(vao) //用哪个缓冲区和如何从缓冲区取出数据给到属性


let time = 0.0;
function render() {
  requestAnimationFrame(render);
  time += 0.01;

  // uniform更改
  gl.uniform1f(timeUniformLocation, time)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) // 清空颜色缓冲区
  gl.drawArrays(gl.TRIANGLES, 0, model.positions.length / 3) // 绘制三角形
}
render()
