import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { OutputPass } from "three/examples/jsm/Addons.js";
import { SobelOperatorShader } from "three/examples/jsm/Addons.js";
import { DotScreenShader } from "three/examples/jsm/shaders/DotScreenShader.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";




// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0x000000, 1) // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop( animations );
document.querySelector("#app").appendChild(renderer.domElement)

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
camera.position.set(0, 5, 5)
// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true // 开启阻尼
controls.dampingFactor = 0.25 // 阻尼系数
controls.enableZoom = true // 开启缩放
controls.enablePan = true // 开启平移
controls.enableRotate = true // 开启旋转
controls.autoRotate = false // 自动旋转
controls.autoRotateSpeed = 1.0 // 自动旋转速度
controls.target.set(0, 0, 0) // 设置控制器的目标点
controls.update() // 更新控制器

// 创建基础环境
const scene = new THREE.Scene()

// 添加世界光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)

// 添加平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
scene.add(gridHelper)

///--------------------------------------------------------------------
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const outlineComposer = new EffectComposer( renderer );
outlineComposer.renderToScreen = false; // 不直接渲染到屏幕
const renderPass = new RenderPass( scene, camera );
outlineComposer.addPass( renderPass );

// const dotScreenPass = new ShaderPass( DotScreenShader );
// composer.addPass( dotScreenPass );

// 灰度
const grayShader = {
  uniforms: {
    tDiffuse: { value: null },
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
    void main() {
      vec4 color = texture2D( tDiffuse, vUv );
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(vec3(gray), color.a);
    }
  `
};
const grayPass = new ShaderPass( grayShader );
outlineComposer.addPass( grayPass );

const soblePass = new ShaderPass( SobelOperatorShader );
soblePass.uniforms[ 'resolution' ].value.x = window.innerWidth * window.devicePixelRatio;
soblePass.uniforms[ 'resolution' ].value.y = window.innerHeight * window.devicePixelRatio;
outlineComposer.addPass( soblePass );


const outlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    edgeTexture: { value: null },
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
    uniform sampler2D edgeTexture;
    varying vec2 vUv;
    void main() {
      vec4 originalColor = texture2D( tDiffuse, vUv );
      vec4 edgeColor = texture2D( edgeTexture, vUv );
      edgeColor = vec4(edgeColor.rgb, step(0.2, edgeColor.r + edgeColor.g + edgeColor.b)); // 二值化边缘
      edgeColor *= vec4(1.0, 0.0, 0.0, 1.0); // 红色边缘
      vec4 color = vec4(edgeColor.rgb + originalColor.rgb, originalColor.a); // 红色边缘
      gl_FragColor = color;
    }
  `
};
const outlinePass = new ShaderPass( outlineShader );

const composer = new EffectComposer( renderer );
composer.addPass( renderPass );
composer.addPass( outlinePass );
composer.addPass( new OutputPass() );



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  outlineComposer.render()
  outlinePass.uniforms['edgeTexture'].value = outlineComposer.readBuffer.texture;
  composer.render()
  controls.update() // 更新控制器
  stats.update();
}

// 其他功能
window.onresize = () => {
  // 重新获取宽高并且渲染
  const width = Math.ceil(window.innerWidth)
  const height = Math.ceil(window.innerHeight)
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.render(scene, camera)
}