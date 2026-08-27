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
// scene.add(gridHelper)

///--------------------------------------------------------------------
// 创建两种相机
const orthographicCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 500)
orthographicCamera.updateMatrix()
orthographicCamera.lookAt(0, 0, 0) // 设置相机朝向
orthographicCamera.position.set(0, 1, 0)
orthographicCamera.zoom = 50 // 设置缩放比例
orthographicCamera.updateProjectionMatrix() // 更新投影矩阵
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
perspectiveCamera.aspect = window.innerWidth / window.innerHeight
perspectiveCamera.updateMatrix()
perspectiveCamera.position.set(0, 5, 5)
let activeCameara = orthographicCamera

const control = new OrbitControls(activeCameara, renderer.domElement)
control.enableDamping = true // 开启阻尼
control.enableZoom = true // 开启缩放
control.enablePan = true // 开启平移

const orthographicCameraHelper = new THREE.CameraHelper(orthographicCamera)
const perspectiveCameraHelper = new THREE.CameraHelper(perspectiveCamera)
// scene.add(orthographicCameraHelper, perspectiveCameraHelper)
// scene.add(cameraHelper)

control.update()

// 创建方块

for(let i = 0; i < 3; i++){
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0xfeffcc, flatShading: true, shininess: 150 })
  )
  cube.position.set(i * 2, 0, 0)
  scene.add(cube)
}

const config = {
  toPerspectiveCamera: () => {
    activeCameara = perspectiveCamera
    control.object = perspectiveCamera
    control.update()
  },
  toOrthographicCamera : () => {
    activeCameara = orthographicCamera
    control.object = orthographicCamera
    control.update()
  },
  perspectiveCameraHelper: false,
  orthographicCameraHelper: false,
  toFrontView: () => {
    gsap.to(activeCameara.position, { x: 0, y: 0, z: 10, duration: 1 }).eventCallback("onUpdate", () => {
      activeCameara.lookAt(0, 0, 0)
    })
    control.update()
  },
  toLeftView: () => {
    gsap.to(activeCameara.position, { x: -10, y: 0, z: 0, duration: 1 }).eventCallback("onUpdate", () => {
      activeCameara.lookAt(0, 0, 0)
    })
    control.update()
  },
  toTopView: () => {
    gsap.to(activeCameara.position, { x: 0, y: 10, z: 0, duration: 1 }).eventCallback("onUpdate", () => {
      activeCameara.lookAt(0, 0, 0)
    })
    control.update()
  }
}

gui.add(config, 'toPerspectiveCamera').name('切换到透视相机')
gui.add(config, 'toOrthographicCamera').name('切换到正交相机')
gui.add(config, 'toFrontView').name('前视图')
gui.add(config, 'toLeftView').name('左视图')
gui.add(config, 'toTopView').name('顶视图')

gui.add(config, 'orthographicCameraHelper').name('正交相机辅助器').onChange((value) => {
  if (value) {
    scene.add(orthographicCameraHelper)
  } else {
    scene.remove(orthographicCameraHelper)
  }
})
gui.add(config, 'perspectiveCameraHelper').name('透视相机辅助器').onChange((value) => {
  if (value) {
    scene.add(perspectiveCameraHelper)
  } else {
    scene.remove(perspectiveCameraHelper)
  }
})




///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, activeCameara)
  // control.update() // 更新控制器
  orthographicCameraHelper.update()
  perspectiveCameraHelper.update()
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