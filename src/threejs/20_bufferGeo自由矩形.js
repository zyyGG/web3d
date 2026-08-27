import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0x000000, 1) // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop( animate );
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

createCircularRing(new THREE.Vector3(0,0,0), 1, 0.5, 0xffffff); // 创建一个圆环

function createCircularRing(position, outRadius, inRadius, color) {
  // const startAngle = 0; // 起始角度
  // const endAngle = 90; // 结束角度
  // const lines = new THREE.Shape()
  // lines.moveTo(position.x + outRadius, position.y); // 移动到圆心
  // lines.absarc(position.x, position.y, outRadius, startAngle / 180 * Math.PI , endAngle / 180 * Math.PI, false); // 外圆
  // // 这里是为了解决圆环的内外圆连接处的线条不连贯的问题
  // lines.lineTo(
  //   (position.x + inRadius) * Math.cos(endAngle / 180 * Math.PI) - position.y * Math.sin(endAngle / 180 * Math.PI), 
  //   (position.x + inRadius) * Math.sin(endAngle / 180 * Math.PI) + position.y * Math.cos(endAngle / 180 * Math.PI)
  // ); // 移动到内圆
  // lines.absarc(position.x, position.y, inRadius, endAngle / 180 * Math.PI, startAngle / 180 * Math.PI, true); // 内圆
  // // 闭合形状（连回起点）
  // lines.lineTo(position.x + outRadius, position.y);
  const geometry = new THREE.BufferGeometry(); // 连接两个圆环的点位
  geometry.setAttribute( 'position', new THREE.BufferAttribute( vertexRect(2, 2, 2), 3 ) );

  // const extrudeGeometry = new THREE.ExtrudeGeometry(lines, {
  //   steps: 1, // 分段数
  //   depth: 0.1, // 圆环的厚度
  //   depthSegments: 2, // 圆环的厚度分段数
  //   bevelEnabled: false, // 是否启用斜角
  // });
  const material = new THREE.MeshBasicMaterial({ 
    color: color, 
    wireframe: false,
   });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.set(position.x, position.y, position.z);
  ring.rotation.x = Math.PI / 2; // 绕x轴旋转90度
  scene.add(ring);
}

// 竖着连接的矩形
function vertexRect(width, height, segment){
  const points = []
  // 基本思路，很简单，手动创建顶点
  // 顶点规律，起始点和终点只出现一次，第二个点和倒数第二个点只出现两次，其他点复用三次
  
  // 创建一个双矩形拼接的图形
  // 双矩形有6个点
  // 按照上面的逻辑，实际是2 * 1 + 2 * 2 + ( 6 - 4) * 3 = 12个描述的点
  const rectWidth = width
  const rectHeight = height
  for(let i = 0; i < segment; i++){
    const point1 = [rectWidth, i * rectHeight, 0]
    const point2 = [0, i * rectHeight + rectHeight, 0]
    const point3 = [rectWidth, i * rectHeight + rectHeight, 0]
    const point4 = [0, i * rectHeight, 0]

    points.push(point1)
    points.push(point4)
    points.push(point2)

    points.push(point1)
    points.push(point2)
    points.push(point3)
  }
  return new Float32Array(points.flat()) // 转换为Float32Array
}




///--------------------------------------------------------------------


// 渲染场景
function animate() {
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