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
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

///--------------------------------------------------------------------
camera.position.set(0, 5, 10) // 设置摄像机位置
const noiseTexture = new THREE.TextureLoader().load('/textures/noise.jpg')
// 主要代码写在这里
const planegeo = new THREE.PlaneGeometry(10, 10, 50, 50)
const planematerial = new THREE.MeshLambertMaterial({
  color: 0xfffffff,
  wireframe: false,
  // bumpMap: noiseTexture,
  side: THREE.DoubleSide,
  transparent: true,
})

const plane = new THREE.Mesh(planegeo, planematerial)
plane.rotation.x = -Math.PI / 2
plane.position.y = -1
scene.add(plane)

const config = {
  height: 1.0,
  meshCell: 50,
}

let customShader = undefined

gui.add(config, "height", 0.0, 5.0, 0.1).name("山脉高度").onChange((value) => {
  customShader.uniforms.uHeight.value = value
  // plane.material.uniforms.uHeight.value = value
})
gui.add(config, "meshCell", 1, 500, 1).name("网格细分").onChange((value) => {
  plane.geometry.dispose()
  plane.geometry = new THREE.PlaneGeometry(10, 10, value, value)
})


planematerial.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 }
  shader.uniforms.noiseTexture = { value: noiseTexture }
  shader.uniforms.uHeight = { value: config.height }
  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    `uniform sampler2D noiseTexture;
uniform float uHeight;
varying vec2 vUv;
#include <common>`
  )
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
vec4 noise = texture2D(noiseTexture, uv);
transformed.z += noise.r * uHeight;

vUv = uv;
    `
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <common>",
    `#include <common>
uniform sampler2D noiseTexture;
varying vec2 vUv;`
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    /}/,
    `
vec4 noise = texture2D(noiseTexture, vUv);
// vec3 color = noise.r;
gl_FragColor = noise;
    }  `
  )

  customShader = shader
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