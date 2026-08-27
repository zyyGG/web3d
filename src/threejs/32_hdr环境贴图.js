import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
import { animate, createTimeline } from "animejs"



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
// renderer.setClearColor(0x000000, 1) // 设置背景色
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
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
// directionalLight.position.set(0, 10, 10)
// scene.add(directionalLight)

// 添加平行光辅助器
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

///--------------------------------------------------------------------
// 主要代码写在这里
const config = {
  color: 0xffffff,
  roughness: 0.0,
  metalness: 0.5, // 金属度
  envMapIntensity: 1, // 环境光强度
}
// 扭结
const geometry = new THREE.TorusKnotGeometry(1, 0.4, 100, 16)
const material = new THREE.MeshStandardMaterial(config)
const torusKnot = new THREE.Mesh(geometry, material)
scene.add(torusKnot)


new RGBELoader().load('/hdr/empty_play_room_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture; // 给场景添加环境光效果
  scene.background = texture; // 给场景添加背景图
  // material.envMap = texture; // 给材质添加环境光效果
})
material.needsUpdate = true; // 更新材质

gui.addColor(config, 'color').name("材质颜色").onChange((value) => {
  material.color.set(value)
})
gui.add(config, 'roughness', 0, 1, 0.01).name("粗糙度").onChange((value) => {
  material.roughness = value
})
gui.add(config, 'metalness', 0, 1, 0.01).name("金属度").onChange((value) => {
  material.metalness = value
})
gui.add(config, 'envMapIntensity', 0, 1, 0.01).name("环境光强度").onChange((value) => {
  material.envMapIntensity = value
})


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