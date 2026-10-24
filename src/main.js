import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { TilesRenderer } from "3d-tiles-renderer";
import { CesiumIonAuthPlugin, GLTFExtensionsPlugin } from "3d-tiles-renderer/plugins";
import { DRACOLoader } from "three/examples/jsm/Addons.js";

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
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000)
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
  const storeParams = JSON.parse(localStorage.getItem('helpControls'));
  if(storeParams) {
    helpParams = storeParams
  } else {
    helpParams = helpParams
  }
  gridHelper.visible = helpParams.gridHelper;
  directionalLightHelper.visible = helpParams.directionalLightHelper;
  axesHelper.visible = helpParams.axesHelper;
  helpControls.add( helpParams, 'gridHelper' ).name('grid辅助器').onChange(value => {gridHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'directionalLightHelper' ).name('平行光辅助器').onChange(value => {directionalLightHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'axesHelper' ).name('坐标辅助器').onChange(value => {axesHelper.visible = value; saveControlHelps()} );
}

loadControlHelps()

///--------------------------------------------------------------------

// 经纬度 -> ECEF (WGS84, 不需要引入Cesium)
function lonLatToECEF(lonDeg, latDeg, height = 0) {
  const a = 6378137.0;
  const e2 = 0.0066943799901413165;
  const lon = (lonDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  return new THREE.Vector3(
    (N + height) * Math.cos(lat) * Math.cos(lon),
    (N + height) * Math.cos(lat) * Math.sin(lon),
    (N * (1 - e2) + height) * Math.sin(lat),
  );
}

const LON = 114.168754;
const LAT = 30.504312;
const eye = lonLatToECEF(LON, LAT, 0);
camera.up.copy(eye).normalize()
camera.near = 1
camera.far = 50000;
camera.updateProjectionMatrix()
camera.position.copy(lonLatToECEF(LON, LAT, 600));
controls.target.copy(eye);
controls.update()

// 3D tiles
const tiles = new TilesRenderer();
tiles.registerPlugin(
  new CesiumIonAuthPlugin({
    apiToken: import.meta.env.VITE_CESIUM_TOKEN,
    assetId: 96188,
  })
)
tiles.registerPlugin(
  new GLTFExtensionsPlugin({
    dracoLoader: new DRACOLoader().setDecoderPath("/draco")
  })
)
tiles.setCamera(camera)
tiles.setResolutionFromRenderer(camera, renderer)
tiles.errorTarget = 12; // 越小越精细、越卡
scene.add(tiles.group);

// 绘制材质颜色
function paintTiles() {
  tiles.group.traverse((obj) => {
    if (!obj.isMesh || obj.userData.__painted) return;
    obj.userData.__painted = true;
    obj.material = new THREE.MeshStandardMaterial({
      color: 0xdfe9f2,
      roughness: 0.9,
      metalness: 0.05,
    })
  })

}



///--------------------------------------------------------------------


// 渲染场景
function animations() {

  camera.updateMatrixWorld(); // 更新世界矩阵
  if(tiles) tiles.update()
  controls.update() // 更新控制器
  stats.update();
  paintTiles();
  renderer.render(scene, camera)
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