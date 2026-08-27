import { GUI } from "dat.gui"
import { gsap } from "gsap";
import PlaneGeometry from "/src/webgl/utils/Geometry/PlaneGeometry.js";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import Matrix4 from "/src/webgl/utils/Math/Matrix4.js";

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

// 基础gl属性调整
gl.enable(gl.DEPTH_TEST)
// gl.enable(gl.CULL_FACE)

// 创建盒子
const shape = new PlaneGeometry(25, 25, 64);
console.log(shape)

const vertexSource = `
  // precision mediump float;

  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 a_textureCoord;

  uniform mat4 u_projectionMatrix;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_modelMatrix;
  uniform sampler2D u_normalMap;

  varying vec3 v_normal;
  varying vec2 v_texture;

  void main(){
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(position, 1.0);
    v_normal = texture2D(u_normalMap, a_textureCoord).rgb * 2.0 - 1.0;
    v_texture = a_textureCoord;
  }
`

const fragmentSource = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec2 v_texture;

  uniform sampler2D u_diffuseMap;

  uniform vec3 u_lightDirection;

  void main(){
    vec4 diffuseMap = texture2D(u_diffuseMap, v_texture);
    vec4 normalMap = texture2D(u_normalMap, v_texture);

    vec3 color = diffuseMap.rgb;
    float dotNL = max(dot(normalize(v_normal), normalize(u_lightDirection)), 0.0);

    color = color * dotNL;
    gl_FragColor = vec4(color, 1.0);
  }
`

const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vertexSource)
gl.compileShader(vertexShader)

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fragmentSource)
gl.compileShader(fragmentShader)

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)
gl.useProgram(program) // 完成着色程序

// 创建索引缓存
const indexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shape.indices, gl.STATIC_DRAW)

// 传递position数据
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
const positionLocation = gl.getAttribLocation(program, 'position') // 获取 attribute 位置
gl.enableVertexAttribArray(positionLocation) // 启用 attribute
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0) // 告诉 attribute 如何获取数据
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.positions), gl.STATIC_DRAW) // 传递顶点数据

// 传递normal数据
const normalBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
const normalLocation = gl.getAttribLocation(program, 'normal')
gl.enableVertexAttribArray(normalLocation)
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.normals), gl.STATIC_DRAW)

const textureCoordBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
const textureCoordLocation = gl.getAttribLocation(program, 'a_textureCoord')
gl.enableVertexAttribArray(textureCoordLocation)
gl.vertexAttribPointer(textureCoordLocation, 2, gl.FLOAT, false, 0, 0)
gl.bufferData(gl.ARRAY_BUFFER, shape.uv, gl.STATIC_DRAW)

// 正交矩阵
function createOrthographicMatrix(left, right, bottom, top, near, far) {
  const lr = -1 / (left - right)
  const bt = -1 / (bottom - top)
  const nf = 1 / (near - far)
  const matrix = new Float32Array(16)
  matrix[0] = -2 * lr
  matrix[5] = -2 * bt
  matrix[10] = 2 * nf
  matrix[12] = (left + right) * lr
  matrix[13] = (top + bottom) * bt
  matrix[14] = (far + near) * nf
  matrix[15] = 0.1
  return matrix
}

const uProjectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')
const orthographicMatrix = createOrthographicMatrix(0, width, 0, height, -1000, 1000)
gl.uniformMatrix4fv(uProjectionMatrixLocation, false, orthographicMatrix)

const uModelMatrixLocation = gl.getUniformLocation(program, 'u_modelMatrix')
const uViewMatrixLocation = gl.getUniformLocation(program, 'u_viewMatrix')
// 视图矩阵（相机矩阵）
const viewMatrix = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
])
gl.uniformMatrix4fv(uViewMatrixLocation, false, viewMatrix)

const params = {
  xRot: 0,
  yRot: 0,
  zRot: 0,
  translateX: width / 2,
  translateY: height / 2,
  translateZ: 0,
  // 平行光方向
  directionLightX: 0,
  directionLightY: 0,
  directionLightZ: 1,
}

function updateModelMatrix() {
  let modelMatrix = new Matrix4()
  .multiply(new Matrix4( // x轴旋转
    Math.cos(params.xRot ), -Math.sin(params.xRot), 0, 0,
    Math.sin(params.xRot), Math.cos(params.xRot), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ))
  .multiply(new Matrix4( // y轴旋转
    Math.cos(params.yRot), 0, Math.sin(params.yRot), 0,
    0, 1, 0, 0,
    -Math.sin(params.yRot), 0, Math.cos(params.yRot), 0,
    0, 0, 0, 1
  ))
  .multiply(new Matrix4( // z轴旋转
    1, 0, 0, 0,
    0, Math.cos(params.zRot), -Math.sin(params.zRot), 0,
    0, Math.sin(params.zRot), Math.cos(params.zRot), 0,
    0, 0, 0, 1
  ))
  .multiply(new Matrix4( // 平移
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    params.translateX, params.translateY, params.translateZ, 1
  ))
  gl.uniformMatrix4fv(uModelMatrixLocation, false, new Float32Array(modelMatrix.elements))

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
}

function updateLightDirection() {
  const uLightDirectionLocation = gl.getUniformLocation(program, 'u_lightDirection')
  const lightDirection = new Float32Array([
    params.directionLightX,
    params.directionLightY,
    params.directionLightZ
  ])
  gl.uniform3fv(uLightDirectionLocation, lightDirection)
}

updateModelMatrix()
updateLightDirection()

const texture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, texture)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))

const normalTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, normalTexture)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 255, 255]))


// 读取常规贴图
const image = new Image()
image.src = '/textures/pbr_01/PavingStones139_1K-PNG_Color.png'
image.onload = function(){
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.generateMipmap(gl.TEXTURE_2D)
  // 指定纹理单元 0
  gl.activeTexture(gl.TEXTURE0)
  // 将纹理对象绑定到目标
  gl.bindTexture(gl.TEXTURE_2D, texture)
  // 将采样器传递给片段着色器
  const uImageLocation = gl.getUniformLocation(program, 'u_diffuseMap')
  gl.uniform1i(uImageLocation, 0)
}

// 读取法线贴图
const normalImage = new Image()
normalImage.src = '/textures/pbr_01/PavingStones139_1K-PNG_NormalGL.png'
normalImage.onload = function(){
  gl.bindTexture(gl.TEXTURE_2D, normalTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, normalImage)
  gl.generateMipmap(gl.TEXTURE_2D)
  // 指定纹理单元 1
  gl.activeTexture(gl.TEXTURE1)
  // 将纹理对象绑定到目标
  gl.bindTexture(gl.TEXTURE_2D, normalTexture)
  // 将采样器传递给片段着色器
  const uNormalMapLocation = gl.getUniformLocation(program, 'u_normalMap')
  gl.uniform1i(uNormalMapLocation, 1)
}

const modelControl = gui.addFolder('模型变换')
modelControl.add(params, 'xRot', -Math.PI * 2, Math.PI * 2, 0.02)
modelControl.add(params, 'yRot', -Math.PI * 2, Math.PI * 2, 0.02)
modelControl.add(params, 'zRot', -Math.PI * 2, Math.PI * 2, 0.02)
modelControl.open()
const lightControl = gui.addFolder('光照方向')
lightControl.add(params, 'directionLightX', -1, 1, 0.01).onChange(updateLightDirection)
lightControl.add(params, 'directionLightY', -1, 1, 0.01).onChange(updateLightDirection)
lightControl.add(params, 'directionLightZ', -1, 1, 0.01).onChange(updateLightDirection)
lightControl.open()

// 循环渲染
function animation(){
  requestAnimationFrame(animation)
  stats.update()
  updateModelMatrix()
  // gl.clear(gl.COLOR_BUFFER_BIT) // 每次重绘时清除画布，否则会重影
}

animation()

