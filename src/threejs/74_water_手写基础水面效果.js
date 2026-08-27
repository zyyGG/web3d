import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";



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

// 关闭辅助器，保证画面干净
gridHelper.visible = false;
axesHelper.visible = false;
directionalLightHelper.visible = false;

/**
 * 自定义水面着色器
 * @param { number } parameters.time 时间
 * @extends THREE.ShaderMaterial
 */
class CustomWaterShader extends THREE.ShaderMaterial {
  constructor(parameters) {
    super(parameters)

    this.uniforms = {
      time: { value: 0 },
      normalMap: {
        value: new THREE.TextureLoader().load('/textures/waternormals.jpg', 
        function ( texure ) {
          texure.wrapS = texure.wrapT = THREE.RepeatWrapping;
        })
      }
    }

    this.vertexShader = /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec4 vPosition;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = (modelMatrix * vec4( position, 1.0 )).xyzw;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    this.fragmentShader = /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec4 vPosition;
      uniform float time;
      uniform sampler2D normalMap;

      vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 203.0 ) + vec2(time / 117.0, time / 129.0);
					vec2 uv1 = uv / 307.0-vec2( time / -319.0, time / 331.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 301.0, time / 497.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 509.0, time / -513.0 );
					vec4 noise = texture2D( normalMap, uv0 ) +
						texture2D( normalMap, uv1 ) +
						texture2D( normalMap, uv2 ) +
						texture2D( normalMap, uv3 );
					return noise * 0.5 - 1.0;
				}

      void main() {
        // vec4 noise = getNoise(vUv * 50.0);
        vec3 color = vec3(0.6, 0.8, 1.0);
        // vec4 normalMapValue = texture2D(normalMap, fract(vUv + vec2( time / 240.0, time / 240.0 ) * 6.0));
        // vec4 normalMapValue = getNoise(vUv);
        vec4 noise = getNoise(vPosition.xz * 200.0);
        vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5));
        color = color * surfaceNormal.r * 0.5 + color * surfaceNormal.g * 0.5;
        // color = color * normalMapValue.r * 0.6 + color * normalMapValue.g * 0.3 + color * normalMapValue.b * 0.1;

        // color = mix(color, normalMapValue, 0.5);

        // 法线贴图因为视角不同的原因，所以画面的内容也会出现不同
        
        // 使用法线贴图
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
}

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10000, 10000, 100, 100),
  new CustomWaterShader({ wireframe: false}),
)
scene.add(plane)
plane.rotation.x = -Math.PI / 2


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  plane.material.uniforms.time.value += 0.01;
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