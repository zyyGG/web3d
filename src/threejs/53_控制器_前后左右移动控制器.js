import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"
import { PointerLockControls } from "three/examples/jsm/Addons.js";



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
// const controls = new OrbitControls(camera, renderer.domElement)
// controls.enableDamping = true // 开启阻尼
// controls.dampingFactor = 0.25 // 阻尼系数
// controls.enableZoom = true // 开启缩放
// controls.enablePan = true // 开启平移
// controls.enableRotate = true // 开启旋转
// controls.autoRotate = false // 自动旋转
// controls.autoRotateSpeed = 1.0 // 自动旋转速度
// controls.target.set(0, 0, 0) // 设置控制器的目标点
// controls.update() // 更新控制器

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

///--------------------------------------------------------------------
// 主要代码写在这里
// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

const control = new PointerLockControls(camera, document.body);
scene.add(control.object);
renderer.domElement.addEventListener('click', () => {
  control.lock();
})

// 大平面
const planeGeometry = new THREE.PlaneGeometry(100, 100)
const planeMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xffffff,
  roughness: 10.0,
  metalness: 20.0,

 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -Math.PI / 2 // 绕x轴旋转90度
scene.add(plane)

let config = {
  speed: 1
}
gui.add(config, 'speed', 0, 10, 0.1).name('移动速度') // 添加gui控制器
let frontKey = false // 前进键
let backKey = false // 后退键
let leftKey = false // 左键
let rightKey = false // 右键
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();

// 按键监听
document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      frontKey = true
      break;
    case 's':
      backKey = true
      break;
    case 'a':
      leftKey = true
      break;
    case 'd':
      rightKey = true
      break;
  }
})

document.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
      frontKey = false
      break;
    case 's':
      backKey = false
      break;
    case 'a':
      leftKey = false
      break;
    case 'd':
      rightKey = false
      break;
  }
})

///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  // controls.update() // 更新控制器
  stats.update();
  if(control.isLocked){
    velocity.x -= velocity.x * 10.0 * 0.01 * config.speed;
    velocity.z -= velocity.z * 10.0 * 0.01 * config.speed;
    direction.z = Number( frontKey ) - Number( backKey );
    direction.x = Number( rightKey ) - Number( leftKey );
    direction.normalize()
    if ( frontKey || backKey ) velocity.z -= direction.z * 400.0 * 0.01 * config.speed;
    if ( rightKey || leftKey ) velocity.x -= direction.x * 400.0 * 0.01 * config.speed;
    control.moveRight(-velocity.x * 0.01 * config.speed);
    control.moveForward(-velocity.z * 0.01 * config.speed);
  }
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