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
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
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
// 通过canvas创建billboard
const spriteMaterial = new THREE.SpriteMaterial({
  map: createCanvasTexture("你好"),
  transparent: true, // 透明度
  depthTest: true, // 控制是否永远渲染在最上面， 默认不渲染
});
const sprite = new THREE.Sprite(spriteMaterial);
sprite.scale.set(0.3,0.1, 1);
sprite.position.set(2,0,0);
// sprite.rotation.set(0, 0, Math.PI / 2);  
scene.add(sprite);

const sprite2 = new THREE.Sprite(
  new THREE.SpriteMaterial({map: createCanvasTexture("Hello Wolrd!")})
);
sprite2.scale.set(0.3,0.1, 1);
sprite2.position.set(0,0,0);
scene.add(sprite2);


function createCanvasTexture(text){
  const canvas = document.createElement("canvas");
  canvas.width = text.length * 16;
  canvas.height = 18;
  canvas.style.width = text.length * 16 + "px";
  canvas.style.height = "18px";
  const context = canvas.getContext("2d");
  // 处理锯齿效果
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "rgba(255, 255, 255, 255)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "16px serif";
  context.fillStyle = "black";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(text, 0, 8);
  const img = canvas.toDataURL()
  console.log(img)
  return new THREE.CanvasTexture(canvas);
}

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