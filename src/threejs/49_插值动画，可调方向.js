import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline, eases } from "animejs"



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

///--------------------------------------------------------------------
// 主要代码写在这里
const curve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-10, 0, 0), // 起点
  new THREE.Vector3(10, 10, -10), // 控制点
  new THREE.Vector3(-10, 10, 10), // 控制点
  new THREE.Vector3(10, 0, 0) // 终点
)
const points = curve.getPoints(50) // 获取曲线上的点
const positions = new Float32Array(points.length * 3) // 100个点
for(let i = 0; i < points.length; i++){
  positions.set([points[i].x, points[i].y, points[i].z], i * 3)
}
const bufferGeometry = new THREE.BufferGeometry()
bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const material = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true })
const line = new THREE.Line(bufferGeometry, material)
scene.add(line)

// 创建人
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material1 = new THREE.MeshPhongMaterial({ color: 0xfeffcc, flatShading: true, shininess: 150 })
const cube = new THREE.Mesh(geometry, material1)
cube.position.set(0, 0, 0)
scene.add(cube)

// 显示采样的点
const pointMaterial = new THREE.PointsMaterial({ size: 0.2, color: 0xff0000 })
const pointGeometry = new THREE.BufferGeometry()
const pointPositions = new Float32Array(points.length * 3) // 100个点
for(let i = 0; i < points.length; i++){
  pointPositions.set([points[i].x, points[i].y, points[i].z], i * 3)
}
pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
const point = new THREE.Points(pointGeometry, pointMaterial)
scene.add(point)

// 手写实现动画
cube.position.set(points[0].x, points[0].y, points[0].z)
let start = 0
let AnimationFrame = null
function updateAnimation(){
  if(start >= 1 ){
    const positions = curve.getPointAt(1)
    cube.position.set(positions.x, positions.y, positions.z)
    cube.quaternion.setFromEuler(new THREE.Euler(0, 0, 0))
  }else {
    const position = curve.getPointAt(start)
    const looAtPosition = curve.getPointAt(start + 0.01)
    cube.position.set(position.x, position.y, position.z)
    if(start+ 0.01 < 1){
      cube.lookAt(looAtPosition.x, looAtPosition.y, looAtPosition.z)
    }
    AnimationFrame = requestAnimationFrame(updateAnimation)
    start += 0.001
  }
}

const config = {
  start: () => {
    if(start >= 1){
      start = 0
    }
    updateAnimation()
  },
  stop: () => {
    cancelAnimationFrame(AnimationFrame)
  },
  reset:() => {
    cancelAnimationFrame(AnimationFrame)
    start = 0
    cube.position.set(points[0].x, points[0].y, points[0].z)
    cube.quaternion.setFromEuler(new THREE.Euler(0, 0, 0))
  }
}
const animationsFolder = gui.addFolder('animations')
animationsFolder.open()
animationsFolder.add(config, 'start').name('start')
animationsFolder.add(config, 'stop').name('stop')
animationsFolder.add(config, 'reset').name('reset')

// cube.position.set(points[0].x, points[0].y, points[0].z)
// const timeline = createTimeline({
//   defaults: {
//     duration: 500,
//     ease: "linear"
//   },
//   autoplay: false,
//   loop: true,
// })


// points.forEach((point, index) => {
//   timeline.add(cube.position, {
//     x: point.x,
//     y: point.y,
//     z: point.z,
//   })
// })

// timeline.play()

// const config = {
//   stop: () => {
//     timeline.pause()
//     console.log(timeline)
//   },
//   play: () => {
//     timeline.play()
//   },
//   reverse: () => {
//     timeline.reverse()
//   },
// }

// gui.add(config, 'stop').name('stop') // 添加停止按钮
// gui.add(config, 'play').name('play') // 添加播放按钮
// gui.add(config, 'reverse').name('reverse') // 添加反向播放按钮
// timeline.onUpdate = (self) => {
//   // 更新物体的朝向
//   console.log(self)
//   timeline.pause()
//   // const currentIndex = Math.floor(self.progress * points.length)
//   // const nextIndex = Math.ceil(self.progress * points.length) % points.length
//   // const nextPoint = points[nextIndex]
//   // cube.lookAt(nextPoint.x, nextPoint.y, nextPoint.z)
// }

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