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
renderer.setClearColor(0x000000, 1) // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop( animations );
document.querySelector("#app").appendChild(renderer.domElement)

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
camera.position.set(0, 0, 5)
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
// directionalLight.position.set(0, 10, 10)
// scene.add(directionalLight)

// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
// scene.add(gridHelper)

///--------------------------------------------------------------------
// 创建标题描述文本
const title = document.createElement('div')
title.style.position = 'absolute'
title.style.bottom = '10px'
title.style.left = '0px'
title.style.width = '100%'
title.style.textAlign = 'center'
title.style.color = '#fff'
title.style.fontSize = '20px'
document.body.appendChild(title)
// 主要代码写在这里
const config = {
  type: 7,
}

let line = updateLine(config.type)
scene.add(line)

gui.add(config, 'type', [1,2,3,4,5,6,7,8,9]).name('线条类型').onChange((value) => {
  scene.remove(line)
  line = updateLine(value)
  scene.add(line)
})


function updateLine(type){

  if(type == 1){
    title.innerHTML = '线段'
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      1, 1, 0,
      2, 2, 0,
    ], 3))
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  } 
  else if(type == 2){
    title.innerHTML = '曲线'
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.5, 0),
      new THREE.Vector3(1.5, 0.5, 0),
      new THREE.Vector3(2, 0, 0),
    ])
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  } 
  else if(type == 3){
    title.innerHTML = '使用arccurve绘制圆'
    const curve = new THREE.ArcCurve(0, 0, 1, 0, Math.PI * 1.5, false)
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  } 
  
  // 
  else if(type == 4){
    title.innerHTML = '使用catmullromcurve绘制曲线, 这是一个三次样条曲线，可以构建平滑的曲线'
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(2, -1, 0),
      new THREE.Vector3(3, 0, 0),
      new THREE.Vector3(4, 2, 0),
      new THREE.Vector3(5, -1, 0),
      new THREE.Vector3(6, 0, 0),
    ])
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }

  // 
  else if(type == 5){
    title.innerHTML = "使用二维二次贝塞尔曲线绘制曲线， 三维QuadraticBezierCurve3同理"
    const curve = new THREE.QuadraticBezierCurve(
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1.5, 1),
      new THREE.Vector2(3, 0)
    )
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }

  // 使用二维三次贝塞尔曲线绘制曲线， 三维的同理
  else if(type == 6){
    title.innerHTML = "使用二维三次贝塞尔曲线绘制曲线， 三维的CubicBezierCurve3同理"
    const curve = new THREE.CubicBezierCurve(
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(2, -1),
      new THREE.Vector2(3, 0)
    )

    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }

  // 
  else if(type == 7){
    title.innerHTML = "椭圆曲线"
    // 最后一个是按照中心点旋转的角度
    const curve = new THREE.EllipseCurve(0, 0, 1, 0.5, 0, Math.PI * 1.5, false, Math.PI * 0.1)
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }

  else if(type == 8){
    title.innerHTML = "二维线段曲线，三维只需要去掉z轴"
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 1, 0)
    )
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }

  else if(type == 9){
    title.innerHTML = "样条曲线， 其实就是catmullromcurve的的二维参数"
    const curve = new THREE.SplineCurve([
      new THREE.Vector3(0, 0 ),
      new THREE.Vector3(1, 1 ),
      new THREE.Vector3(2, -1 ),
      new THREE.Vector3(3, 0),
      new THREE.Vector3(4, 2 ),
      new THREE.Vector3(5, -1),
      new THREE.Vector3(6, 0),
    ])
    const points = curve.getPoints(100)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }
  
  else {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      1, 1, 0,
      2, 2, 0,
    ], 3))
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff })
    const line = new THREE.Line(geometry, material)
    return line
  }
}




///--------------------------------------------------------------------


// 渲染场景
function animations() {
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