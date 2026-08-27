/**
 * Octree 八叉树 碰撞检测示例
 * 
 * 功能：
 * - 用 Octree 从场景网格构建空间索引
 * - Capsule 角色控制器 + WASD 移动
 * - 碰撞检测（重力 + 地面/障碍物碰撞）
 * - OctreeHelper 可视化八叉树结构
 * - GUI 控制参数
 */
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { Octree } from "three/examples/jsm/math/Octree.js"
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper.js"
import { Capsule } from "three/examples/jsm/math/Capsule.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'

// ======================== 基础初始化 ========================
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0x87ceeb, 1) // 天空蓝
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.querySelector("#app").appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 8, 15)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.25
controls.target.set(0, 1, 0)
controls.update()

const scene = new THREE.Scene()

// 光照
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
dirLight.position.set(10, 20, 10)
dirLight.castShadow = true
dirLight.shadow.mapSize.set(2048, 2048)
dirLight.shadow.camera.left = -30
dirLight.shadow.camera.right = 30
dirLight.shadow.camera.top = 30
dirLight.shadow.camera.bottom = -30
scene.add(dirLight)

// ======================== 构建场景物体 ========================

// 地面
const groundGeo = new THREE.BoxGeometry(30, 0.5, 30)
const groundMat = new THREE.MeshStandardMaterial({ color: 0x44aa44 })
const ground = new THREE.Mesh(groundGeo, groundMat)
ground.position.y = -0.25
ground.receiveShadow = true
scene.add(ground)

// 随机障碍物（柱子 + 平台）
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff6644 })
const obstacles = []

function createBox(w, h, d, x, y, z, color = 0xff6644) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({ color })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
  obstacles.push(mesh)
  return mesh
}

// 柱子
createBox(1, 3, 1, -5, 1.5, -5)
createBox(1, 4, 1, 5, 2, -5)
createBox(1, 2, 1, -5, 1, 5)
createBox(1, 5, 1, 5, 2.5, 5)

// 平台/台阶
createBox(4, 0.5, 4, 0, 0.25, -8, 0x4488ff)
createBox(3, 0.5, 3, 0, 0.75, -8, 0x4488ff)
createBox(2, 0.5, 2, 0, 1.25, -8, 0x4488ff)

// 斜坡
const rampGeo = new THREE.BoxGeometry(3, 0.3, 6)
const rampMat = new THREE.MeshStandardMaterial({ color: 0xffaa22 })
const ramp = new THREE.Mesh(rampGeo, rampMat)
ramp.position.set(8, 0.6, 0)
ramp.rotation.z = -0.2
ramp.castShadow = true
ramp.receiveShadow = true
scene.add(ramp)
obstacles.push(ramp)

// 墙壁
createBox(0.5, 3, 8, -8, 1.5, 0, 0x886644)
createBox(8, 3, 0.5, 0, 1.5, 10, 0x886644)

// 球体障碍
const sphereGeo = new THREE.SphereGeometry(1, 16, 16)
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xaa44ff })
const sphere = new THREE.Mesh(sphereGeo, sphereMat)
sphere.position.set(-3, 1, 0)
sphere.castShadow = true
scene.add(sphere)
obstacles.push(sphere)

// 圆柱
const cylGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 16)
const cylMat = new THREE.MeshStandardMaterial({ color: 0x44aaff })
const cyl = new THREE.Mesh(cylGeo, cylMat)
cyl.position.set(3, 1.5, 3)
cyl.castShadow = true
scene.add(cyl)
obstacles.push(cyl)

// ======================== Octree 构建 ========================

const worldOctree = new Octree()

// 从场景中所有网格构建八叉树
function buildOctree() {
  worldOctree.clear()
  // 收集场景中所有 mesh（包含地面和障碍物）
  scene.traverse((child) => {
    if (child.isMesh) {
      worldOctree.fromGraphNode(child)
    }
  })
}
buildOctree()

// OctreeHelper 可视化
let octreeHelper = new OctreeHelper(worldOctree, 0x00ff00)
scene.add(octreeHelper)

// ======================== 角色控制器 (Capsule) ========================

const GRAVITY = 30
const playerRadius = 0.35
const playerHeight = 1.0

const playerCollider = new Capsule(
  new THREE.Vector3(0, playerRadius, 0),  // 底部
  new THREE.Vector3(0, playerRadius + playerHeight, 0), // 顶部
  playerRadius
)

// 玩家可视化的胶囊体
const capsuleGeo = new THREE.CapsuleGeometry(playerRadius, playerHeight, 8, 16)
const capsuleMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 })
const playerMesh = new THREE.Mesh(capsuleGeo, capsuleMat)
playerMesh.castShadow = true
scene.add(playerMesh)

// 玩家状态
const playerVelocity = new THREE.Vector3()
const playerDirection = new THREE.Vector3()
let playerOnFloor = false

// ======================== 键盘输入 ========================

const keyStates = {}

window.addEventListener('keydown', (e) => {
  keyStates[e.code] = true
})

window.addEventListener('keyup', (e) => {
  keyStates[e.code] = false
})

// 鼠标点击锁定指针（可选，FPS 模式）
renderer.domElement.addEventListener('click', () => {
  // renderer.domElement.requestPointerLock()
})

// ======================== 碰撞检测逻辑 ========================

function playerCollisions() {
  const result = worldOctree.capsuleIntersect(playerCollider)
  playerOnFloor = false

  if (result) {
    playerOnFloor = result.normal.y > 0
    // 将胶囊推出碰撞
    playerCollider.translate(result.normal.multiplyScalar(result.depth))
    // 如果碰到物体，抵消该方向的速度
    if (result.normal.y > 0) {
      playerVelocity.y = 0
    } else {
      // 反弹阻尼
      const dot = playerVelocity.dot(result.normal)
      if (dot < 0) {
        playerVelocity.addScaledVector(result.normal, -dot)
      }
    }
  }
}

function updatePlayer(deltaTime) {
  // 仅在指针锁定时用鼠标旋转，这里简化为方向键控制
  let damping = Math.exp(-4 * deltaTime) - 1

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime
    // 空中阻尼小一些
    damping *= 0.1
  } else {
    // 地面阻尼
    damping *= 3
  }

  playerVelocity.addScaledVector(playerVelocity, damping)

  // 键盘输入 → 移动方向
  const speed = 12
  playerDirection.set(0, 0, 0)

  if (keyStates['KeyW'] || keyStates['ArrowUp']) playerDirection.z -= 1
  if (keyStates['KeyS'] || keyStates['ArrowDown']) playerDirection.z += 1
  if (keyStates['KeyA'] || keyStates['ArrowLeft']) playerDirection.x -= 1
  if (keyStates['KeyD'] || keyStates['ArrowRight']) playerDirection.x += 1

  if (playerDirection.lengthSq() > 0) {
    playerDirection.normalize()
    // 相对于相机朝向的方向
    const angle = Math.atan2(
      camera.position.x - playerCollider.start.x,
      camera.position.z - playerCollider.start.z
    )
    playerDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)

    // 地面移动
    if (playerOnFloor) {
      playerVelocity.x += playerDirection.x * speed * deltaTime
      playerVelocity.z += playerDirection.z * speed * deltaTime
    } else {
      // 空中少量控制
      playerVelocity.x += playerDirection.x * speed * 0.2 * deltaTime
      playerVelocity.z += playerDirection.z * speed * 0.2 * deltaTime
    }
  }

  // 跳跃
  if ((keyStates['Space']) && playerOnFloor) {
    playerVelocity.y = 8
  }

  // 移动胶囊
  const deltaPos = playerVelocity.clone().multiplyScalar(deltaTime)
  playerCollider.translate(deltaPos)

  // 碰撞检测
  playerCollisions()

  // 同步可视化网格位置
  playerMesh.position.copy(playerCollider.start)
  playerMesh.position.y += playerHeight / 2

  // 防止掉出世界
  if (playerCollider.start.y < -20) {
    playerCollider.start.set(0, playerRadius, 0)
    playerCollider.end.set(0, playerRadius + playerHeight, 0)
    playerVelocity.set(0, 0, 0)
  }
}

// ======================== GUI ========================

const params = {
  showOctreeHelper: true,
  showAxesHelper: true,
  gravity: GRAVITY,
  resetPosition: () => {
    playerCollider.start.set(0, playerRadius, 0)
    playerCollider.end.set(0, playerRadius + playerHeight, 0)
    playerVelocity.set(0, 0, 0)
  }
}

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const debugFolder = gui.addFolder('调试')
debugFolder.add(params, 'showOctreeHelper').name('显示八叉树').onChange(v => octreeHelper.visible = v)
debugFolder.add(params, 'showAxesHelper').name('显示坐标轴').onChange(v => axesHelper.visible = v)
debugFolder.add(params, 'gravity', 0, 60).name('重力').onChange(v => {
  // GRAVITY is const, but we can use params.gravity in the loop
})
debugFolder.add(params, 'resetPosition').name('重置位置')
debugFolder.open()

const infoDiv = document.createElement('div')
infoDiv.style.cssText = 'position:fixed;top:10px;left:10px;color:#fff;font-size:14px;background:rgba(0,0,0,0.5);padding:10px;border-radius:6px;pointer-events:none;'
infoDiv.innerHTML = `
  <b>Octree 碰撞检测测试</b><br/>
  WASD / 方向键: 移动<br/>
  Space: 跳跃<br/>
  鼠标: 旋转视角
`
document.body.appendChild(infoDiv)

// ======================== 主循环 ========================

const clock = new THREE.Clock()

function animate() {
  const deltaTime = Math.min(clock.getDelta(), 0.1) // 限制最大 delta 防止穿模

  updatePlayer(deltaTime)

  // 相机跟随玩家（平滑）
  const targetPos = playerCollider.start.clone()
  targetPos.y += 2
  camera.position.lerp(
    targetPos.clone().add(new THREE.Vector3(0, 5, 10)),
    0.05
  )
  controls.target.lerp(targetPos, 0.1)
  controls.update()

  renderer.render(scene, camera)
  stats.update()
}

// ======================== 窗口 resize ========================
window.onresize = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
