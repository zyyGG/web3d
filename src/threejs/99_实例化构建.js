import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { HDRLoader } from "three/examples/jsm/Addons.js";



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
scene.add(directionalLight)

// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
scene.add(gridHelper)

let helpParams =  {
  gridHelper: true,
  directionalLightHelper: true,
  axesHelper: true,
}
const helpControls = gui.addFolder('辅助器控制')

function saveControlHelps(){
  console.log(helpParams)
  localStorage.setItem('helpControls', JSON.stringify(helpParams));
}

function loadControlHelps(){
  helpParams = JSON.parse(localStorage.getItem('helpControls'));
  gridHelper.visible = helpParams.gridHelper;
  directionalLightHelper.visible = helpParams.directionalLightHelper;
  axesHelper.visible = helpParams.axesHelper;
  helpControls.add( helpParams, 'gridHelper' ).name('grid辅助器').onChange(value => {gridHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'directionalLightHelper' ).name('平行光辅助器').onChange(value => {directionalLightHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'axesHelper' ).name('坐标辅助器').onChange(value => {axesHelper.visible = value; saveControlHelps()} );
}

loadControlHelps()

///--------------------------------------------------------------------


//  光照调整 
ambientLight.intensity = 0.2
directionalLight.intensity = 0.6
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
directionalLight.shadow.camera.far = 40
directionalLight.shadow.camera.near = 0.5
directionalLight.position.set(20, 20, 20)

directionalLightHelper.visible = false 

const camearHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
camearHelper.visible = false
scene.add(camearHelper)

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setClearColor("#555555", 1) // 设置背景色

// 创建半球光
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0)
hemisphereLight.position.set(0, 20, 20)
scene.add(hemisphereLight)

// 设置相机位置 
camera.position.set(0, 10, 10)

// 设置可检测对象
const objects = new THREE.Group()
scene.add(objects)
  
// 地面
const floor= new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
  })
)
floor.rotation.x = -Math.PI / 2
floor.position.y -= 0.01
floor.receiveShadow = true
objects.add(floor)


const textureLoader = new THREE.TextureLoader()

// 创建方块实例
const maxCount = 1000
let activeCount = 0
const instanceGeometry = new THREE.BoxGeometry(1, 1, 1)
const sideMat = new THREE.MeshStandardMaterial({
  map: textureLoader.load("/textures/spruce_log.png"),
  normalMap: textureLoader.load("/textures/spruce_log_n.png"),
})
const topMat = new THREE.MeshStandardMaterial({
  map: textureLoader.load("/textures/spruce_log_top.png"),
  normalMap: textureLoader.load("/textures/spruce_log_top_n.png"),
})
const instanceMaterial = [sideMat, sideMat, topMat, topMat, sideMat, sideMat]
const instanceMesh = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, maxCount)
instanceMesh.count = 0 // 初始一个都不显示，点击后才添加
instanceMesh.frustumCulled = false // 关闭视锥体裁剪，确保所有实例都能被点击检测到
instanceMesh.castShadow = true
objects.add(instanceMesh)
// 显示实例的包围球辅助器


// 用于射线检测的临时向量
const mouse = new THREE.Vector2()
const tempColor = new THREE.Color()

// 创建点击射线
const raycaster = new THREE.Raycaster()
const mouseStart = new THREE.Vector2()
const mouseEnd = new THREE.Vector2()

// 方块指示器
const indicatorGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01))
const indicatorMaterial = new THREE.LineBasicMaterial({ color: 0x000000 })
const indicatorMesh = new THREE.LineSegments(indicatorGeometry, indicatorMaterial)
indicatorMesh.visible = false
scene.add(indicatorMesh)

// 地面指示器
const floorIndicatorGeometry = new THREE.PlaneGeometry(0.9, 0.9)
const floorIndicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
const floorIndicatorMesh = new THREE.Mesh(floorIndicatorGeometry, floorIndicatorMaterial)
floorIndicatorMesh.rotation.x = -Math.PI / 2
floorIndicatorMesh.visible = false
scene.add(floorIndicatorMesh)


window.addEventListener("mousedown", (event) => {
  mouseStart.set(event.clientX, event.clientY)
})

window.addEventListener("mouseup", event => {
  mouseEnd.set(event.clientX, event.clientY)
  if(mouseStart.distanceTo(mouseEnd) > 5) return

  if(event.button === 2) handleRightClick(event)
  else if(event.button === 0) handleLeftClick(event)
})

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const instanceIntersect = raycaster.intersectObject(instanceMesh)
  if (instanceIntersect.length > 0) {
    const hit = instanceIntersect[0]
    const index = hit.instanceId
    const tempMatrix = new THREE.Matrix4()
    instanceMesh.getMatrixAt(index, tempMatrix)
    const position = new THREE.Vector3()
    position.setFromMatrixPosition(tempMatrix)
    gsap.to(indicatorMesh.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration: 0.1
    })
    // indicatorMesh.position.copy(position)
    indicatorMesh.visible = true
    floorIndicatorMesh.visible = false
    return
    // console.log(`鼠标悬停在实例 #${index} 上，位置: (${position.x}, ${position.y}, ${position.z})`)
  } 

  const floorIntersect = raycaster.intersectObject(floor)
  if (floorIntersect.length > 0) {
    const point = floorIntersect[0].point
    gsap.to(floorIndicatorMesh.position, {
      x: Math.round(point.x),
      y: 0.01,
      z: Math.round(point.z),
      duration: 0.1
    })
    floorIndicatorMesh.visible = true
    indicatorMesh.visible = false
    return
  }

})

// 处理左键点击事件
function handleLeftClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  // 先检测是否点击到已有实例
  const instanceIntersect = raycaster.intersectObject(instanceMesh)
  if (instanceIntersect.length > 0) {
    const hit = instanceIntersect[0]
    const normal = hit.face.normal.clone()
    const cx = hit.point.x + normal.x * 0.5
    const cy = hit.point.y + normal.y * 0.5
    const cz = hit.point.z + normal.z * 0.5
    addInstance(
      Math.round(cx),
      Math.round(cy - 0.5) + 0.5, // 方块中心在 y=0.5
      Math.round(cz)
    ) // 点击到已有实例 → 在该位置添加新实例
    return
  }

  // 没点到实例，再检测地面 → 添加新实例
  const floorIntersect = raycaster.intersectObject(floor)
  if (floorIntersect.length > 0) {
    const x = Math.round(floorIntersect[0].point.x)
    const y = 0.5
    const z = Math.round(floorIntersect[0].point.z)
    addInstance(x, y, z)
    return
  }
}

// 处理右键点击事件
function handleRightClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const instanceIntersect = raycaster.intersectObject(instanceMesh)
  if (instanceIntersect.length > 0) {
    const hit = instanceIntersect[0]
    const index = hit.instanceId
    removeInstance(index)
  }
}

// 添加方块实例
function addInstance(x, y , z) {
  if (activeCount >= maxCount) {
    console.warn('实例数量已达上限')
    return
  }
  activeCount++
  instanceMesh.count = activeCount

  const dummy = new THREE.Object3D()
  dummy.position.copy(new THREE.Vector3(x, y, z)) // 方块中心在 y=0.5
  // dummy.rotation.y = Math.random() * Math.PI * 2
  dummy.updateMatrix()
  instanceMesh.setMatrixAt(activeCount - 1, dummy.matrix)
  instanceMesh.instanceMatrix.needsUpdate = true
  instanceMesh.computeBoundingSphere()
  // instanceMesh.computeBoundingBox()

  console.log(`添加实例 #${activeCount - 1}`)
}

function addInstanceAtInstance(position, face) {
  const offset = face.normal.clone().multiplyScalar(1) // 沿法线方向偏移一个单位
  addInstance(position.clone().add(offset))
}

function removeInstance(index) {
  // 这里采用移位法, 删除的方块直接删, 后面的方块往前移动, 保持id顺序

  if(index < 0 || index >= activeCount) return 

  for(let i = index; i < activeCount - 1; i++) {
    const tempMatrix = new THREE.Matrix4()
    instanceMesh.getMatrixAt(i + 1, tempMatrix)
    instanceMesh.setMatrixAt(i, tempMatrix)
  }
  activeCount--
  instanceMesh.count = activeCount
  instanceMesh.instanceMatrix.needsUpdate = true
  instanceMesh.computeBoundingSphere() // 重新计算包围盒
}

// 规整坐标位置
function processPosition(position) {
  return new THREE.Vector3(
    Math.round(position.x),
    Math.round(position.y),
    Math.round(position.z)
  )
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