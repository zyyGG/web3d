import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { engine, animate, createTimeline } from "animejs"

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
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
// scene.add(ambientLight)



// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
// scene.add(gridHelper)

///--------------------------------------------------------------------
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshStandardMaterial( { 
  color: 0xfeffcc, 
} );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(0,2,0)
cube.castShadow = true
scene.add( cube );

// 平面
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(20,20,1,1),
  new THREE.MeshStandardMaterial({
    color: "rgba(195, 128, 18)",
  }),
)
plane.receiveShadow = true
plane.rotateX(-Math.PI * 0.5)
scene.add(plane)
renderer.shadowMap.enabled = true // 开启阴影

// 平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 0)
directionalLight.intensity = 1
directionalLight.castShadow = true // 开启阴影
scene.add(directionalLight)
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)
// 这个可以看见为什么阴影会消失一部分
const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(cameraHelper)

// 创建半球光用来模拟环境光
// 半球光会创建一个天空色，和地面的反射色， 比如说太阳光找到绿色的漆面会反射一些绿色的颜色到附近的物体上
// 这可以让物体展示更加真实的颜色
const hemisphereLight = new THREE.HemisphereLight(0xffffff, new THREE.Color("rgba(86, 64, 9)"), 1)
hemisphereLight.position.set(0, 10, 0)
// hemisphereLight.castShadow = true
scene.add(hemisphereLight)
const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 1)
scene.add(hemisphereLightHelper)

// 点光源创建阴影
const pointLight = new THREE.PointLight(0xffffff, 1, 100)
pointLight.position.set(0, 5, 0)
pointLight.intensity = 80
pointLight.castShadow = true // 开启阴影
scene.add(pointLight)
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5)
scene.add(pointLightHelper)

const config = {
  directionalLight: true,
  hemisphereLight: true,
  pointLight: true,
}

gui.add(config, "directionalLight").name("平行光").onChange((val) => {
  directionalLight.visible = val
  directionalLightHelper.visible = val
  cameraHelper.visible = val
})

gui.add(config, "hemisphereLight").name("半球光").onChange((val) => {
  hemisphereLight.visible = val
  hemisphereLightHelper.visible = val
})

gui.add(config, "pointLight").name("点光源").onChange((val) => {
  pointLight.visible = val
  pointLightHelper.visible = val
})

// 创建动画
const cubeAnime = createTimeline({
  defaults: {
    duration: 5500,
    ease: "linear",
  },
  loop: true,
  autoplay: false,
})
.add(cube.position, {
  x: {
    from: -1,
    to: 1,
    modifier: v => Math.cos(Math.PI * v) * 5,
  },
  z: {
    from: -1,
    to: 1,
    modifier: v => Math.sin(Math.PI * v) * 5,
  },
}, 0)

let directionalAnime = createTimeline({
  defaults: {
    duration: 8000,
    ease: "linear",
  },
  loop: true,
  autoplay: false,
})
.add(directionalLight.position, {
  x: {
    from: -1,
    to: 1,
    modifier: v => -Math.cos(Math.PI * v) * 5 + 1,
  },
  z: {
    from: -1,
    to: 1,
    modifier: v => Math.sin(Math.PI * v) * 5 - 1,
  },
}, 0)

const pointLightAnime = createTimeline({
  defaults: {
    duration: 2000,
    ease: "linear",
  },
  loop: true,
  alternate: true,
  autoplay: false,
})
.add(pointLight.position, {
  y : [2, 10],
}, 0)

const group = createTimeline()
group
  .sync(cubeAnime, 0)
  .sync(directionalAnime, 0)
  .sync(pointLightAnime, 0)
group.play()




///--------------------------------------------------------------------

let delta = 0
// 渲染场景
function animations() {
  delta += 0.005
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