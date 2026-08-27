import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/Addons.js";



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

// css2d渲染器
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
camera.position.set(0, 5, 5)
// 创建轨道控制器
const controls = new OrbitControls(camera, labelRenderer.domElement)
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
// const spriteMaterial = new THREE.SpriteMaterial({
//   map: texture,
//   transparent: true,
//   opacity: 1,
// })





const speMaterial = new THREE.SpriteMaterial({
  map: texture,
  transparent: true, // 开启透明度
  depthTest: false, // 禁用深度测试
  // 可以放大
  sizeAttenuation: false, // 禁用大小衰减
})

speMaterial.onBeforeCompile = shader => {
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `
    #include <common>
    varying vec2 vUv;
    `
  )
  shader.vertexShader = shader.vertexShader.replace(
    '#include <fog_vertex>',
    `
    #include <fog_vertex>
    vUv = uv;
    `
  )

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `
    #include <common>
    varying vec2 vUv;
    `
  )
  
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `
    #include <map_fragment>
    diffuseColor = diffuseColor; // 确保颜色不受纹理影响
    vec3 borderColor = vec3(1.0, 0.0, 0.0); // 红色边框
    float borderWidth = 0.05; // 边框宽度
    float circle1 = length(vUv - vec2(0.5)) - 0.47;
    float circle2 = length(vUv - vec2(0.5)) - (0.47 - borderWidth);
    float circle = max(circle1, -circle2);
    circle = step(0.0, circle); 
    vec3 innerTexture = diffuseColor.rgb * (1.0 - step(0.0, circle1)); // 内部纹理颜色
    innerTexture = mix(vec3(1.0), innerTexture, diffuseColor.a); // 混合颜色
    innerTexture = mix(borderColor, innerTexture , circle); // 混合边框颜色
    float alpha = (1.0 - circle) + (1.0 - step(0.0, circle2));
    diffuseColor = vec4(innerTexture, alpha);
    `
  )
}
// const spriteMaterial = new THREE.ShaderMaterial({
//   uniforms: {
//     map: { value: texture },
//   },
//   transparent: true,
//   depthTest: false,
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       // 获取世界空间下的相机右和上方向
//       vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
//       vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
//       // sprite的本地坐标
//       vec2 pos = position.xy;
//       // 计算sprite在世界空间的位置
//       vec3 billboardPos = cameraRight * pos.x + cameraUp * pos.y;
//       // 将sprite中心点变换到世界空间
//       vec4 worldPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
//       // 最终顶点位置
//       gl_Position = projectionMatrix * viewMatrix * vec4(worldPos.xyz + billboardPos, 1.0);
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//       gl_PointSize = 100.0; // 设置点大小
//     }
//   `,
//   fragmentShader: `
//     uniform sampler2D map;
//     varying vec2 vUv;
//     float sdfCircle(vec2 p, float r, vec2 offset) {
//       p -= offset;
//       return length(p) - r;
//     }

//     float sdfBox(vec2 p, vec2 b, vec2 offset){
//       p -= offset;
//       vec2 d = abs(p) - b;
//       return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
//     }
//     void main() {
//       vec2 uv = vUv;
//       float circle = sdfCircle(uv, 0.5, vec2(0.5, 0.5));
//       circle = smoothstep(0.0, 0.01, circle);
      
//       float boxBorderSize = 0.03;
//       float boxSize = 0.47;
//       float boxOut = sdfCircle(uv, boxSize, vec2(0.5));
//       float boxInner = sdfCircle(uv, boxSize - boxBorderSize, vec2(0.5));
//       float box = max(min(boxOut, boxInner), -max(boxOut, boxInner));  // xor
//       // float box = min(boxOut, circle); // and
//       // float box = max(boxOut, circle); // or
//       // float box = max(-boxOut, circle); // left subtraction
//       // float box = max(boxOut, -circle); // right subtraction
//       box = smoothstep(0.0, 0.01, box);

//       vec4 texture = texture2D(map, uv + vec2(-0.015, 0.0));
//       float alpha = 1.0 - step(0.0, boxOut);
//       vec3 innerColor = mix(vec3(1.0), texture.rgb, texture.a); // 内部的颜色
//       vec3 color = mix(vec3(1.0, 0.0, 0.0), innerColor, box); // 这里是边框颜色
//       gl_FragColor = vec4(color, alpha);
//     }
//   `,
// })

const sprites = new THREE.Group() // 创建一个组来存放精灵
for(let i = 0; i < 10; i++) {
  // const sprite = new THREE.Sprite(spriteMaterial)
  // const sprite = new THREE.Mesh(spriteGeo, speMaterial) // 使用平面几何体创建精灵
  const sprite = new THREE.Sprite(speMaterial) // 使用精灵材质创建精灵
  sprite.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5)
  sprite.scale.set(0.1, 0.1, 0.1) // 设置大小
  sprite.userData = {
    name: `sprite-${i}`,
    field: "test",
    sex: Math.random() > 0.5 ? "男" : "女",
    age: Math.floor(Math.random() * 100),
    isPersonSprite: true, // 标记为人物精灵
  }
  sprites.add(sprite) // 将精灵添加到组中
  sprite.hasEventListener = true
}
scene.add(sprites)

// 创建style
const style = document.createElement('style')
style.type = 'text/css'
style.innerHTML = `
.container{
  --height: 160px;
  width: 100px;
  height: var(--height);
}
.label-container {
  width: 100px;
  height: calc(var(--height) - 20px);
  position:absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 1);
  border-radius: 4px;
  border: 5px solid #ff0000;
}
.container::after {
  content: '';
  border:10px solid transparent;
  border-top-color: #ff0000;
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
}
.label-item {
  padding: 4px;
  font-size: 12px;
  color: #333;
  border-bottom: 1px solid #ccc;
}
`
document.head.appendChild(style)

function createHTMLLabel(data){
  const container = document.createElement('div');
  container.className = 'container';

  const containerDiv = document.createElement('div');
  containerDiv.className = 'label-container';

  container.appendChild(containerDiv);

  for (const key in data) {
    if(['isPersonSprite'].includes(key)) continue // 跳过标记字段
    const value = data[key];
    const labelDiv = document.createElement('div');
    labelDiv.textContent = `${key}: ${value}`;
    labelDiv.className = 'label-item';
    containerDiv.appendChild(labelDiv);
  }

  const label = new CSS2DObject(container);
  label.center.set(0.5, 1)
  return label// 创建CSS2D对象
}

// 特殊的sprite
// const sprite = new THREE.Sprite(
//   new THREE.SpriteMaterial({
//     map: texture,
//     depthTest: false,
//   })
// )
// sprite.position.set(3, 0, 0)
// sprite.scale.set(1, 1, 1) // 设置大小
// sprites.add(sprite) // 将精灵添加到组中

// console.log(sprite.material, sprites.children[0].material)
// sprite悬停
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
// raycaster.layers.disableAll() // 禁用所有层

// 显示所有第二层的元素
// console.log("所有第二层的元素：", scene.children.filter(child => child))
let infoSprite = null
let isMouseMove = false

window.addEventListener('click', (event) => {
  // 将鼠标位置转换为标准化设备坐标 (-1 到 +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // 更新射线投射器
  raycaster.setFromCamera(mouse, camera)

  // 检测与精灵的交互
  const intersects = raycaster.intersectObjects(sprites.children, true)
  if(!isMouseMove) {
    infoSprite && scene.remove(infoSprite)
    infoSprite = null
  }
  

  if (intersects.length > 0) {
    infoSprite && scene.remove(infoSprite)
    infoSprite = null
    isMouseMove = false
    const intersectedObject = intersects[0].object
    if (intersectedObject instanceof THREE.Sprite || intersectedObject.userData.isPersonSprite) {
      infoSprite = createHTMLLabel(intersectedObject.userData)
      infoSprite.position.set(intersectedObject.position.x, intersectedObject.position.y + 1.0, intersectedObject.position.z)
      scene.add(infoSprite)
    }
  }
})

window.addEventListener("mousemove", (event) => {
  isMouseMove = true
})



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  labelRenderer.render(scene, camera); // 渲染CSS2D对象
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
  labelRenderer.setSize( window.innerWidth, window.innerHeight );
}