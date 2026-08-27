import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { ShaderPass, EffectComposer, RenderPass, OutputPass } from "three/examples/jsm/Addons.js";
import { LuminosityShader } from "three/addons/shaders/LuminosityShader.js"
import { SobelOperatorShader } from "three/addons/shaders/SobelOperatorShader.js";




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
camera.aspect = window.innerWidth / 2 / window.innerHeight
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
// scene.add(directionalLightHelper)

// 世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

// grid辅助器
const gridHelper = new THREE.GridHelper(20, 20)
// scene.add(gridHelper)

function createCanvasText(text, fontSize, color) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  // 抗锯齿
  context.imageSmoothingEnabled = true;
  // 设置canvas大小
  canvas.width = 1000; // 设置canvas宽度
  canvas.height = 500; // 设置canvas高度
  // 白色背景
  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = `${fontSize}px Arial`;
  context.fillStyle = color;
  context.fillText(text, 0, fontSize);
  return canvas;
}

///--------------------------------------------------------------------
//创建元素
const div = document.createElement("div")
div.style.position = "absolute"
div.style.top = "10px"
div.style.left = "50%"
div.style.transform = "translateX(-50%)"
div.style.color = "#ffffff"
div.style.fontSize = "20px"
div.innerHTML = "左边是正常输出，右边是自定义shader的输出"
document.body.appendChild(div)
// 绘制一个矩形
const cube1 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffff })
)
scene.add(cube1)

const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
 new THREE.MeshStandardMaterial({ color: 0xff00ff })
)
cube2.position.set(2, 0, 0)
scene.add(cube2)
// 后期
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
// 自定义shaderpass
const shaderPass = new ShaderPass({
  name: "CustomShaderPass",
  uniforms: {
    tDiffuse: { value: null },
    u_time: { value: 0 },
    resolution: { value: new THREE.Vector2()}
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
    uniform float u_time;
    uniform vec2 resolution;
    varying vec2 vUv;

   
    float computedGray(vec2 uv){
      vec4 c = texture2D(tDiffuse, uv);
      float result = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
      return step(0.01, result); // 只保留大于0.1的灰度值
    }
    

    void main() {
      vec2 uv = vUv;
      uv = uv * vec2(2.0, 1.0);
      uv = fract(uv);
      // 在这个的基础上增加扫描线效果
      
      if(vUv.x < 0.5){
        gl_FragColor = texture2D(tDiffuse, uv);
      } else {
        vec2 texel = vec2( 1.2 / resolution.x, 1.2 / resolution.y );

        // 卷积核
        const mat3 Gx = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1 ); // x direction kernel
			  const mat3 Gy = mat3( -1, 0, 1, -2, 0, 2, -1, 0, 1 ); // y direction kernel

        // first column
        vec2 uv = fract(vUv * vec2(2.0, 1.0));

        float tx0y0 = computedGray(uv + texel * vec2( -1, -1 ));
        float tx0y1 = computedGray(uv + texel * vec2( -1,  0 ));
        float tx0y2 = computedGray(uv + texel * vec2( -1,  1 ));

      // second column

        float tx1y0 = computedGray(uv + texel * vec2( 0,  -1 ));
        float tx1y1 = computedGray(uv + texel * vec2( 0,   0 ));
        float tx1y2 = computedGray(uv + texel * vec2( 0,   1 ));

      // third column

        float tx2y0 = computedGray(uv + texel * vec2( 1,  -1 ));
        float tx2y1 = computedGray(uv + texel * vec2( 1,   0 ));
        float tx2y2 = computedGray(uv + texel * vec2( 1,   1 ));

      // gradient value in x direction

        float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
          Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
          Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

      // gradient value in y direction

        float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
          Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
          Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

      // magnitude of the total gradient

        float G = sqrt( ( valueGx * valueGx ) + ( valueGy * valueGy ) );

        // 原来的画面
        vec4 orginColor = texture2D(tDiffuse, uv);
        vec4 outlineColor = vec4(vec3(G) * vec3(1.0, 1.0, 0.0), 1.0);
        vec3 result = mix(orginColor.rgb, outlineColor.rgb, G);
        gl_FragColor = vec4(result, 1.0);
      }
    }
  `
});
shaderPass.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
const outpusPass = new OutputPass();

composer.addPass(renderPass);
composer.addPass(shaderPass);
composer.addPass(outpusPass);



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  // renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  composer.render()
  // shaderMaterial.uniforms.u_time.value += 1;
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