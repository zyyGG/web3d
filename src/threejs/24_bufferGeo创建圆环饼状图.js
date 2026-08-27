import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { FontLoader } from 'three/addons/loaders/FontLoader.js';



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


const data = {
  "Spinach": 128,
  "Carrot": 57,
  "Tomato": 89,
  "Cucumber": 34,
  "Potato": 77,
  "Onion": 40,
  "Scallion": 20,
  "Garlic": 60,
  "Lettuce": 15,
}

const sum = Object.values(data).reduce((a, b) => a + b, 0) // 计算总和
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008080'] // 颜色数组
const dataArr = Object.entries(data).map((item, index) => {
  return {
    name: item[0],
    value: item[1],
    color: colors[index % colors.length], // 颜色
    percent: (item[1] / sum * 100) // 百分比
  }
})

function createRingPie(inRadius, outRadius, depth, color, percent, rotation = 0){
  const startAngle = 0 // 起始角度
  const endAngle = percent / 100 * 360 // 结束角度
  const geometry = new THREE.BufferGeometry() // 创建圆环
  geometry.setAttribute( 'position', new THREE.BufferAttribute( ringCircle(inRadius, outRadius, depth, endAngle), 3 ) ); // 设置顶点
  geometry.computeVertexNormals()
  const material = new THREE.MeshLambertMaterial({ color: color }) // 创建材质
  const pie = new THREE.Mesh(geometry, material)
  pie.rotation.set(0, 0 , rotation / 180 * Math.PI)
  return pie
}

const pies = []
const labels = []
let rotation = 0
const loader = new FontLoader();
let textMesh = null
let config = {
  lookAtCamera : false
}
gui.add(config, 'lookAtCamera').name('文字朝向摄像机')
loader.load( '/fonts/helvetiker_regular.typeface.json', (font) => {
  // 文本材质
  const matLite = new THREE.MeshBasicMaterial( {
    color: 0xffffff,
  });
  const inRadius = 0.8 // 内半径
  const outRadius = 1 // 外半径
  for(let i = 0; i < dataArr.length; i++){
    const item = dataArr[i]
    const pie = createRingPie(inRadius, outRadius, 0.3, item.color, item.percent, item.percent / 100 * 360)
    pie.rotation.set(0, 0 , (rotation / 100 * 360) / 180 * Math.PI)
    pies.push(pie)
    scene.add(pie)
    
    // 创建文本
    const message = item.name
    const shapes = font.generateShapes( message, 0.05 );
    const textgeo = new THREE.ShapeGeometry( shapes );
    textgeo.center()
    textMesh = new THREE.Mesh( textgeo, matLite );
    const x = (inRadius + ((outRadius - inRadius) / 2)) * Math.cos((rotation + (item.percent / 2)) / 100 * 360 / 180 * Math.PI) // x坐标
    const y = (inRadius + ((outRadius - inRadius) / 2)) * Math.sin((rotation + (item.percent / 2)) / 100 * 360 / 180 * Math.PI) // y坐标
    const z = 0.01 + 0.3 // z坐标
    textMesh.position.set(x, y, z)

    labels.push(textMesh)
    scene.add( textMesh );

    rotation += item.percent
  }
})

// scene.add(...pies) // 添加到场景中

// 竖着连接的矩形
// segment越大，越平滑
function ringCircle(inRadius, outRadius, depth, endAngle){
  // 动态计算segment
  const segment = 2 * Math.ceil(endAngle / 10)  // 分割的数量
  const points = []
  const angle = endAngle / segment // 每个点的角度
  // 按照segment分割内外圆环的点位
  for(let i = 0; i < segment; i++){
    const ration = i * angle / 180 * Math.PI // 角度转弧度
    const nextRation = (i + 1) * angle / 180 * Math.PI // 下一个点的弧度
    const point1 = [0 * Math.cos(ration) + outRadius * Math.cos(ration), 0 * Math.sin(ration) + outRadius * Math.sin(ration), 0] // 外圆环的点
    const point2 = [0 * Math.cos(nextRation) + inRadius * Math.cos(nextRation), 0 * Math.sin(nextRation) + inRadius * Math.sin(nextRation), 0]
    const point3 = [0 * Math.cos(nextRation) + outRadius * Math.cos(nextRation), 0 * Math.sin(nextRation) + outRadius * Math.sin(nextRation), 0]
    const point4 = [0 * Math.cos(ration) + inRadius * Math.cos(ration), 0 * Math.sin(ration) + inRadius * Math.sin(ration), 0] // 内圆环的点

    const point5 = [0 * Math.cos(ration) + outRadius * Math.cos(ration), 0 * Math.sin(ration) + outRadius * Math.sin(ration), depth]
    const point6 = [0 * Math.cos(nextRation) + inRadius * Math.cos(nextRation), 0 * Math.sin(nextRation) + inRadius * Math.sin(nextRation), depth]
    const point7 = [0 * Math.cos(nextRation) + outRadius * Math.cos(nextRation), 0 * Math.sin(nextRation) + outRadius * Math.sin(nextRation), depth]
    const point8 = [0 * Math.cos(ration) + inRadius * Math.cos(ration), 0 * Math.sin(ration) + inRadius * Math.sin(ration), depth] // 内圆环的点

     // top面
     points.push(point1)
     points.push(point4)
     points.push(point2)
     points.push(point1)
     points.push(point2)
     points.push(point3)
     // right面
     points.push(point5)
     points.push(point1)
     points.push(point3)
     points.push(point5)
     points.push(point3)
     points.push(point7)
     // bottom面
     points.push(point8)
     points.push(point5)
     points.push(point7)
     points.push(point8)
     points.push(point7)
     points.push(point6)
     // left面
     points.push(point4)
     points.push(point8)
     points.push(point6)
     points.push(point4)
     points.push(point6)
     points.push(point2)
    //  // front面
    //  points.push(point3)
    //  points.push(point2)
    //  points.push(point6)
    //  points.push(point3)
    //  points.push(point6)
    //  points.push(point7)
    //  // back面
    //  points.push(point5)
    //  points.push(point8)
    //  points.push(point4)
    //  points.push(point5)
    //  points.push(point4)
    //  points.push(point1)
  }
  return new Float32Array(points.flat()) // 转换为Float32Array
}
///--------------------------------------------------------------------


// 渲染场景
let delta = 0
function animate() {
  delta += 0.01
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  // textMesh && textMesh.lookAt(camera.position) // 让文字始终朝向摄像机
  // if(config.lookAtCamera){
  //   labels.forEach(item => {
  //     item.lookAt(camera.position) // 让文字始终朝向摄像机
  //   })
  // }
  // labels.forEach(item => {
  //   const scale = Math.sin(delta * 4) * 0.1 + 1 // 缩放
  //   item.scale.set(scale,scale,scale)
  // })
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