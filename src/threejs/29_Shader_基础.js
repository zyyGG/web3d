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
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const material = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0xfeffcc) },
    time: { value: 0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vNormal = normal;
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float time;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vec3 borderColor = vec3(1.0, 0.0, 0.0);
      float borderSize = 0.01;
      float leftBorder = step(borderSize, vUv.x) * step(borderSize, vUv.y);
      float rightBorder = step(borderSize, 1.0 - vUv.x) * step(borderSize, 1.0 - vUv.y);
      float fullBorder = 1.0 - leftBorder * rightBorder;
      vec3 border = mix(color, borderColor, fullBorder);
      gl_FragColor = vec4(border, 1.0);
      // gl_FragColor = vec4(vUv, 0.0, 1.0);
    }
  `
})
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const cube2 = new THREE.Mesh( geometry, material );
cube2.position.set(2, 0, 0)
scene.add( cube2 );

// 圆柱体
// const cylinderGeometry = new THREE.CylinderGeometry( 0.5, 0.5, 2, 32 );
// // const cylinderMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00, flatShading:true, shininess: 150 } );
// const cylinder = new THREE.Mesh( cylinderGeometry, material );
// cylinder.position.set(-2, 0, 0)
// scene.add( cylinder );




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