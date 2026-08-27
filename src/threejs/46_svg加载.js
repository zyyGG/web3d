import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"
import { SVGLoader } from "three/examples/jsm/Addons.js";



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0xcccccc, 1) // 设置背景色
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

///--------------------------------------------------------------------
// 主要代码写在这里



const loader = new SVGLoader();
const config = {
  url: '/svg/test1.svg',
}

const group = new THREE.Group();
group.scale.multiplyScalar(0.1);
group.position.set(-5, 0, -5);
group.rotation.x = Math.PI / 2;
scene.add(group);

gui.add(config, 'url', {
  'test1': '/svg/test1.svg',
  'test2': '/svg/test2.svg',
  'test3': '/svg/test3.svg',
  'test4': '/svg/test4.svg',
  'test5': '/svg/test5.svg',
}).onChange((value) => {
  group.clear()
  update(value);
})


update(config.url)
function update(url){
  loader.load(url, (data) => {
    const paths = data.paths;
    let renderOrder = 0;
    
    paths.forEach((path) => {
      const fillColor = path.userData.style.fill;
      if(fillColor != 'none' && fillColor != undefined){
          const fillMaterial = new THREE.MeshBasicMaterial( {
          color: new THREE.Color().setStyle( fillColor ),
          opacity: path.userData.style.fillOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        } );

        const shapes = SVGLoader.createShapes( path );

        for ( const shape of shapes ) {

          const geometry = new THREE.ShapeGeometry( shape );
          const mesh = new THREE.Mesh( geometry, fillMaterial );
          mesh.renderOrder = renderOrder++;
          group.add( mesh );
        }
      }
      
      const color = path.userData.style.stroke
      if(color!==undefined){
        const material = new THREE.MeshBasicMaterial({
          color: color || 0x000000,
          side: THREE.DoubleSide,
          depthWrite: false,
          transparent: true,
        });

        // 添加边框
        path.subPaths.forEach((subPath) => {
          const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style)
          if ( geometry ) {
            const mesh = new THREE.Mesh( geometry, material );
            mesh.renderOrder = renderOrder++;
            group.add( mesh );
          }
        });
      }
      
    });
  })
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