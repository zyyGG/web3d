import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0x3e3e3e, 1) // 设置背景色
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

// const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
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

///--------------------------------------------------------------------
// 平行光
// const light = new THREE.DirectionalLight(0xffffff, 2)
// light.position.set(0, 100, 100) // 设置光源位置
// // light.castShadow = true // 允许投射阴影
// scene.add(light) // 添加光源

// const ambientLight = new THREE.AmbientLight(0xffffff, 1)
// scene.add(ambientLight)

new RGBELoader().load('/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture; // 给场景添加环境光效果
  // scene.background = texture; // 给场景添加背景图
  // material.envMap = texture; // 给材质添加环境光效果
})

// 添加标准光源
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
hemisphereLight.position.set(0, 100, 0)
scene.add(hemisphereLight)

camera.position.set(-120, 80, 120) // 设置相机位置
camera.lookAt(0, 0, 0) // 设置相机朝向
// 主要代码写在这里
const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/'); // 设置解码器路径
gltfLoader.setDRACOLoader(dracoLoader); // 设置解码器
const loadAddress = [
  
  // "/models/builds/航站楼.gltf",
  // "/models/builds/航站楼-一层.gltf",
  // "/models/builds/航站楼-三层房间号.gltf",
  // "/models/builds/航站楼-三层.gltf",
  // "/models/builds/航站楼-负一层.gltf",
  "/models/builds/航站楼-二层.glb",
]

const loadModel = (url) => {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, (gltf) => {
      const model = gltf.scene
      model.traverse((child) => {
        if (child.isMesh) {
          console.log(child.material.envMap)
          // const material = new THREE.MeshStandardMaterial({
          //   map: child.material.map,
          //   color: 0xffffff
          // })
        }
      })
      scene.add(model)
      renderer.render(scene, camera)
      resolve(model.children[0])
    }, undefined, (error) => {
      console.error(error)
      reject(error)
    })
  })
}
const loadModels = async () => {
  const models = []
  for (let i = 0; i < loadAddress.length; i++) {
    const model = await loadModel(loadAddress[i])
    models.push(model)
  }
  return models
}
const models = await loadModels()
console.log(models)

controls.addEventListener('change', () => {
  renderer.render(scene, camera)
})

// const config = {
//   show: "gltf",
// }



// gui.add(config, 'show', ['gltf', 'glb_draco']).onChange((value) => {
//     if(value == "全部") {
//       models.forEach(model => {
//         model.visible = true
//       })
//     }else {
//       models.forEach(model => {
//         model.visible = false
//       })
//       if(value == 'gltf'){
//         models[0].visible = true
//       } else if(value == 'glb_draco'){
//         models[1].visible = true
//       }
//     }
//     renderer.render(scene, camera)
// })

///--------------------------------------------------------------------


// 渲染场景
function animations() {
  // renderer.render(scene, camera)
  // controls.update() // 更新控制器
  stats.update(); // 用来更新fps展示
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