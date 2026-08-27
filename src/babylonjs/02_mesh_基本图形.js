import * as BABYLON from "@babylonjs/core";
import { SimpleMaterial } from "@babylonjs/materials"
import datgui from "dat.gui"
import Stats from "stats.js"

const gui = new datgui.GUI()
const stats = new Stats()
// 性能监视工具
document.body.appendChild(stats.domElement);
// 创建canvas元素
const canvasElement = document.createElement("canvas");
canvasElement.id = "renderCanvas";
canvasElement.style.width = window.innerWidth + "px";
canvasElement.style.height = window.innerHeight + "px";
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;
document.querySelector("#app").appendChild(canvasElement);

// 创建引擎
const engine = new BABYLON.Engine(canvasElement, true)

const scene = initScene()
///------------------------------------------------------------------

// 盒子模型
const cube = BABYLON.MeshBuilder.CreateBox("cube")

// tilebox 
const tilebox = BABYLON.MeshBuilder.CreateBox("tilebox")
tilebox.position.set(-2, 0, 0)

// 球体
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 })
sphere.position.set(2, 0, 0)

// 圆柱体
const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { diameter: 1, height: 1 })
cylinder.position.set(0, 0, 2)

// 胶囊
const capsule = BABYLON.MeshBuilder.CreateCapsule("capsule", { radius: 0.25, height: 1 })
capsule.position.set(0, 0, -2)

// 平面
// sideOrientation - 侧面朝向
const plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE })
plane.position.set(-2, 0, 2)

// 圆 
// arc -弧度
// radius -半径
// tessellation -分段数
const disc = BABYLON.MeshBuilder.CreateDisc("disc", { arc: 0.75, radius: 0.5, tessellation: 64, sideOrientation: BABYLON.Mesh.DOUBLESIDE })
disc.position.set(2, 0, -2)

// 甜甜圈
// diameter - 外径
// thickness - 厚度
// tessellation -分段数
const torus = BABYLON.MeshBuilder.CreateTorus("torus", { diameter: 1, thickness: 0.2, tessellation: 64 })
torus.position.set(2, 0, 2)

// 扭结
// radius - 半径
// tube - 管道半径
// radialSegments - 径向分段数
// tubularSegments - 管道分段数
// p - 扭结数
// q - 扭结数
// sideOrientation - 侧面朝向
const knot = BABYLON.MeshBuilder.CreateTorusKnot("knot", { radius: 0.5, tube: 0.1, radialSegments: 64, tubularSegments: 64, p: 5 })
knot.position.set(-2, 0, -2)

///------------------------------------------------------------------
function animate() {
  // 更新引擎
  engine.runRenderLoop(() => {
    scene.render()
    stats.update()
  })
}

animate()

// 初始化场景
function initScene() {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  // 创建相机
  const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
  camera.setPosition(new BABYLON.Vector3(0, 5, -5));
  camera.attachControl(canvasElement, true);
  // 调整控制器缩放级别
  camera.wheelDeltaPercentage = 0.01;
  // 创建环境光源
  const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(1, 1, 0), scene);
  hemisphericLight.intensity = 0.7;
  // 创建平行光
  // const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0, -1, 0), scene);
  // directionalLight.position = new BABYLON.Vector3(10, 10, 10);
  // directionalLight.intensity = 0.3;
  // directionalLight.shadowMinZ = 1
  // directionalLight.shadowMaxZ = 1000
  // directionalLight.shadowEnabled = true
  return scene
}