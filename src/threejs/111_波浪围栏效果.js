import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import Stats from "three/addons/libs/stats.module.js"; // 性能监视工具
import { gsap } from "gsap";

// 创建gui
const gui = new GUI();
const stats = new Stats();
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio); // 处理高分屏
renderer.setClearColor(0x000000, 1); // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animations);
document.querySelector("#app").appendChild(renderer.domElement);

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
camera.position.set(0, 5, 5);
// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 开启阻尼
controls.dampingFactor = 0.25; // 阻尼系数
controls.enableZoom = true; // 开启缩放
controls.enablePan = true; // 开启平移
controls.enableRotate = true; // 开启旋转
controls.autoRotate = false; // 自动旋转
controls.autoRotateSpeed = 1.0; // 自动旋转速度
controls.target.set(0, 0, 0); // 设置控制器的目标点
controls.update(); // 更新控制器

// 创建基础环境
const scene = new THREE.Scene();

// 添加世界光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  1,
);
scene.add(directionalLightHelper);

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

let helpParams = {
  gridHelper: true,
  directionalLightHelper: true,
  axesHelper: true,
};
const helpControls = gui.addFolder("辅助器控制");

function saveControlHelps() {
  console.log(helpParams);
  localStorage.setItem("helpControls", JSON.stringify(helpParams));
}

function loadControlHelps() {
  helpParams = JSON.parse(localStorage.getItem("helpControls"));
  gridHelper.visible = helpParams.gridHelper;
  directionalLightHelper.visible = helpParams.directionalLightHelper;
  axesHelper.visible = helpParams.axesHelper;
  helpControls
    .add(helpParams, "gridHelper")
    .name("grid辅助器")
    .onChange((value) => {
      gridHelper.visible = value;
      saveControlHelps();
    });
  helpControls
    .add(helpParams, "directionalLightHelper")
    .name("平行光辅助器")
    .onChange((value) => {
      directionalLightHelper.visible = value;
      saveControlHelps();
    });
  helpControls
    .add(helpParams, "axesHelper")
    .name("坐标辅助器")
    .onChange((value) => {
      axesHelper.visible = value;
      saveControlHelps();
    });
}

loadControlHelps();

///--------------------------------------------------------------------

// 主要代码写在这里
// const bufferGeometry = new THREE.BufferGeometry()

const cylinder = new THREE.Mesh(
  new THREE.CylinderGeometry(1, 1, 1, 64, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
);
scene.add(cylinder);
const shader = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    frequencyNum: { value: 6.0 }, // 波浪频率
    speed: { value: 1.0 }, // 流动速度
    opacity: { value: 1.0 }, // 整体不透明度
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float frequencyNum;
    uniform float speed;
    uniform float opacity;
    varying vec2 vUv;

    void main() {
      float x = vUv.x;

      // 多层正弦叠加的波浪高度场
      float wave = sin(x * frequencyNum);
      float t = 0.01 * (-uTime * 130.0 * speed);
      wave += sin(x * frequencyNum * 2.1 + t) * 4.5;
      wave += sin(x * frequencyNum * 1.72 + t * 1.121) * 4.0;
      wave += sin(x * frequencyNum * 2.221 + t * 0.437) * 5.0;
      wave += sin(x * frequencyNum * 3.1122 + t * 4.269) * 2.5;
      wave *= 0.06;
      wave /= 3.0;
      wave += 0.55;

      // 波浪遮罩透明度: 波峰以下是实体, 以上渐隐
      float waveAlpha = step(vUv.y, wave) * (wave - vUv.y) / wave;
      float baseAlpha = (1.0 - vUv.y) * 0.12;
      float alpha = max(waveAlpha, baseAlpha);

      // 颜色 (橙→黄渐变)
      vec3 color = mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.85, 0.3), vUv.y);

      gl_FragColor = vec4(color, alpha * opacity);
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  depthTest: true,
});
cylinder.material = shader;


// 空心盒子: 4 面墙, 没有顶盖和底盖
const boxWidth = 1
const boxDepth = 1
const boxHeight = 1
const hw = boxWidth / 2
const hd = boxDepth / 2
const hh = boxHeight / 2

// 4 面墙, 每面 6 个顶点 (2 个三角形), 共 24 个顶点
const positions = [
  // 前墙 (z = +hd)
  -hw, hh, hd, hw, hh, hd, hw, -hh, hd,
  -hw, hh, hd, hw, -hh, hd, -hw, -hh, hd,
  // 后墙 (z = -hd)
  hw, hh, -hd, -hw, hh, -hd, -hw, -hh, -hd,
  hw, hh, -hd, -hw, -hh, -hd, hw, -hh, -hd,
  // 左墙 (x = -hw)
  -hw, hh, -hd, -hw, hh, hd, -hw, -hh, hd,
  -hw, hh, -hd, -hw, -hh, hd, -hw, -hh, -hd,
  // 右墙 (x = +hw)
  hw, hh, hd, hw, hh, -hd, hw, -hh, -hd,
  hw, hh, hd, hw, -hh, -hd, hw, -hh, hd,
]
const bufferGeometry = new THREE.BufferGeometry()
bufferGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))

// 每面墙的 UV 都是 0~1 (波浪 shader 需要)
const uvs = [
  0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, // 前
  0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, // 后
  0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, // 左
  0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, // 右
]
bufferGeometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2))

const box = new THREE.Mesh(bufferGeometry, shader) // 第一个参数是几何体, 第二个是材质
// box.position.set(2, 0, 0)
scene.add(box)

// 地板
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

///--------------------------------------------------------------------

// 渲染场景
function animations() {
  renderer.render(scene, camera);
  controls.update(); // 更新控制器
  stats.update();
  // 更新uniforms
  shader.uniforms.uTime.value += 0.01; // 更新时间
}

// 其他功能
window.onresize = () => {
  // 重新获取宽高并且渲染
  const width = Math.ceil(window.innerWidth);
  const height = Math.ceil(window.innerHeight);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};
