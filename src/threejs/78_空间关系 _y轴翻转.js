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

///--------------------------------------------------------------------
gridHelper.visible = false;
directionalLightHelper.visible = false;
axesHelper.visible = false;


const customGeometry = new THREE.BufferGeometry()
// 字母F
// const positionAttribute = new THREE.BufferAttribute(new Float32Array([
//   200, 0, 0,
//   200, 200, 0,
//   0, 0, 0,

//   0, 0, 0,
//   200, 200, 0,
//   0, 200, 0,
// ]), 3)

// 倒转的y轴
const positionAttribute = new THREE.BufferAttribute(new Float32Array([
  0, 0.0, 0,
  0, 1.0, 0,
  0.5, 0, 0,

  0.5, 0, 0,
  0, 1.0, 0,
  0.8, 0.9, 0,
]), 3)
customGeometry.setAttribute('position', positionAttribute)

// 主要代码写在这里
const plane = new THREE.Mesh(
  customGeometry,
  new THREE.RawShaderMaterial({
    uniforms: {
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      translation: { value: new THREE.Vector3(0, -0.5, 0) }, // 平移
    },
    vertexShader: /* glsl */`
    precision mediump float;
    attribute vec3 position;
    uniform vec2 uResolution;
    uniform vec3 translation;
    void main() {
      // vec3 zeroToOne = (position + translation) / vec3(uResolution, 1.0);
      // vec3 zeroToTwo = zeroToOne * 2.0;
      // vec3 clipSpace = zeroToTwo - 1.0; // 裁切空间 ,  范围 -1 - 1
      vec3 clipSpace = position * vec3(1.0, -1.0, 1.0);


      // clipSpace *= vec3(1, -1, 1); // y轴反转

      // 一步到位
      // vec3 clipSpace = ((position + translate) / vec3(uResolution, 1.0)) * 2.0 - 1.0;

      gl_Position = vec4(clipSpace.xy, 0.0, 1.0);
    }
    `,
    fragmentShader: /* glsl */`
    precision mediump float;

    uniform vec2 uResolution;

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
    `,
    // doubleSided: true,
  })
)
scene.add(plane)
 // 动画

// gsap.to(plane.material.uniforms.translation.value, {
//   x: window.innerWidth - 80,
//   duration: 2,
//   ease: "power1.inOut",
//   yoyo: true,
//   repeat: -1,
// })
// plane.material= new THREE.MeshBasicMaterial({ color: 0xff0000 });
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

// 总结：
// y轴翻转在vertexShader中进行处理的化，传入的position的顶点顺序一定是要按照对应翻转后的坐标系来创建
// 