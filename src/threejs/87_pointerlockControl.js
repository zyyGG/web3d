import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { ArcballControls } from "three/examples/jsm/Addons.js";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"



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


// 创建基础环境
const scene = new THREE.Scene()

const control = new PointerLockControls( camera, renderer.domElement );

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

const playerState = {
  isJumpling: false,
}
// 主要场景
const MainScene = new THREE.Group()
scene.add( MainScene )
const moveStates = [] // "FORWARD", "BACKWARD", "LEFT", "RIGHT"
initScene() // 初始化场景
initKeyBoardControl() // 初始化键盘控制
initPlayer() // 初始化第一人称控制器




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
    new THREE.BoxGeometry(10, 5, 0.1),
    new THREE.MeshStandardMaterial({color: "#dddddd"})
  )
  wall.position.set(0, 2.5, -5)
  MainScene.add(wall)

  // 重置摄像机位置
  camera.position.set(0, 2, 0)
  camera.lookAt(0, 2, -1)
}

function initPlayer(){
  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({color: "#ff0000"})
  )
  player.position.set(0, 1, -2)
  scene.add( player );

  renderer.domElement.addEventListener('click', () => {
    control.lock();
  });
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
  } else if(event.key === ' ' || event.key === 'Space'){
    moveStates.indexOf("JUMP") === -1 && moveStates.push("JUMP")
  } else if(event.key === 'Shift' || event.key === 'ShiftLeft' || event.key === 'ShiftRight'){
    moveStates.indexOf("SHIFT") === -1 && moveStates.push("SHIFT")
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
  } else if(event.key === ' ' || event.key === 'Space'){
    const index = moveStates.indexOf("JUMP")
    if(index > -1) moveStates.splice(index, 1)
  } else if(event.key === 'Shift' || event.key === 'ShiftLeft' || event.key === 'ShiftRight'){
    const index = moveStates.indexOf("SHIFT")
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
    control.moveForward( distance );
  }

  if(moveStates.includes("BACKWARD")){
    control.moveForward( -distance );
  }

  if(moveStates.includes("LEFT")){
    control.moveRight( -distance );
  }

  if(moveStates.includes("RIGHT")){
    control.moveRight( distance );
  }

  if(moveStates.includes("JUMP")){
    camera.position.y += distance
  }

  if(moveStates.includes("SHIFT")){
    camera.position.y -= distance
  }
  
}
///--------------------------------------------------------------------

// 渲染场景
function animations() {
  // 每一帧都要渲染
  renderer.render(scene, camera)
  // controls.update() // 更新控制器
  stats.update();
  update(); //
  // camera.position.y += 0.01
  // camera.lookAt(0, 0, 0)
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