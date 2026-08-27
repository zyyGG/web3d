import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具



// 创建gui
const gui = new GUI()
const stats = new Stats()
const mixers = [];
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
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// 创建动画
const clock = new THREE.Clock();
const mixer = new THREE.AnimationMixer(cube);
let action = null;
mixers.push(mixer);







// 动画列表
const animations = {
  'stander': true,
  'move': false,
  'rotation': false,
}

const animationsFolder = gui.addFolder('animations')
animationsFolder.add(animations, 'stander').name('stander').onChange(() => {updateAnimation('stander')})
animationsFolder.add(animations, 'move').name('move').onChange(() => {updateAnimation('move')})
animationsFolder.add(animations, 'rotation').name('rotation').onChange(() => {updateAnimation('rotation')})
animationsFolder.open()


function updateAnimation(name) {
  for (const key in animations) {
    if (key === name) {
      animations[key] = true
    } else {
      animations[key] = false
    }
  }
  // 清理旧的动画
  if(action){
    action.reset()
    action.stop()
    action = null
  }
  if(name === 'move') {
    action = mixer.clipAction(new THREE.AnimationClip('move', -1, [
      new THREE.VectorKeyframeTrack('.position', [0, 1, 2], [0, 0, 0, 0, 2, 0, 0, 0, 0])
    ]));
    action.setLoop(THREE.ONECE, 1)
    action.play()
  } else if(name === 'rotation'){
    action = mixer.clipAction(new THREE.AnimationClip('rotation', -1, [
      new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1, 2],[
        0,
        0,
        0,
        1, // 初始旋转
        0,
        Math.sin(Math.PI / 2),
        0,
        Math.cos(Math.PI / 2),
        0,
        0,
        0,
        1, // 恢复初始旋转
      ])
    ]));
    // action.setLoop(THREE.LoopOnce, 1)
    action.play()
  }

  gui.updateDisplay()
}

///--------------------------------------------------------------------


// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  mixers.forEach(mixer => mixer.update(0.001));
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