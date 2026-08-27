import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from "three/examples/jsm/Addons.js";

// 边缘shader
import { HorizontalBlurShader } from "three/examples/jsm/Addons.js";
import { SobelOperatorShader } from "three/examples/jsm/shaders/SobelOperatorShader.js";



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

// const DEFAULT_LAYER = 0
// const POST_LAYER = 1
// const postCamera = camera.clone()
// postCamera.position.set(0, 0, 5)
// postCamera.layers.set(POST_LAYER)
// camera.layers.set(DEFAULT_LAYER)


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


const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)
const rtScene = new THREE.Scene()
const rtCamera = camera.clone()
rtScene.add(rtCamera)
const rtCube = cube.clone()
rtScene.add(rtCube)
// light
const rtAmbientLight = new THREE.AmbientLight(0xffffff, 0.5)
rtScene.add(rtAmbientLight)

const rtDirectionalLight = new THREE.DirectionalLight(0xffffff, 1)
rtDirectionalLight.position.set(0, 10, 10)
rtScene.add(rtDirectionalLight)

SobelOperatorShader.uniforms['resolution'].value.x = window.innerWidth * window.devicePixelRatio

const mixComposer = new EffectComposer(renderer, renderTarget)
mixComposer.addPass(new RenderPass(rtScene, rtCamera))
mixComposer.addPass(new ShaderPass(SobelOperatorShader))
mixComposer.addPass(new OutputPass())

const originComposer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
originComposer.addPass(renderPass)
const mixPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tMixTexture: { value: mixComposer.renderTarget1.texture },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform sampler2D tMixTexture;
      varying vec2 vUv;
      void main() {
        vec4 diffuse = texture2D(tDiffuse, vUv);
        vec4 mixTex = texture2D(tMixTexture, vUv);
        vec3 color = step(0.5, vUv.x) * diffuse.rgb + (1.0 - step(0.5, vUv.x)) * mixTex.rgb;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  })
)
originComposer.addPass(mixPass)

/**
 * 总结
 * rendertarget可以理解为一个离屏的缓冲区，
 * 我们将需要渲染的内容送进去，随后生成的纹理输出。
 * 实例举例，我们将深度材质的内容送进renderTarget中。获取到需要的深度纹理。我们此时就可以利用这个深度纹理来做到我们想做的事情了
 * 
 * 在本例子中，还是用composer后处理的方式来进行，本质上你手动去渲染一个场景到renderTarget中，和composer的原理是一样的
 * 
 */

///--------------------------------------------------------------------


// 渲染场景
function animations() {
  // mixComposer.render()
  // renderer.setRenderTarget(renderTarget)
  // renderer.clear()
  // renderer.render(rtScene, rtCamera)
  mixComposer.render()
  originComposer.render()

  // renderer.setRenderTarget(null)
  // renderer.clear()
  // mixComposer.render()

  // renderer.setRenderTarget(null)
  // renderer.clear()
  // originComposer.render()
  // originComposer.render()
  // renderer.setRenderTarget(null);
  // renderer.clear()
  // scene.background = new THREE.Color(0xdddddd);
  // renderer.render(scene, postCamera)

  // renderer.setRenderTarget(null)
  // renderer.clear()
  // renderer.render(scene, camera)

  // renderer.setRenderTarget(mixTarget)
  // renderer.clear()
  // renderer.render(scene, camera)
  // mixComposer.render()


  // renderer.setRenderTarget(renderTarget)
  // renderer.clear()
  // scene.background = new THREE.Color(0xff0000);
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