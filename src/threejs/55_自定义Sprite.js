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

// 使用spirte创建
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load("/images/image.png")
texture.colorSpace = THREE.SRGBColorSpace
console.log(camera)
// const spriteMaterial = new THREE.SpriteMaterial({
//   map: texture,
//   transparent: true,
//   opacity: 1,
// })
const spriteMaterial = new THREE.ShaderMaterial({
  uniforms: {
    map: { value: texture },
  },
  transparent: true,
  depthTest: false,
  side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // 获取世界空间下的相机右和上方向
      vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      // sprite的本地坐标
      vec2 pos = position.xy;
      // 计算sprite在世界空间的位置
      vec3 billboardPos = cameraRight * pos.x + cameraUp * pos.y;
      // 将sprite中心点变换到世界空间
      vec4 worldPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      // 最终顶点位置
      gl_Position = projectionMatrix * viewMatrix * vec4(worldPos.xyz + billboardPos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    varying vec2 vUv;
    float sdfCircle(vec2 p, float r, vec2 offset) {
      p -= offset;
      return length(p) - r;
    }

    float sdfBox(vec2 p, vec2 b, vec2 offset){
      p -= offset;
      vec2 d = abs(p) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }
    void main() {
      vec2 uv = vUv;
      float circle = sdfCircle(uv, 0.5, vec2(0.5, 0.5));
      circle = smoothstep(0.0, 0.01, circle);
      
      float boxBorderSize = 0.03;
      float boxSize = 0.47;
      float boxOut = sdfCircle(uv, boxSize, vec2(0.5));
      float boxInner = sdfCircle(uv, boxSize - boxBorderSize, vec2(0.5));
      float box = max(min(boxOut, boxInner), -max(boxOut, boxInner));  // xor
      // float box = min(boxOut, circle); // and
      // float box = max(boxOut, circle); // or
      // float box = max(-boxOut, circle); // left subtraction
      // float box = max(boxOut, -circle); // right subtraction
      box = smoothstep(0.0, 0.01, box);

      vec4 texture = texture2D(map, uv + vec2(-0.015, 0.0));
      float alpha = 1.0 - step(0.0, boxOut);
      vec3 innerColor = mix(vec3(1.0), texture.rgb, texture.a); // 内部的颜色
      vec3 color = mix(vec3(1.0, 0.0, 0.0), innerColor, box); // 这里是边框颜色
      gl_FragColor = vec4(color, alpha);
    }
  `,
})
const sprite = new THREE.Sprite(spriteMaterial)
sprite.position.set(0, 0, 0) // 设置精灵的位置
scene.add(sprite)

// cube.material = spriteMaterial

// spriteMaterial.onBeforeCompile = (shader) => {
//   console.log(shader.fragmentShader)
// }

setInterval(() => {
  const random = Math.random() * 10
  if(random > 1){
    const x = sprite.position.x + Math.random() * 2 - 1
    const z = sprite.position.z + Math.random() * 2 - 1
    gsap.to(sprite.position, {
      x,
      z
    })
  }
}, 1000)


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  // sprite.lookAt(camera.position) // 始终面向摄像机
  // spriteMaterial.uniforms.cameraMatrix.value = camera.modelViewMatrix
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