import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);


const width = window.innerWidth
const height = window.innerHeight

// 初始化画布
const canvas = document.createElement('canvas')
canvas.width = width
canvas.height = height
const gl = canvas.getContext('webgl2')
if (!gl) {
  window.alert('WebGL2 not supported')
  throw new Error('WebGL2 not supported')
}
gl.viewport(0, 0, width, height)
gl.clearColor(0.0, 0.0, 0.0, 1.0) // 黑色背景
gl.clear(gl.COLOR_BUFFER_BIT)
const app = document.getElementById('app')
app.appendChild(canvas)

// mesh 顶点
const shape = new Float32Array([
  // 左边
  0, 0, 1, 
  30, 0, 1,
  0, 150, 1,
  0, 150, 1,
  30, 0, 1,
  30, 150, 1,

  // 上边
  30, 120, 1,
  100, 120, 1,
  30, 150, 1,
  30, 150, 1,
  100, 120, 1,
  100, 150, 1,
  
  // 中间
  30, 60, 1,
  70, 60, 1,
  30, 90, 1,
  30, 90, 1,
  70, 60, 1,
  70, 90, 1,
])

// shader
const vertexShaderSource = /*glsl*/`
  attribute vec3 position;

  uniform vec2 uResolution;
  uniform vec2 uTranslation;

  void main() {
    vec2 zeroToOne = (position.xy + uTranslation) / uResolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace, 0, 1);
  }
`

const fragmentShaderSource = /*glsl*/`
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`

const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vertexShaderSource)
gl.compileShader(vertexShader)

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fragmentShaderSource)
gl.compileShader(fragmentShader)

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)
gl.useProgram(program) // 使用着色程序

// 传递顶点数据
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, shape, gl.STATIC_DRAW)

// 获取 attribute 位置
const positionAttributeLocation = gl.getAttribLocation(program, 'position')

// 启用 attribute
gl.enableVertexAttribArray(positionAttributeLocation)
gl.vertexAttribPointer(
  positionAttributeLocation,
  3, // size 每个属性有多少个分量组成
  gl.FLOAT, // type 数据类型
  false, // normalize 是否归一化
  0, // stride 步长
  0 // offset 偏移量
)

// 传递uniform 数据
const resolutionUniformLocation = gl.getUniformLocation(program, 'uResolution')
gl.uniform2f(resolutionUniformLocation, width, height)

// 位移
const translate = { x: 0, y: 0 }
const translationUniformLocation = gl.getUniformLocation(program, 'uTranslation')
gl.uniform2f(translationUniformLocation, translate.x, translate.y)
console.log(translationUniformLocation)
function updateTranslation(){
  
  gl.uniform2f(translationUniformLocation, translate.x, translate.y)
}

gui.add(translate, 'x', 0, width).onChange(updateTranslation)
gui.add(translate, 'y', 0, height).onChange(updateTranslation)

// 绘制
gl.drawArrays(gl.TRIANGLES, 0, shape.length / 3)


// 循环渲染
function animation(){
  requestAnimationFrame(animation)
  stats.update()
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, shape.length / 3)
}

animation()

