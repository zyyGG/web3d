import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"



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
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
// directionalLight.intensity = 5 // 设置光源强度
// directionalLight.position.set(0, 10, 10)
// scene.add(directionalLight)

// 添加平行光辅助器
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
// scene.add(directionalLightHelper)

// 世界坐标辅助器
// const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

// grid辅助器
// const gridHelper = new THREE.GridHelper(20, 20)
// scene.add(gridHelper)
// 色调映射
renderer.toneMapping = THREE.NeutralToneMapping // 色调映射

///--------------------------------------------------------------------

const loaderManager = new THREE.LoadingManager()
loaderManager.onStart = () => {
  console.log('开始加载')
}
loaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(`加载中：${url}，已加载${itemsLoaded}个，全部${itemsTotal}个`)
}
loaderManager.onLoad = () => {
  // 主要代码写在这里
  const geometry = new THREE.PlaneGeometry(1, 1, 50, 50)// 创建几何体
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    side: THREE.DoubleSide, // 双面渲染
  })
  // const shape = new THREE.Mesh(geometry, material) // 创建网格
  const planeGroup = new THREE.Group() // 创建组
  const radius = 5

  for(let i = -radius; i <= radius; i++){
    for(let j = -radius; j <= radius; j++){
      const shape = new THREE.Mesh(geometry, material) // 创建网格
      shape.position.set(i, 0, j) // 设置位置
      shape.rotation.x = -Math.PI / 2 // 设置旋转
      // shape.scale.set(0.5, 0.5, 0.5) // 设置缩放
      planeGroup.add(shape) // 添加到组中
    }
  }
  scene.add(planeGroup) // 添加到场景中
  // controls.lock();
}
loaderManager.onError = (url) => {
  console.log(`加载失败：${url}`)
}
const textureLoader = new THREE.TextureLoader(loaderManager)
const texture = textureLoader.load('/textures/pbr_01/PavingStones139_1K-PNG_Color.png')
const normalTexture = textureLoader.load('/textures/pbr_01/PavingStones139_1K-PNG_NormalGL.png')
const roughnessTexture = textureLoader.load('/textures/pbr_01/PavingStones139_1K-PNG_Roughness.png')
const aoTexture = textureLoader.load('/textures/pbr_01/PavingStones139_1K-PNG_AmbientOcclusion.png')
texture.colorSpace = THREE.SRGBColorSpace // 设置颜色空间
// normalTexture.colorSpace = THREE.SRGBColorSpace // 设置颜色空间
// roughnessTexture.colorSpace = THREE.SRGBColorSpace // 设置颜色空间
// aoTexture.colorSpace = THREE.SRGBColorSpace // 设置颜色空间


new RGBELoader().load('/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture; // 给场景添加环境光效果
  scene.background = texture; // 给场景添加背景图
})


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
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