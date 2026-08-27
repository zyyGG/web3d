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
// controls.dampingFactor = 0.1 // 阻尼系数
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
camera.position.set(0, 5, 5) // 设置相机位置
const config = {
  // 细分网格数量
  segments: 50,
  height: 1.0,
  isOpenFbm: true,
  fbmCount: 5,
}
// 主要代码写在这里
const planeGeo = new THREE.PlaneGeometry(50, 50, config.segments, config.segments)
const planeMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uSegments: { value: config.segments },
    uHeight: { value: config.height},
    uIsOpenFbm: { value: Number(config.isOpenFbm) },
    uFbmCount: { value: config.fbmCount },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uSegments;
    uniform float uHeight;
    uniform int uIsOpenFbm;
    uniform int uFbmCount;

    varying vec2 vUv;
    varying float vNoise2dValue;

    vec2 random2d(vec2 coord){
      return vec2(fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453),
                  fract(sin(dot(coord.yx, vec2(8.9899, 79.235))) * 85.8355));
    }

    float noise2d(vec2 st) {
      vec2 iUv = floor(st);
      vec2 fUv = fract(st); // 范围永远是0-1

      float result = 1.0;

      for(int y = -1; y <= 1; y++){
        for(int x = -1; x <= 1; x++){
          vec2 offsetPoint = vec2(float(x), float(y)); // 计算偏移量
          vec2 randCount = random2d(iUv + offsetPoint); // 计算偏移后的随机点
          randCount = 0.5 + 0.5 * sin(6.2831*randCount); // 范围是[0, 1]
          vec2 diff = offsetPoint + randCount - fUv;
          result = min(result, length(diff)); // 计算最小距离
        }
      }

      return result;
    }

    float fbm(vec2 st){
      float f = 0.0;
      float a = 0.5;
      for (int i = 0; i < uFbmCount; i++) {
        f += a * noise2d(st);
        st *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      float noise2dValue = 0.0;
      noise2dValue = uIsOpenFbm == 1 ? fbm(pos.xy) : noise2d(pos.xy);
      vNoise2dValue = noise2dValue;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(pos.x, pos.y, pos.z + noise2dValue * uHeight), 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec2 vUv;
    varying float vNoise2dValue;
    void main() {
      gl_FragColor = vec4(vec3(vNoise2dValue), 1.0);
    }
  `,
})
const plane = new THREE.Mesh(planeGeo, planeMat)
scene.add(plane)
plane.rotateX(-Math.PI / 2) // 旋转平面

gui.add(config, "segments", 1, 100).step(1).name("细分网格数量").onChange((val) => {
  // 更新细分网格数量
  plane.geometry.dispose()
  plane.geometry = new THREE.PlaneGeometry(5, 5, val, val)
})

gui.add(config, "height", 0, 5).step(0.1).name("山脉高度").onChange((val) => {
  // 更新高度
  plane.material.uniforms.uHeight.value = val
})

gui.add(config, "isOpenFbm").name("分形布朗FBM").onChange((val) => {
  // 更新是否开启fbm
  plane.material.uniforms.uIsOpenFbm.value = Number(val)
})

gui.add(config, "fbmCount", 1, 10).step(1).name("FBM计算数量").onChange((val) => {
  // 更新fbm数量
  plane.material.uniforms.uFbmCount.value = val
})




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