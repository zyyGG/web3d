import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

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
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
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
directionalLight.visible = false
ambientLight.visible = false

const HDRFolder = gui.addFolder('HDR环境贴图')
const hdrParams = {
  hdr1: function(){
    loadSceneTexture('/hdr/empty_play_room_4k.hdr')
  },
  hdr2: function(){
    loadSceneTexture('/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr')
  },
  hdr3: function(){
    loadSceneTexture('/hdr/railway_bridge_02_1k.hdr')
  },
}
function loadSceneTexture(path){
  const hdrLoader = new RGBELoader()
  hdrLoader.load(path, function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture;
    // scene.environment = texture
    texture.dispose(); // 释放内存
  });
}

hdrParams.hdr1()
HDRFolder.add(hdrParams, 'hdr1').name('空房间环境')
HDRFolder.add(hdrParams, 'hdr2').name('天空环境')
HDRFolder.add(hdrParams, 'hdr3').name('田野环境')

// 增加半球光
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
hemisphereLight.position.set(0, 20, 0)
scene.add(hemisphereLight)
const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 1)
scene.add(hemisphereLightHelper)

 // 重置摄像机位置
camera.position.set(0, 2, 0)
camera.lookAt(0, 2, -1)
controls.target.set(0, 2, -1)
controls.update()
controls.enablePan = false // 关闭平移
controls.enableZoom = false // 关闭缩放


// 设置渲染目标， 玩家深度图
const renderTarget01 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
renderTarget01.texture.minFilter = THREE.NearestFilter; // 使用最近点采样， 防止深度图模糊
renderTarget01.texture.magFilter = THREE.NearestFilter;
renderTarget01.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
renderTarget01.depthTexture.type = THREE.UnsignedShortType;
// 设置渲染目标， 场景深度图
const renderTarget02 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
renderTarget02.texture.minFilter = THREE.NearestFilter; // 使用最近点采样， 防止深度图模糊
renderTarget02.texture.magFilter = THREE.NearestFilter;
renderTarget02.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
renderTarget02.depthTexture.type = THREE.UnsignedShortType;
// 设置渲染目标，采样玩家轮廓材质
const renderTarget03 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
renderTarget03.texture.minFilter = THREE.NearestFilter; // 使用最近点采样， 防止深度图模糊
renderTarget03.texture.magFilter = THREE.NearestFilter;
renderTarget03.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
renderTarget03.depthTexture.type = THREE.UnsignedShortType;


const DEPTH_LAYER = 1  // 深度图层
const SCENE_LAYER = 0  // 场景图层

// 轮廓shader
const outlineShader = new THREE.ShaderMaterial({
  uniforms: {
    // tDiffuse01: { value: renderTarget01.texture  },
  },
  vertexShader: /**glsl */`
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      vNormal = normalize( normalMatrix * normal );
      vViewPosition = normalize(- ( modelViewMatrix * vec4( position, 1.0 ) ).xyz);
    }
  `,
  fragmentShader: /**glsl */`
    // uniform sampler2D tDiffuse01;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      float rimPower = 2.0;
      float rimIntensity = 1.0;
      vec3 rimColor = vec3(1.0, 1.0, 0.0);
      float rim = 1.0 - max(dot(vNormal, vViewPosition), 0.0);
      rim = pow(rim, rimPower) * rimIntensity;
      vec3 color = rim * rimColor;
      gl_FragColor = vec4(color, rim); // 放大效果
    }
  `,
  transparent: true,
})

let originalMaterial = null; // 用于存储玩家原始材质
let originalGeometry = null; // 用于存储玩家
let outlineGeometry = null;
let outlineMaterial = outlineShader;
// 主要场景
const MainScene = new THREE.Group()
const PlayerGroup = new THREE.Group()
const moveStates = [] // "FORWARD", "BACKWARD", "LEFT", "RIGHT"
initScene() // 初始化场景
initPlayer()
initKeyBoardControl() // 初始化键盘控制

// 混合通道
const composer = new EffectComposer( renderer );
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );
const milityShader = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    tPlayerDepth: { value: renderTarget01.depthTexture },
    tSceneDepth: { value: renderTarget02.depthTexture },
    tOutlineTexture: { value: renderTarget03.texture },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
  },
  vertexShader: /* glsl */`

    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */`
    uniform float cameraNear;
    uniform float cameraFar;
    uniform sampler2D tDiffuse;
    uniform sampler2D tPlayerDepth;
    uniform sampler2D tSceneDepth;
    uniform sampler2D tOutlineTexture;

    varying vec2 vUv;

    // 线性化深度值, 把0-1转回坐标空间的深度值，最终结果是far（1000）到near（0.1）
    float linearizeDepth(float z) {
      float ndc = z * 2.0 - 1.0;
      return (2.0 * cameraNear * cameraFar) /
             (cameraFar + cameraNear - ndc * (cameraFar - cameraNear));
    }

    void main() {
      vec4 color = texture2D( tDiffuse, vUv);
      vec4 playerDepth = texture2D( tPlayerDepth, vUv );
      float linearPlayerDepth = linearizeDepth(playerDepth.r);
      vec4 sceneDepth = texture2D( tSceneDepth, vUv );
      float linearSceneDepth = linearizeDepth(sceneDepth.r);

      vec4 outlineTexture = texture2D( tOutlineTexture, vUv );

      // 如果玩家深度小于场景深度，说明玩家在前面，显示玩家颜色，否则显示场景颜色
      if(linearPlayerDepth < linearSceneDepth + 0.01){
        // 不做处理
        gl_FragColor = color;
      } else {
        color = mix(color, outlineTexture, outlineTexture.a);
        gl_FragColor = color;
      }
      
      // color = mix(outlineTexture, color, linearPlayerDepth < linearSceneDepth + 0.01 ? 1.0 : 0.0);
      // gl_FragColor = vec4(color.rgb, 1.0);
    }
  `
})
const milityPass = new ShaderPass( milityShader );
composer.addPass( milityPass );
const outputPass = new OutputPass();
composer.addPass( outputPass );

function render() {
  // 采样玩家深度图
  setPlayerLayer(DEPTH_LAYER)
  setCameraLayer(DEPTH_LAYER)
  setMainSceneLayer(SCENE_LAYER)
  renderer.setRenderTarget( renderTarget01 );
  renderer.render(scene, camera)

  // 采样场景深度图
  setPlayerLayer(SCENE_LAYER)
  setCameraLayer(DEPTH_LAYER)
  setMainSceneLayer(DEPTH_LAYER)
  renderer.setRenderTarget( renderTarget02 );
  renderer.render(scene, camera)

  // 采样玩家轮廓材质
  renderer.setClearAlpha(0);
  setPlayerLayer(DEPTH_LAYER)
  setCameraLayer(DEPTH_LAYER)
  setMainSceneLayer(SCENE_LAYER)
  setPlayerMaterial(null, outlineMaterial)
  renderer.setRenderTarget( renderTarget03 );
  renderer.render(scene, camera)
  setPlayerMaterial(null, originalMaterial)
  renderer.setClearAlpha(1);

  // 渲染最终结果
  setPlayerLayer(SCENE_LAYER)
  setCameraLayer(SCENE_LAYER)
  setMainSceneLayer(SCENE_LAYER)
  renderer.setRenderTarget( null );
  composer.render();
}

function setPlayerLayer(layer){
  PlayerGroup.traverse(child => {
    if(child.isMesh){
      child.layers.set(layer)
    }
  })
  PlayerGroup.layers.set(layer)
}

function setCameraLayer(layer){
  camera.layers.set(layer)
}

function setMainSceneLayer(layer){
  MainScene.traverse(child => {
    if(child.isMesh){
      child.layers.set(layer)
    }
  })
  MainScene.layers.set(layer)
}

function setPlayerMaterial(geometry, material){
  PlayerGroup.traverse(child => {
    if(child.isMesh){
      child.geometry = geometry || child.geometry
      child.material = material || child.material
    }
  })
}

function initScene(){
  // 地板
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(50, 0.1, 50),
    new THREE.MeshStandardMaterial({color: "#dddddd"})
  )
  ground.position.set(0, -0.05, 0)
  MainScene.add(ground)

  // 墙壁
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(6, 5, 0.1),
    new THREE.MeshStandardMaterial({color: "#dddddd"})
  )
  wall.position.set(3, 2.5, -5)
  MainScene.add(wall)
  scene.add( MainScene )
}

function initPlayer(){
  
  // const SqeuareGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 64)
  // 胶囊
  const SqeuareGeometry = new THREE.CapsuleGeometry(0.5, 1.3, 8, 16)
  originalGeometry = SqeuareGeometry
  const SquareMaterial = new THREE.MeshStandardMaterial({color: "#ff0000"})
  originalMaterial = SquareMaterial; // 保存玩家原始材质
  const playerMesh = new THREE.Mesh(SqeuareGeometry, SquareMaterial)
  PlayerGroup.position.set(-0, 0.9, -7)
  PlayerGroup.add(playerMesh)
  scene.add(PlayerGroup)
}

// 初始化键盘控制
function initKeyBoardControl(){
  // window.addEventListener('keydown', handleMove)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyUp)
}

function handleKeydown(event){
  if(event.key === 'w' || event.key === 'W'){
    moveStates.indexOf("FORWARD") === -1 && moveStates.push("FORWARD")
  } else if(event.key === 's' || event.key === 'S'){
    moveStates.indexOf("BACKWARD") === -1 && moveStates.push("BACKWARD")
  } else if(event.key === 'a' || event.key === 'A'){
    moveStates.indexOf("LEFT") === -1 && moveStates.push("LEFT")
  } else if(event.key === 'd' || event.key === 'D'){
    moveStates.indexOf("RIGHT") === -1 && moveStates.push("RIGHT")
  }
}

function handleKeyUp(event) {
  if(event.key === 'w' || event.key === 'W'){
    const index = moveStates.indexOf("FORWARD")
    if(index > -1) moveStates.splice(index, 1)
  } else if(event.key === 's' || event.key === 'S'){
    const index = moveStates.indexOf("BACKWARD")
    if(index > -1) moveStates.splice(index, 1)
  } else if(event.key === 'a' || event.key === 'A'){
    const index = moveStates.indexOf("LEFT")
    if(index > -1) moveStates.splice(index, 1)
  } else if(event.key === 'd' || event.key === 'D'){
    const index = moveStates.indexOf("RIGHT")
    if(index > -1) moveStates.splice(index, 1)
  }
}

// 每帧更新内容
function update() {
  const vectorized = new THREE.Vector3();
  camera.getWorldDirection( vectorized );
  vectorized.y = 0; // 忽略y轴方向
  vectorized.normalize();
  const speed = 0.3;
  const distance = 0.1 * speed;
  if(moveStates.includes("FORWARD")){
    camera.position.addScaledVector( vectorized, distance );
    controls.target.addScaledVector( vectorized, distance );
    controls.update()
  }

  if(moveStates.includes("BACKWARD")){
    camera.position.addScaledVector( vectorized, -distance );
    controls.target.addScaledVector( vectorized, -distance );
    controls.update()
  }

  const sideVectorized = new THREE.Vector3();
  sideVectorized.crossVectors( camera.up, vectorized );
  sideVectorized.normalize();

  if(moveStates.includes("LEFT")){
    camera.position.addScaledVector( sideVectorized, distance );
    controls.target.addScaledVector( sideVectorized, distance );
    controls.update()
  }

  if(moveStates.includes("RIGHT")){
    camera.position.addScaledVector( sideVectorized, -distance );
    controls.target.addScaledVector( sideVectorized, -distance );
    controls.update()
  }
}
///--------------------------------------------------------------------

// 渲染场景
function animations() {
  stats.update();
  update(); //
  render();
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