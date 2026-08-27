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

// 阴影相关
const shadowGenerator = new BABYLON.ShadowGenerator(1024, scene.getLightByName("directionalLight"));
shadowGenerator.bias = 0.0001; // 阴影偏移
shadowGenerator.usePercentageCloserFiltering = true; // 使用百分比更接近过滤
shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH; // 阴影质量
shadowGenerator.useKernelBlur = true; // 使用内核模糊
// 地面
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
ground.receiveShadows = true;
shadowGenerator.addShadowCaster(ground, true); // 添加阴影接收者
ground.position.y = -0.5;
const groundShape = new BABYLON.PhysicsShapeBox(
  new BABYLON.Vector3(0, 0, 0), // 中心位置
  BABYLON.Quaternion.Identity(), // 旋转四元数
  new BABYLON.Vector3(100, 0.1, 100), // 尺寸 size of the box in each direction
  scene,
)
// groundShape.material = new BABYLON.PhysicsMaterial("groundMaterial", 0.5, 0.5); // 摩擦力和弹性
const groundRigidBody = new BABYLON.PhysicsBody(
  ground,
  BABYLON.PhysicsMotionType.STATIC, // 静态
  false, // 初次启动的是否启用
  scene,
)
groundRigidBody.shape = groundShape; // 设置形状
groundRigidBody.setMassProperties({
  mass: 0,
});

const box1 = BABYLON.MeshBuilder.CreateBox("box1", { size: 1 }, scene);
shadowGenerator.addShadowCaster(box1, true); // 添加阴影投射者
box1.position.set(0, 5, 0);
const box1Shape = new BABYLON.PhysicsShapeBox(
  new BABYLON.Vector3(0, 0, 0), // 中心位置
  BABYLON.Quaternion.Identity(), // 旋转四元数
  new BABYLON.Vector3(1, 1, 1), // 尺寸 size of the box in each direction
  scene,
);
box1Shape.material = {
  friction: 0.5, // 摩擦力
  restitution: 0.2, // 弹性
}
const box1RigidBody = new BABYLON.PhysicsBody(
  box1,
  BABYLON.PhysicsMotionType.DYNAMIC, // 动态
  false, // 初次启动的是否启用
  scene,
);
box1RigidBody.shape = box1Shape; // 设置形状
box1RigidBody.setMassProperties(0.5) // 设置质量

setTimeout(() => {
  console.log("box1RigidBody", box1RigidBody);
  box1RigidBody.setTargetTransform(new BABYLON.Vector3(0, 0.002, 0), BABYLON.Quaternion.Identity(), true);
}, 2000);


/**
 * 总结： 如何创建一个完整的刚体
 * 1. 肯定是需要mesh
 * 2. 创建物理形状 PhysicsShapeBox
 *    - 需要传入中心位置、旋转四元数、尺寸
 * 3. 创建物理刚体 PhysicsBody
 *    - 需要传入mesh、物理运动类型（静态、动态、运动）、是否初次启用
 * 4. 将物理形状赋值给物理刚体的shape属性
 * 
 * 当我们需要移除一个刚体的时候，可以使用dispose方法来销毁物理刚体, 但是形状并不会自动销毁。
 * 我们依然选哟手动再调用shape.dispose()来销毁物理形状。
 * 
 * 物理形状是可以赋值给多个物理刚体的。
 * 
 */


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
  const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.7;
  
  // // 创建平行光
  const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0, -1, 1), scene);
  directionalLight.intensity = 0.3;
  directionalLight.shadowEnabled = true
  
  animate()
  return scene
}