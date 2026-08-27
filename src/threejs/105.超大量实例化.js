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

// ================================================================
//  InstancedBufferGeometry 完整示例
//
//  核心概念：
//    InstancedBufferGeometry = 顶点数据（共享） + 实例数据（每实例独立）
//    需要配合 ShaderMaterial 使用，内置材质不读自定义实例属性
//
//  两种实例化路线：
//    A. InstancedMesh        — 简单，用 setMatrixAt/setColorAt，内置着色器
//    B. InstancedBufferGeometry — 完全自定义，用 ShaderMaterial，本例演示这个
// ================================================================

const INSTANCE_COUNT = 20000

// ---------- 1. 基础几何体（所有实例共享同一套顶点） ----------
// 用 IcosahedronGeometry（二十面体）比 BoxGeometry 更适合展示
const baseGeometry = new THREE.IcosahedronGeometry(0.3, 3) // detail=1 看起来更圆润

// 包装为 InstancedBufferGeometry
const instancedGeo = new THREE.InstancedBufferGeometry()
instancedGeo.index = baseGeometry.index // 索引共享
instancedGeo.attributes = baseGeometry.attributes  // 顶点 position/normal/uv 共享
instancedGeo.instanceCount = INSTANCE_COUNT

// ---------- 2. 实例属性（每个实例独立的数据） ----------
const offsets = new Float32Array(INSTANCE_COUNT * 3)
const scales = new Float32Array(INSTANCE_COUNT * 3)
const colors = new Float32Array(INSTANCE_COUNT * 3)
const phases = new Float32Array(INSTANCE_COUNT) // 动画相位


for (let i = 0; i < INSTANCE_COUNT; i++) {
  // 随机分布在一个球壳区域内
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = 10 + Math.random() * 50 // 半径 3~10

  offsets[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
  offsets[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5 + 2 // 压扁成椭球
  offsets[i * 3 + 2] = r * Math.cos(phi)

  // 随机缩放（0.5 ~ 2.0）
  const s = 0.5 + Math.random() * 1.5
  scales[i * 3 + 0] = s
  scales[i * 3 + 1] = s
  scales[i * 3 + 2] = s

  // HSL 颜色（色相均匀分布，饱和度/亮度随机）
  const hue = Math.random()
  const color = new THREE.Color().setHSL(hue, 0.7 + Math.random() * 0.3, 0.5 + Math.random() * 0.2)
  colors[i * 3 + 0] = color.r
  colors[i * 3 + 1] = color.g
  colors[i * 3 + 2] = color.b

  phases[i] = Math.random() * Math.PI * 2
}

// 关键：InstancedBufferAttribute 的第四个参数 meshPerAttribute 默认 1
// 表示每 N 个实例共享一组数据（1 = 每个实例独立）
instancedGeo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
instancedGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 3))
instancedGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3))
instancedGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))

// 实例 ID（用于射线检测高亮）
const instanceIds = new Float32Array(INSTANCE_COUNT)
for (let i = 0; i < INSTANCE_COUNT; i++) instanceIds[i] = i
instancedGeo.setAttribute('aInstanceId', new THREE.InstancedBufferAttribute(instanceIds, 1))

// ---------- 3. ShaderMaterial（读取自定义实例属性） ----------
const vertexShader = /* glsl */`
  // 顶点属性（所有实例共享）
  // attribute vec3 position;
  // attribute vec3 normal;

  // 实例属性（每个实例独立）
  attribute vec3 aOffset;   // 位置偏移
  attribute vec3 aScale;    // 缩放
  attribute vec3 aColor;    // 颜色
  attribute float aPhase;   // 动画相位
  attribute float aInstanceId; // 实例 ID（射线高亮用）

  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vWorldPos;
  varying float vAO; // 简易环境光遮蔽
  varying float vInstanceId;

  void main() {
    // 动画：呼吸缩放 + 微弱上下浮动
    float breathe = sin(uTime * 1.5 + aPhase) * 0.15 + 1.0;
    vec3 animatedScale = aScale * breathe;

    // 动态旋转
    float angle = uTime * 0.5 + aPhase;
    float cosA = cos(angle);
    float sinA = sin(angle);
    mat3 rotation = mat3(
      cosA, 0.0, sinA,
      0.0, 1.0, 0.0,
      -sinA, 0.0, cosA
    );

    // 组合变换：旋转 → 缩放 → 平移
    vec3 rotatedPos = rotation * position;
    vec3 scaledPos = rotatedPos * animatedScale;
    vec3 worldPos = scaledPos + aOffset + vec3(cos(uTime + aPhase) * 5.0, sin(uTime + aPhase) * 5.0, 0.0);

    // 法线也需要旋转（不需要缩放，避免非均匀缩放导致法线失真）
    vNormal = normalize(rotation * normal);
    vColor = aColor;
    vWorldPos = worldPos;
    vInstanceId = aInstanceId;

    // 简易 AO：离中心越远越暗
    vAO = 1.0 - smoothstep(3.0, 10.0, length(aOffset)) * 0.3;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uLightDir;    // 主光方向
  uniform vec3 uLightColor;  // 主光颜色
  uniform vec3 uAmbientColor;// 环境光颜色
  uniform float uFresnelPower; // 菲涅尔强度
  uniform int uSelectedId;   // 射线选中的实例 ID（-1 = 无选中）

  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vWorldPos;
  varying float vAO;
  varying float vInstanceId;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightDir);

    // 半兰伯特（暗面提亮，比纯 Lambert 更自然）
    float halfLambert = dot(normal, lightDir) * 0.5 + 0.5;
    halfLambert = pow(halfLambert, 2.0);

    // 菲涅尔（边缘泛光）
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);

    // 高光（Blinn-Phong）
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);

    // 组合
    vec3 ambient = uAmbientColor * vColor * 0.3;
    vec3 diffuse = uLightColor * vColor * halfLambert;
    vec3 rim = uLightColor * fresnel * 0.4;
    vec3 specular = uLightColor * spec * 0.6;

    vec3 finalColor = (ambient + diffuse + rim + specular) * vAO;

    // 射线选中高亮：亮红色
    if (int(vInstanceId + 0.5) == uSelectedId) {
      finalColor = vec3(1.0, 0.0, 0.3); // 亮红色
      finalColor += rim * 0.8; // 保持边缘泛光，增加层次感
    }

    // 简易色调映射（避免依赖 renderer.toneMapping）
    finalColor = finalColor / (finalColor + vec3(1.0));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const boxMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(5, 10, 5).normalize() },
    uLightColor: { value: new THREE.Color(0xfff4e6) },
    uAmbientColor: { value: new THREE.Color(0x4488cc) },
    uFresnelPower: { value: 3.0 },
    uSelectedId: { value: -1 },
  },
})

const boxMesh = new THREE.Mesh(instancedGeo, boxMaterial)
boxMesh.frustumCulled = false
scene.add(boxMesh)

// ---------- 立方体实例化（独立的 InstancedBufferGeometry） ----------
const CUBE_COUNT = 5000

const baseCubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
const cubeInstancedGeo = new THREE.InstancedBufferGeometry()
cubeInstancedGeo.index = baseCubeGeo.index
cubeInstancedGeo.attributes = baseCubeGeo.attributes
cubeInstancedGeo.instanceCount = CUBE_COUNT

const cubeOffsets = new Float32Array(CUBE_COUNT * 3)
const cubeScales = new Float32Array(CUBE_COUNT * 3)
const cubeColors = new Float32Array(CUBE_COUNT * 3)
const cubePhases = new Float32Array(CUBE_COUNT)
const cubeInstanceIds = new Float32Array(CUBE_COUNT)

for (let i = 0; i < CUBE_COUNT; i++) {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = 10 + Math.random() * 50

  cubeOffsets[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
  cubeOffsets[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5 + 2
  cubeOffsets[i * 3 + 2] = r * Math.cos(phi)

  const s = 0.5 + Math.random() * 1.5
  cubeScales[i * 3 + 0] = s
  cubeScales[i * 3 + 1] = s
  cubeScales[i * 3 + 2] = s

  const hue = 0.55 + Math.random() * 0.15 // 冷色系（蓝紫），与球体区分
  const color = new THREE.Color().setHSL(hue, 0.8 + Math.random() * 0.2, 0.4 + Math.random() * 0.3)
  cubeColors[i * 3 + 0] = color.r
  cubeColors[i * 3 + 1] = color.g
  cubeColors[i * 3 + 2] = color.b

  cubePhases[i] = Math.random() * Math.PI * 2
  cubeInstanceIds[i] = i
}

cubeInstancedGeo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(cubeOffsets, 3))
cubeInstancedGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(cubeScales, 3))
cubeInstancedGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(cubeColors, 3))
cubeInstancedGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(cubePhases, 1))
cubeInstancedGeo.setAttribute('aInstanceId', new THREE.InstancedBufferAttribute(cubeInstanceIds, 1))

// 复用同一套 shader，独立的 uniform 实例
const cubeMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uLightDir: boxMaterial.uniforms.uLightDir, // 共享引用，GUI 同步修改
    uLightColor: { value: new THREE.Color(0xfff4e6) },
    uAmbientColor: { value: new THREE.Color(0x2244aa) }, // 更深的蓝，与球体区分
    uFresnelPower: { value: 2.5 },
    uSelectedId: { value: -1 },
  },
})

const cubeMesh = new THREE.Mesh(cubeInstancedGeo, cubeMaterial)
cubeMesh.frustumCulled = false
scene.add(cubeMesh)

// ---------- 射线检测（手动计算，与 Shader 中的动画公式一致） ----------
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

renderer.domElement.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const time = performance.now() * 0.001
  let closestId = -1
  let closestDist = Infinity
  let hitType = null // 'sphere' or 'cube'

  // 检测球体实例
  for (let i = 0; i < INSTANCE_COUNT; i++) {
    const phase = phases[i]
    const ox = offsets[i * 3 + 0] + Math.cos(time + phase) * 5.0
    const oy = offsets[i * 3 + 1] + Math.sin(time + phase) * 5.0
    const oz = offsets[i * 3 + 2]

    const center = new THREE.Vector3(ox, oy, oz)
    const v = center.clone().sub(raycaster.ray.origin)
    const t = v.dot(raycaster.ray.direction)
    if (t < 0) continue

    const closest = raycaster.ray.origin.clone().add(
      raycaster.ray.direction.clone().multiplyScalar(t)
    )
    const dist = closest.distanceTo(center)

    const maxScale = Math.max(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2])
    const breathe = Math.sin(time * 1.5 + phase) * 0.15 + 1.0
    const threshold = maxScale * breathe * 0.5

    if (dist < threshold && dist < closestDist) {
      closestDist = dist
      closestId = i
      hitType = 'sphere'
    }
  }

  // 检测立方体实例
  for (let i = 0; i < CUBE_COUNT; i++) {
    const phase = cubePhases[i]
    const ox = cubeOffsets[i * 3 + 0] + Math.cos(time + phase) * 5.0
    const oy = cubeOffsets[i * 3 + 1] + Math.sin(time + phase) * 5.0
    const oz = cubeOffsets[i * 3 + 2]

    const center = new THREE.Vector3(ox, oy, oz)
    const v = center.clone().sub(raycaster.ray.origin)
    const t = v.dot(raycaster.ray.direction)
    if (t < 0) continue

    const closest = raycaster.ray.origin.clone().add(
      raycaster.ray.direction.clone().multiplyScalar(t)
    )
    const dist = closest.distanceTo(center)

    const maxScale = Math.max(cubeScales[i * 3], cubeScales[i * 3 + 1], cubeScales[i * 3 + 2])
    const breathe = Math.sin(time * 1.5 + phase) * 0.15 + 1.0
    const threshold = maxScale * breathe * 0.5

    if (dist < threshold && dist < closestDist) {
      closestDist = dist
      closestId = i
      hitType = 'cube'
    }
  }

  // 清除两个材质的选中状态，再设置命中的那个
  boxMaterial.uniforms.uSelectedId.value = hitType === 'sphere' ? closestId : -1
  cubeMaterial.uniforms.uSelectedId.value = hitType === 'cube' ? closestId : -1
})

// ---------- 4. 辅助：线框模式的包围球（展示分布范围） ----------
const wireframeGeo = new THREE.SphereGeometry(10, 32, 32)
const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.15 })
const wireframeSphere = new THREE.Mesh(wireframeGeo, wireframeMat)
wireframeSphere.position.y = 2
scene.add(wireframeSphere)

// ---------- 5. GUI 控制 ----------
const params = {
  instanceCount: INSTANCE_COUNT,
  fresnelPower: 3.0,
  lightColor: '#fff4e6',
  ambientColor: '#4488cc',
  lightDirX: 5,
  lightDirY: 10,
  lightDirZ: 5,
}

const folder = gui.addFolder('InstancedBufferGeometry')
folder.add(params, 'fresnelPower', 0.5, 8, 0.1).name('菲涅尔强度').onChange((v) => {
  boxMaterial.uniforms.uFresnelPower.value = v
})
folder.addColor(params, 'lightColor').name('主光颜色').onChange((v) => {
  boxMaterial.uniforms.uLightColor.value.set(v)
})
folder.addColor(params, 'ambientColor').name('环境光颜色').onChange((v) => {
  boxMaterial.uniforms.uAmbientColor.value.set(v)
})
folder.add(params, 'lightDirX', -10, 10, 0.5).name('光源X').onChange(updateLightDir)
folder.add(params, 'lightDirY', -10, 10, 0.5).name('光源Y').onChange(updateLightDir)
folder.add(params, 'lightDirZ', -10, 10, 0.5).name('光源Z').onChange(updateLightDir)

function updateLightDir() {
  boxMaterial.uniforms.uLightDir.value.set(
    params.lightDirX, params.lightDirY, params.lightDirZ
  ).normalize()
}

///--------------------------------------------------------------------

// 渲染场景
function animations(time) {
  const t = time * 0.001
  boxMaterial.uniforms.uTime.value = t
  cubeMaterial.uniforms.uTime.value = t
  renderer.render(scene, camera)
  controls.update()
  stats.update()
}

// 其他功能
window.onresize = () => {
  const width = Math.ceil(window.innerWidth)
  const height = Math.ceil(window.innerHeight)
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}