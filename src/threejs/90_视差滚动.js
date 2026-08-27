import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { HDRLoader } from "three/examples/jsm/Addons.js";



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

// HDRloader
// console.log(HDRLoader)
const hdrLoader = new HDRLoader ()
const envMap  = await hdrLoader.loadAsync("/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr")
envMap.mapping = THREE.EquirectangularReflectionMapping;
// scene.environment = envMap;
// scene.background = envMap;
  

// 主要代码写在这里
// const bufferGeometry = new THREE.BufferGeometry()
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.1, 20),
  new THREE.MeshStandardMaterial({ color: 0xdddddd})
)
scene.add(floor)

// 创建画板
const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
)
wall.position.set(0, 5, -5)
scene.add(wall)

const newMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uMap: { value: envMap },
    uParallax: { value: 0.5 },
    uExposure: { value: 1.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D uMap;
    uniform float uParallax;
    uniform float uExposure;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;

    const float PI = 3.141592653589793;

    vec2 dirToEquirectUV(vec3 dir) {
      dir = normalize(dir);
      float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
      float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
      return vec2(u, v);
    }

    void main() {
      vec3 V = normalize(cameraPosition - vWorldPos);   // 每像素视线方向
      vec3 N = normalize(vWorldNormal);

      // 反射方向 + 视角强度控制，产生明显空间感
      vec3 R = normalize(reflect(-V, N * uParallax));
      vec2 envUV = dirToEquirectUV(R);

      vec3 envColor = texture2D(uMap, envUV).rgb * uExposure;
      gl_FragColor = vec4(envColor, 1.0);
    }
  `,
  side: THREE.DoubleSide,
})

wall.material = newMaterial

// 导入天空盒


// gsap.to(newMaterial.uniforms.uTime, {
//   value: Math.PI * 2,
//   duration: 5,
//   repeat: -1,
//   ease: "none"
// })




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