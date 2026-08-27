import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { OBJLoader } from "three/examples/jsm/Addons.js";
import { gsap } from "gsap";



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0x000000, 1) // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop( animations );
document.querySelector("#app").appendChild(renderer.domElement)

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
camera.position.set(0, 5, 5)
// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true // 开启阻尼
controls.dampingFactor = 0.25 // 阻尼系数
controls.enableZoom = true // 开启缩放
controls.enablePan = true // 开启平移
controls.enableRotate = true // 开启旋转
controls.autoRotate = false // 自动旋转
controls.autoRotateSpeed = 1.0 // 自动旋转速度
controls.target.set(0, 0, 0) // 设置控制器的目标点
controls.update() // 更新控制器

// 创建基础环境
const scene = new THREE.Scene()

// 添加世界光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)

// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
scene.add(gridHelper)

let helpParams =  {
  gridHelper: true,
  directionalLightHelper: true,
  axesHelper: true,
}
const helpControls = gui.addFolder('辅助器控制')

function saveControlHelps(){
  localStorage.setItem('helpControls', JSON.stringify(helpParams));
}

function loadControlHelps(){
  helpParams = JSON.parse(localStorage.getItem('helpControls'));
  gridHelper.visible = helpParams.gridHelper;
  directionalLightHelper.visible = helpParams.directionalLightHelper;
  axesHelper.visible = helpParams.axesHelper;
  helpControls.add( helpParams, 'gridHelper' ).name('grid辅助器').onChange(value => {gridHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'directionalLightHelper' ).name('平行光辅助器').onChange(value => {directionalLightHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'axesHelper' ).name('坐标辅助器').onChange(value => {axesHelper.visible = value; saveControlHelps()} );
}

loadControlHelps()

///--------------------------------------------------------------------


// bufferGeometry.setAttribute('position', positionAttribute)
// let projectionMatrix = new THREE.Matrix4()

const customMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    projectionMatrix: { value: new THREE.Matrix4() },
    viewModelMatrix: { value: new THREE.Matrix4() },
    u_directionLightPosition: { value: new THREE.Vector3(1.0, 1.0, 1.0)}
  },
  vertexShader: /* glsl */`
    precision mediump float;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec3 aColor;
  
    uniform mat4 projectionMatrix;
    uniform mat4 viewModelMatrix;
    uniform vec2 u_resolution;

    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // vNormal = (projectionMatrix * vec4(normal, 1.0)).xyz;
      vNormal = normal;
      vPosition = position;
      gl_Position = projectionMatrix * viewModelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec3 u_directionLightPosition;

    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {

      // 平行光方向
      vec3 directionLightPosition = normalize(u_directionLightPosition);

      vec3 color = normalize(vPosition);

      // color = mix(color, vec3(0.0, 0.0, 0.0), max(dot(vNormal, directionLightPosition), 0.0));

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  side: THREE.FrontSide,
  transparent: true,
})

const shape01 = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), customMaterial)
scene.add(shape01)


new OBJLoader().load('/models/f.obj', (data) => {
  // console.log(data)
  shape01.geometry = data.children[0].geometry
})



const params = {
  xRot: 0,
  yRot: 0,
  zRot: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  transX: 200,
  transY: 200,
  transZ: 0,

  // 视锥
  fildOfView: 0.003 , // 这是比值关系
  near: -400,
  far: 400,

  // 平行光源方向
  dLightX: 0,
  dLightY: 0,
  dLightZ: -1,

  
}

const directionLightGui = gui.addFolder('平行光参数')
directionLightGui.open()
directionLightGui.add(params, 'dLightX', -1, 1).name('X方向').onChange(value => {
  shape01.material.uniforms.u_directionLightPosition.value.x = value;
})
directionLightGui.add(params, 'dLightY', -1, 1).name('Y方向').onChange(value => {
  shape01.material.uniforms.u_directionLightPosition.value.y = value;
})
directionLightGui.add(params, 'dLightZ', -1, 1).name('Z方向').onChange(value => {
  shape01.material.uniforms.u_directionLightPosition.value.z = value;
})
shape01.material.uniforms.u_directionLightPosition.value.set(params.dLightX, params.dLightY, params.dLightZ);

let cameraFolder = gui.addFolder('相机参数')
cameraFolder.open()
cameraFolder.add(params, 'fildOfView', 0.0, 2.0).name('视野角度').onChange(updateProjectionMatrix)
cameraFolder.add(params, 'near', -400, 400).name('近裁切面').onChange(updateProjectionMatrix)
cameraFolder.add(params, 'far', -400, 400).name('远裁切面').onChange(updateProjectionMatrix)

const projectionFolder = gui.addFolder('投影矩阵变换')
projectionFolder.open()
projectionFolder.add(params, 'xRot', 0, 360).name('X轴旋转').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'yRot', 0, 360).name('Y轴旋转').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'zRot', 0, 360).name('Z轴旋转').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'scaleX', 0.1, 5).name('X轴缩放').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'scaleY', 0.1, 5).name('Y轴缩放').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'scaleZ', 0.1, 5).name('Z轴缩放').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'transX', 0, window.innerWidth).name('X轴平移').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'transY', 0, window.innerHeight).name('Y轴平移').onChange(updateProjectionMatrix)
projectionFolder.add(params, 'transZ', -600, 600).name('Z轴平移').onChange(updateProjectionMatrix)

updateProjectionMatrix()
updateViewModelMatrix()

function updateProjectionMatrix(){
  // let aspect = window.innerWidth / window.innerHeight; // 宽高比
  // let fovRad = Math.tan(Math.PI * 0.5 - 0.5 * THREE.MathUtils.degToRad(params.fildOfView)); // 视野角度转弧度并计算切割平面尺寸比例
  // let rangeInv = 1.0 / (params.near - params.far);

  // 投影矩阵
  // let projectionMatrix = new THREE.Matrix4(
  //   fovRad / aspect, 0, 0, 0,
  //   0, fovRad, 0, 0,
  //   0, 0, (params.near + params.far) * rangeInv, 2 * params.near * params.far * rangeInv,
  //   0, 0, -1, 0, 
  // )

  // 裁切空间矩阵
  // let projectionMatrix = new THREE.Matrix4(
  //   2 / window.innerWidth, 0, 0, -1,
  //   0, -2 / window.innerHeight, 0, 1,
  //   0, 0, 2 / 1000, 0,
  //   0, 0, 0, 1,
  // )
  let top = 0
  let bottom = window.innerHeight
  let left = 0
  let right = window.innerWidth
  let near = params.near
  let far = params.far

  let projectionMatrix = new THREE.Matrix4(
    2 / (right - left), 0, 0, -(right + left) / (right - left),
    0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
    0, 0, 2 / (far - near), -(far + near) / (far - near),
    0, 0, params.fildOfView, 1,
  )
  // let projectionMatrix = new THREE.Matrix4().makeOrthographic(
  //   window.innerWidth / -2,   // left
  //   window.innerWidth / 2,    // right
  //   window.innerHeight / 2,   // top
  //   window.innerHeight / -2,  // bottom
  //   params.near,              // near,
  //   params.far                // far
  // );
 
  // 缩放矩阵
  projectionMatrix.multiply(new THREE.Matrix4().makeScale(params.scaleX, params.scaleY, params.scaleZ));
  // 平移矩阵
  projectionMatrix.multiply(new THREE.Matrix4().makeTranslation(params.transX, params.transY, params.transZ));
   // x旋转矩阵
  projectionMatrix.multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(params.xRot)));
  projectionMatrix.multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(180))); // 模型是颠倒的，这里先旋转180度，摆正模型
  // y旋转矩阵
  projectionMatrix.multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(params.yRot)));
  // z旋转矩阵
  projectionMatrix.multiply(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(params.zRot)));
  // 修改操作中心点
  // projectionMatrix.multiply(new THREE.Matrix4().makeTranslation(-65, -75, 0));

  // 视图变换
  // projectionMatrix.multiply(camera.matrixWorldInverse);
  // projectionMatrix.multiply(controls.matrixWorldInverse);
  // 投影变换
  // projectionMatrix.multiply(camera.projectionMatrix);

  shape01.material.uniforms.projectionMatrix.value = projectionMatrix;
}

function updateViewModelMatrix(){
  // 模型视图矩阵
  // let viewModelMatrix = new THREE.Matrix4().makeOrthographic(
  //   window.innerWidth / -2,   // left
  //   window.innerWidth / 2,    // right
  //   window.innerHeight / 2,   // top
  //   window.innerHeight / -2,  // bottom
  //   1,                        // near,
  //   1000                      // far
  // );

  // 视图变换
  // viewModelMatrix.multiply(camera.matrixWorldInverse);
  // console.log(camera.matrixWorldInverse)
  // viewModelMatrix.multiply(controls.matrixWorldInverse);

  // shape01.material.uniforms.viewModelMatrix = { value: viewModelMatrix };
}


// 总结：
// 使用THREE.Matrix4来创建矩阵， 然后传递给着色器使用
// 注意事项：THREE.Matrix4是列优先矩阵， 所以在构造函数中传递参数的时候要注意顺序


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
}

// 其他功能
window.onresize = () => {
  // 重新获取宽高并且渲染
  const width = Math.ceil(window.innerWidth)
  const height = Math.ceil(window.innerHeight)
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.render(scene, camera)
}