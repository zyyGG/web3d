import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { EffectComposer, OutputPass, RenderPass, ShaderPass } from "three/examples/jsm/Addons.js";



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
camera.position.set(-5, 5, 5)

// 主要代码写在这里
// 创建平面阴影, 这个分两个步骤, 从光源处创建一个相机观察场景生成深度图.
// 然后再从正式的相机来生成深度图,将正式相机的深度图转为光源处相机的深度图参数, 这样就可以判断点位是否发生了覆盖

const groups = new THREE.Group()
scene.add(groups)
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5, metalness: 0.5 })
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.1, 20),
  baseMaterial
)
groups.add(floor)
floor.position.set(0, -0.5, 0)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  baseMaterial
)
cube.pivot = new THREE.Vector3(0, -0.5, 0)
cube.scale.y = 5
groups.add(cube)
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  baseMaterial
)
groups.add(sphere)
sphere.position.set(2, 0, 0)
const cylinder = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
  baseMaterial
)
groups.add(cylinder)
cylinder.position.set(-2, 0, 0)

// 决定平行光源相机点位
// const directionLightPosition = directionalLight.position.clone()
// const lightCamera = new THREE.OrthographicCamera(window.innerWidth / -100, window.innerWidth / 100, window.innerHeight / 100, window.innerHeight / -100, 0.1, 100)
const lightCamera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 50)
const lightRenderTarget = new THREE.WebGLRenderTarget(1024, 1024)
lightRenderTarget.depthTexture = new THREE.DepthTexture()

const shadowReceiverMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uShadowMap: { value: lightRenderTarget.depthTexture },
    uLightMatrix: { value: new THREE.Matrix4() },
    uLightProjectionMatrix: { value: lightCamera.projectionMatrix.clone() },
    uShadowMapSize:{ value: new THREE.Vector2(lightRenderTarget.width, lightRenderTarget.height) }
  },
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    varying vec4 vShadowClip;
    uniform mat4 uLightMatrix;
    uniform mat4 uLightProjectionMatrix;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vShadowClip = uLightProjectionMatrix * uLightMatrix * worldPosition;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D uShadowMap;
    uniform vec2 uShadowMapSize;
    varying vec4 vShadowClip;

    void main() {
      vec3 shadowNdc = vShadowClip.xyz / vShadowClip.w;
      vec2 shadowUv = shadowNdc.xy * 0.5 + 0.5;
      float currentDepth = shadowNdc.z * 0.5 + 0.5;
      float shadowAmount = 0.0;
      

      if (
        shadowUv.x >= 0.0 && shadowUv.x <= 1.0 &&
        shadowUv.y >= 0.0 && shadowUv.y <= 1.0 &&
        currentDepth >= 0.0 && currentDepth <= 1.0
      ) {
        // 采样周围9个点求平均
        float textureSize = 1.0 / uShadowMapSize.x; // 假设宽高相等
        float bias = 0.002;
        float occalusion = 0.0;
        for(int i = -1; i < 1; i++) {
          for(int j = -1; j < 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * textureSize;
            float shadowDepth = texture2D(uShadowMap, shadowUv + offset).r;
            occalusion += currentDepth - bias > shadowDepth ? 1.0 : 0.0;
          }
        }
        shadowAmount = (occalusion / 9.0);
      }

      gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAmount);
    }
  `,
})

const shadowReceiver = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  shadowReceiverMaterial
)
shadowReceiver.rotation.x = -Math.PI * 0.5
shadowReceiver.position.set(0, -0.449, 0)
shadowReceiver.renderOrder = 1
groups.add(shadowReceiver)

const shadowDepthMaterial = new THREE.MeshDepthMaterial()



function renderShadowMap() {
  lightCamera.position.copy(directionalLight.position) // 更随光源的最新位置
  lightCamera.lookAt(0, 0, 0)
  lightCamera.updateMatrixWorld() // 更新光源相机的世界矩阵
  lightCamera.updateProjectionMatrix() // 更新光源相机的投影矩阵
  shadowReceiverMaterial.uniforms.uLightMatrix.value.copy(lightCamera.matrixWorldInverse)
  shadowReceiverMaterial.uniforms.uLightProjectionMatrix.value.copy(lightCamera.projectionMatrix)
  // 进行一次渲染
  shadowReceiver.visible = false
  scene.overrideMaterial = shadowDepthMaterial // 使用深度材质渲染
  renderer.setRenderTarget(lightRenderTarget)
  renderer.render(scene, lightCamera)
  renderer.setRenderTarget(null) // 恢复默认渲染目标
  scene.overrideMaterial = null // 恢复原始材质
  shadowReceiver.visible = true
}

///--------------------------------------------------------------------


// 渲染场景
function animations() {
  
  controls.update() // 更新控制器
  stats.update();
  renderShadowMap() // 渲染阴影贴图
  // composer.render()
  renderer.render(scene, camera)

  // 移动光源
  const timeScale = 0.0001
  // directionalLight.position.x = Math.sin(Date.now() * timeScale) * 10
  // directionalLight.position.z = Math.cos(Date.now() * timeScale) * 10
  directionalLightHelper.update() // 更新辅助器
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