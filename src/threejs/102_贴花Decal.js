import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { DecalGeometry } from "three/examples/jsm/Addons.js";



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

  

// 主要代码写在这里
const geometry = new THREE.CapsuleGeometry(1, 2, 16, 32);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00});
const cylinder = new THREE.Mesh(geometry, material);
scene.add(cylinder);
const cylinderWireframe = new THREE.WireframeGeometry(geometry);
const line = new THREE.LineSegments(cylinderWireframe);
line.material.depthTest = true;
line.material.depthWrite = false;
line.material.polygonOffset = true;
line.material.polygonOffsetFactor = -4;
// scene.add(line);

// 贴花纹理：复用一次 + 设置 sRGB 色彩空间（不设颜色会偏淡/偏暗）
const decalTexture = new THREE.TextureLoader().load('/textures/decal-diffuse.png');
decalTexture.colorSpace = THREE.SRGBColorSpace;

const decalMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  map: decalTexture,
});

// const decalPosition = new THREE.Vector3(0, 0, 1);
// const decalRotation = new THREE.Euler(0, 0, 0);
// const decalScale = new THREE.Vector3(1, 1, 1);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let count = 0

// 贴花参数：size 越小，顶部半球曲面上的拉伸越不明显
const decalParams = { size: 0.4 }
gui.add(decalParams, 'size', 0.05, 1, 0.05).name('贴花大小')

window.addEventListener('click', (event) => {
  // 将鼠标点击位置转换为归一化设备坐标（NDC）
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(cylinder);
  if (intersects.length > 0) {
    const intersect = intersects[0];

    // 法线转到世界空间（cylinder 当前无变换，加上更稳健）
    const normal = intersect.face.normal.clone().transformDirection(cylinder.matrixWorld);

    // 选一个与法线不平行的 up，避免顶部/底部 lookAt 退化导致贴花方向错乱
    const up = Math.abs(normal.y) > 0.99
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);

    const decalPosition = intersect.point.clone();
    const decalLookAtMatrix = new THREE.Matrix4().lookAt(decalPosition, decalPosition.clone().add(normal), up);
    // 源代码只接受欧拉, 这里将 Matrix4 转换为欧拉角
    const decalRotation = new THREE.Euler().setFromRotationMatrix(decalLookAtMatrix); 

    createDecal(cylinder, decalPosition, decalRotation);
  }
})

function createDecal(mesh, position, rotation) {
  count++

  // size.x/y 决定贴花在曲面上的覆盖范围，越小拉伸越轻；size.z 是投影深度，不影响 XY 拉伸
  const size = new THREE.Vector3(decalParams.size, decalParams.size, 1);
  const geometry = new DecalGeometry(mesh, position, rotation, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    // polygonOffsetUnits: -1 * count,
    // renderOrder: count,
    transparent: true,
    map: decalTexture,
    depthWrite: false, // 关闭深度写入, 防止相互重叠闪烁
  });
  const decalMesh = new THREE.Mesh(geometry, material);
  // scene.add(decalMesh);
  cylinder.attach(decalMesh); // 将贴花附加到圆柱体上，这样它会随圆柱体一起旋转和移动
}

gsap.to(cylinder.rotation, {
  x: Math.PI * 2,
  y: Math.PI * 2,
  duration: 10,
  repeat: -1,
  ease: "linear"
})




///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  // cylinder.rotation.x += 0.01
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