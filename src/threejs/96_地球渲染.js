import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { Line2 } from "three/examples/jsm/lines/webgpu/Line2.js";
import { LineMaterial, LineGeometry } from "three/examples/jsm/Addons.js";



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

let helpParams =  {
  gridHelper: true,
  directionalLightHelper: true,
  axesHelper: true,
}
const helpControls = gui.addFolder('辅助器控制')

function saveControlHelps(){
  console.log(helpParams)
  localStorage.setItem('helpControls', JSON.stringify(helpParams));
}

function loadControlHelps(){
  helpParams = JSON.parse(localStorage.getItem('helpControls'));
  gridHelper.visible = helpParams.gridHelper;
  directionalLightHelper.visible = helpParams.directionalLightHelper;
  axesHelper.visible = helpParams.axesHelper;
  helpControls.add( helpParams, 'gridHelper' ).name('grid辅助器').onChange(value => {gridHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'directionalLightHelper' ).name('平行光辅助器').onChange(value => {directionalLightHelper.visible = value; saveControlHelps()} );
  helpControls.add( helpParams, 'axesHelper' ).name('坐标辅助器').onChange(value => {axesHelper.visible = value; saveControlHelps()} );
}

loadControlHelps()

///--------------------------------------------------------------------

camera.position.set(-5, 10, -15)
camera.fov = 45
// camera
ambientLight.intensity = 0.5

const updateMaterials = []
  
// 环境贴图
const hdrLoader= new HDRLoader()
const envMap = await hdrLoader.loadAsync('/hdr/space_area_.hdr')
envMap.mapping = THREE.EquirectangularReflectionMapping // 设置映射类型
// scene.background = envMap
scene.environment = envMap // 环境空间
// 主要代码写在这里
// const bufferGeometry = new THREE.BufferGeometry()

const earthGroup = new THREE.Group()
scene.add(earthGroup)

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(10, 64, 64),
  new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load("/highLevel/night16384x8192.jpg"),
    metalness: 0.1,
    roughness: 0.8,
    side: THREE.DoubleSide,
    // wireframe: true,
  })
)
earthGroup.add(earth)

// 创建一个球壳罩住地球
const earthShell = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.SphereGeometry(10.1, 128, 256), 0.1),
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uWrireframeColor: { value: new THREE.Color(0x999999) },
      uRadius: { value: 10.1 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uWrireframeColor;
      uniform float uRadius;

      void main() {
        float normalizeY = (vPosition.y / uRadius + 1.0) / 2.0; // 将y坐标归一化到0-1之间
        float diff = 0.05;
        float b = fract(uTime * 0.05); // 0.0 - 1.0
        float t = smoothstep(b, b + 0.01, normalizeY) - smoothstep(b + diff, b + diff + 0.01, normalizeY);
        vec3 color = uWrireframeColor;
        gl_FragColor = vec4(color * t, t);
      }
    `,
    // wireframe: true,
    transparent: true,
    // side: THREE.DoubleSide,
  })
)
earthGroup.add(earthShell)



const PROVINCE_RADIUS = 10.08 // 
const provinceGroup = new THREE.Group()
const provinceMap = new Map() // 省份名称和对应的线段对象

// 将经纬度坐标转为球面坐标
function latlngToVec3(lng, lat, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function buildProvinceGeometry(ring, radius) {
  // ring: [[lng, lat], [lng, lat], ...]

  // 1. 直接在经纬度 2D 空间创建 Shape
  const contourVec2 = ring.map(([lng, lat]) => new THREE.Vector2(lng, lat));
  const shape = new THREE.Shape(contourVec2);

  // 1.1 挤出模型
  const extrudeSettings = {
    steps: 1, // 挤出分段数
    depth: 1, // 挤出深度
    bevelEnabled: false, // 关闭斜角
  }

  // 2. ShapeGeometry 在 2D 平面做三角剖分
  const extrudeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // 3. 将每个顶点从 (lng, lat) 映射到球面 3D
  const posAttr = extrudeGeo.getAttribute('position');
  const positions = new Float32Array(posAttr.count * 3);
  const normals = new Float32Array(posAttr.count * 3);
  const uvs = new Float32Array(posAttr.count * 2);

  for (let i = 0; i < posAttr.count; i++) {
    const lng = posAttr.getX(i);   // 经度
    const lat = posAttr.getY(i);   // 纬度
    const z = posAttr.getZ(i);   // 挤出深度

    const r = radius + z * 0.1; // 挤出深度映射到球面半径上
    const v = latlngToVec3(lng, lat, r);
    positions[i * 3]     = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;

    const n = v.clone().normalize(); // 法线向量
    normals[i * 3]     = n.x;
    normals[i * 3 + 1] = n.y;
    normals[i * 3 + 2] = n.z;

    // 每个mesh的uv都是独立的, 从左往右0 - 1, 从下往上0 - 1
    const uv = v.clone().normalize(); // 法线向量
    uv.x = (uv.x + 1) / 2; // +1 映射到 0 - 1
    uv.y = (uv.y + 1) / 2;
    uvs[i * 2]     = uv.x;
    uvs[i * 2 + 1] = uv.y;

  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(extrudeGeo.getIndex());

  return geometry;
}

// 均匀降采样：每隔 N 个点取一个
function simplifyRing(ring, keepEvery = 5) {
  const result = [ring[0]]; // 保留第一个
  for (let i = keepEvery; i < ring.length - 1; i += keepEvery) {
    result.push(ring[i]);
  }
  result.push(ring[ring.length - 1]); // 保留最后一个
  return result;
}

async function loadProvinceData() {
  const res = await fetch('/geojson/china.json')
  const geojson = await res.json()

  const meshMaterial = new THREE.ShaderMaterial({
    uniforms: {
      
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vUv = uv;
        vNormal = normal;
        vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        // 菲涅尔边缘效果
        
        // float fresnel = pow(1.0 - max(dot(normalize(vViewPosition), normalize(vNormal)), 0.0), 3.0);
        // float edge = smoothstep(0.0, 0.1, fresnel);
        // vec3 color = mix(vec3(0.0, 0.5, 1.0), vec3(1.0, 1.0, 1.0), fresnel);
        gl_FragColor = vec4(vec3(vUv.x), 1.0);
      }
    `,
  })

  geojson.features.forEach((feature, idx) => {
    const name = feature.properties.name;
    const coords = feature.geometry.coordinates
    const geometryType = feature.geometry.type

    let ring;
    if (geometryType === 'Polygon') {
      ring = coords[0];           // Polygon: coords[0] 就是外环
    } else if (geometryType === 'MultiPolygon') {
      ring = coords[0][0];        // MultiPolygon: coords[0][0] 是第一个多边形的外环
    }

    // 转换到球面上
    const simplifiedRing = simplifyRing(ring, 1); // 每3个取1个

    // 构件几何体
    const geometry = buildProvinceGeometry(simplifiedRing, PROVINCE_RADIUS);

    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.userData = {
      provinceName: name,
      // originalColor: material.color.clone(),
    }

    // 替换为：干净的顶部边界环线（在挤出顶面半径处）
    const topRadius = PROVINCE_RADIUS + 0.1; // 比图形大一点
    const borderPts = simplifiedRing.map(([lng, lat]) =>
      latlngToVec3(lng, lat, topRadius)
    );
    borderPts.push(borderPts[0].clone()); // 闭合

    const borderGeo = new LineGeometry().setFromPoints(borderPts);
    const borderLine = new Line2(
      borderGeo,
      new LineMaterial({ 
        color: new THREE.Color(0x00ffff), 
        linewidth: 0.001, // 这个值不能太大了
       }),
    );
    provinceGroup.add(borderLine);

    provinceGroup.add(mesh);
    provinceMap.set(name, mesh);
  })
  earthGroup.add(provinceGroup)
  console.log('省份加载完成，共', provinceMap.size, '个');

}

// 加载geojson数据
loadProvinceData()


// 放置平面到某个点的功能
const pointsGroup = new THREE.Group()
scene.add(pointsGroup)
function plancePoint(lng, lat, color = 0xff0000) {
  const position = latlngToVec3(lng, lat, PROVINCE_RADIUS + 0.2);
  const lookAtTarget = latlngToVec3(lng, lat, PROVINCE_RADIUS + 1.0); // 让平面朝向地球中心
  const point = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.1),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(color) },
        uRadius: { value: 0.05 }, // 中心点的圆心大小
        uRingSize: { value: 0.1 }, // 环的大小
        uRandomStart: { value: Math.random() * 10.0 }, // 随机起始时间
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
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uRadius;
        uniform float uRingSize;
        uniform float uRandomStart;

        float sdf_circle(vec2 uv, float radius) {
          return length(uv - vec2(0.5)) - radius;
        }

        void main() {
          float rs = uRingSize; // ring size
          float timeFactor = fract((uTime + uRandomStart) * 0.1); // 0 - 1
          float sp = timeFactor * 0.3 + 0.2; // 0 - 1
          vec3 color = uColor;
          float c1 = sdf_circle(vUv, sp);
          float c2 = sdf_circle(vUv, sp - rs);
          float c3 = sdf_circle(vUv, uRadius);
          float c = max(0.0, min(-c1, c2)); // 混合
          c = max(c, -c3); // 限制在圆内
          c = smoothstep(0.0, 0.001, c); // 边缘平滑
          float alpha = mix(c, c * -0.1, timeFactor);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
    })
  )
  updateMaterials.push(point.material) // 添加到更新列表中
  point.position.copy(position);
  point.lookAt(lookAtTarget);
  pointsGroup.add(point);
}

plancePoint(116.4074, 39.9042) // 北京
plancePoint(121.4737, 31.2304) // 上海
plancePoint(113.2644, 23.1291) // 广州
plancePoint(114.3055, 30.5928) // 武汉
plancePoint(104.0665, 30.5728) // 成都
plancePoint(108.9398, 34.3416) // 西安
plancePoint(120.1551, 30.2741) // 杭州
plancePoint(106.5516, 29.5630) // 重庆



// 色彩飞线
const linesGroup = new THREE.Group() // 统一管理飞线
scene.add(linesGroup)
function createColorfulLine(startLng, startLat, endLng, endLat, height = 0.5, backColor = 0x33ff33, frontColor = 0x00ff00) {
  const startPos = latlngToVec3(startLng, startLat, PROVINCE_RADIUS + 0.2);
  const endPos = latlngToVec3(endLng, endLat, PROVINCE_RADIUS + 0.2);
  const midPos = startPos.clone().lerp(endPos, 0.5).normalize().multiplyScalar(PROVINCE_RADIUS + height); // 中间点抬高

  const curve = new THREE.QuadraticBezierCurve3(startPos, midPos, endPos); // 使用二次贝塞尔曲线生成飞线
  const points = curve.getPoints(100); // 采样点

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setAttribute('aProgress', new THREE.BufferAttribute(
    new Float32Array(
      points.map((_, i) => i / (points.length - 1)) // 这里把每个点的进度存储在aProgress属性中，范围是0到1
    ), 1
  ))
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0.0 },
      uBaseColor: { value: new THREE.Color(backColor) },
      uMoveColor: { value: new THREE.Color(frontColor) },
      uRandomTime: { value: Math.random() * 10.0 }, // 随机起始时间
    },
    vertexShader: /* glsl */`
      attribute float aProgress;
      varying float vProgress;
      void main() {
        vProgress = aProgress;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uMoveColor;
      uniform float uRandomTime;

      varying float vProgress;

      void main() {
        // 光带头部位置：始终从 start(0) 往 end(1) 走
        float head = fract((uTime + uRandomTime) * 0.1);

        // 尾巴范围：[head - uTailLength, head]
        float trail = smoothstep(head - 0.1, head, vProgress);
        trail *= 1.0 - smoothstep(head, head + 0.2, vProgress); // 尾巴渐隐

        vec3 color = mix(uBaseColor, uMoveColor, trail);
        float alpha = trail; // 透明度随尾巴渐隐
        gl_FragColor = vec4(color, alpha);
      }
    `
  })
  const line = new THREE.Line(geometry, material);
  updateMaterials.push(material) // 添加到更新列表中
  // linesGroup.add(line);
  scene.add(line) // 直接添加到场景中
}

createColorfulLine(116.4074, 39.9042, 121.4737, 31.2304) // 北京 -> 上海
createColorfulLine(116.4074, 39.9042, 113.2644, 23.1291) // 北京 -> 广州
createColorfulLine(116.4074, 39.9042, 114.3055, 30.5928) // 北京 -> 武汉
createColorfulLine(116.4074, 39.9042, 104.0665, 30.5728) // 北京 -> 成都
createColorfulLine(104.0665, 30.5728, 108.9398, 34.3416) // 成都 -> 西安
createColorfulLine(104.0665, 30.5728, 106.5516, 29.5630) // 成都 -> 重庆
createColorfulLine(104.0665, 30.5728, 114.3055, 30.5928) // 成都 -> 重庆


updateMaterials.push(earthShell.material) // 添加到更新列表中
function updateUniforms(){
  updateMaterials.forEach(mat => {
    mat.uniforms.uTime.value += 0.01
  })
}



///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
  controls.update() // 更新控制器
  stats.update();
  // 星球自转
  try{
    // earth && (earth.rotation.y += 0.001)
    updateUniforms()
  } catch(e) {}
  
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