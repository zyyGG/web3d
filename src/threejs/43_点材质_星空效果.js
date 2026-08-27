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
// scene.add(directionalLight)

// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
// scene.add(gridHelper)

///--------------------------------------------------------------------
// 主要代码写在这里
camera.position.set(0, 3, 0)
camera.lookAt(0, 0, 0)
controls.enableZoom = false // 禁用缩放

const config = {
  count: 10000,
}
// 创建店
const positions = createPoints()
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
const material = new THREE.PointsMaterial({
  size: 0.03,
  sizeAttenuation: true, // 是否随距离衰减
  color: 0xffffff,
  transparent: true, // 是否透明
  opacity: 1, // 透明度
})
const points = new THREE.Points(geometry, material)
scene.add(points)

gui.add(config, 'count', 0, 10000).name("星星数量").step(1).onChange(() => {
  // 更新点的数量
  const positions = createPoints()
  points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
})

function createPoints(){
  // 创建散点
  const radius = 10// 半径
  const count = config.count // 1000个点
  const positions = new Float32Array(count * 3) // 1000个点，每个点3个坐标
  for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1 // 随机生成u  
      const v = Math.random() * 2 - 1 // 随机生成v

      const theta = Math.pow(u, 2) + Math.pow(v, 2)
      if(theta <= 1){
        const x = 2 * u * Math.sqrt(1 - theta) * radius
        const y = 2 * v * Math.sqrt(1 - theta) * radius
        // 这1是让z轴的点在-1到1之间
        // 
        const z = (1 - 2 * theta) * radius // 
        positions.set([x, y, z], i * 3) // 设置点的坐标
      }else{
        positions.set([1000,1000,1000], i * 3) // 设置点的坐标
      }
  }
  return positions
}


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