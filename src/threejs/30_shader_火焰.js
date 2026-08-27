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
renderer.setClearColor(0xcff0c0, 1) // 设置背景色
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

// const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const material = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0xfeffcc) },
    time: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  transparent: true,
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

    uniform vec2 uResolution;
    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      float t = time, i, z, d;
      for(gl_FragColor *= i; i++ < 50.0; gl_FragColor += (sin(z / 3.0 + vec4(7.0, 2.0, 3.0, 0.0)) + 1.0) / d){
        // vec3 p = z * normalize(vec3(fragCoord + fragCoord, 0.0) - uResolution.xyy);
        vec3 p = z * normalize(vec3((vUv + vUv) * vec2(800.0, 400.0), 0.0) - vec2(800.0, 400.0).xyy);
        p.z += 5.0 + cos(t);
        p.xz *= mat2(cos(p.y * 0.5 + vec4(0.0, 33.0, 11.0, 0.0))) / max(p.y * 0.1 + 1.0, 0.1);
        for(d = 2.0; d< 15.0; d/= 0.6){
          p += cos((p.yzx - vec3(t / 0.1, t, d)) * d) / d;
        }
        z += d = 0.01 + abs(length(p.xz) + p.y * 0.3 - 0.5) / 7.0;
      }
      gl_FragColor = tanh(gl_FragColor / 1e3);
      float transparent = smoothstep(0.1, 1.0, length(gl_FragColor.xyz));
      gl_FragColor = vec4(gl_FragColor.xyz, transparent);
    }
  `
})

const planeGeo = new THREE.PlaneGeometry(1, 1, 1, 1)
const plane = new THREE.Mesh(planeGeo, material)
// plane.rotateX(-Math.PI / 2)
scene.add(plane)

camera.position.set(0, 0.5, 0.5)
///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  material.uniforms.time.value += 0.001
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