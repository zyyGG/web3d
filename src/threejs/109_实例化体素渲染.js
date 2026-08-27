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
  const savedHelps = localStorage.getItem('helpControls');
  if (savedHelps) {
    helpParams = { ...helpParams, ...JSON.parse(savedHelps) };
  }
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

const clock = new THREE.Clock()
const raycaster = new THREE.Raycaster()
const mouseNdc = new THREE.Vector2(2, 2)
const tempObject = new THREE.Object3D()
const tempMatrix = new THREE.Matrix4()
const tempPosition = new THREE.Vector3()

const voxelParams = {
  worldSize: 48,
  maxHeight: 18,
  noiseScale: 0.17,
  heightBias: 0.38,
  wireframe: false,
  spinLight: true,
  regenerate: () => buildVoxelWorld()
}

const voxelGroup = new THREE.Group()
scene.add(voxelGroup)

let voxelMesh = null

const highlightBox = new THREE.Mesh(
  new THREE.BoxGeometry(1.04, 1.04, 1.04),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
)
highlightBox.visible = false
scene.add(highlightBox)

const voxelControls = gui.addFolder('体素参数')
voxelControls.add(voxelParams, 'worldSize', 16, 72, 1).name('地图尺寸').onFinishChange(() => buildVoxelWorld())
voxelControls.add(voxelParams, 'maxHeight', 4, 30, 1).name('最大高度').onFinishChange(() => buildVoxelWorld())
voxelControls.add(voxelParams, 'noiseScale', 0.05, 0.45, 0.01).name('噪声缩放').onFinishChange(() => buildVoxelWorld())
voxelControls.add(voxelParams, 'heightBias', 0, 0.8, 0.01).name('基础高度').onFinishChange(() => buildVoxelWorld())
voxelControls.add(voxelParams, 'wireframe').name('体素线框').onChange(value => {
  if (voxelMesh) {
    voxelMesh.material.wireframe = value
  }
})
voxelControls.add(voxelParams, 'spinLight').name('旋转光照')
voxelControls.add(voxelParams, 'regenerate').name('重新生成')

function hashNoise2D(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function smoothNoise2D(x, z) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz

  const n00 = hashNoise2D(ix, iz)
  const n10 = hashNoise2D(ix + 1, iz)
  const n01 = hashNoise2D(ix, iz + 1)
  const n11 = hashNoise2D(ix + 1, iz + 1)

  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)

  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(n00, n10, u),
    THREE.MathUtils.lerp(n01, n11, u),
    v
  )
}

function fbmNoise(x, z, octaves = 4) {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  let normalization = 0

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise2D(x * frequency, z * frequency) * amplitude
    normalization += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return value / normalization
}

function sampleHeight(x, z) {
  const n = fbmNoise(x * voxelParams.noiseScale, z * voxelParams.noiseScale)
  const ridge = Math.abs(Math.sin((x + z) * 0.12)) * 0.26
  const h = voxelParams.heightBias + n * 0.9 + ridge
  return Math.max(1, Math.floor(h * voxelParams.maxHeight))
}

function getVoxelColor(height, maxHeight) {
  const t = THREE.MathUtils.clamp(height / Math.max(maxHeight - 1, 1), 0, 1)
  if (t < 0.22) return new THREE.Color("#2d6a4f")
  if (t < 0.5) return new THREE.Color("#52b788")
  if (t < 0.78) return new THREE.Color("#90a955")
  return new THREE.Color("#dad7cd")
}

function buildVoxelWorld() {
  if (voxelMesh) {
    voxelGroup.remove(voxelMesh)
    voxelMesh.geometry.dispose()
    voxelMesh.material.dispose()
    voxelMesh = null
  }

  const size = voxelParams.worldSize
  const half = size / 2

  const heights = []
  let cubeCount = 0

  for (let x = 0; x < size; x++) {
    heights[x] = []
    for (let z = 0; z < size; z++) {
      const worldX = x - half
      const worldZ = z - half
      const h = sampleHeight(worldX, worldZ)
      heights[x][z] = h
      cubeCount += h
    }
  }

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.86,
    metalness: 0.05,
    wireframe: voxelParams.wireframe,
    // vertexColors: true
  })

  voxelMesh = new THREE.InstancedMesh(geometry, material, cubeCount)
  voxelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  let index = 0
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const h = heights[x][z]
      const worldX = x - half + 0.5
      const worldZ = z - half + 0.5
      for (let y = 0; y < h; y++) {
        tempObject.position.set(worldX, y + 0.5, worldZ)
        tempObject.updateMatrix()
        voxelMesh.setMatrixAt(index, tempObject.matrix)
        voxelMesh.setColorAt(index, getVoxelColor(y, voxelParams.maxHeight))
        index++
      }
    }
  }

  voxelMesh.castShadow = false
  voxelMesh.receiveShadow = false
  voxelMesh.instanceMatrix.needsUpdate = true
  if (voxelMesh.instanceColor) {
    voxelMesh.instanceColor.needsUpdate = true
  }
  voxelGroup.add(voxelMesh)

  controls.target.set(0, voxelParams.maxHeight * 0.22, 0)
  controls.update()
  highlightBox.visible = false
}

buildVoxelWorld()

window.addEventListener('pointermove', event => {
  mouseNdc.x = (event.clientX / window.innerWidth) * 2 - 1
  mouseNdc.y = -(event.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener('pointerleave', () => {
  mouseNdc.set(2, 2)
  highlightBox.visible = false
})


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  const elapsed = clock.getElapsedTime()

  if (voxelParams.spinLight) {
    directionalLight.position.x = Math.sin(elapsed * 0.3) * 24
    directionalLight.position.z = Math.cos(elapsed * 0.3) * 24
    directionalLight.position.y = 16
  }

  if (voxelMesh) {
    raycaster.setFromCamera(mouseNdc, camera)
    const intersections = raycaster.intersectObject(voxelMesh)

    if (intersections.length > 0 && intersections[0].instanceId !== undefined) {
      voxelMesh.getMatrixAt(intersections[0].instanceId, tempMatrix)
      tempPosition.setFromMatrixPosition(tempMatrix)
      highlightBox.position.copy(tempPosition)
      highlightBox.visible = true
    } else {
      highlightBox.visible = false
    }
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