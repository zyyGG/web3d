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
const EdgeHighlightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    rimColor: { value: new THREE.Color(0x00ffff) },
    rimPower: { value: 2.0 },
    rimIntensity: { value: 1.5 },
    baseColor: { value: new THREE.Color(0x222222) },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vNormal = normalize(normalMatrix * normal);
      vViewPosition = -mvPosition.xyz;
    }
  `,
  fragmentShader: `
    uniform vec3 rimColor;
    uniform float rimPower;
    uniform float rimIntensity;
    uniform vec3 baseColor;
    uniform float uTime;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // 基础菲涅尔计算
      float rim = 1.0 - max(dot(viewDir, normal), 0.0);
      
      // 添加呼吸动画效果
      float breathe = (sin(uTime * 0.5) * 0.5 + 0.5) * 0.5 + 0.5;
      
      // 应用幂函数控制边缘锐度和亮度
      rim = pow(rim, rimPower) * rimIntensity * breathe;
      
      // 混合基础颜色和边缘颜色
      vec3 finalColor = mix(baseColor, rimColor, rim);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  transparent: false,
  side: THREE.DoubleSide
});

// 边缘高亮效果球体
const edgeCube = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  EdgeHighlightMaterial
);
scene.add(edgeCube);
edgeCube.position.set(0, 0, 0);

// 添加GUI控制
const edgeFolder = gui.addFolder('边缘高亮效果');
edgeFolder.addColor({color: 0x00ffff}, 'color').onChange(value => {
  EdgeHighlightMaterial.uniforms.rimColor.value.set(value);
});
edgeFolder.add(EdgeHighlightMaterial.uniforms.rimPower, 'value', 0.1, 5.0).name('边缘锐度');
edgeFolder.add(EdgeHighlightMaterial.uniforms.rimIntensity, 'value', 0.1, 3.0).name('边缘强度');
edgeFolder.open();



camera.position.z = 5;
camera.fov = 50;
camera.updateProjectionMatrix()

// 渲染场景
function animate() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  // cube.rotation.y += 0.001
  // threeCube.rotation.y += 0.001
  // ShaderMaterial.uniforms.uTime.value += 0.01
  EdgeHighlightMaterial.uniforms.uTime.value += 0.01;
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