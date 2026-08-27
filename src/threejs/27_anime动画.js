import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate as animation, createTimeline } from 'animejs';



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
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const newPosition = new THREE.Vector3(0, 0, 0);
// const originalPosition = new Proxy({
//   x: cube.position.x,
//   y: cube.position.y,
//   z: cube.position.z,
//   scale: 1
// }, {
//   set(target, key, value){
//     if(key === 'scale'){
//       cube.scale.set(value, value, value)
//       Reflect.set(target, key, value)
//       return
//     }else if(key === 'x' || key === 'y' || key === 'z'){ 
//       cube.position[key] = value
//       Reflect.set(target, key, value)
//       return
//     } else {
//       Reflect.set(target, key, value)
//       return
//     }
//   },
//   get(target, key){
//     if(key === 'scale'){
//       return cube.scale.x
//     }else {
//       return cube.position[key]
//     }
//   }
// })
const randomPosition = new THREE.Vector3(
  Math.random() * 10 - 5,
  Math.random() * 10 - 5,
  Math.random() * 10 - 5
)
const cubeAnimation = createTimeline({ autoplay: false, defaults: { duration: 20000 } })
cubeAnimation.add(cube.position, {
  x: 5,
  y: 5,
  z: 0,
  easing: 'easeInOutQuad',
  autoplay: false,
}, 0)
cubeAnimation.add(cube.scale, {
  x: 0.1,
  y: 0.1,
  z: 0.1,
  easing: 'easeInOutQuad',
  autoplay: true,
}, 0)
// const cubeAnimation = animation(cube.position, {
//   x: 5,
//   y: 5,
//   z: 0,
//   alternate: true, // 反向动画
//   ease: 'in(1.5)',
//   // easing: 'easeInOutQuad',
//   duration: 2000,
//   loop: false,
//   autoplay: false,
// })

const config = {
  play: () => { cubeAnimation.restart() }
}

gui.add(config, 'play').name('播放动画')

///--------------------------------------------------------------------


// 渲染场景
function animate() {
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