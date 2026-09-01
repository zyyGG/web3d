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
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec2 vPosXZ; // 把位置传给片元, 在片元里逐像素算角度
    void main() {
      vUv = uv;
      vPosXZ = position.xz; // 位置插值是连续的, 没有 atan 分支跳变问题
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    varying vec2 vPosXZ;
    const float PI = 3.1415926;

    // 多项式高度场: 输入 t ∈ [-1, 1]
    float poly(float t) {
      float t2 = t * t;
      float t4 = t2 * t2;
      // 四次多项式 6t⁴ - 6t²: W 形双谷, 起伏更剧烈 (poly(±1) = 0 无缝)
      return 6.0 * t4 - 6.0 * t2;
    }

    void main() {
      vec2 uv = vUv;
      // 逐像素用真实位置算角度: 位置连续 → 角度不会像顶点插值那样跳变
      float theta = atan(vPosXZ.x, vPosXZ.y); // -PI ~ PI
      float t = theta / PI;                   // [-1, 1]
      uv.y += poly(t) * 0.45;                 // ← 用多项式扭曲 uv.y, 0.45 让起伏更剧烈

      // 用扭曲后的 uv 生成渐变颜色
      float f = clamp(uv.y, 0.0, 1.0);        // 混合系数: 0=橙 1=蓝
      vec3 color = mix(vec3(1.0, 0.2, 0.1), vec3(0.2, 0.5, 1.0), f);
      // 蓝色完全透明: f 超过阈值(偏蓝)就 alpha 直接为 0, 硬切
      float alpha = 1.0 - step(0.5, f);
      gl_FragColor = vec4(color, alpha);
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  depthTest: false,
});
cylinder.material = shader;

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
