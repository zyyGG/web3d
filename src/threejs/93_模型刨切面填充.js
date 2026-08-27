import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer({ stencil: true, alpha: false })
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

  

// 主要代码写在这里
renderer.localClippingEnabled = true // 启用局部裁剪
renderer.autoClearStencil = false // 禁用自动清除模板缓冲

// const bufferGeometry = new THREE.BufferGeometry()
const cubeGeometry = new THREE.SphereGeometry(1, 32, 32)
const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0) // 创建一个水平平面

// 裁切平面辅助器
const planeHelper = new THREE.PlaneHelper(plane, 2, 0xffff00)
scene.add(planeHelper)

const object = new THREE.Group()
scene.add(object)
const group = new THREE.Group()
const baseMaterial = new THREE.MeshBasicMaterial()
baseMaterial.depthTest = true // 禁用深度测试
baseMaterial.depthWrite = true // 禁用深度写入
baseMaterial.colorWrite = false // 禁用颜色写入
baseMaterial.stencilWrite = true // 启用模板写入
baseMaterial.stencilFunc = THREE.AlwaysStencilFunc // 始终通过模板测试

// 背面渲染
const mat0 = baseMaterial.clone()
mat0.side = THREE.BackSide
mat0.clippingPlanes = [plane]
mat0.stencilFail = THREE.IncrementWrapStencilOp // 模板测试失败时，模板值 +1
mat0.stencilZFail = THREE.IncrementWrapStencilOp // 模板测试通过但深度测试失败时，模板值 +1
mat0.stencilZPass = THREE.IncrementWrapStencilOp // 模板测试和深度测试都通过时，模板值 +1

const mesh0 = new THREE.Mesh(cubeGeometry, mat0)
mesh0.renderOrder = 1

// 正面渲染
const mat1 = baseMaterial.clone()
mat1.side = THREE.FrontSide
mat1.clippingPlanes = [plane]
mat1.stencilFail = THREE.DecrementWrapStencilOp // 模板测试失败时，模板值 -1
mat1.stencilZFail = THREE.DecrementWrapStencilOp // 模板测试通过但深度测试失败时，模板值 -1
mat1.stencilZPass = THREE.DecrementWrapStencilOp // 模板测试和深度测试都通过时，模板值 -1

const mesh1 = new THREE.Mesh(cubeGeometry, mat1)
mesh1.renderOrder = 1
object.add(mesh0)
object.add(mesh1)

// 使用模板缓冲渲染填充面（不加 clippingPlanes，用 stencil 控制可见性）
const planeGeom = new THREE.PlaneGeometry(4, 4)
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xE91E63,
  // stencilWrite: true 才能启用 stencil 测试（读取）
  stencilWrite: true,
  stencilRef: 0,
  stencilFunc: THREE.NotEqualStencilFunc,
  stencilFail: THREE.ReplaceStencilOp,
  stencilZFail: THREE.ReplaceStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,
})
const po = new THREE.Mesh(planeGeom, planeMaterial)
po.renderOrder = 1.5
scene.add(po)
po.onAfterRender = function () {
  renderer.clearStencil(); // 画完后清空模板，为后续物体做准备
}


const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.1,
  roughness: 0.75,
  clippingPlanes: [plane],
  shadowSide: THREE.FrontSide,
})

const clippingColorFront = new THREE.Mesh(cubeGeometry, material)
object.add( clippingColorFront );
clippingColorFront.renderOrder = 3


const params = {
  constant: 0,
}

gui.add( params, 'constant').min(-1).max(1).step(0.01).name('裁剪平面常数').onChange(value => {
  plane.constant = value;
})


/**
 * 本次问题汇总
 * 1. 最重要的就是没有开启webgl上下文的stencil缓冲区,导致调试了很久
 * 这里介绍一个检查有没有开启stencil缓冲区的方法.
 *  1. 创建一个平面, 开启stencilWrite, 然后将stencilFunc设置为NeverStencilFunc
 *  2. 渲染看看这个面是否显示, 显示就是stencil缓冲区没有开启, 不显示就是开启了
 * 2. 还有个方法就是使用renderer.getContext().getParameter(renderer.getContext().STENCIL_BITS)来获取stencil缓冲区的位数, 如果是0就是没有开启, 如果是8就是开启了
 */


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  
  controls.update() // 更新控制器
  stats.update();

  

  // 每帧将填充面定位到裁切平面上
  // plane.coplanarPoint( po.position );
  po.lookAt(
    po.position.x - plane.normal.x,
    po.position.y - plane.normal.y,
    po.position.z - plane.normal.z,
  );
  renderer.render(scene, camera)
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