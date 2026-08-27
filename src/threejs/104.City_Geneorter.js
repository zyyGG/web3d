import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { CityGenerator } from "three/examples/jsm/generators/CityGenerator.js";
import { WebGPURenderer } from "three/webgpu";


// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
// CityGenerator 的街道/路肩用的是 TSL 节点材质（MeshStandardNodeMaterial），
// 老 WebGLRenderer 不支持，必须用 WebGPURenderer（setAnimationLoop 会自动初始化）
// forceWebGL: true 走 WebGL2 后端，兼容性更好；真实浏览器可去掉以用 WebGPU
const renderer = new WebGPURenderer({ antialias: true, forceWebGL: true })
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
  const saved = localStorage.getItem('helpControls');
  // 首次访问时 localStorage 没有数据，getItem 返回 null，需要给默认值兜底
  helpParams = saved ? JSON.parse(saved) : { gridHelper: true, directionalLightHelper: true, axesHelper: true };
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
// const bufferGeometry = new THREE.BufferGeometry()
const city = new CityGenerator( { 
  seed: 10,
  blocksX: 10, // 街区数量
  blocksZ: 10, // 街区数量
  blockSize: 4, // 街区大小
  blockSpacing: 0.2, // 街区间距
  lotsX: 4, // 街区内地块数量
  lotsZ: 4, // 街区内地块数量
  lotSpacing: 0.1, // 街区内地块间距
 });
const materials = {
  building: new THREE.MeshStandardMaterial( { color: 0x808080 } ),
  roof: new THREE.MeshStandardMaterial( { color: 0x404040 } ),
  road: new THREE.MeshStandardMaterial( { color: 0x202020 } ),
  ground: new THREE.MeshStandardMaterial( { color: 0x101010 } )
}
scene.add( city.build( materials ) );

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