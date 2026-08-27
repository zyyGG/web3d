import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";




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

gridHelper.visible = false
directionalLightHelper.visible = false

const baseMaterialCube = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );
const baseMaterialFloor = new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } );

// 方块
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  baseMaterialCube
)
// cube.position.set(-3, 0.5, 0)
scene.add(cube)

// 地板
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.1, 10),
  baseMaterialFloor
)
// floor.rotation.x = -Math.PI / 2
scene.add(floor)

gsap.to(cube.position, {
  y: -0.5,
  yoyo: true,
  repeat: -1,
  duration: 2,
})


const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
  // side: THREE.DoubleSide,
})




// 得到深度空间的图像
// const depthTexture = new THREE.DepthTexture();
// depthTexture.type = THREE.UnsignedShortType; // 设置深度纹理类型
const renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight);
const renderTarget2 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight);

const composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );
const depthShader = new ShaderPass(new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    tDepth1: { value: renderTarget.texture },
    tDepth2: { value: renderTarget2.texture },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */`
    varying vec2 vUv;
    uniform sampler2D tDiffuse; // 原始图像
    uniform sampler2D tDepth1;
    uniform sampler2D tDepth2;

    float near = 0.1;
    float far = 1000.0;

    // 解压深度值， 这里深度值使用4个通道来提高精度
    float unpackRGBAToDepth( const in vec4 v ) {
        const vec4 bitShift = vec4( 1.0, 1.0 / 255.0, 1.0 / (255.0 * 255.0), 1.0 / (255.0 * 255.0 * 255.0) );
        float depth = dot( v, bitShift );
        return depth;
      }


    float linearizeDepth(vec4 depthColor) {
      float z = 0.0;
      z = unpackRGBAToDepth(depthColor);
      // 这里主要就是把非线性深度值转为线性深度值
      z = 1.0 / ((1.0 / near) - z * ((far - near) / (far * near)));
      return z;
    }
    
    void main() {
      vec4 diffuseColor = texture2D( tDiffuse, vUv );
      vec4 depth1Color = texture2D( tDepth1, vUv );
      vec4 depth2Color = texture2D( tDepth2, vUv );

      vec3 color = vec3(1.0, 1.0, 1.0);

      float depth1 = linearizeDepth(depth1Color);
      float depth2 = linearizeDepth(depth2Color);
      
      color = diffuseColor.rgb;
      // color = vec3(depth1 / far);
      color = color * (abs(depth1 - depth2) < 0.1 ? 0.0 : 1.0);
      // color = mix(color, vec3(1.0, 0.0, 0.0), (abs(depth1 - depth2) < 0.1) && (diffuseColor.rgb != vec3(0.0, 0.0, 0.0)) ? 1.0 : 0.0);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  
}))
composer.addPass( depthShader )
composer.addPass( new OutputPass()); // 转为SRGB空间


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  axesHelper.visible = false;
  // 渲染目标物体
  cube.visible = true;
  floor.visible = false;
  cube.material = depthMaterial;
  renderer.setRenderTarget( renderTarget );
  renderer.render( scene, camera );

  // 渲染非目标物体
  cube.visible = false;
  floor.visible = true;
  floor.material = depthMaterial;
  renderer.setRenderTarget( renderTarget2 );
  renderer.render( scene, camera );

  // 正常渲染场景
  axesHelper.visible = true;
  cube.visible = true;
  floor.visible = true;
  cube.material = baseMaterialCube;
  floor.material = baseMaterialFloor;
  renderer.setRenderTarget( null );
  // renderer.render( scene, camera );
  composer.render(); // 使用后期处理渲染场景


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