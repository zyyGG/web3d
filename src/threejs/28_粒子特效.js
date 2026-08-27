import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"



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
const geometry = new THREE.IcosahedronGeometry( 0.5, 8);
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const ball = new THREE.Mesh( geometry, material );
scene.add( ball );

let timeline = createTimeline({autoplay: false})

let particleControl = null

const config = {
  play: () => {
    particleControl = createParicle()
    timeline.play()
  },
  particle: {
    count: 50,
    minSpeed: 1,
    maxSpeed: 2,
    minSize: 0.1,
    maxSize: 0.3,
    xMinRange: -1,
    xMaxRange: 1,
    yMinRange: 1,
    yMaxRange: 1.5,
    zMinRange: -1,
    zMaxRange: 1,
  },
  particleControl: {
    x: 0,
    y: 0,
    z: 0,
  }
}

gui.add(config, 'play').name('生成粒子')
const particleConfig = gui.addFolder('粒子设置')
particleConfig.open()
particleConfig.add(config.particle, 'count', 1, 100).name('粒子数量')
particleConfig.add(config.particle, 'minSpeed', 0.1, 5).name('最小速度')
particleConfig.add(config.particle, 'maxSpeed', 0.1, 5).name('最大速度')
particleConfig.add(config.particle, 'minSize', 0.1, 1).name('最小大小')
particleConfig.add(config.particle, 'maxSize', 0.1, 1).name('最大大小')
particleConfig.add(config.particle, 'xMinRange', -10, 10).name('X轴最小范围')
particleConfig.add(config.particle, 'xMaxRange', -10, 10).name('X轴最大范围')
particleConfig.add(config.particle, 'yMinRange', -10, 10).name('Y轴最小范围')
particleConfig.add(config.particle, 'yMaxRange', -10, 10).name('Y轴最大范围')
particleConfig.add(config.particle, 'zMinRange', -10, 10).name('Z轴最小范围')
particleConfig.add(config.particle, 'zMaxRange', -10, 10).name('Z轴最大范围')
const particleControlConfig = gui.addFolder('粒子控制')
particleControlConfig.open()
particleControlConfig.add(config.particleControl, 'x', -10, 10).name('X轴位置').onChange((val) => {
  if(particleControl){
    particleControl.position.x = val
  }
})
particleControlConfig.add(config.particleControl, 'y', -10, 10).name('Y轴位置').onChange((val) => {
  if(particleControl){
    particleControl.position.y = val
  }
})
particleControlConfig.add(config.particleControl, 'z', -10, 10).name('Z轴位置').onChange((val) => {
  if(particleControl){
    particleControl.position.z = val
  }
})

function createParicle(){
  if(particleControl){
    particleControl.clear()
    scene.remove(particleControl)
    particleControl = null
  }
  const particleGroup = new THREE.Group()
  scene.add(particleGroup)
  timeline = createTimeline({autoplay: false})
  
  const paricleMaterial = new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load('/particles/dot.png'),
    transparent: true,
    opacity: 0.5,
    color: 0xffffff
  })
  for(let i = 0; i < config.particle.count; i++){
    const particle = new THREE.Sprite(paricleMaterial)
    const scale = Math.random() * (config.particle.maxSize - config.particle.minSize) + config.particle.minSize
    particle.scale.set(scale, scale, scale)
    timeline.add(particle.position, {
      x: Math.random() * (Math.abs(config.particle.xMinRange) + Math.abs(config.particle.xMaxRange)) + config.particle.xMinRange,
      y: Math.random() * (Math.abs(config.particle.yMinRange) + Math.abs(config.particle.yMaxRange)) + config.particle.yMinRange,
      z: Math.random() * (Math.abs(config.particle.zMinRange) + Math.abs(config.particle.zMaxRange)) + config.particle.zMinRange,  
      duration: (Math.random() * (config.particle.maxSpeed - config.particle.minSpeed) + config.particle.minSpeed) * 1000,
      easing: 'linear',
      loop: true,
      direction: 'alternate',
      delay: Math.random() * 1000,
    }, 0)
    particleGroup.add(particle)
  }
  particleGroup.position.set(config.particleControl.x, config.particleControl.y, config.particleControl.z)
  return particleGroup
}


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