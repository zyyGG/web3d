import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"
import { VertexNormalsHelper } from "three/examples/jsm/Addons.js";



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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.67)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.intensity = 1
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
// scene.add(gridHelper)

// 平行光辅助器

///--------------------------------------------------------------------
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(mat3(modelMatrix) * normal); // 法线矩阵
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec2 vUv;

    uniform float u_time;
    uniform vec3 u_directionalLight;

    void main() {

      vec2 uv = vUv;
      vec3 normal = vNormal;
      vec3 color = vec3(0.0, 0.0, 0.0); // 物体的颜色
      vec3 baseColor = vec3(1.0, 1.0, 0.0); // 基础颜色

      // 定义一个环境光
      float ambientLightIntensity = 0.67;
      vec3 ambientLightColor = vec3(1.0, 1.0, 1.0); // 环境光颜色
      // 定义一个平行光
      vec3 directionalLightPosition = vec3(0.0, 10.0, 10.0); // 平行光位置
      vec3 directionalLightColor = vec3(1.0, 1.0, 1.0); // 平行光颜色
      float directionalLightIntensity = 1.0; // 平行光强度

      // 旋转平行光
      directionalLightPosition.x = sin(u_time) * 10.0;
      directionalLightPosition.y = cos(u_time) * 10.0;
      directionalLightPosition.z = 0.0;


      // 计算环境光的影响, 这里0.333是一个系数，可以根据需要调整， 这可以细致的调整环境光从0 - 3.00
      color = mix(color, baseColor * ambientLightColor, ambientLightIntensity * 0.745); // 混合环境光和物体颜色

      // 计算平行光的影响
      vec3 lightDirection = normalize(directionalLightPosition - vec3(0.0, 0.0, 0.0)); // 光线方向
      float lightIntensity = max(dot(normal, lightDirection), 0.0); // 计算法线与光线的夹角
      lightIntensity = lightIntensity * directionalLightIntensity; // 计算光线的强度
      color = mix(color, baseColor * directionalLightColor, lightIntensity * 0.55); // 计算光线的颜色

      gl_FragColor = vec4(color, 1.0 );
    }
  `
});
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 10, 10),
  material
)
plane.rotation.x = -Math.PI / 2
plane.position.y = -1
scene.add(plane)
plane.geometry.computeVertexNormals() // 计算法线

// 正常的basic材质
const material2 = new THREE.MeshLambertMaterial({ color: 0xffff00 })

const sphere = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.5,10),
  material
)
sphere.position.set(0, 0, 2)
scene.add(sphere)

const sphere2 = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.5,10),
  material2
)
sphere2.position.set(2, 0, 2)

scene.add(sphere2)


const basicCube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  material2
)
basicCube.position.set(2, 0, 0)
scene.add(basicCube)


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  material.uniforms.u_time.value += 0.001
  // 移动平行光
  directionalLight.position.x = Math.sin(material.uniforms.u_time.value) * 10
  directionalLight.position.y = Math.cos(material.uniforms.u_time.value) * 10
  directionalLight.position.z = 0.0
  directionalLightHelper.update()
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