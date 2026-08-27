import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0x000000, 1) // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop( animate );
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
scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

///--------------------------------------------------------------------
camera.position.set(0, 5, 5) // 设置相机位置
// 主要代码写在这里
// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );
const loader = new THREE.TextureLoader()
const starTexture = loader.load("/particles/mixShape1.png")

const rectSize = 30
const spriteList = []
for(let i = 0 ; i < Math.pow(rectSize, 2); i++) {
  // const x = Math.random() * 3 - 1.5
  // const y = 0
  // const z = Math.random() * 3 - 1.5
  const x = Math.floor(i/rectSize) * 0.15
  const y = 0
  const z = i%rectSize * 0.15
  // const scale = Math.random() * 0.2+ 0.1
  const scale = 0.1
  const starMaterial = new THREE.SpriteMaterial({
    map: starTexture,
    // color: THREE.MathUtils.randInt(0, 0xffffff),
    color: 0xf05000,
    transparent: true,
    opacity: 1,
  })

  const star = new THREE.Sprite(starMaterial)
  star.scale.set(scale, scale, scale) // 设置大小
  star.position.set(x, y, z) // 设置位置
  scene.add(star)
  spriteList.push(star)
}


///--------------------------------------------------------------------

const clock = new THREE.Clock() // 创建时钟
// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  spriteList.forEach((sprite, index)=>{
    sprite.position.y = Math.sin(clock.getElapsedTime() * 2 + index * 0.1) * 0.2
    const scale = Math.sin(clock.getElapsedTime() * 2 + index * 0.1) * 0.03 + 0.05
    sprite.scale.set(scale, scale, scale)
    sprite.material.opacity = Math.sin(clock.getElapsedTime() * 2 + index * 0.1) * 0.3 + 0.3
    // sprite.position.x = Math.cos(clock.getElapsedTime() + index * 0.1) * 0.5
  })
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