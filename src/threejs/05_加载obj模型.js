import * as THREE from "three"
// import GUI from "three/addons/libs/lil-gui.module.min.js"
import * as GUI from "dat.gui"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { OBJLoader } from "three/examples/jsm/Addons.js"
import { MTLLoader } from "three/examples/jsm/Addons.js"

// 创建基础环境
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
// 创建gui
const gui = new GUI.GUI();

// 处理高分屏
renderer.setPixelRatio(window.devicePixelRatio)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()

// 摄像机坐标
camera.position.set(0, 5, 0) // 设置摄像机位置
// camera.position.set(0, 0, 10) // 设置摄像机位置


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
// 世界坐标辅助器
// const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)
// 设置渲染器背景色
// renderer.setClearColor(0xfeffcc, 1) // 设置背景色
renderer.setClearColor(0x000000, 1) // 设置背景色

renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector("#app").appendChild(renderer.domElement)

// 添加世界光源
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight)
// 添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)
// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)

const objLoader = new OBJLoader()
const mtlLoader = new MTLLoader()
mtlLoader.load("/models/obj2.mtl", (materials) => {
  materials.preload()
  objLoader.setMaterials(materials)
  
  objLoader.load("/models/obj2.obj", (object)=>{
    object.traverse((child) => {
      if (child.isMesh) {
        if(child.material.name == "03"){
          child.material = new THREE.MeshStandardMaterial({
            color: 0xFFC3B7,
            side: THREE.FrontSide,
            transparent: true,
            opacity: 0.3
          })
        }else {
          child.material = new THREE.MeshLambertMaterial({
            color: materials.materials[child.material.name].color,
          })
        }
      }
    })
    scene.add(object)
  })
})






camera.position.z = 5;

// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
}
//循环渲染
renderer.setAnimationLoop( animate );

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