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

///--------------------------------------------------------------------
// 主要代码写在这里
// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );
const shape = new THREE.Shape();
shape.moveTo( 0,0 );
shape.lineTo( 0, 1 );
shape.lineTo( 1, 1 );
shape.lineTo( 1, 0 );
shape.lineTo( 0, 0 );

const geometry = new THREE.ExtrudeGeometry( shape, {
  steps: 1, // 拉伸的步数, 这个影响中间的细节
  depth: 0.5, // 拉伸的深度, 这个影响厚度
  bevelEnabled: true, // 是否启用斜角
  bevelThickness: 0.1, // 斜角的厚度
  bevelSize: 0.1, // 斜角的大小
  bevelOffset: 0, // 斜角的偏移量
  bevelSegments: 10 // 斜角的段数, 越大越圆滑
} );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

// 创建一个凹面形状
const shape2 = new THREE.Shape();
const radius = 0.1;
shape2.moveTo( radius, 0 );
shape2.lineTo( 0, 0 );
shape2.lineTo( 0, 1 - radius );
shape2.quadraticCurveTo( 0, 1, radius, 1 );
shape2.lineTo( 1 - radius, 1 );
shape2.quadraticCurveTo( 1, 1, 1, 1 - radius );
shape2.lineTo( 1, 0.7 + radius );
shape2.quadraticCurveTo( 1, 0.7, 1 - radius, 0.7 );
shape2.lineTo( 0.7 + radius, 0.7 );
shape2.quadraticCurveTo( 0.7, 0.7, 0.7, 0.7 - radius );
shape2.lineTo( 0.7, 0.3 + radius );
shape2.quadraticCurveTo( 0.7, 0.3, 0.7 + radius, 0.3 );
shape2.lineTo( 1 - radius, 0.3 );
shape2.quadraticCurveTo( 1, 0.3, 1, 0.3 - radius );
shape2.lineTo( 1, 0 );
shape2.lineTo( radius, 0 );
const geometry2 = new THREE.ShapeGeometry( shape2);
const material2 = new THREE.MeshStandardMaterial( { color:  0xfeffcc, flatShading:true, shininess: 150, side: THREE.DoubleSide } );
const mesh2 = new THREE.Mesh( geometry2, material2 );
mesh2.position.set(2, 0, 0); // 设置位置
scene.add( mesh2 );

const geometry3 = new THREE.ExtrudeGeometry( shape2, {
  steps: 1, // 拉伸的步数, 这个影响中间的细节
  depth:0.1, // 拉伸的深度, 这个影响厚度
  bevelEnabled: true, // 是否启用斜角
  bevelThickness: 0.1, // 斜角的厚度
  bevelSize: 0.1, // 斜角的大小
  bevelOffset: 0, // 斜角的偏移量
  bevelSegments: 5 // 斜角的段数, 越大越圆滑
});
const material3 = new THREE.MeshStandardMaterial( { color:  0xfeffcc, flatShading:true } );
const mesh3 = new THREE.Mesh( geometry3, material3 );
mesh3.position.set(4, 0, 0); // 设置位置
scene.add( mesh3 );


///--------------------------------------------------------------------


// 渲染场景
function animate() {
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