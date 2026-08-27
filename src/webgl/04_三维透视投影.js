import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { BoxGeometry } from "/src/webgl/utils/Geometry.js";
import MathUtils from "/src/webgl/utils/MathUtils.js";

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

// shader
const vertexShaderSource = /*glsl*/`
  attribute vec3 position;

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 1);
  }
`

const fragmentShaderSource = /*glsl*/`
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`
const shape = new BoxGeometry(1, 1, 1).vertexs

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

const params = {
  // 透视投影参数
  top: 0,
  bottom: height,
  left: 0,
  right: width,
  near: 0.1,
  far: 1000,
  fieldOfViewRadians: 75, 

  // 模型变换参数
  x: 0,
  y: 0,
  z: 0,
  xRot: 0,
  yRot: 0,
  zRot: 0,
  xScale: 1,
  yScale: 1,
  zScale: 1,

  // 视图变换参数
  eyeX: 0,
  eyeY: 0,
  eyeZ: 10,
  centerX: 0,
  centerY: 0,
  centerZ: 0,
  upX: 0,
  upY: 1,
  upZ: 0,
}


// 绘制
gl.drawArrays(gl.TRIANGLES, 0, shape.length / 3)
updateUniforms()


function updateUniforms(){
  // 模型变换
  let modelMatrix = MathUtils.m4Multiply(
    // x 旋转
    [
      1, 0, 0, 0,
      0, Math.cos(MathUtils.degToRad(params.xRot)), -Math.sin(MathUtils.degToRad(params.xRot)), 0,
      0, Math.sin(MathUtils.degToRad(params.xRot)), Math.cos(MathUtils.degToRad(params.xRot)), 0,
      0, 0, 0, 1,
    ],
    // y 旋转
    [
      Math.cos(MathUtils.degToRad(params.yRot)), 0, Math.sin(MathUtils.degToRad(params.yRot)), 0,
      0, 1, 0, 0,
      -Math.sin(MathUtils.degToRad(params.yRot)), 0, Math.cos(MathUtils.degToRad(params.yRot)), 0,
      0, 0, 0, 1,
    ],
    // z 旋转
    [
      Math.cos(MathUtils.degToRad(params.zRot)), -Math.sin(MathUtils.degToRad(params.zRot)), 0, 0,
      Math.sin(MathUtils.degToRad(params.zRot)), Math.cos(MathUtils.degToRad(params.zRot)), 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ],
    // 缩放
    [
      params.xScale, 0, 0, 0,
      0, params.yScale, 0, 0,
      0, 0, params.zScale, 0,
      0, 0, 0, 1,
    ],
    // 平移
    [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      params.x, params.y, params.z, 1,
    ],
    
  )
  
  // 视图变换
  let viewMatrix = MathUtils.m4Multiply(
    // 上方向量
    [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -params.eyeX, -params.eyeY, -params.eyeZ, 1,
    ],
    [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
  )
  const fov = Math.tan(Math.PI * 0.5 - 0.5 * params.fieldOfViewRadians)
  const aspect = width / height
  const rangeInv = 1.0 / (params.near - params.far)
  // 透视投影
  const projectionMatrix = new Float32Array([
    fov / aspect, 0, 0, 0,
    0, fov, 0, 0,
    0, 0, (params.near + params.far) * rangeInv, -1,
    0, 0, params.near * params.far * rangeInv * 2, 0,
  ])
  // // 正交变化
  // const projectionMatrix = new Float32Array([
  //   2 / (params.right - params.left), 0, 0, 0,
  //   0, 2 / (params.bottom - params.top), 0, 0,
  //   0, 0, 2 / (params.far - params.near), 0,

  //   -(params.right + params.left) / (params.right - params.left), 
  //   -(params.bottom + params.top) / (params.bottom - params.top), 
  //   -(params.far + params.near) / (params.far - params.near), 
  //   1,
  // ])

  const modelMatrixLocation = gl.getUniformLocation(program, 'uModelMatrix')
  const viewMatrixLocation = gl.getUniformLocation(program, 'uViewMatrix')
  const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix')

  gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix)
  gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)
  gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
}

const modelFolder = gui.addFolder('模型变换（模型）')
modelFolder.add(params, 'x', -width, width).onChange(updateUniforms)
modelFolder.add(params, 'y', -height, height).onChange(updateUniforms)
modelFolder.add(params, 'z', -500, 500).onChange(updateUniforms)
modelFolder.add(params, 'xRot', 0, 360).onChange(updateUniforms)
modelFolder.add(params, 'yRot', 0, 360).onChange(updateUniforms)
modelFolder.add(params, 'zRot', 0, 360).onChange(updateUniforms)
modelFolder.add(params, 'xScale', 0.1, 5).onChange(updateUniforms)
modelFolder.add(params, 'yScale', 0.1, 5).onChange(updateUniforms)
modelFolder.add(params, 'zScale', 0.1, 5).onChange(updateUniforms)

const viewFolder = gui.addFolder('视图变换（摄像机）')
viewFolder.add(params, 'eyeX', -width, width).onChange(updateUniforms)
viewFolder.add(params, 'eyeY', -height, height).onChange(updateUniforms)
viewFolder.add(params, 'eyeZ', -500, 500).onChange(updateUniforms)
viewFolder.add(params, 'centerX', -width, width).onChange(updateUniforms)
viewFolder.add(params, 'centerY', -height, height).onChange(updateUniforms)
viewFolder.add(params, 'centerZ', -500, 500).onChange(updateUniforms)
viewFolder.add(params, 'upX', -1, 1).onChange(updateUniforms)
viewFolder.add(params, 'upY', -1, 1).onChange(updateUniforms)
viewFolder.add(params, 'upZ', -1, 1).onChange(updateUniforms)

const projectionFolder = gui.addFolder('正交投影参数（空间转换）')
projectionFolder.add(params, 'top', -height, height).onChange(updateUniforms)
projectionFolder.add(params, 'bottom', -height, height).onChange(updateUniforms)
projectionFolder.add(params, 'left', -width, width).onChange(updateUniforms)
projectionFolder.add(params, 'right', -width, width).onChange(updateUniforms)
projectionFolder.add(params, 'near', 0.1, 1000).onChange(updateUniforms)
projectionFolder.add(params, 'far', 0.1, 1000).onChange(updateUniforms)


// 循环渲染
function animation(){
  requestAnimationFrame(animation)
  stats.update()
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, shape.length / 3)
}

animation()

