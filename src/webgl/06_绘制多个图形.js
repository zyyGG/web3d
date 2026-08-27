import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { BoxGeometry } from "/src/webgl/utils/Geometry.js";
import MathUtils from "/src/webgl/utils/MathUtils.js";

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// gui 控制参数
const params = {
  // 视图变换参数
  eyeX: 0,
  eyeY: 0,
  eyeZ: 10,
  lookAtX: 0,
  lookAtY: 0,
  lookAtZ: 0,
  upX: 0,
  upY: 1,
  upZ: 0,
}
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
const app = document.getElementById('app')
app.appendChild(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight


gl.viewport(0, 0, canvas.width, canvas.height); // 设定视口参数
gl.clearColor(0.1, 0.1, 0.1, 1.0); // 清除颜色
gl.enable(gl.DEPTH_TEST); // 深度渲染

let viewMatrix = MathUtils.m4Inverse(getCameraMatrix())

class Shape {
  program = null
  moduleMatrix = null
  viewMatrix = null
  projectionMatrix = null
  color = null
  length = 0
  position = null
  set x(value){this.position[0] = value}
  set y(value){this.position[1] = value}
  set z(value){this.position[2] = value}
  get x() {return this.position[0]}
  get y() {return this.position[1]}
  get z() {return this.position[2]}
  constructor(){}

  render(){
    this.updateModuleMatrix()
    gl.useProgram(this.program);
    
    // 传递矩阵数据
    const uModelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');
    gl.uniformMatrix4fv(uModelMatrixLocation, false, new Float32Array(this.moduleMatrix));
    const uViewMatrixLocation = gl.getUniformLocation(this.program, 'viewMatrix');
    gl.uniformMatrix4fv(uViewMatrixLocation, false, new Float32Array(viewMatrix));
    const uProjectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
    gl.uniformMatrix4fv(uProjectionMatrixLocation, false, new Float32Array(this.projectionMatrix));
    // 传递颜色数据
    const uColorLocation = gl.getUniformLocation(this.program, 'uColor');
    gl.uniform3fv(uColorLocation, new Float32Array(this.color));
    gl.drawArrays(gl.TRIANGLES, 0, this.length);
  }

  updateModuleMatrix(){
    this.moduleMatrix[12] = this.position[0]
    this.moduleMatrix[13] = this.position[1]
    this.moduleMatrix[14] = this.position[2]
  }
}

const scene = []

const shape01 = createShape([0, 0, 0], 0xff0000)
scene.push(shape01)
const shape02 = createShape([2, 0, 0], 0x00ff00)
scene.push(shape02)
const shape03 = createShape([-2, 2, 0], 0x0000ff)
scene.push(shape03)


gsap.to(shape01, {
  duration: 2,
  y: 4,
  yoyo: true,
  repeat: -1,
  ease: 'power1.inOut',
})



function updateViewMatrix(){
  viewMatrix = MathUtils.m4Inverse(getCameraMatrix())
}

gui.add(params, 'eyeX', -10, 10, 0.1).name('eyeX').onChange(updateViewMatrix)
gui.add(params, 'eyeY', -10, 10, 0.1).name('eyeY').onChange(updateViewMatrix)
gui.add(params, 'eyeZ', -10, 10, 0.1).name('eyeZ').onChange(updateViewMatrix)
gui.add(params, 'lookAtX', -10, 10, 0.1).name('lookAtX').onChange(updateViewMatrix)
gui.add(params, 'lookAtY', -10, 10, 0.1).name('lookAtY').onChange(updateViewMatrix)
gui.add(params, 'lookAtZ', -10, 10, 0.1).name('lookAtZ').onChange(updateViewMatrix)
gui.add(params, 'upX', -1, 1, 0.1).name('upX').onChange(updateViewMatrix)
gui.add(params, 'upY', -1, 1, 0.1).name('upY').onChange(updateViewMatrix)
gui.add(params, 'upZ', -1, 1, 0.1).name('upZ').onChange(updateViewMatrix)



function createShape(modulePosition, color) {
  const shape = new Shape();
  shape.position = modulePosition;
  const geometry = new BoxGeometry(1, 1, 1);
  shape.length = geometry.vertexs.length / 3;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const vertexShaderSource = /*glsl */`
  precision mediump float;

  attribute vec3 position;
  attribute vec3 normal;

  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 modelMatrix;

  varying vec3 vNormal;

  void main() {
    vNormal = normal;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
  `
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  const fragmentShaderSource = /*glsl */`
  precision mediump float;

  varying vec3 vNormal;

  uniform vec3 uColor;

  void main() {
    vec3 dLight = vec3(0.0, 0.0, 1.0);
    vec3 color = uColor * max(dot(normalize(vNormal), dLight), 0.5);
    gl_FragColor = vec4(color, 1.0);
  }
  `
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  shape.program = program;
  gl.useProgram(program);

  // 传递attribute数据
  const positionBuffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertexs), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  // 传递 normal 数据
  const normalBuffer = gl.createBuffer()
  const normalLocation = gl.getAttribLocation(program, 'normal');
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(normalLocation)
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  // 计算矩阵
  shape.moduleMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    modulePosition[0], modulePosition[1], modulePosition[2], 1,
  ]
  const fov = Math.tan(Math.PI * 0.5 - 0.5 * MathUtils.degToRad(75))
  const aspect = canvas.width / canvas.height
  const near = 0.1
  const far = 1000
  const rangeInv = 1.0 / (near - far)
  // 透视投影
  shape.projectionMatrix = new Float32Array([
    fov / aspect, 0, 0, 0,
    0, fov, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0,
  ])
  shape.color = [((color >> 16) & 0xff) / 255, ((color >> 8) & 0xff) / 255, (color & 0xff) / 255];
  
  return shape

}

function getCameraMatrix(){
  const zAxis = MathUtils.normalizeVector3(MathUtils.subtractVector3(
    [params.eyeX, params.eyeY, params.eyeZ],
    [params.lookAtX, params.lookAtY, params.lookAtZ]
  ))
  const xAxis = MathUtils.normalizeVector3(MathUtils.crossVector3(
    [params.upX, params.upY, params.upZ],
    zAxis
  ))
  const yAxis = MathUtils.crossVector3(zAxis, xAxis)

  return [
    xAxis[0], xAxis[1], xAxis[2], 0,
    yAxis[0], yAxis[1], yAxis[2], 0,
    zAxis[0], zAxis[1], zAxis[2], 0,
    params.eyeX, params.eyeY, params.eyeZ, 1,
  ]
}

function animation(){
  requestAnimationFrame(animation);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  scene.forEach(shape => {
    shape.render()
  })

  stats.update();
}
animation()
