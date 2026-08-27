/**
 * SelectionBox + SelectionHelper 框选示例
 * 
 * 功能：
 * - 鼠标拖拽画矩形框选 3D 物体
 * - 选中的物体高亮显示
 * - Shift 多次框选累加选择
 * - 点击空白处取消选择
 * - GUI 控制
 */
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SelectionBox } from "three/examples/jsm/interactive/SelectionBox.js"
import { SelectionHelper } from "three/examples/jsm/interactive/SelectionHelper.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'

// ======================== 基础初始化 ========================
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0x222233, 1)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
document.querySelector("#app").appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(12, 15, 18)
camera.lookAt(0, 0, 0)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.1

const scene = new THREE.Scene()

// 光照
scene.add(new THREE.AmbientLight(0xffffff, 0.6))
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
dirLight.position.set(10, 20, 10)
scene.add(dirLight)

// 坐标轴 + 网格
scene.add(new THREE.AxesHelper(10))
const grid = new THREE.GridHelper(20, 20, 0x444466, 0x333355)
scene.add(grid)

// ======================== 创建随机物体 ========================

const selectableObjects = [] // 所有可选物体
const originalColors = new Map() // 存储原始颜色

function randomColor() {
  return new THREE.Color().setHSL(Math.random(), 0.7, 0.6)
}

// 随机几何体类型
const geometries = [
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.SphereGeometry(0.5, 16, 16),
  new THREE.ConeGeometry(0.4, 1, 16),
  new THREE.CylinderGeometry(0.3, 0.3, 1, 16),
  new THREE.TorusGeometry(0.4, 0.15, 8, 24),
  new THREE.DodecahedronGeometry(0.5),
  new THREE.OctahedronGeometry(0.5),
  new THREE.TetrahedronGeometry(0.5),
]

// 在 5x5 网格上放置物体
const gridSize = 5
const spacing = 2.5
const offset = (gridSize - 1) * spacing / 2

for (let x = 0; x < gridSize; x++) {
  for (let z = 0; z < gridSize; z++) {
    const geo = geometries[Math.floor(Math.random() * geometries.length)]
    const color = randomColor()
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 })
    const mesh = new THREE.Mesh(geo, mat)

    mesh.position.set(
      x * spacing - offset,
      0.5,
      z * spacing - offset
    )

    // 给每个物体加旋转，增加视觉区分
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)

    scene.add(mesh)
    selectableObjects.push(mesh)
    originalColors.set(mesh, color.clone())
  }
}

// ======================== SelectionBox + Helper ========================

const selectionBox = new SelectionBox(camera, scene)
const helper = new SelectionHelper(renderer, 'selectBox')
helper.enabled = false // 默认禁用，只在 Shift 按下时启用

// 选框样式
const styleEl = document.createElement('style')
styleEl.textContent = `
  .selectBox {
    border: 1px solid #4fc3f7;
    background-color: rgba(79, 195, 247, 0.15);
    position: fixed;
    pointer-events: none;
  }
`
document.head.appendChild(styleEl)

// 选中的物体集合
let selectedObjects = []
const highlightColor = new THREE.Color(0xffff00)

function clearSelection() {
  // 恢复原始颜色
  for (const obj of selectedObjects) {
    const orig = originalColors.get(obj)
    if (orig) obj.material.color.copy(orig)
  }
  selectedObjects = []
  updateInfoPanel()
}

function setSelectionHighlight(objects) {
  for (const obj of objects) {
    obj.material.color.copy(highlightColor)
  }
  selectedObjects = objects
  updateInfoPanel()
}

// ======================== 鼠标事件 ========================

// 需要区分「框选拖拽」和「OrbitControls 旋转」
// 方案：Shift + 拖拽 = 框选，普通拖拽 = 旋转视角
let isSelecting = false

renderer.domElement.addEventListener('pointerdown', (event) => {
  // 只有 Shift + 左键 才启动框选
  if (event.shiftKey && event.button === 0) {
    isSelecting = true
    controls.enabled = false // 禁用轨道控制器

    // 启用 SelectionHelper 并手动补设状态
    // （因为 helper 的 pointerdown 先于本处理器执行，当时 enabled=false 直接 return 了，
    //    导致 isDown 没被置 true，这里手动补偿）
    helper.enabled = true
    helper.isDown = true
    helper._startPoint.set(event.clientX, event.clientY)

    // 记录起始点（NDC 坐标）
    selectionBox.startPoint.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    )
  }
})

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!isSelecting) return

  // 更新 SelectionBox 的 endPoint（实时更新 frustum）
  selectionBox.endPoint.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  )
})

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!isSelecting) return
  isSelecting = false
  helper.enabled = false  // 恢复禁用
  controls.enabled = true

  // 执行框选
  const startPoint = selectionBox.startPoint.clone()
  const endPoint = selectionBox.endPoint.clone()

  // 只有拖拽了一定距离才算框选
  if (startPoint.distanceTo(endPoint) < 0.01) return

  // 恢复之前选中物体的颜色
  clearSelection()

  // 执行选择
  selectionBox.startPoint.copy(startPoint)
  selectionBox.endPoint.copy(endPoint)
  const allSelected = selectionBox.select()

  // 只保留我们的 selectableObjects 中的
  const filtered = allSelected.filter(obj => selectableObjects.includes(obj))
  setSelectionHighlight(filtered)
})

// 点击空白处取消选择
renderer.domElement.addEventListener('click', (event) => {
  if (event.shiftKey) return
  // 简单判断：如果点击位置附近没有物体就取消
  clearSelection()
})

// ======================== 信息面板 ========================

const infoDiv = document.createElement('div')
infoDiv.style.cssText = `
  position: fixed; top: 10px; left: 10px;
  color: #fff; font-size: 13px;
  background: rgba(0,0,0,0.6); padding: 12px 16px;
  border-radius: 8px; pointer-events: none;
  line-height: 1.6; min-width: 200px;
`
document.body.appendChild(infoDiv)

const selectedDiv = document.createElement('div')
selectedDiv.style.cssText = `
  position: fixed; bottom: 10px; left: 10px;
  color: #fff; font-size: 13px;
  background: rgba(0,0,0,0.6); padding: 12px 16px;
  border-radius: 8px; pointer-events: none;
  line-height: 1.6; min-width: 200px;
`
document.body.appendChild(selectedDiv)

function updateInfoPanel() {
  infoDiv.innerHTML = `
    <b>SelectionBox 框选测试</b><br/>
    Shift + 鼠标左键拖拽: 框选物体<br/>
    普通拖拽: 旋转视角<br/>
    框选物体数量: <span style="color:#4fc3f7">${selectableObjects.length}</span>
  `
  if (selectedObjects.length > 0) {
    selectedDiv.innerHTML = `<b>已选中 ${selectedObjects.length} 个物体：</b><br/>` +
      selectedObjects.map((obj, i) => {
        const p = obj.position
        return `#${i + 1}  位置(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`
      }).join('<br/>')
    selectedDiv.style.display = 'block'
  } else {
    selectedDiv.style.display = 'none'
  }
}
updateInfoPanel()

// ======================== GUI ========================

const params = {
  showGrid: true,
  showAxes: true,
  boxBorderColor: '#4fc3f7',
  boxBgColor: 'rgba(79, 195, 247, 0.15)',
  highlightColor: '#ffff00',
  clearSelection: () => clearSelection(),
}

const folder = gui.addFolder('设置')
folder.add(params, 'showGrid').name('显示网格').onChange(v => grid.visible = v)
folder.add(params, 'showAxes').name('显示坐标轴').onChange(v => {
  scene.getObjectByProperty('type', 'AxesHelper')?.visible && (scene.getObjectByProperty('type', 'AxesHelper').visible = v)
})
folder.addColor(params, 'boxBorderColor').name('选框颜色').onChange(v => {
  styleEl.textContent = `
    .selectBox {
      border: 1px solid ${v};
      background-color: ${params.boxBgColor};
      position: fixed;
      pointer-events: none;
    }
  `
})
folder.addColor(params, 'highlightColor').name('高亮颜色').onChange(v => {
  highlightColor.set(v)
  for (const obj of selectedObjects) {
    obj.material.color.set(v)
  }
})
folder.add(params, 'clearSelection').name('清除选择')
folder.open()

// ======================== 主循环 ========================

function animate() {
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
