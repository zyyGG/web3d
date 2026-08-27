import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio) // 处理高分屏
renderer.setClearColor(0x1e1e1e, 1) // 设置背景色
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

gridHelper.visible = false;
// 主要代码写在这里
const geometry = new THREE.SphereGeometry( 1, 32, 32 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, shininess: 150 } );
const cubeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    texture0: { value: new THREE.TextureLoader().load('/textures/patten01.png')  },
    grid: { value: new THREE.TextureLoader().load('/textures/grid.png')  },
    u_time: { value: 0.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D texture0;
    uniform sampler2D grid;
    uniform float u_time;
    varying vec2 vUv;
    varying vec3 vNormal;

    float noise_2d(vec2 p){
      return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float fbm(vec2 p) {
      float total = 0.0;
      float frequency = 1.0;
      float amplitude = 1.0;
      float persistence = 0.5;
      int octaves = 6;

      for (int i = 0; i < octaves; i++) {
        total += noise_2d(p * frequency) * amplitude;
        frequency *= 2.0;
        amplitude *= persistence;
      }
      return total;
    }

    void main() {
      // vec4 color = texture2D( tDiffuse, vUv );
      // color = vec4()
      vec3 color = vec3(0.2, 0.6, 1.0);
      vec3 border_color = vec3(1.0, 0.5, 1.0);
      float border = 0.5;
      // 菲涅尔边缘
      float ndv = dot(normalize(vNormal), normalize(cameraPosition));
      vec4 texColor = texture2D( texture0, fract(normalize(vNormal).yz * vec2(1.5)));
      if(ndv < 0.0) ndv = abs(ndv);
      ndv = 1.0 - ndv;
      float intensity = pow(ndv, 0.8);

      vec4 gridAnim = texture2D( grid, fract(vUv * 5.0 + vec2(u_time * 0.1, u_time * 0.1)) );
      // texColor.a = step(border, gridAnim.r);
      // gridAnim.r = step(border, gridAnim.r);
      // texColor.a = gridAnim.r * fbm(vUv * 10.0);

      color = mix(color, vec3(1.0, 0.0, 0.0), texColor.a);
      // color = color * (0.5 + 0.5 * gridAnim.r);
      color = mix( color, border_color, intensity);
      float alpha = intensity; // 通过边缘光的强度来控制其他区域的透明度
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  // depthTest: true,
  side: THREE.FrontSide,
})
const cube = new THREE.Mesh( geometry, cubeMaterial );
scene.add( cube );
cube.position.y = 0.3

const plane = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.2, 20),
  material,
)
// plane.rotation.x = - Math.PI / 2
plane.position.y = 0.0
scene.add(plane)

const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.6, 0.6),
  new THREE.MeshStandardMaterial({color: 0xff00ff})
)
cube2.position.set(0.0, 0.2, 0.0)
scene.add(cube2)



const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
)

const renderTarget2 = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
)

// plane.material.map = renderTarget.texture
// plane.material.needsUpdate = true

const DEFAULT_LAYER = 0;
const DEPTH_LAYER = 1;

const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
  side: THREE.BackSide,
})

// 给其他接触用的
const depthMaterial2 = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
})

const composer = new EffectComposer( renderer );
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );
const shaderPass = new ShaderPass( new THREE.ShaderMaterial( {
    uniforms: {
      tDiffuse: { value: null },
      tDepth1: { value: renderTarget.textures[0] },
      tDepth2: { value: renderTarget2.textures[0] },
      near: { value: camera.near },
      far: { value: camera.far },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth1;
      uniform sampler2D tDepth2;
      uniform float near;
      uniform float far;
      varying vec2 vUv;
      varying vec3 vPosition;

      float unpackRGBAToDepth( const in vec4 v ) {
        const vec4 bitShift = vec4( 1.0, 1.0 / 255.0, 1.0 / (255.0 * 255.0), 1.0 / (255.0 * 255.0 * 255.0) );
        float depth = dot( v, bitShift );
        return depth;
      }

      // 视口Z坐标转正交深度
      float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
        return ( viewZ + near ) / ( near - far );
      }

      // 透视深度转视口Z坐标
      float perspectiveDepthToViewZ( const in float fragCoordZ, const in float near, const in float far ) {
        return ( near * far ) / ( ( far - near ) * fragCoordZ - far );
      }

      // 从深度贴图读取深度
      float readDepth( sampler2D depthSampler, vec2 coord ) {
        float fragCoordZ = unpackRGBAToDepth(texture2D( depthSampler, coord ));
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, near, far );
        return viewZToOrthographicDepth( viewZ, near, far );
      }
      void main() {
        vec4 diffuse = texture2D( tDiffuse, vUv );
        // float depth1 = readDepth(tDepth1, vUv);
        // float depth2 = readDepth(tDepth2, vUv);
        float depth1 = unpackRGBAToDepth(texture2D( tDepth1, vUv ));
        float depth2 = unpackRGBAToDepth(texture2D( tDepth2, vUv ));
        float diff = 1.0;
        
        // > 时 表示第二个物体在第一个物体前面，此时着色是在第一个物体上
        // < 时 表示第二个物体在第一个物体后面，此时着色是在第二个物体上
        if(depth2 > depth1){
          // diff = step(0.00004, abs(depth2 - depth1));
          // 渐变混合边缘
          diff = smoothstep(0.0, 0.0004, abs(depth2 - depth1));
        } 
        
        vec3 color = mix(vec3(1.0, 0.5, 1.0), diffuse.rgb, diff);
        gl_FragColor = vec4(color, 1.0);
        
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
  }) );
composer.addPass( shaderPass );
const outputPass = new OutputPass();
composer.addPass( outputPass );




///--------------------------------------------------------------------

let tick = 0
// 渲染场景
function animations() {
  // const time = performance.now() * 0.001;
  // cube.rotation.y = time * 0.3;
  // cube.rotation.x = time * 0.2;
  tick += 0.001
  cubeMaterial.uniforms.u_time.value = tick;
  cubeMaterial.needsUpdate = true


  cube.material = depthMaterial
  plane.material = depthMaterial2
  cube.layers.set(DEPTH_LAYER)
  // 渲染进入深度的模型
  camera.layers.set(DEPTH_LAYER)
  cube2.layers.set(DEFAULT_LAYER)
  renderer.setClearColor(0xffffff, 1) // 设置背景色
  renderer.setRenderTarget(renderTarget)
  renderer.render(scene, camera)

  // 渲染比对的其他模型深度材质
  cube.layers.set(DEFAULT_LAYER)
  plane.layers.set(DEPTH_LAYER)
  cube2.layers.set(DEPTH_LAYER)
  renderer.setRenderTarget(renderTarget2)
  renderer.render(scene, camera)

  cube.material = cubeMaterial;
  plane.material = material;

  // 渲染正常模型
  renderer.setClearColor(0x1e1e1e, 1) // 设置背景色
  plane.layers.set(DEFAULT_LAYER)
  camera.layers.set(DEFAULT_LAYER)
  cube2.layers.set(DEFAULT_LAYER)
  renderer.setRenderTarget(null)
  
  renderer.render(scene, camera)

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