import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { WebGL } from './webgl/utils';
import BoxGeometry from "./webgl/utils/Geometry/BoxGeometry"; // 引入BoxGeometry
import PerspectiveCamera from './webgl/utils/Camera/PerspectiveCamera.js'

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

const width = window.innerWidth
const height = window.innerHeight
const renderer = new WebGL.Renderer(width, height);
document.getElementById('app').appendChild(renderer.domElement);

//创建scene
const scene = new WebGL.Scene();

const camera = new PerspectiveCamera(50, width / height, 0.1, 1000);
camera.position.set(0, 10, 10);

// 创建形状
const shape = new WebGL.Mesh(
  new BoxGeometry(1, 1, 1), 
  new WebGL.BaseMaterial({
    color: { r: 1, g: 0, b: 1 }
  })
)
scene.add(shape);
shape.position.x = -5;
shape.position.y = -3;
shape.scale.set(1, 0.0, 1);

// gsap.to(shape.position, {
//   x: 5,
//   duration: 2,
//   ease: "power1.inOut",
//   yoyo: true,
//   repeat: -1,
// })

gsap.to(shape.rotation, {
  y: 360,
  x: 360,
  duration: 1,
  ease: "none",
  yoyo: false,
  repeat: -1,
})

renderer.render(scene, camera);
// 更新画布的操作
renderer.animation(() => {
  renderer.render(scene, camera);
  stats.update();
})