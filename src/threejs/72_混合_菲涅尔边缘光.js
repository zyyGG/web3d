import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from "three/examples/jsm/Addons.js";

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

const DEFAULT_LAYER = 0;
const OUTLINE_LAYER = 1;


const geometry = new THREE.IcosahedronGeometry(1, 8);
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150, flatShading: false, } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

cube.layers.enable(OUTLINE_LAYER);

const rtCamera = camera.clone();
rtCamera.layers.set(OUTLINE_LAYER);
scene.add(rtCamera);

ambientLight.layers.enable(OUTLINE_LAYER);
directionalLight.layers.enable(OUTLINE_LAYER);

const renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );

const materials = {};
// SobelOperatorShader.uniforms['resolution'].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
const outlineMaterial = new THREE.ShaderMaterial({
  uniforms: {
    rimColor:     { value: new THREE.Color(0xff33ff) },
    rimPower:     { value: 2.5 },   // 指数，越大越贴边
    rimStrength:  { value: 1.0 },   // 强度（影响 alpha）
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewDir; // 视线方向
    void main() {
      vNormal = normalize( normalMatrix * normal );
      vViewDir = normalize( -( modelViewMatrix * vec4( position, 1.0 ) ).xyz );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position , 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    uniform vec3 rimColor;
    uniform float rimPower;
    uniform float rimStrength;
    void main() {
      vec3 color = vec3(1.0);
      float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
      rim = pow(rim, rimPower) * rimStrength; // 使用幂函数控制边缘的锐度
      color = mix(vec3(0.0, 0.0, 0.0), rimColor, rim); // 混合颜色
      gl_FragColor = vec4(color, 1.0); // 下面的色彩混合是相加，所以纯黑色默认当成了透明
    }
  `,
  transparent: true,
  depthWrite: true, // false 可以额穿透显示，true 只显示在前方的模型
})


const composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );
const mixPass = new ShaderPass( new THREE.ShaderMaterial({
  uniforms: {
    "tDiffuse": { value: null },
    "outlineTexture": { value: renderTarget.texture },
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
    uniform sampler2D outlineTexture;
    varying vec2 vUv;
    void main() {
      vec4 diffuse = texture2D( tDiffuse, vUv );
      vec4 outline = texture2D( outlineTexture, vUv );
      vec3 color = diffuse.rgb + outline.rgb;
      gl_FragColor = vec4( color, 1.0 );
    }
  `
}))
mixPass.needsSwap = true;
composer.addPass(mixPass );
composer.addPass(new OutputPass())

cube.material = outlineMaterial;


// 在创建一个cube用来测试
const testCube = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.7, 0.2, 100, 16),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
)
scene.add(testCube)
testCube.position.set(3, 0, 0)

testCube.layers.enable(OUTLINE_LAYER);


const params = {
  rimColor: outlineMaterial.uniforms.rimColor.value.getHex(),
  rimPower: outlineMaterial.uniforms.rimPower.value,
  rimStrength: outlineMaterial.uniforms.rimStrength.value,
  materialColor: material.color.getHex(),
}

gui.addColor(params, 'rimColor').onChange(val => {
  outlineMaterial.uniforms.rimColor.value.setHex(val)
})
gui.add(params, 'rimPower', 0.1, 10).step(0.1).onChange(val => {
  outlineMaterial.uniforms.rimPower.value = val
})
gui.add(params, 'rimStrength', 0.1, 5).step(0.1).onChange(val => {
  outlineMaterial.uniforms.rimStrength.value = val
})
gui.addColor(params, 'materialColor').name("模型颜色").onChange(val => {
  material.color.setHex(val)
})


/**
 * 总结：
 * 这里使用的是菲涅尔效应来实现边缘高亮
 * 通过计算视线方向和法线的点积来确定边缘位置
 * 使用幂函数来控制边缘的锐度
 * 通过后期处理将边缘效果叠加到原始渲染上
 * 优点：
 *  实现简单，效果还不错
 * 缺点：
 *  只能内发光，无法实现外发光
 *  对于有多个uv的模型，边缘效果会不连续(具体看示例中的矩形)
 *  对于复杂模型，边缘效果可能不均匀
 *  边缘不能设置成黑色
 */


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  cube.material = outlineMaterial;
  testCube.material = outlineMaterial;
  // 这里让画面渲染到 renderTarget
  rtCamera.position.copy( camera.position );
  rtCamera.quaternion.copy( camera.quaternion );
  rtCamera.updateMatrixWorld();
  rtCamera.projectionMatrix.copy( camera.projectionMatrix );
  renderer.setRenderTarget( renderTarget );
  renderer.clear();
  renderer.render( scene, rtCamera );
  
  cube.material = material; // 恢复原来的材质
  testCube.material = material;
  // renderer.setRenderTarget( renderTarget );
  // renderer.clear();
  // renderer.render( scene, rtCamera );
  composer.render()
  // renderer.render(scene, camera)
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