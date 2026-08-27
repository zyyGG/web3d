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
const material = new THREE.MeshStandardMaterial( { color: 0xfeffcc} );
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
camera.position.y = 0;
camera.position.x = -5;
camera.position.z = -5;
const count = 10
// 创建cube
for(let i = 0; i < Math.pow(count,3); i++){
  const cube = new THREE.Mesh( geometry, material );
  scene.add( cube );
  cube.position.x = (i % count) * 1.5 
  cube.position.y = Math.floor(i / (count * count)) * 1.5
  cube.position.z = Math.floor(i / count % count) * 1.5
}


// 添加点击事件
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const selectMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000} );
let lastSelected = null; // 上一个选中的物体
let laseSelecMaterial = null; // 上一个选中的物体的材质
let mouseMove = false; // 鼠标是否移动
window.addEventListener('mouseup', (event) => {
  if(event.button !== 0) return // 只处理鼠标左键点击
  if(mouseMove) return // 如果鼠标移动了就不处理点击事件
  
  // 计算鼠标点击位置
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // 更新射线
  raycaster.setFromCamera(mouse, camera)

  // 检测物体
  const intersects = raycaster.intersectObjects(scene.children)
  if (intersects.length > 0) {
    // 检查第一个物体是否是mesh
    const activeObject = intersects[0].object
    if(activeObject.isMesh){
      // 恢复上一个mesh的材质
      if(lastSelected){
        lastSelected.material = laseSelecMaterial
      }
      // 记录上一个mesh
      lastSelected = activeObject
      // 记录上一个mesh的材质
      laseSelecMaterial = activeObject.material
      // 设置选中材质
      activeObject.material = selectMaterial
      
    }
  }
})

window.addEventListener("mousedown", (event) => {
  mouseMove = false
})

window.addEventListener('mousemove', (event) => {
  event.preventDefault()
  // 移动超过阈值
  if (Math.abs(event.movementX) > 5 || Math.abs(event.movementY) > 5) {
    mouseMove = true
    return
  }
})


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