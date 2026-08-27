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
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
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

camera.position.set(0, 20, 20)

// 主要代码写在这里
// const bufferGeometry = new THREE.BufferGeometry()
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(10, 10, 10),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
)
scene.add(cube)
// cube.position.set(-20, 0, 0)

const cube02 = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
)
cube02.position.set(20, 0, 0)

scene.add(cube02)

// 创建一个平面几何体
const plane = new THREE.Plane(new THREE.Vector3(0, 1, ), 0); // 平面法向量为Y轴，距离原点为0
const planez = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // 平面法向量为Y轴，距离原点为0
renderer.localClippingEnabled = true; // 启用局部裁剪

cube.material.clippingPlanes = [plane, planez]; // 将裁剪平面应用到材质上
// cube02.material.clippingPlanes = [plane]; // 将裁剪平面应用到材质上
const planeTransformHelper = new THREE.PlaneHelper(plane, 20, 0xff0000); // 创建平面辅助器
scene.add(planeTransformHelper); // 将平面辅助器添加到场景中
const planeTransformHelperz = new THREE.PlaneHelper(planez, 20, 0x00ff00); // 创建平面辅助器
scene.add(planeTransformHelperz); // 将平面辅助器添加到场景中



// 体刨切
// const cube02 = new THREE.Mesh(
//   new THREE.BoxGeometry(10, 10, 10),
//   new THREE.MeshStandardMaterial({ color: 0x00ff00 })
// )
// scene.add(cube02)

// const cube


const params = {
  planeY: 0,
  planeZ: 0,
  Reversal: false,
  clippingSections: false, // 是否启用裁剪平面
}

const planeFolder = gui.addFolder('裁剪平面控制')
planeFolder.add(params, 'planeY', -5.5, 5.5, 0.1).onChange(value => {
  plane.constant = value; // 更新平面位置
});
planeFolder.add(params, 'planeZ', -5.5, 5.5, 0.1).onChange(value => {
  planez.constant = value; // 更新平面位置
});

planeFolder.add(params, 'Reversal').onChange(value => {
  plane.negate(); // 反转平面法向量
}).name('反转裁剪平面法向量');
planeFolder.add(params, 'clippingSections').onChange(value => {
  cube.material.clipIntersection = value
}).name('裁剪平面交集')





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