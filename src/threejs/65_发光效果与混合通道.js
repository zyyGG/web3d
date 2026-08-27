import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";

// 后处理通道
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"



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


// 初始化后处理通道
const renderScene = new RenderPass( scene, camera)

const bloomPass = new UnrealBloomPass(new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = 0;
bloomPass.strength = 0;
bloomPass.radius = 1;

const bloomComposer = new EffectComposer( renderer );
bloomComposer.renderToScreen = false;
bloomComposer.addPass( renderScene );
bloomComposer.addPass( bloomPass );

// 混合通道
const mixPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: {value: null},
      bloomTexture: { value: bloomComposer.renderTarget2.texture}, // 将bloomComposer的结果作为输入
    },
    vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
      varying vec2 vUv;

      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;

      void main( ){
        gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4(1.0) * texture2D( bloomTexture, vUv ) );
      }
    `,
    defines: {}, // 一些宏定义
  }),
  "baseTexture" // 指定输入纹理名称
);

mixPass.needsSwap = true // 需要交换缓冲区

const outputPass = new OutputPass();

const finalComposer = new EffectComposer( renderer );
finalComposer.addPass( renderScene );
finalComposer.addPass( mixPass );
finalComposer.addPass( outputPass );

// 分层
const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

const materials = {};
const darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );

// 主要代码写在这里
// 标准方块
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// 线条
const lineCube = new THREE.LineSegments( new THREE.EdgesGeometry( cube.geometry ), new THREE.LineBasicMaterial( { color: "#7000ff" } ) );
lineCube.scale.multiplyScalar(1.01) // 放大一点，防止z-fighting
scene.add( lineCube );
lineCube.layers.enable( BLOOM_SCENE );

// 星空材质
const materialStars = new THREE.ShaderMaterial({
  uniforms: {
    image: { value: new THREE.TextureLoader().load('/textures/night_star.jpg') },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;

    uniform sampler2D image;

    void main(){
      vec4 imageColor = texture2D(image, gl_FragCoord.xy / vec2( ${window.innerWidth}, ${window.innerHeight} ));
      // 变暗处理
      imageColor *= 0.02;
      // 
      gl_FragColor = imageColor;
    }
  `,
})
// cube.material = materialStars

material.transparent = true
material.opacity = 1
material.needsUpdate = true

lineCube.material.transparent = true
lineCube.material.opacity = 0
lineCube.material.needsUpdate = true

const tl1 = gsap.timeline()
  .to(material, {
    duration:1,
    ease:"power1.inOut",
    opacity:0.0,
    onComplete: () => {
      cube.material = materialStars
    }
  })
  .to(lineCube.material, {
    duration:1,
    ease:"power1.inOut",
    opacity: 1,
  })
  .to(bloomPass, {
    duration:1,
    ease:"power1.inOut",
    strength: 0.7,
    onUpdate: () => {
      gui.updateDisplay()
    }
  }, "-=2")
  .pause()

const tl2 = gsap.timeline()
  .to(bloomPass, {
    duration:1,
    ease:"power1.inOut",
    strength: 0.0,
    onUpdate: () => {
      gui.updateDisplay()
    }
  })
  .to(lineCube.material, {
    duration:1,
    ease:"power1.inOut",
    opacity: 0,
  }, "-=1")
  .to(material, {
    duration:1,
    ease:"power1.inOut",
    opacity:1,
    onStart: () => {
      cube.material = material
    }
  }, "-=1")
  .pause()

// tl1.eventCallback("onComplete", () => {
//   console.log("tl1 complete")
//   tl2.play()
// })
// tl2.eventCallback("onComplete", () => {
//   console.log("tl2 complete")
//   tl1.play()
// })

// 创建GUI
const params = {
  toggleBloom: () => {
    if(tl1.isActive() || tl2.isActive()) return
    if(material === cube.material){
      tl1.restart()
    }else{
      tl2.restart()
    }
  },
  color: "#7000ff",
};

gui.add( params, 'toggleBloom' ).name('开始切换动画');
gui.addColor( params, 'color' ).name('线条颜色').onChange( (val) => {
  lineCube.material.color = new THREE.Color(val)
});


const bloomGui = gui.addFolder('bloom')
bloomGui.open()
bloomGui.add( bloomPass, 'strength', 0.0, 3.0 ).step(0.1).name('强度')
bloomGui.add( bloomPass, 'radius', 0.0, 1.0 ).step(0.01).name('半径')
bloomGui.add( bloomPass, 'threshold', 0.0, 1.0 ).step(0.01).name('阈值')



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  // renderer.render(scene, camera)
  // 遍历所有的模型，将不在Bloom层的模型替换为黑色
  scene.traverse( (obj) => {
    if ( bloomLayer.test( obj.layers ) === false ) {
        materials[ obj.uuid ] = obj.material;
        obj.material = darkMaterial;
      }
  });
  bloomComposer.render()
  // 恢复原来的材质
  scene.traverse( (obj) => {
    if ( materials[ obj.uuid ] ) {
        obj.material = materials[ obj.uuid ];
        delete materials[ obj.uuid ];
      }
  });
  // 使用混合通道渲染最终结果
  finalComposer.render()
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