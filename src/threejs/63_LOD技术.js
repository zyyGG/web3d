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

///--------------------------------------------------------------------
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


const publicMetaerial = new THREE.MeshPhongMaterial({
  color: 0x00ff00,
  flatShading: true,
})


// 我们需要准备三个阶段的模型，分别是低精度，中等精度和高精度模型
const lowPolyGeometry = new THREE.IcosahedronGeometry(5, 1); // 低精度模型
const lowPolyMeterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, flatShading: true });
const lowPolyMesh = new THREE.Mesh(lowPolyGeometry, publicMetaerial);

const mediumPolyGeometry = new THREE.IcosahedronGeometry(5, 5); // 低精度模型
const mediumPolyMeterial = new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: true });
const mediumPolyMesh = new THREE.Mesh(mediumPolyGeometry, publicMetaerial);

const highPolyGeometry = new THREE.IcosahedronGeometry(5, 12); // 低精度模型
const highPolyMeterial = new THREE.MeshPhongMaterial({ color: 0x0000ff, flatShading: true });
const highPolyMesh = new THREE.Mesh(highPolyGeometry, publicMetaerial);

scene.add(lowPolyMesh, mediumPolyMesh, highPolyMesh);

// 添加lod细节层次
const lod = new THREE.LOD();
lod.addLevel(highPolyMesh, 0); // 距离小于0时显示
lod.addLevel(mediumPolyMesh, 50); // 距离小于50时显示
lod.addLevel(lowPolyMesh, 100); // 50 < x < 100时显示
scene.add(lod);







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