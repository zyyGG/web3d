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

// 主要代码写在这里
// 灯座：底座 + 灯杆
const lampGroup = new THREE.Group()
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 })
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32), baseMaterial)
base.position.y = 0.15
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 16), baseMaterial)
pole.position.y = 1.5
lampGroup.add(base, pole)
scene.add(lampGroup)

// 灯泡：本体自发光 + 一盏真实点光源，位置挂在灯杆顶端
const bulbPosition = new THREE.Vector3(0, 2.8, 0)
const coreGeometry = new THREE.SphereGeometry(0.25, 32, 16)
const coreMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 1 })
const core = new THREE.Mesh(coreGeometry, coreMaterial)
core.position.copy(bulbPosition)
scene.add(core)

const bulbLight = new THREE.PointLight(0xffaa33, 2, 8, 2)
bulbLight.position.copy(bulbPosition)
scene.add(bulbLight)

// 伪辉光面片：径向渐变透明度 + 加法混合，冒充模糊光晕
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(0xffaa33) },
    uIntensity: { value: 1.5 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered) * 2.0; // 0 中心, 1 边缘
      float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
      alpha = pow(alpha, 2.0); // 核心更亮，边缘更快衰减
      gl_FragColor = vec4(uColor * uIntensity, alpha);
    }
  `,
  transparent: true,
  depthWrite: false, // 不写深度，避免遮挡后面物体
  blending: THREE.AdditiveBlending, // 加法混合，叠加出发光感
  side: THREE.DoubleSide,
})
const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), glowMaterial)
glowPlane.position.copy(bulbPosition)
scene.add(glowPlane)

// 呼吸参数：强度在 min~max 之间平滑往返
const breathParams = {
  speed: 1.2,
  min: 0.4,
  max: 2.2,
}
const glowFolder = gui.addFolder('呼吸辉光灯')
glowFolder.add(breathParams, 'speed', 0.1, 4).name('呼吸速度')
glowFolder.add(breathParams, 'min', 0, 2).name('最弱强度')
glowFolder.add(breathParams, 'max', 1, 4).name('最强强度')

///--------------------------------------------------------------------

let time = 0
// 渲染场景
function animations() {
  time += 0.016

  // 0~1 的呼吸波形，再映射到 min~max 强度区间
  const breath = (Math.sin(time * breathParams.speed) + 1) / 2
  const intensity = THREE.MathUtils.lerp(breathParams.min, breathParams.max, breath)

  bulbLight.intensity = intensity
  coreMaterial.emissiveIntensity = intensity
  glowMaterial.uniforms.uIntensity.value = intensity

  glowPlane.quaternion.copy(camera.quaternion) // billboard：始终面向相机
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