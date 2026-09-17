import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { gsap } from "gsap";

// ============================================================================
// 体积云（Volumetric Cloud / Raymarching）
// ----------------------------------------------------------------------------
// 思路：
//  1. 用一个长方体（Box）圈出"云层所在的空间"，只在这个盒子里做光线步进（raymarching）
//  2. 每条光线在盒子内部按固定步长采样"密度场"，密度来自 3D FBM 噪声（程序化生成，不需要贴图）
//  3. 每个采样点再朝太阳方向做一次"短程步进"，累加出到太阳的光学厚度 → 得到自阴影
//  4. 用 Beer-Lambert 定律（exp(-σ·ds））做前向合成，得到透射率与散射颜色
//  5. 天空用一个巨大的反面球做渐变背景，云用"预乘 Alpha"混合叠加到天空上
//
// ★ 想让云"立体"，下面这 5 件事一个都不能少（都是踩过的坑）：
//  1) 噪声坐标要各向同性：用 世界坐标 / 云块尺寸，而不是盒子的归一化坐标(0~1)。
//     盒子横竖尺寸不同时，用归一化坐标会把噪声拉伸 → 云变成"一片一片"的薄饼。
//  2) 密度映射要用 S 形曲线：线性放大只会得到一层薄雾；S 形才能"边缘过渡 + 内部饱和"。
//  3) 别用"抬高阈值"去削云顶：阈值随高度上升会把云顶压成平缓的坡（像雪原），
//     云顶形状要交给噪声本身（taper 取小值）。
//  4) 光照要有对比：太阳放侧上方，靠"向光步进"算出真实自阴影；环境光压低，受光/背光才分得开。
//  5) 色调映射要在最后统一做：云是预乘 Alpha 叠到天空上的，如果各自先做映射，
//     叠加后会超过 1 被裁成大片纯白 → 所以先渲染到 HDR 缓冲，最后由 OutputPass 统一处理。
//
// 性能与精度的关系（很重要）：
//  可解析的最细细节 ≈ 射线在盒内的长度 / 步数。盒子越大、相机越远，
//  同样的步数就越"糊"。所以场景尺度、云块尺寸、步数是绑在一起调的。
// ============================================================================

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer({ antialias: true })
// 体积渲染是"每像素一次循环"，像素数越多越卡，所以这里限制一下最大像素比
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 处理高分屏
renderer.setClearColor(0x000000, 1) // 设置背景色
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animations);
document.querySelector("#app").appendChild(renderer.domElement)

// 摄像机初始化
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000)
camera.aspect = window.innerWidth / window.innerHeight
camera.updateProjectionMatrix()
camera.position.set(0, 980, 660)
// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true // 开启阻尼
controls.dampingFactor = 0.25 // 阻尼系数
controls.enableZoom = true // 开启缩放
controls.enablePan = true // 开启平移
controls.enableRotate = true // 开启旋转
controls.autoRotate = false // 自动旋转
controls.autoRotateSpeed = 1.0 // 自动旋转速度
controls.target.set(0, 364, -128) // 设置控制器的目标点
controls.update() // 更新控制器

// 创建基础环境
const scene = new THREE.Scene()

// ---------------------------------------------------------------------------
// 后处理：先渲染到 HDR(半浮点) 缓冲，等天空和云都合成完了，最后统一做色调映射
// ---------------------------------------------------------------------------
// 为什么不直接在着色器里做？因为云是"预乘 Alpha"混合到天空上的：
// 如果先把云自己映射到接近 1，再和天空叠加，结果会超过 1 被裁成纯白（大面积死白）。
// 用 OutputPass 就相当于：整个画面在线性空间里合成完，再做一次 ACES + sRGB 输出。
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(new OutputPass())

///--------------------------------------------------------------------

// 主要代码写在这里

// ---------------------------------------------------------------------------
// 可调参数
// ---------------------------------------------------------------------------
const params = {
  // 云层范围（直接用世界坐标，方便和场景/模型对齐）
  cloudBase: 150,      // 云底高度
  cloudTop: 780,       // 云顶高度
  extent: 1200,        // 云层水平范围（正方形边长）
  // 云团形状
  coverage: 0.46,      // 云覆盖率：越大云越多（噪声阈值）
  featureSize: 300,    // 云块尺寸（世界单位）：越大云团越大、越像大积云
  detail: 0.35,        // 边缘细节侵蚀：让轮廓蓬松
  softness: 0.035,     // 边缘过渡宽度：越小云越硬/成团，越大越像薄雾
  taper: 0.1,          // 上窄下宽：太大反而会把云顶压成平缓的坡（就不立体了）
  softBase: 60,        // 云底软过渡厚度（小一点 → 云底像一块平整的"底"）
  softTop: 120,        // 云顶软过渡厚度
  density: 0.024,      // 消光系数：越大越不透光，自阴影也越强
  // 光照
  sunElevation: 37,    // 太阳高度角(度)
  sunAzimuth: 30,      // 太阳方位角(度)：放在相机侧上方，云的受光面/背光面才分得开
  sunIntensity: 1.4,   // 太阳强度
  phaseG: 0.6,         // 相函数各向异性：>0 前向散射（逆光时的银边）
  phaseMix: 0.45,      // 多次散射强度：越大相函数越被抹平（真实云往往偏各向同性）
  shadowStrength: 1.0, // 自阴影强度
  aerial: 0.25,        // 空气透视：远处云融入大气雾的程度（重要的"纵深"线索）
  // 渲染质量
  marchSteps: 128,     // 主步进次数（决定能解析多细的云：步长 ≈ 射线在盒内的长度 / 步数）
  lightSteps: 8,       // 向光步进次数
  // 风
  windSpeed: 0.05,     // 风速
  windAngle: 30,       // 风向(度)
  autoRotate: false,   // 相机自动旋转
  showBox: false,      // 是否显示云层包围盒
  showGround: true,    // 是否显示地面
}

// ---------------------------------------------------------------------------
// 云层包围盒（由 云底/云顶/水平范围 推导，留出软过渡的空间）
// ---------------------------------------------------------------------------
const boxCenter = new THREE.Vector3(0, 0, 0)
const boxSize = new THREE.Vector3(1, 1, 1)
const boxMin = new THREE.Vector3()
const boxMax = new THREE.Vector3()

function updateBox() {
  const minY = params.cloudBase - params.softBase
  const maxY = params.cloudTop + params.softTop
  const half = params.extent * 0.5

  boxMin.set(-half, minY, -half)
  boxMax.set(half, maxY, half)
  boxSize.set(params.extent, maxY - minY, params.extent)

  // 用一个单位立方体做缩放，改参数时盒子跟着变
  boxCenter.copy(boxMin).add(boxMax).multiplyScalar(0.5)
  cloudBox.position.copy(boxCenter)
  cloudBox.scale.copy(boxSize)
  boxHelper.update()
}

// 太阳方向（会由 GUI 的高度角/方位角计算出来）
const sunDir = new THREE.Vector3(0.5, 0.5, 0.5).normalize()

// sRGB 十六进制颜色 → 线性空间（着色器内部统一用线性空间计算）
const toLinear = (hex) => new THREE.Color(hex).convertSRGBToLinear()

// 地平线颜色：天空底部和地面远处共用同一个，接缝才自然
const horizonColor = { value: toLinear(0xc7dcf0) }

// 公共 uniform：天空与云要共享太阳方向、太阳颜色等，保持光照一致
const sharedUniforms = {
  uTime: { value: 0 },
  uSunDir: { value: sunDir },
  uSunColor: { value: toLinear(0xfff8f0) },
  uSunIntensity: { value: params.sunIntensity },
  uAmbientColor: { value: toLinear(0xdce8ff) },
  uPhaseG: { value: params.phaseG },
  uPhaseMix: { value: params.phaseMix },
  uHorizonColor: horizonColor,
}

// ---------------------------------------------------------------------------
// 1. 天空穹顶（渐变天空 + 太阳）
// ---------------------------------------------------------------------------
const skyUniforms = {
  ...sharedUniforms,
  uSkyTop: { value: toLinear(0x24518c) },
}

const skyMaterial = new THREE.ShaderMaterial({
  uniforms: skyUniforms,
  side: THREE.BackSide, // 球的内表面
  depthWrite: false,
  vertexShader: /* glsl */`
    varying vec3 vDir;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      // 从相机指向该顶点的方向，就是该像素对应的视线方向
      vDir = worldPos.xyz - cameraPosition;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 uSkyTop;
    uniform vec3 uHorizonColor;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    varying vec3 vDir;

    void main() {
      vec3 dir = normalize(vDir);
      float h = dir.y;

      // 天空：从地平线色渐变到天顶色（用指数比 smoothstep 更接近真实大气）
      vec3 color = mix(uSkyTop, uHorizonColor, exp(-max(h, 0.0) * 3.0));
      // 地平线以下（地面方向）稍微压暗
      color *= mix(1.0, 0.75, smoothstep(0.0, -0.05, h));

      // 太阳圆盘 + 光晕
      float sun = max(dot(dir, uSunDir), 0.0);
      color += uSunColor * pow(sun, 2000.0) * 6.0;  // 太阳本体
      color += uSunColor * pow(sun, 16.0) * 0.35;   // 大范围光晕
      color += uSunColor * pow(sun, 3.0) * 0.06;    // 天空整体泛亮

      gl_FragColor = vec4(color, 1.0);
    }
  `,
})

const skyDome = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), skyMaterial)
skyDome.frustumCulled = false
scene.add(skyDome)

// ---------------------------------------------------------------------------
// 2. 地面（远处融入地平线色，避免下方出现一大片死平的蓝色）
// ---------------------------------------------------------------------------
const groundMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uGroundColor: { value: toLinear(0x33414d) },
    uHorizonColor: horizonColor, // 与天空用同一个 color 对象，接缝天然对得上
  },
  vertexShader: /* glsl */`
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 uGroundColor;
    uniform vec3 uHorizonColor;
    varying vec3 vWorldPos;

    void main() {
      // 离原点越远越被大气雾覆盖（空气透视）
      float dist = length(vWorldPos.xz);
      float fog = 1.0 - exp(-dist * 0.0012);
      gl_FragColor = vec4(mix(uGroundColor, uHorizonColor, fog), 1.0);
    }
  `,
})

const ground = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), groundMaterial)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// ---------------------------------------------------------------------------
// 2. 体积云
// ---------------------------------------------------------------------------
const cloudUniforms = {
  ...sharedUniforms,
  // 盒子（世界空间 AABB）
  uBoxMin: { value: boxMin },
  uBoxMax: { value: boxMax },
  uBoxSize: { value: boxSize },

  // 形状
  uCoverage: { value: params.coverage },
  uDensity: { value: params.density },
  uFeatureSize: { value: params.featureSize },
  uDetail: { value: params.detail },
  uSoftness: { value: params.softness },
  uTaper: { value: params.taper },
  uBaseY: { value: params.cloudBase },
  uTopY: { value: params.cloudTop },
  uSoftBase: { value: params.softBase },
  uSoftTop: { value: params.softTop },

  // 自阴影
  uShadowStrength: { value: params.shadowStrength },
  uAerial: { value: params.aerial },
  uLightMarchLen: { value: 380 }, // 朝太阳步进的总长度（世界单位）

  // 风
  uWindDir: { value: new THREE.Vector2(1, 0) },
  uWindSpeed: { value: params.windSpeed },
}

const cloudMaterial = new THREE.ShaderMaterial({
  uniforms: cloudUniforms,
  // 步数用宏注入：改步数时重新编译着色器即可（GLSL ES 1.0 要求循环次数为常量）
  defines: {
    MARCH_STEPS: params.marchSteps,
    LIGHT_STEPS: params.lightSteps,
  },
  // 只渲染背面：相机在盒子外和盒子内都能正确触发片元着色器，且不会因为近裁剪面被切掉
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
  // 预乘 Alpha 混合：片元输出的是"已经乘过 alpha 的颜色"，所以源因子用 One
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,

  vertexShader: /* glsl */`
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */`
    precision highp float;

    uniform float uTime;
    uniform vec3  uBoxMin;
    uniform vec3  uBoxMax;
    uniform vec3  uBoxSize;

    uniform float uCoverage;
    uniform float uDensity;
    uniform float uFeatureSize;
    uniform float uDetail;
    uniform float uSoftness;
    uniform float uTaper;
    uniform float uBaseY;
    uniform float uTopY;
    uniform float uSoftBase;
    uniform float uSoftTop;

    uniform vec3  uSunDir;
    uniform vec3  uSunColor;
    uniform float uSunIntensity;
    uniform vec3  uAmbientColor;
    uniform vec3  uHorizonColor;
    uniform float uPhaseG;
    uniform float uPhaseMix;
    uniform float uShadowStrength;
    uniform float uAerial;
    uniform float uLightMarchLen;

    uniform vec2  uWindDir;
    uniform float uWindSpeed;

    varying vec3 vWorldPos;

    #define PI 3.14159265359

    // ---------------- 3D 噪声（hash + 三线性插值 Value Noise）----------------
    float hash13(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float valueNoise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f); // smoothstep 缓和
      return mix(
        mix(mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
        mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
        f.z);
    }

    // 分形布朗运动：多个频率的噪声叠加，得到"云"的层次感
    float fbm5(vec3 p) {
      float sum = 0.0, amp = 0.5, norm = 0.0;
      for (int i = 0; i < 5; i++) {
        sum += amp * valueNoise(p);
        norm += amp;
        p = p * 2.03 + vec3(7.1, 1.3, 3.7);
        amp *= 0.5;
      }
      return sum / norm;
    }

    // 细节层：频率高得多，负责云边缘的"花椰菜"质感
    float fbm4(vec3 p) {
      float sum = 0.0, amp = 0.5, norm = 0.0;
      for (int i = 0; i < 4; i++) {
        sum += amp * valueNoise(p);
        norm += amp;
        p = p * 2.11 + vec3(3.3, 5.9, 1.7);
        amp *= 0.5;
      }
      return sum / norm;
    }

    // ---------------- 密度场 ----------------
    // pos：世界坐标；lodFade：距离越远越小，用来丢掉高频细节（防止远处出现采样噪点）
    float densityAt(vec3 pos, bool withDetail, float lodFade) {
      // 云底/云顶的软过渡（直接用世界高度，改参数时云会跟着动，也保证盒子上下不会被硬切）
      float base = smoothstep(uBaseY, uBaseY + uSoftBase, pos.y) *
                   (1.0 - smoothstep(uTopY - uSoftTop, uTopY, pos.y));
      if (base <= 0.0) return 0.0;

      // ★ 关键：噪声坐标必须是"各向同性"的
      // 用 世界坐标 / 云块尺寸 去采噪声，云块才是三个方向等大的"团"；
      // 如果直接用盒子的归一化坐标(0~1)，横向与纵向尺寸不同，会被拉伸成"一片一片"的薄饼。
      vec3 p = pos / uFeatureSize +
               vec3(uWindDir.x, 0.0, uWindDir.y) * uWindSpeed * uTime;

      float shape = fbm5(p);

      // 阈值随高度抬高 → 云团向上收窄，得到积云那种"上窄下宽"的塔形
      float heightT = clamp((pos.y - uBaseY) / max(uTopY - uBaseY, 1.0), 0.0, 1.0);
      float threshold = (1.0 - uCoverage) + uTaper * heightT * heightT;

      float d = shape - threshold;
      if (d <= 0.0) return 0.0;

      // 把"超出阈值的量"用 S 形曲线映射到 0~1：
      // 边缘平滑过渡，内部快速饱和成实心的云团（直接线性放大只会得到一层薄雾）
      d = clamp(d / max(uSoftness, 0.001), 0.0, 1.0);
      d = d * d * (3.0 - 2.0 * d);

      // 高频细节侵蚀边缘，让轮廓蓬松（不要参与向光步进，省性能）
      // 细节频率要跟步长匹配：比步长还细的部分只会变成噪点
      if (withDetail) {
        float detail = fbm4(p * 4.0 + 13.7);
        d = max(d - detail * uDetail * lodFade, 0.0);
      }

      d *= base;

      // 水平方向在盒子四壁淡出（垂直方向已经由 base 保证为 0）
      vec2 q = (pos.xz - uBoxMin.xz) / uBoxSize.xz;
      vec2 edge = smoothstep(vec2(0.0), vec2(0.10), q) *
                  (1.0 - smoothstep(vec2(0.90), vec2(1.0), q));
      return d * edge.x * edge.y;
    }

    // ---------------- Henyey-Greenstein 相函数 ----------------
    // 已乘 4π 做归一化：各向同性时平均值 ≈ 1
    float hgPhase(float cosTheta, float g) {
      float g2 = g * g;
      float denom = 1.0 + g2 - 2.0 * g * cosTheta;
      return (1.0 - g2) / pow(max(denom, 1e-4), 1.5);
    }

    void main() {
      // ---------------- 构造光线（世界空间）----------------
      vec3 ro = cameraPosition;
      vec3 rd = normalize(vWorldPos - cameraPosition);

      // ---------------- 光线与盒子求交（slab 算法）----------------
      vec3 invRd = 1.0 / rd;
      vec3 tA = (uBoxMin - ro) * invRd;
      vec3 tB = (uBoxMax - ro) * invRd;
      vec3 tNear = min(tA, tB);
      vec3 tFar  = max(tA, tB);

      float tn = max(max(tNear.x, tNear.y), tNear.z);
      float tf = min(min(tFar.x, tFar.y), tFar.z);
      tn = max(tn, 0.0);                     // 相机在盒子内部时，从相机开始
      if (tf <= tn) {                        // 没打中盒子，不输出任何东西
        gl_FragColor = vec4(0.0);
        return;
      }

      // ---------------- 光线步进 ----------------
      float stepLen = (tf - tn) / float(MARCH_STEPS);
      float lightStepLen = uLightMarchLen / float(LIGHT_STEPS);

      // 抖动起点：消除固定步长产生的层状条纹
      float jitter = hash13(vec3(gl_FragCoord.xy, uTime));
      float t = tn + stepLen * jitter;

      float cosTheta = dot(rd, uSunDir);
      // 多次散射近似：真实云内部散射多次，相函数会被"抹平"，否则逆光观察时会过暗
      float phase = mix(1.0, hgPhase(cosTheta, uPhaseG), uPhaseMix);

      vec3 scatter = vec3(0.0);   // 累积的散射颜色（预乘）
      float transmittance = 1.0;  // 剩余透射率

      for (int i = 0; i < MARCH_STEPS; i++) {
        vec3 pos = ro + rd * t;

        // 距离 LOD：远处的云丢掉高频细节，既防混叠也省性能
        float lodFade = exp(-t * 0.0008);
        float d = densityAt(pos, true, lodFade);

        // 已经几乎不透光了就不用继续累加（用权重代替 break，兼容 GLSL ES 1.0）
        float alive = step(0.005, transmittance) * step(0.001, d);

        if (alive > 0.5) {
          // ---- 朝太阳方向短程步进，得到该点的光照透射率（自阴影）----
          float lightDepth = 0.0;
          vec3 lp = pos;
          for (int j = 0; j < LIGHT_STEPS; j++) {
            lp += uSunDir * lightStepLen;
            lightDepth += densityAt(lp, false, 1.0);
          }
          float sunTrans = exp(-lightDepth * lightStepLen * uDensity);
          sunTrans = mix(1.0, sunTrans, uShadowStrength);

          // ---- 着色：太阳散射 + 天空环境光 ----
          float heightT = clamp((pos.y - uBaseY) / max(uTopY - uBaseY, 1.0), 0.0, 1.0);
          // powder：云越薄越靠近受光面，边缘亮、内部暗，体积感就出来了
          float powder = 1.0 - exp(-d * 6.0);
          vec3 lit = uSunColor * sunTrans * phase * uSunIntensity * mix(1.0, powder, 0.5);
          // 环境光：越靠云顶越亮；再用 sunTrans 压暗内部（代价极低的 AO 近似）
          // 环境光压低一点，受光面/背光面才能拉开，画面才有立体感
          vec3 ambient = uAmbientColor * (0.15 + 0.85 * heightT) * (0.2 + 0.8 * sunTrans);
          vec3 color = lit + ambient;

          // ---- 空气透视：越远的云越被大气雾染成天空色（近处清晰、远处发白变蓝）----
          // 这是让画面立刻产生"纵深"的关键：没有它，远近云都是同一个白色，看上去就是一整块
          float aerialT = (1.0 - exp(-t * 0.0005)) * uAerial;
          color = mix(color, uHorizonColor, aerialT);

          // ---- Beer-Lambert 前向合成 ----
          float sigma = d * uDensity * stepLen;
          float alpha = 1.0 - exp(-sigma);
          scatter += transmittance * alpha * color;
          transmittance *= exp(-sigma);
        }

        t += stepLen;
      }

      // 输出预乘 Alpha 的线性颜色。
      // 注意：这里不要自己做色调映射 / sRGB 转换，
      // 那会把"已经映射到接近 1"的云和后面的天空叠加后推到 1 以上 → 整片死白。
      // 统一交给最后的 OutputPass 处理。
      gl_FragColor = vec4(scatter, 1.0 - transmittance);
    }
  `,
})

const cloudBox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1), // 单位立方体，靠 scale 控制大小
  cloudMaterial
)
scene.add(cloudBox)

// 盒子线框（方便理解云被哪个范围限制住了，默认隐藏）
const boxHelper = new THREE.BoxHelper(cloudBox, 0x00ffff)
boxHelper.visible = false
scene.add(boxHelper)

///--------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GUI 与参数更新
// ---------------------------------------------------------------------------
function updateSun() {
  const el = THREE.MathUtils.degToRad(params.sunElevation)
  const az = THREE.MathUtils.degToRad(params.sunAzimuth)
  sunDir
    .set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az))
    .normalize()
}
updateSun()

function updateWind() {
  const a = THREE.MathUtils.degToRad(params.windAngle)
  cloudUniforms.uWindDir.value.set(Math.cos(a), Math.sin(a))
}

// 改步数需要重新编译着色器
function updateSteps() {
  cloudMaterial.defines.MARCH_STEPS = params.marchSteps
  cloudMaterial.defines.LIGHT_STEPS = params.lightSteps
  cloudMaterial.needsUpdate = true
}

const cloudGui = gui.addFolder('云层形状')
cloudGui.add(params, 'cloudBase', 0, 2000, 10).name('云底高度').onChange(v => { cloudUniforms.uBaseY.value = v; updateBox() })
cloudGui.add(params, 'cloudTop', 100, 4000, 10).name('云顶高度').onChange(v => { cloudUniforms.uTopY.value = v; updateBox() })
cloudGui.add(params, 'extent', 600, 4000, 50).name('水平范围').onChange(updateBox)
cloudGui.add(params, 'coverage', 0, 1, 0.01).name('覆盖率').onChange(v => cloudUniforms.uCoverage.value = v)
cloudGui.add(params, 'featureSize', 60, 1200, 10).name('云块尺寸').onChange(v => cloudUniforms.uFeatureSize.value = v)
cloudGui.add(params, 'detail', 0, 1, 0.01).name('边缘细节').onChange(v => cloudUniforms.uDetail.value = v)
cloudGui.add(params, 'softness', 0.01, 0.3, 0.005).name('边缘过渡').onChange(v => cloudUniforms.uSoftness.value = v)
cloudGui.add(params, 'taper', 0, 0.6, 0.01).name('上窄下宽').onChange(v => cloudUniforms.uTaper.value = v)
cloudGui.add(params, 'softBase', 10, 400, 5).name('云底过渡').onChange(v => { cloudUniforms.uSoftBase.value = v; updateBox() })
cloudGui.add(params, 'softTop', 10, 800, 5).name('云顶过渡').onChange(v => { cloudUniforms.uSoftTop.value = v; updateBox() })
cloudGui.add(params, 'density', 0.001, 0.05, 0.001).name('密度/消光').onChange(v => cloudUniforms.uDensity.value = v)

const lightGui = gui.addFolder('光照')
lightGui.add(params, 'sunElevation', -10, 90, 1).name('太阳高度角').onChange(updateSun)
lightGui.add(params, 'sunAzimuth', 0, 360, 1).name('太阳方位角').onChange(updateSun)
lightGui.add(params, 'sunIntensity', 0, 6, 0.05).name('太阳强度').onChange(v => sharedUniforms.uSunIntensity.value = v)
lightGui.add(params, 'phaseG', 0, 0.9, 0.01).name('前向散射').onChange(v => sharedUniforms.uPhaseG.value = v)
lightGui.add(params, 'phaseMix', 0, 1, 0.01).name('多次散射').onChange(v => sharedUniforms.uPhaseMix.value = v)
lightGui.add(params, 'shadowStrength', 0, 1, 0.01).name('自阴影').onChange(v => cloudUniforms.uShadowStrength.value = v)
lightGui.add(params, 'aerial', 0, 1, 0.01).name('空气透视').onChange(v => cloudUniforms.uAerial.value = v)

const renderGui = gui.addFolder('渲染质量')
renderGui.add(params, 'marchSteps', 32, 192, 16).name('主步进次数').onFinishChange(updateSteps)
renderGui.add(params, 'lightSteps', 2, 12, 1).name('向光步进次数').onFinishChange(updateSteps)
renderGui.add(params, 'autoRotate').name('相机自动旋转').onChange(v => controls.autoRotate = v)

const windGui = gui.addFolder('风')
windGui.add(params, 'windSpeed', 0, 0.5, 0.005).name('风速').onChange(v => cloudUniforms.uWindSpeed.value = v)
windGui.add(params, 'windAngle', 0, 360, 1).name('风向').onChange(updateWind)
updateWind()

updateBox() // 根据当前参数初始化云层包围盒

gui.add(params, 'showBox').name('显示云层包围盒').onChange(v => boxHelper.visible = v)
gui.add(params, 'showGround').name('显示地面').onChange(v => ground.visible = v)

///--------------------------------------------------------------------

// 渲染场景
const timer = new THREE.Timer()

function animations(timestamp) {
  timer.update(timestamp)
  cloudUniforms.uTime.value = timer.getElapsed()

  composer.render() // 用 composer 渲染（自带色调映射与 sRGB 输出）
  controls.update() // 更新控制器
  stats.update();
}

// 其他功能
window.onresize = () => {
  // 重新获取宽高并且渲染
  const width = Math.ceil(window.innerWidth)
  const height = Math.ceil(window.innerHeight)
  renderer.setSize(width, height)
  composer.setSize(width, height) // 后处理缓冲也要跟着改
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
