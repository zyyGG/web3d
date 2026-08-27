import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import BoxGeometry from "/src/webgl/utils/Geometry/BoxGeometry.js";
import Matrix4 from "/src/webgl/utils/Math/Matrix4.js";

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

const { canvas, gl } = initGl()
console.log(canvas.width, canvas.height);
const program = createProgramer(
  gl,
  `
    attribute vec3 position;

    uniform mat4 projectionMatrix;
    uniform mat4 modelMatrix;

    void main() {
      gl_Position = projectionMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  `
    precision mediump float;

    void main() {
      vec3 color = vec3(1.0, 1.0, 1.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `
)
const shape = new BoxGeometry(100, 100, 100)

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, shape.positions, gl.STATIC_DRAW)

const positionLocation = gl.getAttribLocation(program, "position")
gl.enableVertexAttribArray(positionLocation)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

// 索引缓冲区
const indexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shape.indices, gl.STATIC_DRAW)

// 获取投影矩阵
const projectionMatrix = getProjectionMatrix(canvas)
const projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix")
gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

const params = {
  x: 100,
  y: 100,
  z: 0,
}
// 模型矩阵
const modelMatrix = Matrix4.getTranslationMatrix(params.x, params.y, params.z)
const modelMatrixLocation = gl.getUniformLocation(program, "modelMatrix")
gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements)

gui.add(params, "x", -canvas.width, canvas.width).onChange(updateModelMatrix)
gui.add(params, "y", -canvas.height, canvas.height).onChange(updateModelMatrix)
gui.add(params, "z", -500, 500).onChange(updateModelMatrix)

render()

function updateModelMatrix(){
  const martix = Matrix4.getTranslationMatrix(params.x, params.y, params.z)
  gl.uniformMatrix4fv(modelMatrixLocation, false, martix.elements)
  render()
}

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0)
}

// 初始化GL
function initGl(){
  const canvas = document.createElement("canvas")
  canvas.width = window.innerWidth
  canvas.height =window.innerHeight
  const gl = canvas.getContext("webgl2")
  const app = document.querySelector("#app")
  app.appendChild(canvas);
  gl.clearColor(0, 0, 0, 1.0);// 纯黑色
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); // 开启深度测试
  gl.enable(gl.CULL_FACE); // 开启背面剪裁
  gl.cullFace(gl.BACK); // 剪裁背面
  gl.frontFace(gl.CW); // 顺时针是正面
  // gl.frontFace(gl.CCW); 

  return {
    canvas,
    gl,
  }
}

// 创建着色器程序
function createProgramer(gl, vertexSource, fragmentSource){
  const vertex = complierShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = complierShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.useProgram(program)

  if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    console.error("着色器程序创建失败", gl.getProgramInfoLog(program));
    gl.deleteProgram(program)
    return null
  }

  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  return program

  function complierShader(gl, type, source){
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      console.error("着色器编译失败", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader)
      return null
    }

    return shader
  }
}


// projectionMatrix
function getProjectionMatrix(canvas){
  return new Float32Array([
    2 / canvas.width, 0, 0, 0,
    0, -2 / canvas.height, 0, 0,
    0, 0, 2 / 1000, -0.001,
    0, 0, 0, 1,
  ])
}

