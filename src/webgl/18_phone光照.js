import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import BoxGeometry from "/src/webgl/utils/Geometry/BoxGeometry.js";
import SphereGeometry from "/src/webgl/utils/Geometry/SphereGeometry.js";
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
    attribute vec3 normal;

    uniform mat4 projectionMatrix;
    uniform mat4 modelMatrix;
    uniform vec3 directionLight;

    varying vec3 vNormal;
    varying vec3 vLight;

    void main() {
      vNormal = normal;
      vLight = normalize(directionLight);
      gl_Position = projectionMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vLight;

    void main() {
      // float ambientLight = 0.1;
      // vec3 color = vec3(1.0, 0.0, 1.0);
      // float dotNL = max(dot(vNormal, vLight), 0.0);

      // // 计算高光
      // vec3 cameraPosition = vec3(0.0, 0.0, 1.0); // 假设相机位置在z轴正方向
      // vec3 viewDir = normalize(cameraPosition - vec3(0.0, 0.0, 0.0)); // 视线方向
      // // 计算视线方向和光线方向的半径向量
      // vec3 halfDir = normalize(vLight + viewDir);
      // // 计算半程向量和法向量的点积(判断夹角), 最后的64.0是高光的粗细程度, 越大光斑越小
      // float spec = pow(max(dot(vNormal, halfDir), 0.0), 3.0); // 高光强度
      // color += vec3(1.0, 1.0, 1.0) * spec; // 添加高光颜色

      // color = color * (dotNL + ambientLight);
      // gl_FragColor = vec4(color, 1.0);

      // 相机的位置
      vec3 cameraPosition = vec3(0.0, 0.0, 1.0);
      vec3 viewDir = normalize(cameraPosition - vec3(0.0, 0.0, 0.0)); // 视线方向

      // 计算漫反射光, 这里使用半兰伯特光照模型
      vec3 color = vec3(1.0, 0.0, 1.0) * (max(dot(vNormal, vLight), 0.0) * 0.5 + 0.5);
      // 计算反射光线
      vec3 reflectDir = normalize(reflect(-vLight, vNormal));
      float gloss = 12.0; // 高光系数
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), gloss);
      vec3 specColor = spec * vec3(1.0, 1.0, 1.0); // 高光颜色
      color += specColor;
      gl_FragColor = vec4(color, 1.0);
    }
  `
)
const shape = new SphereGeometry(100, 32, 32)

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, shape.positions, gl.STATIC_DRAW)

const positionLocation = gl.getAttribLocation(program, "position")
gl.enableVertexAttribArray(positionLocation)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

const normalBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
gl.bufferData(gl.ARRAY_BUFFER, shape.normals, gl.STATIC_DRAW)

const normalLocation = gl.getAttribLocation(program, "normal")
gl.enableVertexAttribArray(normalLocation)
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)

// 索引缓冲区
const indexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shape.indices, gl.STATIC_DRAW)

// 获取投影矩阵
const projectionMatrix = getProjectionMatrix(canvas)
const projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix")
gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

const params = {
  x: 0,
  y: 0,
  z: 0,
}
// 模型矩阵
const modelMatrix = Matrix4.getTranslationMatrix(params.x, params.y, params.z)
const modelMatrixLocation = gl.getUniformLocation(program, "modelMatrix")
gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements)

gui.add(params, "x", -canvas.width, canvas.width).onChange(updateModelMatrix)
gui.add(params, "y", -canvas.height, canvas.height).onChange(updateModelMatrix)
gui.add(params, "z", -500, 500).onChange(updateModelMatrix)

// 平行光
const directionLightParams = {
  x: 50,
  y: -50,
  z: 0,
}

const directionLightVector = new Float32Array([
  directionLightParams.x,
  directionLightParams.y,
  directionLightParams.z,
])
const directionLightLocation = gl.getUniformLocation(program, "directionLight")
gl.uniform3fv(directionLightLocation, directionLightVector)

const directionLightFolder = gui.addFolder('平行光方向')
directionLightFolder.add(directionLightParams, 'x', -100, 100).onChange(updateDirectionLight)
directionLightFolder.add(directionLightParams, 'y', -100, 100).onChange(updateDirectionLight)
directionLightFolder.add(directionLightParams, 'z', -100, 100).onChange(updateDirectionLight)
directionLightFolder.open()


render()

function updateDirectionLight(){
  const directionLightVector = new Float32Array([
    directionLightParams.x,
    directionLightParams.y,
    directionLightParams.z,
  ])
  gl.uniform3fv(directionLightLocation, directionLightVector)
  render()
}

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

