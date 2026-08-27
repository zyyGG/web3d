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

// const armGeometry = new THREE.BoxGeometry(1, 3, 1, 1, 10, 1);
const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 32, 10)
const vertexCount = armGeometry.attributes.position.count;
const skinIndices = [];
const skinWeights = [];
const halfH = 10 / 2;

for (let i = 0; i < vertexCount; i++) {
  const y = armGeometry.attributes.position.getY(i) + halfH; // 0~3
  const t = y / 10; // [0,1] 从肩到手

  let i0, i1, w0, w1;
  if (t < .7) {                // 肩→肘
    i0 = 0; i1 = 1;
    w1 = t / 0.5;
  } else {                      // 肘→手
    i0 = 1; i1 = 2;
    w1 = (t - 0.5) / 0.5;
  }
  w0 = 1.0 - w1;

  skinIndices.push(i0, i1, 0, 0);
  skinWeights.push(w0, w1, 0, 0);
}

armGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(skinIndices), 4));
armGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(skinWeights), 4));

const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, skinning: true });
const shape01 = new THREE.SkinnedMesh(armGeometry, armMaterial);
scene.add(shape01);

// 骨骼（肩→肘→手）
const bones = [];
const shoulder = new THREE.Bone(); // 肩部骨骼
const elbow = new THREE.Bone(); // 肘部骨骼
const hand = new THREE.Bone(); // 手部骨骼
shoulder.add(elbow);
elbow.add(hand);
shoulder.position.y = -1.5;
elbow.position.y = 1.0;
hand.position.y = 2.0;
bones.push(shoulder, elbow, hand);

const skeleton = new THREE.Skeleton(bones);
shape01.add(shoulder);
shape01.bind(skeleton);

const skeletonHelper = new THREE.SkeletonHelper(shape01);
scene.add(skeletonHelper);

// GSAP 骨骼动画（肘部摆动）
const timeline = gsap.timeline({repeat: -1, yoyo: true});

// 手
timeline.to(hand.position, {
  z: 0.2,
  duration: 1.5,
  ease: 'sine.inOut',
}, 0); // 与上一个动画同时开始

timeline.to(hand.rotation, {
  x: THREE.MathUtils.degToRad(20),
  duration: 1.5,
  ease: 'sine.inOut',
}, 0); // 与上一个动画同时开始
// 肘
timeline.to(elbow.position, {
  z: 0.1,
  duration: 1.5,
  ease: 'sine.inOut',
}, 0); // 与上一个动画同时开始

timeline.to(elbow.rotation, {
  x: THREE.MathUtils.degToRad(5),
  duration: 1.5,
  ease: 'sine.inOut',
}, 0); // 与上一个动画同时开始

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