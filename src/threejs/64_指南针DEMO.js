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
camera.position.set(-5, 5, 5)
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

// 创建指南针的DEMO的画布层和dom元素

// UI控件层
const UILayer = document.createElement('div');
UILayer.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;');
UILayer.setAttribute('id', 'UILayer');
document.body.appendChild(UILayer);
// 创建指南针组
const compass = document.createElement('div');
compass.setAttribute('id', 'compass');
compass.setAttribute('style', 'position: absolute; bottom: 30px; left: 30px; width: 100px; height: 100px; background-color: transparent; border: 1px solid grey; border-radius: 50%; display: flex; align-items: center; justify-content: center; pointer-events: none;');
UILayer.appendChild(compass);
// 添加指南针刻度
// 正北方
const compassNorth = document.createElement('div'); 
compassNorth.setAttribute('style', 'position: absolute; top: 0; left: 50%; transform: translate(-50%, 0); color:rgba(255, 0, 0, 1); font-size: 12px; font-weight: bold; pointer-events: all; cursor: pointer;');
compassNorth.innerHTML = 'N';
compass.appendChild(compassNorth);
// 正东方
const compassEast = document.createElement('div'); 
compassEast.setAttribute('style', 'position: absolute; top: 50%; right: 0; transform: translate(0, -50%); color:rgba(255, 255, 255, 1); font-size: 12px; font-weight: bold; pointer-events: all; cursor: pointer;');
compassEast.innerHTML = 'E';
compass.appendChild(compassEast);
// 正西方
const compassWest = document.createElement('div');
compassWest.setAttribute('style', 'position: absolute; top: 50%; left: 0; transform: translate(0, -50%); color:rgba(255, 255, 255, 1); font-size: 12px; font-weight: bold; pointer-events: all; cursor: pointer;');
compassWest.innerHTML = 'W';
compass.appendChild(compassWest);
// 正南方
const compassSouth = document.createElement('div');
compassSouth.setAttribute('style', 'position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 0); color:rgba(255, 255, 255, 1); font-size: 12px; font-weight: bold; pointer-events: all; cursor: pointer;');
compassSouth.innerHTML = 'S';
compass.appendChild(compassSouth);
// 创建刻度指针
const compassPointer = document.createElement('div');
compassPointer.setAttribute('id', 'compassPointer');
compassPointer.setAttribute('style', 'position: absolute; width: 20px; height: 70px; background-color: white; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); background: linear-gradient(to bottom, rgba(255, 0, 0, 1) 50%, rgba(255, 255, 255, 1) 50.1%, rgba(255, 255, 255, 1) 100%) ;');
compass.appendChild(compassPointer);

// 旋转指针
function rotationPointer(degrees = 0) {
  const compassPointer = document.getElementById('compassPointer');
  compassPointer.style.transform = `rotate(${degrees}deg)`;
}

// 或者当前视角的弧度
function getCurrentCameraRotation() {
  const controlAngle = controls.getAzimuthalAngle(); // 获取相机的方位角
  const degrees = THREE.MathUtils.radToDeg(controlAngle); // 将弧度转换为角度
  return degrees;
}

// 给方向文本添加交互事件，允许点击后，调整摄像机视角
compassNorth.addEventListener('click', () => {
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1 });
  gsap.to(camera.position, { x: 0, y: 5, z: 5, duration: 1 });
  gsap.to(controls, { autoRotate: false, duration: 1 });
});
compassEast.addEventListener('click', () => {
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1 });
  gsap.to(camera.position, { x: -5, y: 5, z: 0, duration: 1 });
  gsap.to(controls, { autoRotate: false, duration: 1 });
});
compassWest.addEventListener('click', () => {
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1 });
  gsap.to(camera.position, { x: 5, y: 5, z: 0, duration: 1 });
  gsap.to(controls, { autoRotate: false, duration: 1 });
});
compassSouth.addEventListener('click', () => {
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1 });
  gsap.to(camera.position, { x: 0, y: 5, z: -5, duration: 1 });
  gsap.to(controls, { autoRotate: false, duration: 1 });
});




///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  rotationPointer(-getCurrentCameraRotation()); // 更新指南针指针的旋转角度
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