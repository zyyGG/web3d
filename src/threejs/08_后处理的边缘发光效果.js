import * as THREE from "three"
import GUI from "three/addons/libs/lil-gui.module.min.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'; // 
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const gui = new GUI()
// 创建基础环境
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()

// 处理高分屏
renderer.setPixelRatio(window.devicePixelRatio)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
document.querySelector("#app").appendChild(renderer.domElement)

renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setClearColor(0xfeffcc)

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

// const pointLight = new THREE.PointLight( 0xffffff, 100 );
// camera.add( pointLight );

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );

// const cube = new THREE.LineSegments( new THREE.EdgesGeometry(geometry),
// new THREE.LineBasicMaterial( { color: 0x00ffff, linewidth: 2 } ) );
// scene.add( cube );


// 世界光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)
// 平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(10, 5, 5)
scene.add(directionalLight)



const params = {
  threshold: 0,
  strength: 0.5,
  radius: 0,
};
const objLoader = new OBJLoader()
objLoader.load("/models/obj2.obj",(object)=>{
  object.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhongMaterial({ color: 0x44aa88, flatShading: true, shininess: 150 })
      const geometry = new THREE.EdgesGeometry(child.geometry, 15);
      const line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 }));
      // child.material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
      // child.material.side = THREE.FrontSide
      scene.add(line)
    }
  })
  scene.add(object)
})


// 后处理
const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

const composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( bloomPass );
composer.addPass( outputPass );

camera.position.z = 5;

// 渲染场景
function animate() {
  renderer.render(scene, camera)
  composer.render();
}
//循环渲染
renderer.setAnimationLoop( animate );

const bloomFolder = gui.addFolder( 'bloom' );

bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {

  bloomPass.threshold = Number( value );

} );

bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {

  bloomPass.strength = Number( value );

} );

gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

  bloomPass.radius = Number( value );

} );

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