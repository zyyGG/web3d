import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from "three/examples/jsm/Addons.js";

const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0x000000, 1)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animations)
document.querySelector("#app").appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 50, 100)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.25
controls.target.set(0, 0, 0)
controls.update()

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x3e3e3e)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)
scene.add(new THREE.DirectionalLightHelper(directionalLight, 1))
scene.add(new THREE.AxesHelper(5))
scene.add(new THREE.GridHelper(20, 20))

// ===== 参数 =====
const WATER_HALF = 100
const HEIGHT_MAP_RES = 1024
const HEIGHT_MIN = -50
const HEIGHT_MAX = 50

// ===== 1. 正交相机 =====
const orthoCam = new THREE.OrthographicCamera(
  -WATER_HALF, WATER_HALF,
  -WATER_HALF, WATER_HALF,
  -200, 500
)
orthoCam.position.set(0, 100, 0)
orthoCam.up.set(0, -1, -1)
orthoCam.lookAt(0, 0, 0)
orthoCam.updateMatrixWorld()
orthoCam.updateProjectionMatrix()

// ===== 2. 高度图 =====
const heightTarget = new THREE.WebGLRenderTarget(HEIGHT_MAP_RES, HEIGHT_MAP_RES)

const heightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uMinY: { value: HEIGHT_MIN },
    uMaxY: { value: HEIGHT_MAX },
  },
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #include <packing>
    varying vec3 vWorldPos;
    uniform float uMinY;
    uniform float uMaxY;
    void main() {
      // 压缩深度
      float yNorm = (vWorldPos.y - uMinY) / (uMaxY - uMinY);
      vec4 packingDepth = packDepthToRGBA( clamp(yNorm, 0.0, 1.0) );
      gl_FragColor = packingDepth;
    }
  `,
  side: THREE.DoubleSide,
})

let heightReady = false

function bakeHeightMap() {
  orthoCam.layers.set(1)
  gltfModels.traverse(child => child.isMesh && (child.layers.set(1)))
  scene.overrideMaterial = heightMaterial
  renderer.setRenderTarget(heightTarget)
  renderer.render(scene, orthoCam)
  scene.overrideMaterial = null
  renderer.setRenderTarget(null)
  heightReady = true
  gltfModels.traverse(child => child.isMesh && (child.layers.set(0)))
  orthoCam.layers.set(0) // 设置正交相机的图层为 1
  orthoCam.removeFromParent() // 移除正交相机
  orthoCam.remove() // 移除正交相机
}

// ===== 3. 加载模型 =====
const gltfLoader = new GLTFLoader()
let gltfModels = new THREE.Group()
gltfLoader.load("/models/scene006.glb", (data) => {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x999999, metalness: 0.1, roughness: 0.4
  })
  const model = data.scene
  model.traverse(child => { if (child.isMesh) {
    child.material = mat
  }})
  scene.add(model)
  gltfModels = model
  bakeHeightMap()
})

// camera.layers.set(1)

// ===== 4. 水体 =====
const textureLoader = new THREE.TextureLoader()
const normalMap = textureLoader.load('/textures/waternormals.jpg')
normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping

const waterGeometry = new THREE.PlaneGeometry(WATER_HALF, WATER_HALF, 256, 256)
const waterMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uHeightMap:     { value: heightTarget.texture },
    uWaterHeight:   { value: 0.1 },
    uHalfSize:      { value: WATER_HALF },
    uMinY:          { value: HEIGHT_MIN },
    uMaxY:          { value: HEIGHT_MAX },
    uMaxDepth:      { value: 5.0 },
    uShallowColor:  { value: new THREE.Color(0.2, 0.6, 0.5) },
    uDeepColor:     { value: new THREE.Color(0.0, 0.05, 0.15) },
    uFoamRange:     { value: 0.3 },
    uFoamColor:     { value: new THREE.Color(1.0, 1.0, 1.0) },
    uNormalMap:     { value: normalMap },
    uNormalRepeat:  { value: 4.0 },
    uNormalStrength:{ value: 0.1 },
    uLightDir:      { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    uTime:          { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vWorldPos;
    varying vec2 vUv;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    #include <packing>

    uniform sampler2D uHeightMap;
    uniform float uWaterHeight;
    uniform float uHalfSize;
    uniform float uMinY;
    uniform float uMaxY;
    uniform float uMaxDepth;
    uniform vec3 uShallowColor;
    uniform vec3 uDeepColor;
    uniform float uFoamRange;
    uniform vec3 uFoamColor;
    uniform sampler2D uNormalMap;
    uniform float uNormalRepeat;
    uniform float uNormalStrength;
    uniform vec3 uLightDir;
    uniform float uTime;

    varying vec3 vWorldPos;
    varying vec2 vUv;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float perlin_noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      // 高度图 UV（世界空间）
      vec2 heightUv = (vWorldPos.xz + uHalfSize) / (2.0 * uHalfSize);
      
      // 读取地形高度
      float yNorm = unpackRGBAToDepth(texture2D(uHeightMap, heightUv));
      float terrainY = mix(uMinY, uMaxY, yNorm);
      
      float waterDepth = max(0.0, uWaterHeight - terrainY);
      float depthFactor = clamp(waterDepth / uMaxDepth, 0.0, 1.0);
      
      // ---- 法线贴图 ----
      vec2 normalUv = vUv * uNormalRepeat;
      normalUv.y += uTime * 0.05;
      normalUv.x += uTime * 0.05;
      vec3 normalTex = texture2D(uNormalMap, normalUv).xyz;
      // vec3 normalTex2 = texture2D(uNormalMap, normalUv * vec2(-1, -1)).xyz;
      // vec3 normalTex = mix(normalTex1, normalTex2, 1.0);
      // 从 [0,1] 映射到 [-1,1]
      vec3 normal = normalize(normalTex * 2.0 - 1.0);
      // 将法线从切线空间转换到世界空间（简化处理：平面朝上，x 为右，z 为前）
      vec3 worldNormal = normalize(vec3(
        normal.x * uNormalStrength,
        normal.y,
        normal.z * uNormalStrength
      ));
      // 确保法线朝上
      worldNormal.y = abs(worldNormal.y);
      worldNormal = normalize(worldNormal);
      
      // ---- 光照 ----
      float lightDot = max(0.0, dot(worldNormal, normalize(uLightDir)));
      float specular = pow(max(0.0, dot(reflect(-normalize(uLightDir), worldNormal), vec3(0.0, 1.0, 0.0))), 8.0);
      
      // ---- 水体颜色 ----
      vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);
      waterColor = waterColor * (0.5 + 0.5 * lightDot) + vec3(specular) * 0.5;
      
      // 浮沫边缘
      float noiseFactor = perlin_noise(vUv * 40.0 + uTime);
      // 使用smoothstep来创建一个平滑的过渡效果，使泡沫边缘更加自然, 这里计算,uFoamRange(泡沫范围) - waterDepth(水深)的值, 然后使用smoothstep函数将其映射到0到1之间, 最后用1减去这个值来得到泡沫因子
      float foamFactor = (1.0 - smoothstep(0.0, uFoamRange + noiseFactor * 0.5, waterDepth ));
      
      
      // 应用光照
      vec3 foamColor = uFoamColor * (0.5 + 0.5 * lightDot);
      vec3 color = mix(waterColor, foamColor, foamFactor);
      
      // 深度对颜色的影响（让深水更暗）
      color *= mix(1.0, 0.7, depthFactor);
      
      float alpha = mix(0.8, 1.0, depthFactor);
      alpha = max(alpha, foamFactor * 0.95);
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
})

const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = -Math.PI / 2
water.position.y = 0.1
scene.add(water)

// ===== GUI =====
gui.add(water.position, 'y', 0.1, 20).name('水面高度').onChange(v => {
  water.position.y = v
  waterMaterial.uniforms.uWaterHeight.value = v
})
gui.add(waterMaterial.uniforms.uMaxDepth, 'value', 1, 100).name('最大水深范围')
gui.addColor(waterMaterial.uniforms.uShallowColor, 'value').name('浅水颜色')
gui.addColor(waterMaterial.uniforms.uDeepColor, 'value').name('深水颜色')
gui.add(waterMaterial.uniforms.uFoamRange, 'value', 0, 2).name('泡沫范围')
gui.addColor(waterMaterial.uniforms.uFoamColor, 'value').name('泡沫颜色')
gui.add(waterMaterial.uniforms.uNormalStrength, 'value', 0, 0.5).name('法线强度')
gui.add(waterMaterial.uniforms.uNormalRepeat, 'value', 0.5, 10).name('法线重复')
gui.add({ 重新渲染: bakeHeightMap }, '重新渲染').name('重新烘培')

// ===== 5. 动画 =====
function animations() {
  waterMaterial.uniforms.uTime.value += 0.016
  controls.update()
  renderer.render(scene, camera)
  stats.update()
}

// ===== 6. 窗口 =====
window.onresize = () => {
  const w = Math.ceil(window.innerWidth)
  const h = Math.ceil(window.innerHeight)
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}