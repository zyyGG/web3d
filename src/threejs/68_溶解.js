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
cube.scale.set(1, 3, 1)
cube.position.set(0,1,0)

// 地面
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(20,20),
  new THREE.MeshPhongMaterial({ color:0x999999, side:THREE.DoubleSide })
)
plane.rotation.x = -Math.PI / 2
plane.position.y = 0.1
scene.add(plane)


// 
const customShader = new THREE.ShaderMaterial({
  uniforms: {
    progress: { value: 0.0 },
    dissolveColor: { value: new THREE.Color(0xff0000) },
    dissolveWidth: { value: 0.02 },
  },
  vertexShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    void main(){
      vNormal = normal;
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    uniform float progress;
    uniform vec3 dissolveColor;
    uniform float dissolveWidth;


    float rand(vec3 co){
      return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,54.53))) * 43758.5453);
    }

    // 噪声
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);

      f = f * f * (3.0 - 2.0 * f);

      float n = i.x + i.y * 57.0 + 113.0 * i.z;

      return mix(mix(mix(rand(vec3(n + 0.0, 0.0, 0.0)), rand(vec3(n + 1.0, 0.0, 0.0)), f.x),
                     mix(rand(vec3(n + 57.0, 0.0, 0.0)), rand(vec3(n + 58.0, 0.0, 0.0)), f.x), f.y),
                 mix(mix(rand(vec3(n + 113.0, 0.0, 0.0)), rand(vec3(n + 114.0, 0.0, 0.0)), f.x),
                     mix(rand(vec3(n + 170.0, 0.0, 0.0)), rand(vec3(n + 171.0, 0.0, 0.0)), f.x), f.y),
             f.z);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main(){
      vec3 color = vec3(1.0);
      float alpha = 1.0;
      float nProgress = progress * (1.0 + 0.1 + dissolveWidth) + 0.5;

      // 归一化position
      float fPosition = (vPosition.y + 1.0); // 物体高度3.0
      
      vec3 noise_texture = vec3(fbm(vUv.xyy * 10.0 ));

      float line = smoothstep(nProgress - dissolveWidth, nProgress, fPosition + noise_texture.x * 0.1) - smoothstep(nProgress, nProgress + dissolveWidth, fPosition + noise_texture.x * 0.1);
      color = mix(color, dissolveColor, line);

      alpha = smoothstep(nProgress - dissolveWidth, nProgress + dissolveWidth, fPosition + noise_texture.x * 0.1);
      if(alpha < 0.1) discard;

      // color = step(vUv.y, 0.5) * color + (1.0 - step(vUv.y, 0.5)) * dissolveColor;
      // float alpha = smoothstep(progress - dissolveWidth, progress + dissolveWidth, vUv.y);
      // if(alpha < 0.1) discard;
      
      gl_FragColor = vec4(color, alpha);
      // gl_FragColor = vec4(fPosition, 1.0, 1.0, 1.0);
    }
  `,
  transparent: true,
})

// 这个是平面的
// plane.material = customShader

// cube
cube.material = customShader


gsap.to(cube.position, {
  duration: 2,
  y: 3,
  ease: "power1.inOut",
  yoyo: true,
  repeat: -1
})


const params = {
  progress: 0,
  dissolveColor: 0xff0000,
  dissolveWidth: 0.02,
}

gui.add(params, 'progress', 0, 1.0, 0.01).onChange(val => {
  customShader.uniforms.progress.value = val
  customShader.needsUpdate = true
})
gui.addColor(params, 'dissolveColor').onChange(val => {
  customShader.uniforms.dissolveColor.value = new THREE.Color(val)
  customShader.needsUpdate = true
})
gui.add(params, 'dissolveWidth', 0.0, 0.5, 0.01).onChange(val => {
  customShader.uniforms.dissolveWidth.value = val
  customShader.needsUpdate = true
})


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  customShader.needsUpdate = true
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