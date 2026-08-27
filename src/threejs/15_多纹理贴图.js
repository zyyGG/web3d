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
renderer.setAnimationLoop( animate );
document.querySelector("#app").appendChild(renderer.domElement)

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
camera.position.z = 5;
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)

// // 添加平行光辅助器
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
// scene.add(directionalLightHelper)

// 添加点光源
const pointLight = new THREE.PointLight(0xffffff, 200, 50)
pointLight.position.set(2, 2, 2)
scene.add(pointLight)
const PointLightHelper = new THREE.PointLightHelper(pointLight, 1)
// scene.add(PointLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

///--------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader()
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// geometry.addGroup(0, 6, 0); // 添加一个组
// geometry.addGroup(6, 12, 1); // 添加一个组
// geometry.addGroup(12, 24, 0); // 添加一个组
geometry.groups[0].materialIndex = 0; // 设置第一个组的材质索引为0
geometry.groups[1].materialIndex = 0; // 设置第二个组的材质索引为1
geometry.groups[2].materialIndex = 1; // 设置第三个组的材质索引为0
geometry.groups[3].materialIndex = 1; // 设置第四个组的材质索引为1
geometry.groups[4].materialIndex = 0; // 设置第五个组的材质索引为0
geometry.groups[5].materialIndex = 0; // 设置第六个组的材质索引为1
const materials = [
  new THREE.MeshStandardMaterial({map: textureLoader.load('/textures/spruce_log.png'), normalMap: textureLoader.load('/textures/spruce_log_n.png')}),
  new THREE.MeshStandardMaterial({map: textureLoader.load('/textures/spruce_log_top.png'), normalMap: textureLoader.load('/textures/spruce_log_top_n.png')}),
]
const cube = new THREE.Mesh( geometry, materials);
scene.add( cube );

const geometry2 = new THREE.BoxGeometry(1, 1, 1);
const materials2 = new THREE.MeshStandardMaterial({map: textureLoader.load('/textures/yellow_stained_glass.png'), normalMap: textureLoader.load('/textures/yellow_stained_glass_n.png')})
const cube2 = new THREE.Mesh(geometry2, materials2);
cube2.position.set(2, 0, 0)
scene.add(cube2)

// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  pointLight.position.set(
    Math.sin(Date.now() * 0.001) * 10,
    Math.cos(Date.now() * 0.001) * 10,
    Math.cos(Date.now() * 0.001) * 10
  )
  PointLightHelper.update()
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