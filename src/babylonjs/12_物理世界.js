import * as BABYLON from "@babylonjs/core";
import GUI from "dat.gui"
import Stats from "stats.js";
import "@babylonjs/loaders"



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
let camera = null;

// 创建引擎
const engine = new BABYLON.Engine(canvasElement, true)
const scene = initScene()
///------------------------------------------------------------------
// 加载gltf

// 开启碰撞监听的世界

const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
const hk = await new HavokPhysics();
const physicsPlugin = new BABYLON.HavokPlugin(true, hk);
scene.enablePhysics(gravityVector, physicsPlugin);

// 加载mesh
// const container = await BABYLON.ImportMeshAsync("/models/scenes/freescene.glb", scene);

// 创建player , 胶囊
// const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 1, diameter: 1 }, scene);
// player.position.y = 1;

// const playerAggregate = new BABYLON.PhysicsAggregate(player,
//   BABYLON.PhysicsShapeType.CAPSULE,
//   {
//   mass: 1,
//   friction: 0.2, // 摩擦力
//   restitution: 0, // 弹性
// }, scene);

// 地面
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
ground.position.y = -0.5;
const groundAggregate = new BABYLON.PhysicsAggregate(ground,
  BABYLON.PhysicsShapeType.BOX,
  {
  mass: 0,
  friction: 1,
  restitution: 0, // 弹性
}, scene);

// 创建方块
const box1 = BABYLON.MeshBuilder.CreateBox("box1", { size: 1 }, scene);
box1.position.set(0, 1, 0);
const box1Aggregate = new BABYLON.PhysicsAggregate(box1,
  BABYLON.PhysicsShapeType.BOX,
  {
  mass: 1,
  friction: 0.2, // 摩擦力
  restitution: 0, // 弹性
}, scene);







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
  camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
  camera.setPosition(new BABYLON.Vector3(0, 5, 5));
  camera.attachControl(canvasElement, true);


  // 调整控制器缩放级别
  camera.wheelDeltaPercentage = 0.01;

  // 创建环境光源
  const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(1, 1, 0), scene);
  hemisphericLight.intensity = 0.7;
  
  // // 创建平行光
  const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0, -1, 0), scene);
  directionalLight.position = new BABYLON.Vector3(10, 10, 10);
  directionalLight.intensity = 0.3;
  directionalLight.shadowMinZ = 1
  directionalLight.shadowMaxZ = 1000
  directionalLight.shadowEnabled = true
  
  animate()
  return scene
}