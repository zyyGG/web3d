import * as BABYLON from "@babylonjs/core";
import * as GUI from '@babylonjs/gui'

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
// 其他代码写在这里
const cube = BABYLON.MeshBuilder.CreateBox("cube")
cube.position.set(0, 0, 0)

// 创建全屏的gui
const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
// 创建按钮
const button = GUI.Button.CreateSimpleButton("button1", "点击")
button.width = "150px";
button.height = "40px";
button.color = "white";
button.cornerRadius = 20; // 圆角
button.background = "green";
button.top = "20px";
button.left = "20px";
button.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
button.onPointerUpObservable.add(function() {
    alert("you did it!");
});
advancedTexture.addControl(button);

// 空node
const node = new BABYLON.TransformNode("node")
node.position.set(0, 0, 0)


///------------------------------------------------------------------
function animate() {
  // 更新引擎
  engine.runRenderLoop(() => {
    scene.render()
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
  const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(1, 1, 0), scene);
  hemisphericLight.intensity = 0.7;
  // 创建平行光
  const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0, -1, 0), scene);
  directionalLight.position = new BABYLON.Vector3(10, 10, 10);
  directionalLight.intensity = 0.3;
  directionalLight.shadowMinZ = 1
  directionalLight.shadowMaxZ = 1000
  directionalLight.shadowEnabled = true
  animate()
  return scene
}