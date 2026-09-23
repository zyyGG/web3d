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

// 主要代码写在这里
// -------------------- 解析 Blender 导出的 NURBS 路径 --------------------
// 注意：这个 obj 里只有 cstype/curv/parm（真正的 B-spline 定义），
// three 自带的 OBJLoader 不解析这些语句，只能自己读文本手动解析。
function parseNurbsObj(text) {
  const vertices = []
  let curvTokens = []
  let degree = 3
  let knots = []

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.split(/\s+/)
      vertices.push(new THREE.Vector3(parseFloat(x), parseFloat(y), parseFloat(z)))
    } else if (line.startsWith('deg ')) {
      degree = Number(line.split(/\s+/)[1])
    } else if (line.startsWith('curv ')) {
      curvTokens = line.split(/\s+/).slice(1).map(Number) // [u0, u1, 控制点索引...]
    } else if (line.startsWith('parm u ')) {
      knots = line.split(/\s+/).slice(2).map(Number)
    }
  })

  const [domainStart, domainEnd, ...indices] = curvTokens
  // obj 负索引：相对已声明顶点总数向前数，例如 -1 是最后一个顶点；
  // 首尾重复引用同一个控制点是 Blender 导出闭合 NURBS 的固定写法，必须保留，不能去重
  const controlPoints = indices.map((index) => (
    index < 0 ? vertices[vertices.length + index] : vertices[index - 1]
  ))

  return { controlPoints, degree, knots, domainStart, domainEnd }
}

// 标准 de Boor 算法：找到参数 u 落在哪一段节点区间（The NURBS Book, Algorithm A2.1）
function findKnotSpan(controlPointCount, degree, u, knots) {
  const n = controlPointCount - 1
  if (u >= knots[n + 1]) return n
  if (u <= knots[degree]) return degree

  let low = degree
  let high = n + 1
  let mid = Math.floor((low + high) / 2)
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid
    else low = mid
    mid = Math.floor((low + high) / 2)
  }
  return mid
}

// 标准 de Boor 算法：递推算出曲线在参数 u 处的实际点（The NURBS Book, Algorithm A5.1 思路）
function evaluateBSpline(controlPoints, degree, knots, u) {
  const span = findKnotSpan(controlPoints.length, degree, u, knots)
  const d = []
  for (let j = 0; j <= degree; j++) {
    d[j] = controlPoints[j + span - degree].clone()
  }
  for (let r = 1; r <= degree; r++) {
    for (let j = degree; j >= r; j--) {
      const left = knots[j + span - degree]
      const right = knots[j + 1 + span - r]
      const alpha = (u - left) / (right - left)
      d[j] = d[j - 1].clone().multiplyScalar(1 - alpha).add(d[j].clone().multiplyScalar(alpha))
    }
  }
  return d[degree]
}

// 包装成 THREE.Curve，这样 getPointAt/getTangentAt（等弧长采样）都能直接复用
class NurbsCurve extends THREE.Curve {
  constructor(controlPoints, degree, knots, domainStart, domainEnd) {
    super()
    this.controlPoints = controlPoints
    this.degree = degree
    this.knots = knots
    this.domainStart = domainStart
    this.domainEnd = domainEnd
  }

  getPoint(t, target = new THREE.Vector3()) {
    const u = THREE.MathUtils.lerp(this.domainStart, this.domainEnd, t)
    // u 卡在定义域末端时，findKnotSpan 用 >= 判断会越界，夹紧一点点避免精度问题
    const clampedU = Math.min(u, this.domainEnd - 1e-6)
    return target.copy(evaluateBSpline(this.controlPoints, this.degree, this.knots, clampedU))
  }
}

let nurbsCurve = null
const nurbsCube = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.4, 0.4),
  new THREE.MeshStandardMaterial({ color: 0xff5533 }),
)
nurbsCube.visible = false
scene.add(nurbsCube)

fetch('/nurbs/test.obj')
  .then((response) => response.text())
  .then((text) => {
    const { controlPoints, degree, knots, domainStart, domainEnd } = parseNurbsObj(text)
    nurbsCurve = new NurbsCurve(controlPoints, degree, knots, domainStart, domainEnd)

    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x33ccff, emissive: 0x1166aa, emissiveIntensity: 0.6 })
    const pathMesh = new THREE.Mesh(new THREE.TubeGeometry(nurbsCurve, 1000, 0.005, 8, true), pathMaterial)
    scene.add(pathMesh)

    nurbsCube.visible = true
  })
  .catch((error) => console.error('NURBS 路径加载失败', error))

const nurbsMoveParams = { speed: 0.08 }
const nurbsFolder = gui.addFolder('NURBS 路径巡游')
nurbsFolder.add(nurbsMoveParams, 'speed', 0.01, 0.5).name('速度')

///--------------------------------------------------------------------

let nurbsProgress = 0
let lastTimestamp = 0
// 渲染场景
function animations(timestamp = 0) {
  const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0
  lastTimestamp = timestamp

  if (nurbsCurve) {
    nurbsProgress = (nurbsProgress + nurbsMoveParams.speed * delta) % 1
    const point = nurbsCurve.getPointAt(nurbsProgress)
    const tangent = nurbsCurve.getTangentAt(nurbsProgress)
    nurbsCube.position.copy(point)
    nurbsCube.lookAt(point.clone().add(tangent))
  }

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