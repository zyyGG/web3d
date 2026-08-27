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
/**@type {BABYLON.ArcRotateCamera} */
let camera= null;
/**@type {BABYLON.HemisphericLight} */
let hemisphericLight = null;
/**@type {BABYLON.DirectionalLight} */
let directionalLight = null;
/**@type {BABYLON.ShadowGenerator} */
let shadowGenerator = null;
const scene = initScene()

// 物理世界
const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
const hk = await new HavokPhysics();
const physicsPlugin = new BABYLON.HavokPlugin(true, hk);
scene.enablePhysics(gravityVector, physicsPlugin);


const config = {
  physicsShow: false,
}
const physicsBodys = []
const physicsGui = gui.addFolder("物理世界")
physicsGui.add(config, "physicsShow").onChange((value) => {
    if(value == true) {
      // 清理旧的物理体
      for (const body of physicsBodys) {
        body.dispose();
      }
      const physicsViewer = new BABYLON.PhysicsViewer();
      for (const mesh of scene.rootNodes) {
        if(mesh.physicsBody) {
          const viewerShape = physicsViewer.showBody(mesh.physicsBody);
          physicsBodys.push(viewerShape);
        }
      }
    } else {
      // 清理物理体
      for (const body of physicsBodys) {
        body.dispose();
      }
      physicsBodys.length = 0; // 清空数组
    }
  });
physicsGui.open();


///------------------------------------------------------------------
// 其他代码写在这里
const cube = BABYLON.MeshBuilder.CreateBox("cube")
cube.position.set(0, 5, 0)
shadowGenerator.addShadowCaster(cube, true) // 添加阴影投射者

// cube
const cubeShape = new BABYLON.PhysicsShapeBox(
  new BABYLON.Vector3(0, 0, 0), // 中心位置
  BABYLON.Quaternion.Identity(), // 旋转四元数
  new BABYLON.Vector3(1, 1, 1), // 尺寸 size of the box in each direction
  scene,
);
cubeShape.material = {
  friction: 0.5, // 摩擦力
  restitution: 0.2, // 弹性
}
const cubeRigidBody = new BABYLON.PhysicsBody(
  cube,
  BABYLON.PhysicsMotionType.DYNAMIC, // 动态
  false, // 初次启动的是否启用
  scene,
);
cubeRigidBody.shape = cubeShape; // 设置形状
cubeRigidBody.setMassProperties(0.5) // 设置质量

// ground
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
ground.position.set(0, -0.5, 0);
ground.receiveShadows = true; // 接收阴影
shadowGenerator.addShadowCaster(ground, true) // 添加阴影接收者

const groundShape = new BABYLON.PhysicsShapeBox(
  new BABYLON.Vector3(0, 0, 0), // 中心位置
  BABYLON.Quaternion.Identity(), // 旋转四元数
  new BABYLON.Vector3(100, 0.1, 100), // 尺寸 size of the box in each direction
  scene,
)
const groundRigidBody = new BABYLON.PhysicsBody(
  ground,
  BABYLON.PhysicsMotionType.STATIC, // 静态
  false, // 初次启动的是否启用
  scene,
)
groundRigidBody.shape = groundShape; // 设置形状

// sphere
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
sphere.position.set(0, 5, 2);
shadowGenerator.addShadowCaster(sphere, true); // 添加阴影投射者
const sphereShape = new BABYLON.PhysicsShapeSphere(
  new BABYLON.Vector3(0, 0, 0), // 中心位置
  0.5, // 半径
  scene,
);
sphereShape.material = {
  friction: 0.5, // 摩擦力
  restitution: 0.2, // 弹性
}
const sphereRigidBody = new BABYLON.PhysicsBody(
  sphere,
  BABYLON.PhysicsMotionType.DYNAMIC, // 动态
  false, // 初次启动的是否启用
  scene,
);
sphereRigidBody.shape = sphereShape; // 设置形状

// 圆柱体
const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, scene);
cylinder.position.set(2, 5, 0);
shadowGenerator.addShadowCaster(cylinder, true); // 添加阴影投射者
const cylinderShape = new BABYLON.PhysicsShapeCylinder(
  new BABYLON.Vector3(0, -1, 0), // 点A
  new BABYLON.Vector3(0, 1, 0), // 点B
  0.5, // 半径
  scene,
);
const cylinderRigidBody = new BABYLON.PhysicsBody(
  cylinder,
  BABYLON.PhysicsMotionType.DYNAMIC, // 动态
  false, // 初次启动的是否启用
  scene,
);
cylinderRigidBody.shape = cylinderShape; // 设置形状

// 胶囊 Capsule
const capsule = new BABYLON.MeshBuilder.CreateCapsule("capsule", { height: 2, radius: 0.5, diameter: 1 }, scene)
capsule.position.set(-2, 5, 0)
shadowGenerator.addShadowCaster(capsule, true)
const capsuleShape = new BABYLON.PhysicsShapeCapsule(
  new BABYLON.Vector3(0, -0.5, 0), // 点A
  new BABYLON.Vector3(0, 0.5, 0), // 点B
  0.5, // 半径
  scene,
)
const capsuleRigidBody = new BABYLON.PhysicsBody(
  capsule,
  BABYLON.PhysicsMotionType.DYNAMIC,
  false,
  scene,
)
capsuleRigidBody.shape = capsuleShape


/**
 * 这里记载几个常用的物理形状
 * 1. box
 * 2. box,
 * 3. sphere 球体
 * 4. cylinder 圆柱
 * 5. capsule 胶囊
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
  camera.setPosition(new BABYLON.Vector3(0, 5, -5));
  camera.attachControl(canvasElement, true);

  // 调整控制器缩放级别
  camera.wheelDeltaPercentage = 0.01;

  // 创建环境光源
  hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(1, 1, 0), scene);
  hemisphericLight.intensity = 0.7;
  
  // // 创建平行光
  directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -1, -1), scene);
  directionalLight.position = new BABYLON.Vector3(10, 10, 10);
  directionalLight.intensity = 0.3;
  directionalLight.shadowMinZ = 1 // 阴影最小深度
  directionalLight.shadowMaxZ = 1000 // 阴影最大深度
  directionalLight.shadowEnabled = true

  shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.usePoissonSampling = true;
  
  animate()
  return scene
}