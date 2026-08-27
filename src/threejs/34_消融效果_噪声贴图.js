import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"
import { texture } from "three/tsl";



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
camera.position.z = 5;
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

///--------------------------------------------------------------------
const config = {
  process: 0.5
}
// 主要代码写在这里
// const geometry = new THREE.IcosahedronGeometry( 1, 8 )
const geometry = new THREE.BoxGeometry(1,1,1);
const textureLoader = new THREE.TextureLoader();
// const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const material = new THREE.ShaderMaterial({
  uniforms: {
    color: {
      value: new THREE.Color(0x00ff00)
    },
    uTexture1: {
      value: textureLoader.load("/textures/spruce_log.png")
    },
    uTexture2: {
      value: textureLoader.load("/textures/noise.jpg"),
    },
    process: {
      value: config.process
    },
    uTime: {
      value: 0
    }
  },
  transparent: true,
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normal);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform float uTime;
    uniform float process;
    
    void main() {
      vec4 textureColor1 = texture2D(uTexture1, vUv);
      vec4 textureColor2 = texture2D(uTexture2, vUv);
      // float edge_width = mix(0.0,0.5, process);
      // 边缘宽度
      float edge_width = process / 5.0; // 让过度的效果更明显
      vec4 edgeColor = vec4(1.0, 0.0, 0.0 ,0.5);

      // 这里利用噪点图的红色通道来计算边缘，
      float edge = smoothstep(textureColor2.r - edge_width, textureColor2.r, process);
      
      // 将边缘颜色和纹理颜色进行混合
      textureColor1.rgb += edgeColor.rgb * (1.0 - edge);
      gl_FragColor = vec4(textureColor1.rgb, edge);
    }
  `
})
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({ color: 0xffccff})
)
cube2.position.set(2, 0, 0)
scene.add(cube2)




gui.add(config, 'process', 0.0, 1.0, 0.01).onChange((value) => {
  material.uniforms.process.value = value
})

///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  // cube.rotateY(0.001)
  // cube2.rotateY(0.001)
  material.uniforms.uTime.value += 0.001
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