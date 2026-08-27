import * as THREE from "three"
import GUI from "three/addons/libs/lil-gui.module.min.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

// 创建基础环境
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
// 创建gui
const gui = new GUI()

// 处理高分屏
renderer.setPixelRatio(window.devicePixelRatio)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()


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
// 光线辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)
// 设置渲染器背景色
// renderer.setClearColor(0xfeffcc, 1) // 设置背景色
renderer.setClearColor(0x000000, 1) // 设置背景色

renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector("#app").appendChild(renderer.domElement)

// 添加世界光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)
// 添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(10, 5, 5)
scene.add(directionalLight)
// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)


const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0x44aa88, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


camera.position.z = 5;

// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
}
//循环渲染
renderer.setAnimationLoop( animate );

// const directionalLightGui = gui.addFolder("平行光")
// directionalLightGui.add(directionalLight.position, "x", -10, 10).name("平行光X轴").onChange(()=>{directionalLight.lookAt(new THREE.Vector3(0, 0, 0))})
// directionalLightGui.add(directionalLight.position, "y", -10, 10).name("平行光Y轴")
// directionalLightGui.add(directionalLight.position, "z", -10, 10).name("平行光Z轴")
// gui.add(cube.rotation, "x", 0, Math.PI * 2).name("旋转X轴")
// gui.add(cube.rotation, "y", 0, Math.PI * 2).name("旋转Y轴")
// gui.add(cube.rotation, "z", 0, Math.PI * 2).name("旋转Z轴")

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