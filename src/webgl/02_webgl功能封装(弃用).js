import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { WebGL } from './webgl/utils';

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
const geometry = new WebGL.Geometry([
  0, 0, 0,
  50, 0, 0,
  0, 50, 0,
  0, 50, 0,
  50, 0, 0,
  50, 50, 0,
])

const shape = new WebGL.Mesh(geometry, new WebGL.BaseMaterial({
  color: { r: 1, g: 0, b: 1 }
}))
shape.position.x = 100;
scene.add(shape);

renderer.render(scene)
// 更新画布的操作
renderer.animation(() => {
  // renderer.render(scene); // 更新目标场景
  stats.update();
})