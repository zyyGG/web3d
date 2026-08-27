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

// 创建动画
const mixer = new THREE.AnimationMixer(cube)
const animationTimeline = []
const duration = 1
const picesTime = duration / points.length // 单个点位的移动时间
for(let i = 0; i < points.length; i++){
  animationTimeline.push(i*picesTime)
}
const action = mixer.clipAction(new THREE.AnimationClip('move', -1, [
  new THREE.VectorKeyframeTrack('.position', animationTimeline, points.flatMap((item) => [item.x, item.y, item.z])),
]));
action.setLoop(THREE.LoopRepeat, Infinity) // 循环播放
action.timeScale = 1 // 播放速度
action.clampWhenFinished = true // 循环时不回到起点
action.setEffectiveWeight(1) // 设置权重
// 正放一遍倒放一遍

action.play()



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  mixer.update(0.001)
  // customShader.uniforms.uTime.value += 0.01
  // if(line.material.uniforms.uTime){
  //   console.log(line.material.uniforms)
  //   line.material.uniforms.uTime.value += 0.01
  // }
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