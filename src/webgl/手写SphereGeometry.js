import { GUI } from "dat.gui"
import { gsap } from "gsap";
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

class SphereGeometry {
  /**
   * 初始化球体几何体
   * @params {number} radius 半径
   * @params {number} widthSegments 水平分段数
   * @params {number} heightSegments 垂直分段数
   * @params {number} phiStart 水平起始角度
   * @params {number} phiLength 水平扫过角度
   * @params {number} thetaStart 垂直起始角度
   * @params {number} thetaLength 垂直扫过角度
   */
  constructor(radius = 1, widthSegments = 32, heightSegments = 16, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    this.radius = radius
    this.widthSegments = Math.max(3, Math.floor(widthSegments))
    this.heightSegments = Math.max(2, Math.floor(heightSegments))
    this.phiStart = phiStart
    this.phiLength = phiLength
    this.thetaStart = thetaStart
    this.thetaLength = thetaLength

    const positions = []
    const normals = []
    const uv = []
    const indices = []

    const thetaEnd = Math.min(this.thetaStart + this.thetaLength, Math.PI)

    let index = 0
    const grid = []

    // 生成顶点、法线和uv坐标
    for (let iy = 0; iy <= this.heightSegments; iy++) {
      const verticesRow = []
      const v = iy / this.heightSegments

      // 极点特殊处理
      let uOffset = 0
      if (iy === 0 && this.thetaStart === 0) {
        uOffset = 0.5 / this.widthSegments
      } else if (iy === this.heightSegments && thetaEnd === Math.PI) {
        uOffset = -0.5 / this.widthSegments
      }

      for (let ix = 0; ix <= this.widthSegments; ix++) {
        const u = ix / this.widthSegments

        // 球面参数方程
        const x = -this.radius * Math.cos(this.phiStart + u * this.phiLength) * Math.sin(this.thetaStart + v * thetaEnd)
        const y = this.radius * Math.cos(this.thetaStart + v * thetaEnd)
        const z = this.radius * Math.sin(this.phiStart + u * this.phiLength) * Math.sin(this.thetaStart + v * thetaEnd)

        // 顶点
        positions.push(x, y, z)

        // 法线
        const len = Math.sqrt(x * x + y * y + z * z)
        normals.push(x / len, y / len, z / len)
        // uv
        uv.push(u + uOffset, 1 - v)

        verticesRow.push(index++)
      }
      grid.push(verticesRow)
    }

    // 生成索引
    for (let iy = 0; iy < this.heightSegments; iy++) {
      for (let ix = 0; ix < this.widthSegments; ix++) {
        const a = grid[iy][ix + 1]
        const b = grid[iy][ix]
        const c = grid[iy + 1][ix]
        const d = grid[iy + 1][ix + 1]

        if (iy !== 0 || this.thetaStart > 0) {
          indices.push(a, b, d)
        }
        if (iy !== this.heightSegments - 1 || thetaEnd < Math.PI) {
          indices.push(b, c, d)
        }
      }
    }

    this.positions = new Float32Array(positions)
    this.normals = new Float32Array(normals)
    this.uv = new Float32Array(uv)
    this.indices = new Uint16Array(indices)
  }
}

// 创建盒子
const shape = new SphereGeometry(16)


const vertexSource = `
  // precision mediump float;

  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 a_textureCoord;

  uniform mat4 u_projectionMatrix;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_modelMatrix;

  varying vec3 v_normal;
  varying vec2 v_texture;

  void main(){
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(position, 1.0);
    v_normal = (u_modelMatrix * vec4(normal, 0.0)).xyz;
    v_texture = a_textureCoord;
  }
`

const fragmentSource = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec2 v_texture;

  uniform vec3 u_lightDirection;

  void main(){

    vec3 color = vec3(1.0, 1.0, 0.0);
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

// 模型的空间位置变换
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

// 光照位置变换
function updateLightDirection() {
  const uLightDirectionLocation = gl.getUniformLocation(program, 'u_lightDirection')
  const lightDirection = new Float32Array([
    params.directionLightX,
    params.directionLightY,
    params.directionLightZ
  ])
  gl.uniform3fv(uLightDirectionLocation, lightDirection)
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

updateModelMatrix()
updateLightDirection()

// 循环渲染
function animation(){
  requestAnimationFrame(animation)
  stats.update()
  updateModelMatrix()
  // gl.clear(gl.COLOR_BUFFER_BIT) // 每次重绘时清除画布，否则会重影
}

animation()

