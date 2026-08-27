import * as THREE from "three"
import GUI from "three/addons/libs/lil-gui.module.min.js"

// 创建基础环境
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()

// 处理高分屏
renderer.setPixelRatio(window.devicePixelRatio)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()

renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector("#app").appendChild(renderer.domElement)

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: "rgb(252, 255, 204)" } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

// 渲染场景
function animate() {
  renderer.render(scene, camera)
}
//循环渲染
renderer.setAnimationLoop( animate );

// 创建gui
const gui = new GUI()
gui.add(cube.rotation, "x", 0, Math.PI * 2).name("旋转X轴")
gui.add(cube.rotation, "y", 0, Math.PI * 2).name("旋转Y轴")
gui.add(cube.rotation, "z", 0, Math.PI * 2).name("旋转Z轴")

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