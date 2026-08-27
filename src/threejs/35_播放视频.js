import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"



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
camera.position.z = 5;
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
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

///--------------------------------------------------------------------
camera.position.set(0, 0, 10) // 设置摄像机位置
// 搭建场景
// 创建大屏幕背板
const screenBackGeometry = new THREE.BoxGeometry(4.5, 2.5, 0.5)
const screenBackMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555,
})
const screenBackMesh = new THREE.Mesh(screenBackGeometry, screenBackMaterial)
screenBackMesh.position.set(0, 0, -0.25)
scene.add(screenBackMesh)

// 创建视频纹理
const video = document.createElement('video')
video.src = "/video/demo01.mp4"
video.crossOrigin = 'anonymous'
video.loop = true // 循环播放
// 创建大屏幕
const screenGeometry = new THREE.BoxGeometry(4, 2, 0.01)
const screenMaterial = new THREE.MeshBasicMaterial({
  map: new THREE.VideoTexture(video),
  transparent: true, // 透明
  opacity: 1, // 不透明度
})
const screenMesh = new THREE.Mesh(screenGeometry, [
  new THREE.MeshStandardMaterial({ color: 0x555555 }), // 正面
  new THREE.MeshStandardMaterial({ color: 0x555555 }), // 背面
  new THREE.MeshStandardMaterial({ color: 0x555555 }), // 上面
  new THREE.MeshStandardMaterial({ color: 0x555555 }), // 下面
  screenMaterial, // 左面
  new THREE.MeshStandardMaterial({ color: 0x555555 }), // 右面
])
screenMesh.position.set(0, 0, 0)
scene.add(screenMesh)

// 添加视频精灵图
const spriteMaterial = new THREE.SpriteMaterial({
  map: new THREE.VideoTexture(video),
  color: 0xffffff,
})
const sprite = new THREE.Sprite(spriteMaterial)
sprite.scale.set(4, 2, 1) // 设置精灵图大小
sprite.position.set(8, 0, 0)
scene.add(sprite)
// 视频精灵图背景
const spriteBackMaterial = new THREE.SpriteMaterial({
  color: 0x555555,
})
const spriteBack = new THREE.Sprite(spriteBackMaterial)
spriteBack.scale.set(4.5, 2.5, 1) // 设置精灵图大小
spriteBack.position.set(8, 0, 0)
scene.add(spriteBack)
// 永远保证视频精灵图在视频视频精灵图背景的前面
sprite.renderOrder = 1 // 设置渲染顺序
spriteBack.renderOrder = 0 // 设置渲染顺序
// 添加视频精灵图的动画






let videoState = false // 视频状态
const config = {
  toggleVideo: () => {
    if (videoState) {
      video.pause()
      videoState = false
    } else {
      video.play()
      videoState = true
    }
  },
  toggleMuted: () => {
    if (video.muted) {
      video.muted = false
    } else {
      video.muted = true
    }
  }
}

gui.add(config, 'toggleVideo').name('播放/暂停视频') // 添加gui控制器
gui.add(config, 'toggleMuted').name('静音/取消静音') // 添加gui控制器




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