import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { MeshBVH } from "three-mesh-bvh"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"



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
// -------------------- 地面与赛道（赛道只是视觉参考，不限制走位） --------------------
scene.background = new THREE.Color(0xbfe3ff) // 淡蓝天空背景
scene.fog = new THREE.Fog(0xbfe3ff, 80, 260) // 远处运雾，增加景深
renderer.setClearColor(0xbfe3ff, 1)

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a6b35, roughness: 1 })
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.02
scene.add(ground)

// -------------------- 解析 Blender 导出的 NURBS 曲线，当作赛道中心线 --------------------
// obj 里只有 cstype/curv/parm（真正的 B-spline 定义），OBJLoader 不解析这些语句，只能自己读文本手动解析。
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
  // obj 负索引：相对已声明顶点总数向前数，首尾重复引用同一个控制点是 Blender 导出闭合 NURBS 的固定写法，必须保留不能去重
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

// 标准 de Boor 算法：递推算出曲线在参数 u 处的实际点
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
    const clampedU = Math.min(u, this.domainEnd - 1e-6) // 避免卡在定义域末端时越界
    return target.copy(evaluateBSpline(this.controlPoints, this.degree, this.knots, clampedU))
  }
}

// 沿一条闭合曲线采样，向左右各扩出半宽，拼成一条带状路面
function createTrackGeometry(curve, width, segments) {
  const points = curve.getSpacedPoints(segments)
  const positions = []
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const nextPoint = points[(i + 1) % points.length]
    const dir = new THREE.Vector2(nextPoint.x - point.x, nextPoint.z - point.z).normalize()
    const perp = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(width / 2)
    positions.push(point.x + perp.x, 0, point.z + perp.y)
    positions.push(point.x - perp.x, 0, point.z - perp.y)
  }
  const indices = []
  for (let i = 0; i < points.length; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = ((i + 1) % points.length) * 2
    const d = ((i + 1) % points.length) * 2 + 1
    indices.push(a, b, c, b, d, c)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// -------------------- 路缘石（纯视觉）--------------------
// 沿路缘比较稀疑的采样线摆一排交替红白方块，冒充路缘石
function createCurbMesh(curve, width) {
  const samples = curve.getSpacedPoints(80)
  const group = new THREE.Group()
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 })
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6 })
  const boxGeometry = new THREE.BoxGeometry(0.5, 0.15, 1.1)

  for (let i = 0; i < samples.length; i++) {
    const point = samples[i]
    const nextPoint = samples[(i + 1) % samples.length]
    const dir = new THREE.Vector2(nextPoint.x - point.x, nextPoint.z - point.z).normalize()
    const perp = new THREE.Vector2(-dir.y, dir.x)
    const angle = Math.atan2(dir.x, dir.y)

    ;[-1, 1].forEach((side) => {
      const curbMesh = new THREE.Mesh(boxGeometry, i % 2 === 0 ? redMaterial : whiteMaterial)
      curbMesh.position.set(point.x + perp.x * width * side, 0.08, point.z + perp.y * width * side)
      curbMesh.rotation.y = angle
      group.add(curbMesh)
    })
  }
  return group
}

// -------------------- 围栏（纯视觉）--------------------
// 沿路面内外各偷一条半透明竖直带状网，冒充赛道防护栏
function createFenceGeometry(curve, offset, height, segments) {
  const points = curve.getSpacedPoints(segments)
  const positions = []
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const nextPoint = points[(i + 1) % points.length]
    const dir = new THREE.Vector2(nextPoint.x - point.x, nextPoint.z - point.z).normalize()
    const perp = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(offset)
    positions.push(point.x + perp.x, 0, point.z + perp.y)
    positions.push(point.x + perp.x, height, point.z + perp.y)
  }
  const indices = []
  for (let i = 0; i < points.length; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = ((i + 1) % points.length) * 2
    const d = ((i + 1) % points.length) * 2 + 1
    indices.push(a, b, c, b, d, c)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// -------------------- 树与灌木（纯视觉）--------------------
function createTree(x, z, scale = 1) {
  const tree = new THREE.Group()
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 1 })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.4, 8), trunkMaterial)
  trunk.position.y = 0.7
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2e6b34, roughness: 1 })
  const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), foliageMaterial)
  foliage.position.y = 1.9
  foliage.scale.set(1, 1.2, 1)
  tree.add(trunk, foliage)
  tree.position.set(x, 0, z)
  tree.scale.setScalar(scale)
  tree.rotation.y = Math.random() * Math.PI * 2
  return tree
}

function createBush(x, z, scale = 1) {
  const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x3c7a3f, roughness: 1 })
  const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), bushMaterial)
  bush.position.set(x, 0.4, z)
  bush.scale.setScalar(scale)
  return bush
}

// -------------------- 看台（纯视觉）--------------------
function createGrandstand() {
  const stand = new THREE.Group()
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.8 })
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3355aa, roughness: 0.5 })

  for (let tier = 0; tier < 4; tier++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 2.2), frameMaterial)
    step.position.set(0, 0.6 + tier * 1.1, -tier * 1.6)
    stand.add(step)
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 3), roofMaterial)
  roof.position.set(0, 5.6, -3.2)
  stand.add(roof)
  return stand
}

// -------------------- 赛道中心线、采样、可视化都得等 NURBS 解析完才能建 --------------------
const trackHalfWidth = 3
let trackCurve = null
let trackSamples = null
let trackReady = false
let trackStartHeading = 0
let buildingsBVH = null // 建筑物的 BVH 加速结构，用来做车与建筑物的碰撞检测

fetch('/nurbs/test02.obj')
  .then((response) => response.text())
  .then((text) => {
    const { controlPoints, degree, knots, domainStart, domainEnd } = parseNurbsObj(text)
    const trackScale = 18 // 原始曲线只有几个单位大，放大到正常赛道尺寸，避免弯道挤在一起自相重叠
    controlPoints.forEach((point) => point.multiplyScalar(trackScale))

    trackCurve = new NurbsCurve(controlPoints, degree, knots, domainStart, domainEnd)
    trackSamples = trackCurve.getSpacedPoints(300) // 密集采样，用于边界碰撞和圈数判定

    const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 })
    const track = new THREE.Mesh(createTrackGeometry(trackCurve, trackHalfWidth * 2, 160), trackMaterial)
    track.position.y = 0.01
    scene.add(track)
    scene.add(createCurbMesh(trackCurve, trackHalfWidth + 0.3))

    // -------------------- 围栏：赛道内外側各一条，半透明网状质感 --------------------
    const fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
    })
    scene.add(new THREE.Mesh(createFenceGeometry(trackCurve, trackHalfWidth + 2.4, 1.2, 160), fenceMaterial))
    scene.add(new THREE.Mesh(createFenceGeometry(trackCurve, -(trackHalfWidth + 2.4), 1.2, 160), fenceMaterial))

    // -------------------- 看台：摆在起跑线旁边（用垂直于赛道的方向偏移，别用错切线方向摆到路中间） --------------------
    const startDir = new THREE.Vector2(trackSamples[1].x - trackSamples[0].x, trackSamples[1].z - trackSamples[0].z).normalize()
    const startPerp = new THREE.Vector2(-startDir.y, startDir.x)
    const grandstand = createGrandstand()
    grandstand.position.set(
      trackSamples[0].x + startPerp.x * (trackHalfWidth + 10),
      0,
      trackSamples[0].z + startPerp.y * (trackHalfWidth + 10),
    )
    grandstand.rotation.y = Math.atan2(startDir.x, startDir.y) + Math.PI / 2
    scene.add(grandstand)

    // -------------------- 树与灌木：在赛道周围随机撃种，自动避开赛道本体 --------------------
    const scatterHalfExtent = 90
    const minDistanceFromTrack = trackHalfWidth + 6
    let placedCount = 0
    while (placedCount < 140) {
      const x = THREE.MathUtils.randFloatSpread(scatterHalfExtent * 2)
      const z = THREE.MathUtils.randFloatSpread(scatterHalfExtent * 2)

      let nearestDistSq = Infinity
      for (let i = 0; i < trackSamples.length; i += 3) { // 每隔几个采样点检一次，够用且更快
        const distSq = trackSamples[i].distanceToSquared(new THREE.Vector3(x, 0, z))
        if (distSq < nearestDistSq) nearestDistSq = distSq
      }
      if (Math.sqrt(nearestDistSq) < minDistanceFromTrack) continue

      if (Math.random() < 0.35) {
        scene.add(createTree(x, z, THREE.MathUtils.randFloat(0.8, 1.4)))
      } else {
        scene.add(createBush(x, z, THREE.MathUtils.randFloat(0.7, 1.3)))
      }
      placedCount++
    }

    // -------------------- 修车库/车库建筑：真正可碰撞的建筑物，摄在赛道旁边玩家会实际撞上的位置 --------------------
    function createGarage() {
      const garage = new THREE.Group()
      const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xb8b2a4, roughness: 0.85 })
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xaa3322, roughness: 0.7 })
      const wall = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 6), wallMaterial)
      wall.position.y = 1.5
      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.4, 6.6), roofMaterial)
      roof.position.y = 3.2
      garage.add(wall, roof)
      return garage
    }

    const garageIndices = [Math.floor(trackSamples.length * 0.28), Math.floor(trackSamples.length * 0.62)]
    const garages = garageIndices.map((index) => {
      const point = trackSamples[index]
      const nextPoint = trackSamples[(index + 1) % trackSamples.length]
      const dir = new THREE.Vector2(nextPoint.x - point.x, nextPoint.z - point.z).normalize()
      const perp = new THREE.Vector2(-dir.y, dir.x)

      const garage = createGarage()
      garage.position.set(point.x + perp.x * (trackHalfWidth + 5), 0, point.z + perp.y * (trackHalfWidth + 5))
      garage.rotation.y = Math.atan2(dir.x, dir.y)
      scene.add(garage)
      return garage
    })

    // -------------------- 把看台 + 修车库合并成一个世界空间几何体，建成单一 BVH，碰撞检测用 --------------------
    const collidableMeshes = []
    grandstand.traverse((child) => { if (child.isMesh) collidableMeshes.push(child) })
    garages.forEach((garage) => garage.traverse((child) => { if (child.isMesh) collidableMeshes.push(child) }))

    const worldSpaceGeometries = collidableMeshes.map((mesh) => {
      mesh.updateWorldMatrix(true, false)
      return mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
    })
    const mergedBuildingGeometry = mergeGeometries(worldSpaceGeometries, false)
    buildingsBVH = new MeshBVH(mergedBuildingGeometry)

    // -------------------- 调试线条：中心线 + 左右边界线 + 控制点，方便肉眼核对赛道形状 --------------------
    const debugGroup = new THREE.Group()

    const centerlinePoints = trackSamples.map((p) => new THREE.Vector3(p.x, 0.15, p.z))
    const centerlineGeometry = new THREE.BufferGeometry().setFromPoints([...centerlinePoints, centerlinePoints[0]])
    const centerline = new THREE.Line(centerlineGeometry, new THREE.LineBasicMaterial({ color: 0xffff00 }))
    debugGroup.add(centerline)

    // 沿采样点向左右各偏移半宽，画出赛道的实际边界线
    function createBoundaryLine(offsetSide, color) {
      const points = trackSamples.map((point, i) => {
        const nextPoint = trackSamples[(i + 1) % trackSamples.length]
        const dir = new THREE.Vector2(nextPoint.x - point.x, nextPoint.z - point.z).normalize()
        const perp = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(trackHalfWidth * offsetSide)
        return new THREE.Vector3(point.x + perp.x, 0.15, point.z + perp.y)
      })
      const geometry = new THREE.BufferGeometry().setFromPoints([...points, points[0]])
      return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }))
    }
    debugGroup.add(createBoundaryLine(1, 0x00ffff))
    debugGroup.add(createBoundaryLine(-1, 0xff00ff))

    // 原始控制点位置（缩放后），用小球标出来，核对解析出来的控制点对不对
    const controlPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff2266 })
    controlPoints.forEach((point) => {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), controlPointMaterial)
      marker.position.set(point.x, 0.4, point.z)
      debugGroup.add(marker)
    })

    scene.add(debugGroup)
    const debugFolder = gui.addFolder('调试线条')
    debugFolder.add(debugGroup, 'visible').name('显示赛道调试线')

    // 起跑线：摆在采样的第 0 个点，垂直于赛道方向
    const finishLineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    const finishLine = new THREE.Mesh(new THREE.PlaneGeometry(trackHalfWidth * 2, 1.2), finishLineMaterial)
    const finishDir = new THREE.Vector2(trackSamples[1].x - trackSamples[0].x, trackSamples[1].z - trackSamples[0].z).normalize()
    finishLine.rotation.x = -Math.PI / 2
    finishLine.rotation.z = Math.atan2(finishDir.x, finishDir.y)
    finishLine.position.set(trackSamples[0].x, 0.02, trackSamples[0].z)
    scene.add(finishLine)

    // 把赛车直接放到起跑线上，朝向沿赛道切线，而不是卡在世界原点
    car.position.set(trackSamples[0].x, 0, trackSamples[0].z)
    carState.heading = Math.atan2(finishDir.x, finishDir.y)
    car.rotation.y = carState.heading
    trackStartHeading = carState.heading // 记下出生朝向，撞毁重置时要用

    trackReady = true
  })
  .catch((error) => console.error('赛道 NURBS 曲线加载失败', error))

// -------------------- 赛车模型：车身 + 4 个可转向/可滚动的车轮 --------------------
function createWheel() {
  const wheelPivot = new THREE.Group() // 转向轴心，front 轮用它来左右打方向
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  const wheelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 20), tireMaterial)
  wheelMesh.rotation.z = Math.PI / 2 // 让圆柱的旋转轴对齐到左右方向，冒充轮胎
  wheelPivot.add(wheelMesh)
  return { wheelPivot, wheelMesh }
}

const carBody = new THREE.Group() // 承载俯仰(pitch)/侧倾(roll)，模拟悬挂重心摆动
const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0xd23c3c, roughness: 0.4, metalness: 0.2 })
const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.4), chassisMaterial)
chassis.position.y = 0.55
const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2b3a, roughness: 0.3, metalness: 0.1 })
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.6), cabinMaterial)
cabin.position.set(0, 0.95, -0.2)
carBody.add(chassis, cabin)

const wheelOffsets = [
  { key: 'frontLeft', x: -0.85, z: 1.1, steer: true },
  { key: 'frontRight', x: 0.85, z: 1.1, steer: true },
  { key: 'rearLeft', x: -0.85, z: -1.1, steer: false },
  { key: 'rearRight', x: 0.85, z: -1.1, steer: false },
]
const wheels = {}
wheelOffsets.forEach(({ key, x, z, steer }) => {
  const { wheelPivot, wheelMesh } = createWheel()
  wheelPivot.position.set(x, 0.32, z)
  carBody.add(wheelPivot)
  wheels[key] = { wheelPivot, wheelMesh, steer }
})

const car = new THREE.Group() // 外层只负责朝向(heading)和世界位置
car.add(carBody)
scene.add(car)

// -------------------- 键盘输入 --------------------
const keyState = {}
window.addEventListener('keydown', (event) => {
  keyState[event.code] = true
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault()
})
window.addEventListener('keyup', (event) => { keyState[event.code] = false })
const isPressed = (...codes) => codes.some((code) => keyState[code])

// -------------------- 赛车参数与状态 --------------------
const carParams = {
  acceleration: 10,        // 油门加速度 m/s^2
  brakeDeceleration: 16,   // 刹车减速度 m/s^2
  friction: 2.2,           // 松开油门时的自然减速
  maxSpeed: 22,            // 最高前进速度 m/s
  maxReverseSpeed: -8,     // 最高倒车速度
  turnSpeed: 2.4,          // 满转向、满速时的最大转向角速度 rad/s
  leanAmount: 0.22,        // 转弯时车身侧倾的最大角度
  pitchAmount: 0.14,       // 加速/刹车时车身俯仰的最大角度
  suspensionSmoothing: 6,  // 侧倾/俯仰恢复水平的速度，越大越"硬"
  cameraDistance: 7,
  cameraHeight: 3.2,
  cameraSmoothing: 4,
  chaseCameraEnabled: true,
}
const carState = { speed: 0, heading: 0, roll: 0, pitch: 0 }
const carDamageState = { health: 100 }
let wasCollidingWithBuilding = false

function updateCarPhysics(delta) {
  if (delta <= 0) return

  const throttleInput = (isPressed('KeyW', 'ArrowUp') ? 1 : 0) - (isPressed('KeyS', 'ArrowDown') ? 1 : 0)
  const steerInput = (isPressed('KeyA', 'ArrowLeft') ? 1 : 0) - (isPressed('KeyD', 'ArrowRight') ? 1 : 0)
  const previousSpeed = carState.speed

  if (throttleInput > 0) {
    carState.speed += carParams.acceleration * delta
  } else if (throttleInput < 0) {
    // 正向行驶时踩反向键 = 刹车；已经停下/倒车时才是真正的倒车加速度
    carState.speed -= (carState.speed > 0.5 ? carParams.brakeDeceleration : carParams.acceleration) * delta
  } else {
    const drag = carParams.friction * delta
    carState.speed = Math.abs(carState.speed) <= drag ? 0 : carState.speed - Math.sign(carState.speed) * drag
  }
  carState.speed = THREE.MathUtils.clamp(carState.speed, carParams.maxReverseSpeed, carParams.maxSpeed)

  // 车速越快，同样的方向盘输入能拐的角速度也越大；停着时几乎转不动，更像真车
  const speedFactor = THREE.MathUtils.clamp(Math.abs(carState.speed) / carParams.maxSpeed, 0, 1)
  const turnDirection = carState.speed >= 0 ? 1 : -1 // 倒车时转向方向相反
  carState.heading += steerInput * carParams.turnSpeed * speedFactor * turnDirection * delta

  const forward = new THREE.Vector3(Math.sin(carState.heading), 0, Math.cos(carState.heading))
  car.position.addScaledVector(forward, carState.speed * delta)
  car.rotation.y = carState.heading

  // -------- 重心摆动：侧倾(roll) 由转向+车速决定，俯仰(pitch) 由瞬时加速度决定 --------
  const targetRoll = -steerInput * carParams.leanAmount * speedFactor
  const instantAcceleration = (carState.speed - previousSpeed) / delta
  const targetPitch = -THREE.MathUtils.clamp(instantAcceleration / carParams.acceleration, -1.5, 1.5) * carParams.pitchAmount

  // 指数平滑：模拟悬挂弹簧阻尼慢慢恢复水平，而不是瞬间贴到目标角度
  const smoothFactor = 1 - Math.exp(-carParams.suspensionSmoothing * delta)
  carState.roll = THREE.MathUtils.lerp(carState.roll, targetRoll, smoothFactor)
  carState.pitch = THREE.MathUtils.lerp(carState.pitch, targetPitch, smoothFactor)
  carBody.rotation.z = carState.roll
  carBody.rotation.x = carState.pitch

  // -------- 车轮：前轮跟随方向盘转向，四轮按车速滚动 --------
  const maxSteerAngle = 0.5
  Object.values(wheels).forEach(({ wheelPivot, wheelMesh, steer }) => {
    if (steer) wheelPivot.rotation.y = steerInput * maxSteerAngle
    wheelMesh.rotation.x -= (carState.speed * delta) / 0.32 // 除以轮胎半径，换算成滚动角速度
  })
}

// -------------------- 赛道边界碰撞 + 圈数计时 --------------------
const raceState = { lapCount: 0, lastNearestIndex: 0, lastLapTime: 0, currentLapTime: 0 }

function updateTrackConstraint() {
  if (!trackReady) return // NURBS 赛道还没加载完之前，不做边界/圈数判定

  // 找赛道中心线上离车最近的采样点，用来判断是否出路、跟圈数
  let nearestIndex = 0
  let nearestDistSq = Infinity
  for (let i = 0; i < trackSamples.length; i++) {
    const distSq = trackSamples[i].distanceToSquared(car.position)
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq
      nearestIndex = i
    }
  }

  const point = trackSamples[nearestIndex]
  const nextPoint = trackSamples[(nearestIndex + 1) % trackSamples.length]
  const dir = new THREE.Vector2(nextPoint.x - point.x, nextPoint.z - point.z).normalize()
  const perp = new THREE.Vector2(-dir.y, dir.x)
  const offset = new THREE.Vector2(car.position.x - point.x, car.position.z - point.z)
  const lateralOffset = offset.dot(perp)

  // 路面実际宽度之外再留一点缓冲，碰到边界才硬性弹回并扣速，像撞上路缘石
  const limit = trackHalfWidth + 1.4
  if (Math.abs(lateralOffset) > limit) {
    const clampedLateral = Math.sign(lateralOffset) * limit
    car.position.x = point.x + perp.x * clampedLateral
    car.position.z = point.z + perp.y * clampedLateral
    carState.speed *= 0.4
  }

  // 经过起点附近，且上一帧还在赛道后半段，才算跑完一圈（避免在起点附近来回抖重复计数）
  const total = trackSamples.length
  if (raceState.lastNearestIndex > total * 0.7 && nearestIndex < total * 0.3) {
    raceState.lapCount += 1
    raceState.lastLapTime = raceState.currentLapTime
    raceState.currentLapTime = 0
  }
  raceState.lastNearestIndex = nearestIndex
}

// -------------------- 与建筑物的 BVH 碰撞：推出去 + 扣血 + 车身凹陷 --------------------
function applyCrumple(localImpactDir) {
  const dir2D = new THREE.Vector2(localImpactDir.x, localImpactDir.z)
  if (dir2D.lengthSq() < 1e-6) return
  dir2D.normalize()

  // 把车身盒子里面靠近撞击方向的顶点往里推一点，冒充凹陷
  const posAttr = chassis.geometry.attributes.position
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i)
    const vz = posAttr.getZ(i)
    const vertexDir = new THREE.Vector2(vx, vz)
    if (vertexDir.lengthSq() < 1e-6) continue
    vertexDir.normalize()

    if (vertexDir.dot(dir2D) > 0.55) {
      const dent = 0.1 + Math.random() * 0.08
      posAttr.setX(i, vx - dir2D.x * dent)
      posAttr.setZ(i, vz - dir2D.y * dent)
    }
  }
  posAttr.needsUpdate = true
  chassis.geometry.computeVertexNormals()
  chassisMaterial.color.multiplyScalar(0.9) // 每撑一次车漆暗一点，模拟碰痕/烧焦
}

function updateBuildingCollision() {
  if (!buildingsBVH) return

  const carRadius = 1.3 // 把车简化成一个球做碰撞检测
  const hit = buildingsBVH.closestPointToPoint(car.position, {}, 0, carRadius + 2)
  if (!hit || hit.distance >= carRadius) {
    wasCollidingWithBuilding = false
    return
  }

  const penetration = carRadius - hit.distance
  const pushDir = car.position.clone().sub(hit.point)
  if (pushDir.lengthSq() < 1e-6) {
    pushDir.set(Math.sin(carState.heading), 0, Math.cos(carState.heading)).negate()
  }
  pushDir.y = 0
  pushDir.normalize()
  car.position.addScaledVector(pushDir, penetration) // 硬性推出建筑物表面，防止穿模

  if (!wasCollidingWithBuilding) {
    const impactSpeed = Math.abs(carState.speed)
    if (impactSpeed > 2) {
      const damage = THREE.MathUtils.clamp(impactSpeed * 2.2, 4, 45)
      carDamageState.health = Math.max(0, carDamageState.health - damage)

      const localImpactDir = pushDir.clone().negate().applyQuaternion(car.quaternion.clone().invert())
      applyCrumple(localImpactDir)
    }
    carState.speed *= 0.15 // 撞上建筑物，速度被撑掉绝大部分
  }
  wasCollidingWithBuilding = true
}

function resetCar() {
  const spawn = trackReady ? trackSamples[0] : { x: 0, z: 0 }
  car.position.set(spawn.x, 0, spawn.z)
  car.rotation.y = trackStartHeading
  carState.speed = 0
  carState.heading = trackStartHeading
  carState.roll = 0
  carState.pitch = 0
  carDamageState.health = 100
  wasCollidingWithBuilding = false

  chassis.geometry.dispose()
  chassis.geometry = new THREE.BoxGeometry(1.7, 0.5, 3.4)
  chassisMaterial.color.set(0xd23c3c)
}

// -------------------- 跟随相机：始终在车后方一点，带阻尼跟随 --------------------
const chaseLookTarget = new THREE.Vector3(0, 1, 4)
camera.position.set(0, carParams.cameraHeight, -carParams.cameraDistance) // 匹配 heading=0 时的初始机位，避免开局镜头猛地飞过来

function updateChaseCamera(delta) {
  const forward = new THREE.Vector3(Math.sin(carState.heading), 0, Math.cos(carState.heading))
  const targetPosition = car.position.clone()
    .addScaledVector(forward, -carParams.cameraDistance)
    .setY(car.position.y + carParams.cameraHeight)
  const targetLook = car.position.clone().addScaledVector(forward, 4).setY(car.position.y + 1)

  const smoothFactor = 1 - Math.exp(-carParams.cameraSmoothing * delta)
  camera.position.lerp(targetPosition, smoothFactor)
  chaseLookTarget.lerp(targetLook, smoothFactor)
  camera.lookAt(chaseLookTarget)
}

controls.enabled = false // 默认跟随相机驾驶，勾掉 GUI 里的选项可切回自由视角调试

const carFolder = gui.addFolder('赛车')
carFolder.add(carParams, 'acceleration', 2, 25).name('加速度')
carFolder.add(carParams, 'brakeDeceleration', 4, 30).name('刹车力度')
carFolder.add(carParams, 'friction', 0.5, 8).name('自然减速')
carFolder.add(carParams, 'maxSpeed', 5, 40).name('最高速度')
carFolder.add(carParams, 'turnSpeed', 0.5, 5).name('转向速度')
carFolder.add(carParams, 'leanAmount', 0, 0.5).name('侧倾幅度')
carFolder.add(carParams, 'pitchAmount', 0, 0.4).name('俯仰幅度')
carFolder.add(carParams, 'suspensionSmoothing', 1, 15).name('悬挂回弹速度')
carFolder.add(carParams, 'chaseCameraEnabled').name('跟随相机').onChange((value) => { controls.enabled = !value })
carFolder.add(carState, 'speed').name('当前速度(m/s)').listen()

const raceFolder = gui.addFolder('圈数与计时')
raceFolder.add(raceState, 'lapCount').name('已跑圈数').listen()
raceFolder.add(raceState, 'currentLapTime').name('本圈用时(s)').listen()
raceFolder.add(raceState, 'lastLapTime').name('上一圈用时(s)').listen()

const damageFolder = gui.addFolder('车辆状态')
damageFolder.add(carDamageState, 'health', 0, 100).name('车辆血量').listen()
damageFolder.add({ 重置车辆: resetCar }, '重置车辆')

///--------------------------------------------------------------------

let lastTimestamp = 0
// 渲染场景
function animations(timestamp = 0) {
  const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0
  lastTimestamp = timestamp

  updateCarPhysics(delta)
  updateTrackConstraint()
  updateBuildingCollision()
  if (carDamageState.health <= 0) resetCar() // 血量掉光，自动回到起点重来
  if (trackReady) raceState.currentLapTime += delta

  if (carParams.chaseCameraEnabled) {
    updateChaseCamera(delta)
  } else {
    controls.update() // 更新控制器
  }

  renderer.render(scene, camera)
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