import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import Stats from "three/addons/libs/stats.module.js"; // 性能监视工具
import { gsap } from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/Addons.js";
// import ThresholdShader from "three/examples/jsm/shaders/ThresholdShader.js";
// import { edgepass } from "three/examples/jsm/postprocessing/EdgePass.js";
// import { dilatePass } from "three/examples/jsm/postprocessing/DilatePass.js";
// import { maskInputPass } from "three/examples/jsm/postprocessing/MaskInputPass.js";

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
/**
 * 推荐版逻辑：
 * 1. 主画面用 EffectComposer 的 RenderPass 渲染。
 * 2. 需要描边的对象 enable OUTLINE_LAYER，同时保留 DEFAULT_LAYER。
 * 3. 每帧先把 camera.layers 切到 OUTLINE_LAYER，渲染白色 mask 到 outlineTarget。
 * 4. 再把 camera.layers 切回 DEFAULT_LAYER。
 * 5. ShaderPass 读取 tDiffuse 和 outlineTarget.texture，做边缘检测/膨胀/混合。
 * 6. 如果需要穿墙效果，再额外采样 sceneDepth 和 objectDepth。
 */

// 图层
const DEFAULT_LAYER = 0;
const OUTLINE_LAYER = 1;

// 创建整个场景

const createScene = () => {
  const sphereGroup = new THREE.Group();
  const sphereCount = 60;
  const scatterRadius = 3;
  const minRadius = 0.15;
  const maxRadius = 0.8;

  for (let i = 0; i < sphereCount; i++) {
    const radius = THREE.MathUtils.randFloat(minRadius, maxRadius);
    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.65, 0.55),
      roughness: 0.55,
      metalness: 0.05,
    });
    const sphere = new THREE.Mesh(geometry, material);
    const direction = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
    ).normalize();
    const distance = Math.cbrt(Math.random()) * scatterRadius;

    sphere.position.copy(direction.multiplyScalar(distance));

    sphereGroup.add(sphere);
  }
  sphereGroup.children[0].layers.enable(OUTLINE_LAYER);
  scene.add(sphereGroup);
  return sphereGroup;
};

const sphereGroup = createScene();
const outlineRenderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
);

const outlineComposer = new EffectComposer(renderer);
outlineComposer.renderToScreen = false;
// mask input pass, 将 outlineRenderTarget 的内容二值化，生成 mask
const maskInputMaterial = new THREE.ShaderMaterial({
  uniforms: {
    outlineTarget: { value: outlineRenderTarget.texture },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D outlineTarget;
    varying vec2 vUv;
    void main() {
      vec4 mask = texture2D( outlineTarget, vUv );
      float value = step(0.5, mask.r);
      gl_FragColor = vec4(vec3(value), value);
    }
  `
})
const maskInputPass = new ShaderPass(maskInputMaterial)
outlineComposer.addPass(maskInputPass);
// dilate shader, 将白色区域向外扩张一圈或者多圈
const dilateMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    uThickness: { value: 1.0 }, // 厚度
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    uniform float uThickness;
    void main() {
      float center = texture2D( tDiffuse, vUv ).r;
      float result = center;
      for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
          vec2 offset = vec2(float(x), float(y)) * uThickness / vec2(textureSize(tDiffuse, 0));
          result = max(result, texture2D(tDiffuse, vUv + offset).r);
        }
      }
      gl_FragColor = vec4(vec3(result), result);
    }
  `
})
const dilatePass = new ShaderPass(dilateMaterial);
outlineComposer.addPass(dilatePass);
// edge subtract shader, 将膨胀后的 mask 减去原始 mask，得到边缘部分
const edgeSubtractMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    originalMask: { value: outlineRenderTarget.texture },
    uColor: { value: new THREE.Color(0xff0000) }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D originalMask;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float dilated = texture2D( tDiffuse, vUv ).r;
      float original = texture2D( originalMask, vUv ).r;
      original = step(0.5, original);
      float result = max(dilated - original, 0.0);
      gl_FragColor = vec4(uColor.rgb * result, result);
    }
  `
})
const edgeSubtractPass = new ShaderPass(edgeSubtractMaterial);
outlineComposer.addPass(edgeSubtractPass);



// 后处理
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const mixMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    outlineTarget: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D outlineTarget;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D( tDiffuse, vUv );
      vec4 outline = texture2D( outlineTarget, vUv );
      vec3 finalColor = mix(color.rgb, outline.rgb, outline.a);
      gl_FragColor = vec4(finalColor, color.a);
    }
  `,
});
const mixPass = new ShaderPass(mixMaterial);
composer.addPass(mixPass);
composer.addPass(new OutputPass()); // Replace 'YourShader' with the actual shader you want to use

// 射线检测
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const intersects = checkIntersects();
  if (intersects.length > 0) {
    // 处理交互逻辑，例如高亮选中的球体
    const selectedObject = intersects[0].object;
    selectedObject.layers.enable(OUTLINE_LAYER);
    // 把其他球体的高亮关了
    sphereGroup.children.forEach((sphere) => {
      if (sphere !== selectedObject) {
        sphere.layers.set(DEFAULT_LAYER);
      }
    });
  } 
});

function checkIntersects() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sphereGroup.children, true);
  return intersects;
}


const maskMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

///--------------------------------------------------------------------

// 渲染场景
function animations() {
  // 渲染outline球体
  scene.overrideMaterial = maskMaterial; // 使用遮罩材质渲染轮廓球体
  renderer.setRenderTarget(outlineRenderTarget);
  renderer.clear();
  camera.layers.set(OUTLINE_LAYER);
  renderer.render(scene, camera);

  outlineComposer.render();
  mixMaterial.uniforms.outlineTarget.value = outlineComposer.readBuffer.texture;

  // 渲染默认图层
  scene.overrideMaterial = null; // 恢复原始材质
  renderer.setRenderTarget(null);
  camera.layers.set(DEFAULT_LAYER);
  composer.render();
  // requestAnimationFrame(animations);
  // renderer.render(scene, camera)
  
  controls.update(); // 更新控制器
  stats.update();
}
// animations();

// 其他功能
window.onresize = () => {
  // 重新获取宽高并且渲染
  const width = Math.ceil(window.innerWidth);
  const height = Math.ceil(window.innerHeight);
  renderer.setSize(width, height);
  outlineRenderTarget.setSize(width, height);
  outlineComposer.setSize(width, height);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};
