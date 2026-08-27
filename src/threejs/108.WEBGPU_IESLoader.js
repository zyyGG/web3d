import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { IESLoader } from "three/examples/jsm/Addons.js";
import { IESSpotLight } from "three/webgpu";
import { WebGPURenderer } from "three/webgpu";



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new WebGPURenderer({ antialias: true }) // forceWebGL: true 走 WebGL2 后端，兼容性更好；真实浏览器可去掉以用 WebGPU
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

  directionalLight.visible = false

// 主要代码写在这里
// ===== IES 光度学灯光（真实灯具配光） =====
// IESLoader 把 .ies 文件（IESNA LM-63 光强分布数据）解析成一张
// 360x180 的 DataTexture 查找表，赋给 IESSpotLight.iesMap 后，
// 灯光会按真实灯具的配光曲线发光，形成真实的光斑。
//
// 注意三点：
//  1. IESSpotLight 必须从 three/webgpu 导入，且只能配合 WebGPURenderer 使用
//  2. 纹理要赋给 spotLight.iesMap（不是 iesTexture）
//  3. Vite 中 public 目录映射到站点根路径，所以路径是 '/ies/spotLight.ies'
new IESLoader()
  .loadAsync('/ies/spotLight.ies')
  .then((texture) => {
    const spotLight = new IESSpotLight(0xffffff, 2000, 0, Math.PI / 3, 0, 2)
    spotLight.iesMap = texture // 关键：把 IES 配光曲线赋给灯光
    spotLight.position.set(0, 5, 0)
    spotLight.target.position.set(0, 0, 0)
    scene.add(spotLight)
    scene.add(spotLight.target) // target 需加入场景，朝向才会正确更新
  })
  .catch((err) => console.error('IES 文件加载失败：', err))

// 受光面：地面 + 一面墙，用来展示 IES 光斑
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.5, metalness: 0.1 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 6),
  new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 })
);
wall.position.set(0, 3, -5);
scene.add(wall);



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