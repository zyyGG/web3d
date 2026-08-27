import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
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
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
// camera.aspect = window.innerWidth / window.innerHeight
// camera.updateProjectionMatrix()
// camera.position.set(0, 5, 5)
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 500)
camera.zoom = 100
camera.position.set(0, 0, 1) // 设置摄像机位置
camera.updateProjectionMatrix() // 更新摄像机投影矩阵
// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true // 开启阻尼
controls.dampingFactor = 0.25 // 阻尼系数
controls.enableZoom = true // 开启缩放
controls.enablePan = true // 开启平移
controls.enableRotate = true // 开启旋转
controls.autoRotate = true // 自动旋转
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
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
// scene.add(gridHelper)

///--------------------------------------------------------------------
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
const cube2 = cube.clone()
cube2.position.set(2, 0, 0)
scene.add(cube2)
const cube3 = cube.clone()
cube3.position.set(0, 2, 0)
scene.add(cube3)

const config = {
  frontView: () => {
    // 强制旋转
    gsap.to(camera.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1,
    })
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      z: Math.max(Math.abs(camera.position.z), 10),
      duration: 1
    })
  },
  leftView: () => {
    // 强制旋转
    gsap.to(camera.rotation, {
      x: 0,
      y: -Math.PI / 2,
      z: 0,
      duration: 1,
    })
    gsap.to(camera.position, {
      x: -Math.max(Math.abs(camera.position.x), 10),
      y: 0,
      z: 0,
      duration: 1
    })
  },
  topView: () => {
    // 强制旋转
    gsap.to(camera.rotation, {
      x: -Math.PI / 2,
      y: 0,
      z: 0,
      duration: 1,
    })
    gsap.to(camera.position, {
      x: 0,
      y: Math.max(Math.abs(camera.position.y), 10),
      z: 0,
      duration: 1
    })
  },
}


gui.add(config, 'frontView').name('前视图')
gui.add(config, 'leftView').name('左视图')
gui.add(config, 'topView').name('顶视图')



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  // controls.update() // 更新控制器
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