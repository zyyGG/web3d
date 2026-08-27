import * as THREE from "three"
// import GUI from "three/addons/libs/lil-gui.module.min.js"
import * as GUI from "dat.gui"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { OBJLoader } from "three/examples/jsm/Addons.js"
import { MTLLoader } from "three/examples/jsm/Addons.js"

// 创建基础环境
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
// 创建gui
const gui = new GUI.GUI();

// 处理高分屏
renderer.setPixelRatio(window.devicePixelRatio)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()

// 摄像机坐标
camera.position.set(0, 5, 0) // 设置摄像机位置
// camera.position.set(0, 0, 10) // 设置摄像机位置


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
controls.minDistance = 2 
controls.maxDistanc  = 100
controls.update() // 更新控制器
// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)
// 设置渲染器背景色
// renderer.setClearColor(0xfeffcc, 1) // 设置背景色
renderer.setClearColor(0x000000, 1) // 设置背景色

renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector("#app").appendChild(renderer.domElement)

// 添加世界光源
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight)
// 添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)
// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)

// const objLoader = new OBJLoader()
// const mtlLoader = new MTLLoader()
// mtlLoader.load("/models/obj2.mtl", (materials) => {
//   materials.preload()
//   objLoader.setMaterials(materials)
//   objLoader.load("/models/obj2.obj", (object)=>{
//     const group = new THREE.Group()
//     object.traverse((child) => {
      
      
//       const geometry = child.geometry
//       const mesh = new THREE.Mesh(geometry, customMaterial)
//       group.add(mesh)
//     })
//     scene.add(group)
//   })
// })
const ShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(0xffffff) },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector3(0,0,0) },
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vPosition = position + 0.5;
      vNormal = normal;
      vUv = uv;
    }
  `,
  fragmentShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    uniform vec3 uColor;
    uniform float uTime;
    uniform vec3 uResolution;

    void main() {
      vec2 uv = fract(vUv * 5.0);
      float edge = 0.49;
      float edgeRound = 0.01;
      float edgey = mod(uTime * 0.05, uResolution.y - edge) * -(2.0 * 2.0) + (uResolution.y - edge);
      
      // float edgey = 0.3;
      vec3 edgeColor = vec3(1.0, 0.0, 0.0);
      // float mixColor = smoothstep(edge, edge + edgeRound, abs(edgey - vPosition.y)) * smoothstep(abs(edgey - vPosition.y) - edge, (abs(edgey - vPosition.y) - edge) + 0.1, abs(edgey - vPosition.y));
      float mixColor = 1.0 - smoothstep(edge, edge + edgeRound, vPosition.y + edgey) * smoothstep(edge, edge + edgeRound, uResolution.y - vPosition.y - edgey);
      // float mixColor = step(0.5, vPosition.y) * 0.5 + 0.5;
      vec3 color = vec3(mixColor);
      gl_FragColor = vec4(color, 1.0);
    }
  `,transparent: true,
})
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  // 边缘高亮着色器
  ShaderMaterial,
)
ShaderMaterial.uniforms.uResolution.value = new THREE.Vector3(cube.geometry.parameters.width, cube.geometry.parameters.height, cube.geometry.parameters.depth)

scene.add(cube)
cube.position.set(-2, 0, 0)

const threeCube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
)
scene.add(threeCube)
threeCube.position.set(2, 0, 0)


camera.position.z = 5;
camera.fov = 50;
camera.updateProjectionMatrix()

// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  // cube.rotation.y += 0.001
  // threeCube.rotation.y += 0.001
  ShaderMaterial.uniforms.uTime.value += 0.01
}
//循环渲染
renderer.setAnimationLoop( animate );

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