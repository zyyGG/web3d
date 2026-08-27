import * as BABYLON from "@babylonjs/core";
import GUI from "dat.gui"
import Stats from "stats.js";
// 创建canvas元素
const canvasElement = document.createElement("canvas");
canvasElement.id = "renderCanvas";
canvasElement.style.width = window.innerWidth + "px";
canvasElement.style.height = window.innerHeight + "px";
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;
document.querySelector("#app").appendChild(canvasElement);

const gui = new GUI.GUI()
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: memory
document.body.appendChild(stats.dom);

// 创建引擎
const engine = new BABYLON.Engine(canvasElement, true)
const scene = initScene()
///------------------------------------------------------------------
// 其他代码写在这里
const cube = BABYLON.MeshBuilder.CreateBox("cube")
cube.position.set(-1, 0, 0)
cube.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI / 4)
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 })
ground.position.set(0, -0.5, 0)
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 0.5 })
sphere.position.set(0, 0, 1)

// 环境光
// 这个光是从上往下照射的，
const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);
hemisphericLight.intensity = 0.7;
// 基础色
hemisphericLight.diffuse = new BABYLON.Color3(0, 1, 0);
// 高亮的反光色
hemisphericLight.specular = new BABYLON.Color3(1, 0, 0);
// 地面的反光颜色
hemisphericLight.groundColor = new BABYLON.Color3(0, 0, 1);

///------------------------------------------------------------------
function animate() {
  // 更新引擎
  engine.runRenderLoop(() => {
    scene.render()
    stats.update()
  })
}

// 初始化场景
function initScene() {
  
  // 创建场景
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

  // 创建相机
  const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
  camera.setPosition(new BABYLON.Vector3(0, 5, -5));
  camera.attachControl(canvasElement, true);

  // 调整控制器缩放级别
  camera.wheelDeltaPercentage = 0.01;

  // 创建环境光源
  // const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(1, 1, 0), scene);
  // hemisphericLight.intensity = 0.7;
  
  // // 创建平行光
  // const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0, -1, 0), scene);
  // directionalLight.position = new BABYLON.Vector3(10, 10, 10);
  // directionalLight.intensity = 0.3;
  // directionalLight.shadowMinZ = 1
  // directionalLight.shadowMaxZ = 1000
  // directionalLight.shadowEnabled = true

  animate()
  return scene
}