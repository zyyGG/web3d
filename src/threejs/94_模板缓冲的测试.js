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

// 正确设置相机 — 先更新 controls 使其同步
camera.position.set(0, 0, 5)
controls.target.set(0, 0, 0)
controls.update()

// ── 诊断：检查模板缓冲区是否存在 ──
const gl = renderer.getContext()
const attrs = gl.getContextAttributes()
console.log('WebGL 上下文属性:', attrs)
const stencilBits = gl.getParameter(gl.STENCIL_BITS)
console.log('📊 模板缓冲区位数:', stencilBits, stencilBits > 0 ? '✅ 存在' : '❌ 不存在')

if (stencilBits === 0) {
  console.error('❌ 致命：模板缓冲区为0！尝试下面两种修复：')
  console.error('  方案1: 改第18行为 new THREE.WebGLRenderer({ stencil: true, alpha: false })')
  console.error('  方案2: 换个浏览器（Chrome/Edge最新版）')
}

// ── 方案：两遍渲染法 ──
// 第一遍：只画模板标记 mesh0 + 线框
// 第二遍：只画平面 mesh1（读取第一遍的模板值）
// 两遍之间只清除深度，保留模板缓冲区

// 主要代码写在这里
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const planeGeometry = new THREE.PlaneGeometry(4, 4)

// ── 第1层：写模板（不可见） ──
const baseMaterial = new THREE.MeshBasicMaterial({
  depthTest: false,
  depthWrite: false,
  colorWrite: false,
  stencilWrite: true,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilZPass: THREE.IncrementStencilOp,
})
const mesh0 = new THREE.Mesh(cubeGeometry, baseMaterial)
mesh0.renderOrder = 0
scene.add(mesh0)

// ── 可见的线框，标出盒子位置 ──
const wireMat = new THREE.LineBasicMaterial({ color: 0xffff00 })
const wireGeo = new THREE.EdgesGeometry(cubeGeometry)
const wireframe = new THREE.LineSegments(wireGeo, wireMat)
wireframe.renderOrder = 0
scene.add(wireframe)

// ── 第2层：读模板（只在 stencil != 0 处显示） ──
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xE91E63,
  side: THREE.DoubleSide,
  depthTest: false,
  stencilWrite: true,
  stencilRef: 0,
  stencilFunc: THREE.NotEqualStencilFunc,
  stencilFail: THREE.ReplaceStencilOp,
  stencilZFail: THREE.ReplaceStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,
})
const mesh1 = new THREE.Mesh(planeGeometry, planeMaterial)
mesh1.renderOrder = 0
scene.add(mesh1)



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  controls.update()

  // ── 两遍渲染 ──
  renderer.autoClear = false

  // 第1遍：清除所有，只画模板标记和线框
  renderer.clear(true, true, true)
  mesh1.visible = false
  renderer.render(scene, camera)

  // 只清除深度，保留模板缓冲区
  renderer.clear(false, true, false)

  // 第2遍：只画平面（读取模板）
  mesh1.visible = true
  mesh0.visible = false
  wireframe.visible = false
  renderer.render(scene, camera)

  // 恢复状态
  mesh0.visible = true
  wireframe.visible = true
  renderer.autoClear = true

  stats.update();
}


///--------------------------------------------------------------------


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