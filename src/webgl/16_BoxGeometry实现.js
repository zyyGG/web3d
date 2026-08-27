import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具

import Scene from "./webgl/utils/Scene"
import Renderer from "./webgl/utils/Renderer";
import Camera from "./webgl/utils/Camera/PerspectiveCamera"
import BoxGeometry from "./webgl/utils/Geometry/BoxGeometry"
import SphereGeometry from "./webgl/utils/Geometry/SphereGeometry"
import BaseMaterial from "./webgl/utils/Material/BaseMaterial"
import Mesh from "./webgl/utils/Mesh"

const scene = new Scene();
const renderer = new Renderer(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
document.body.appendChild(renderer.domElement);

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

const cubeGeometry = new BoxGeometry(2, 2, 2, 1);
const cubeMaterial = new BaseMaterial({
  color: { r: 0.2, g: 0.5, b: 1 },
})
const cube = new Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

const params = {
  rotX: 0,
  rotY: 0,
  rotZ: 0,
}
gui.add(params, 'rotX', -360, 360, 0.01).onChange(value => cube.rotation.x = value);
gui.add(params, 'rotY', -360, 360, 0.01).onChange(value => cube.rotation.y = value);
gui.add(params, 'rotZ', -360, 360, 0.01).onChange(value => cube.rotation.z = value);

function animation() {
  requestAnimationFrame(animation);
  stats.update();
  renderer.render(scene, camera);
}

animation()
