import * as Cesium from "cesium";

// ============================================================================
// 点击按钮 → 场景变暗 → OSM 建筑变半透明 + 边缘发光 → 镜头飞向自己的电梯模型
//           → 电梯高亮 + 运行轨迹线 + 方向指示
// ----------------------------------------------------------------------------
// 为什么建筑"边缘线条"不用 PostProcessStageLibrary.createSilhouetteStage？
// 那个效果基于深度缓冲做 Sobel。Cesium 里 3D Tiles 一旦变成半透明就进入
// 半透明通道，而半透明通道 depthMask = false（见 AlphaPipelineStage.js），
// 不写深度 → 深度边缘检测直接失效。所以这里改用 CustomShader 的 Fresnel
// 边缘发光（视线与法线夹角越小越亮），不依赖深度，半透明下依然有效。
// ============================================================================

// 全屏渐晕 / 轻微压暗。作用在所有物体之上，所以只做"氛围"，主体压暗交给影像层
const VIGNETTE_FS = /* glsl */ `
uniform sampler2D colorTexture;
uniform float u_dim;
uniform float u_vignette;
in vec2 v_textureCoordinates;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float d = clamp(length(v_textureCoordinates - vec2(0.5)) * 1.41421356, 0.0, 1.0);
  float v = mix(1.0, smoothstep(0.15, 1.0, d), u_vignette);
  out_FragColor = vec4(color.rgb * u_dim * v, color.a);
}
`;

// OSM 建筑：本体半透明 + 边缘 Fresnel 发光
// u_mix 是 0→1 的整体混合系数，为 0 时完全保持原始外观，避免开启瞬间跳色
const XRAY_FS = /* glsl */ `
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  vec3 n = normalize(fsInput.attributes.normalEC);    // 眼空间法线
  vec3 v = normalize(-fsInput.attributes.positionEC); // 指向相机的视线
  // abs() 让"看穿"到内壁时也有边缘光，否则内表面全黑
  float rim = pow(1.0 - abs(dot(n, v)), u_rimPower);

  vec3 xrayColor = mix(u_bodyColor, u_edgeColor, clamp(rim, 0.0, 1.0));
  float xrayAlpha = clamp(u_alpha + rim * 0.95, 0.0, 1.0);

  material.diffuse = mix(material.diffuse, xrayColor, u_mix);
  material.alpha = mix(material.alpha, xrayAlpha, u_mix);
}
`;

const EDGE_COLOR = Cesium.Color.fromCssColorString("#5ee7ff");
const EDGE_COLOR_VEC3 = new Cesium.Cartesian3(0.35, 0.9, 1.0);
const BODY_COLOR_VEC3 = new Cesium.Cartesian3(0.06, 0.22, 0.34);

/**
 * @param {Cesium.Viewer} viewer
 * @param {Cesium.Cesium3DTileset} osmTileset createOsmBuildingsAsync() 的返回值
 * @param {object} [options]
 * @param {number} [options.lon] 电梯所在经度
 * @param {number} [options.lat] 电梯所在纬度
 * @param {number|null} [options.groundHeight] 地面高度（米）；null = 自动采样地形
 * @param {string} [options.modelUri] 你自己的"楼 + 电梯"glb；留空则用程序化占位
 * @param {number} [options.modelHeading] 模型朝向（度）
 * @param {number} [options.shaftBottom] 电梯井底部离地高度（米）
 * @param {number} [options.shaftTop] 电梯井顶部离地高度（米）
 * @returns {Promise<{enter: Function, exit: Function, toggle: Function, dispose: Function, button: HTMLButtonElement, state: object}>}
 */
export async function setupElevatorXray(viewer, osmTileset, options = {}) {
  const cfg = {
    lon: 114.168754,
    lat: 30.504312,
    groundHeight: null,
    modelUri: "",
    modelHeading: 0,
    shaftBottom: 1.5,
    shaftTop: 42,
    ...options,
  };

  const scene = viewer.scene;
  const groundHeight =
    cfg.groundHeight ?? (await sampleGroundHeight(viewer, cfg.lon, cfg.lat));

  // ---------------- 局部坐标系（东 / 北 / 天） ----------------
  const origin = Cesium.Cartesian3.fromDegrees(cfg.lon, cfg.lat, groundHeight);
  const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  const enuQuaternion = Cesium.Quaternion.fromRotationMatrix(
    Cesium.Matrix4.getMatrix3(enuFrame, new Cesium.Matrix3()),
  );

  // 局部 (east, north, up) → ECEF
  const localToWorld = (east, north, up) =>
    Cesium.Matrix4.multiplyByPoint(
      enuFrame,
      new Cesium.Cartesian3(east, north, up),
      new Cesium.Cartesian3(),
    );

  const shaftBottomPos = localToWorld(0, 0, cfg.shaftBottom);
  const shaftTopPos = localToWorld(0, 0, cfg.shaftTop);
  const midPos = localToWorld(0, 0, (cfg.shaftBottom + cfg.shaftTop) / 2);

  // ---------------- 动画状态（tween 只改这些数字） ----------------
  const state = {
    progress: 0, // 0 = 普通模式，1 = X 光模式
    alpha: 1, // OSM 建筑不透明度
    dim: 0, // 场景压暗程度
    glow: 0, // 电梯高亮程度
    cabinT: 0, // 轿厢位置 0~1
    cabinDir: 1, // 1 上行 / -1 下行
  };

  let active = false;
  let animating = false;
  const originalShowOutline = osmTileset.showOutline;

  // ---------------- OSM 建筑的 X 光材质 ----------------
  const xrayShader = new Cesium.CustomShader({
    mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
    lightingModel: Cesium.LightingModel.UNLIT,
    translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
    uniforms: {
      u_alpha: { type: Cesium.UniformType.FLOAT, value: 1.0 },
      u_mix: { type: Cesium.UniformType.FLOAT, value: 0.0 },
      u_rimPower: { type: Cesium.UniformType.FLOAT, value: 2.4 },
      u_bodyColor: { type: Cesium.UniformType.VEC3, value: BODY_COLOR_VEC3 },
      u_edgeColor: { type: Cesium.UniformType.VEC3, value: EDGE_COLOR_VEC3 },
    },
    fragmentShaderText: XRAY_FS,
  });

  // ---------------- 全屏渐晕 ----------------
  const vignetteStage = new Cesium.PostProcessStage({
    name: "xray_vignette",
    fragmentShader: VIGNETTE_FS,
    uniforms: { u_dim: 1.0, u_vignette: 0.0 },
  });
  scene.postProcessStages.add(vignetteStage);

  // ---------------- 电梯本体（自己的模型 / 程序化占位） ----------------
  // 你自己的模型：整栋楼 + 电梯都在这一个 glb 里
  const modelEntity = cfg.modelUri
    ? viewer.entities.add({
        name: "自定义楼+电梯模型",
        position: origin,
        orientation: Cesium.Transforms.headingPitchRollQuaternion(
          origin,
          new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(cfg.modelHeading),
            0,
            0,
          ),
        ),
        show: false,
        model: {
          uri: cfg.modelUri,
          shadows: Cesium.ShadowMode.DISABLED,
          color: EDGE_COLOR,
          colorBlendMode: Cesium.ColorBlendMode.MIX,
          colorBlendAmount: new Cesium.CallbackProperty(() => state.glow, false),
          silhouetteColor: Cesium.Color.fromAlpha(EDGE_COLOR, 0.9),
          silhouetteSize: new Cesium.CallbackProperty(
            () => state.glow * 3.5,
            false,
          ),
        },
      })
    : undefined;

  // 电梯井外壳（没有自己的模型时用来占位，有模型时留空）
  const shellEntity = cfg.modelUri
    ? undefined
    : viewer.entities.add({
        name: "电梯井",
        position: midPos,
        orientation: enuQuaternion,
        show: false,
        box: {
          dimensions: new Cesium.Cartesian3(
            7,
            7,
            cfg.shaftTop - cfg.shaftBottom,
          ),
          // material 必须是 MaterialProperty：直接给 CallbackProperty 会在
          // geometry updater 里报 materialProperty.getType is not a function
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(
              () => Cesium.Color.fromAlpha(EDGE_COLOR, 0.03 + state.glow * 0.05),
              false,
            ),
          ),
          outline: true,
          outlineColor: new Cesium.CallbackProperty(
            () => Cesium.Color.fromAlpha(EDGE_COLOR, 0.25 * state.glow),
            false,
          ),
        },
      });

  // 轿厢：上下往返运动
  const cabinEntity = viewer.entities.add({
    name: "电梯轿厢",
    position: new Cesium.CallbackProperty(
      () =>
        Cesium.Cartesian3.lerp(
          shaftBottomPos,
          shaftTopPos,
          state.cabinT,
          new Cesium.Cartesian3(),
        ),
      false,
    ),
    orientation: enuQuaternion,
    show: false,
    box: {
      dimensions: new Cesium.Cartesian3(2.6, 2.6, 2.8),
      material: new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(
          () => Cesium.Color.fromAlpha(EDGE_COLOR, 0.35 + state.glow * 0.55),
          false,
        ),
      ),
      outline: true,
      outlineColor: EDGE_COLOR,
    },
    label: {
      text: new Cesium.CallbackProperty(
        () => (state.cabinDir > 0 ? "▲ 上行" : "▼ 下行"),
        false,
      ),
      font: "500 13px 'Microsoft YaHei', system-ui, sans-serif",
      fillColor: EDGE_COLOR,
      outlineColor: Cesium.Color.fromCssColorString("#04141d"),
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -34),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  // 运行轨迹：流动虚线
  const dashOffsetStart = performance.now();
  const trackEntity = viewer.entities.add({
    name: "电梯运行轨迹",
    show: false,
    polyline: {
      positions: [shaftBottomPos, shaftTopPos],
      width: 2,
      arcType: Cesium.ArcType.NONE,
      material: new Cesium.PolylineDashMaterialProperty({
        color: EDGE_COLOR,
        dashLength: 18,
        gapColor: Cesium.Color.TRANSPARENT,
        dashOffset: new Cesium.CallbackProperty(
          () => ((performance.now() - dashOffsetStart) / 45) % 180,
          false,
        ),
      }),
    },
  });

  // 方向指示：顶部 / 底部两个锥形箭头，按运行方向切换显示
  const makeCone = (up) =>
    viewer.entities.add({
      name: up ? "方向指示-上" : "方向指示-下",
      position: localToWorld(
        0,
        0,
        up ? cfg.shaftTop - 1.6 : cfg.shaftBottom + 1.6,
      ),
      orientation: enuQuaternion,
      show: false,
      cylinder: {
        length: 3.2,
        topRadius: up ? 0 : 1.6,
        bottomRadius: up ? 1.6 : 0,
        material: EDGE_COLOR.withAlpha(0.85),
      },
    });
  const coneUp = makeCone(true);
  const coneDown = makeCone(false);

  const xrayEntities = [
    modelEntity,
    shellEntity,
    cabinEntity,
    trackEntity,
    coneUp,
    coneDown,
  ].filter(Boolean);

  // ---------------- 场景压暗 ----------------
  function applyDim(p) {
    const layers = viewer.imageryLayers;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers.get(i);
      layer.brightness = Cesium.Math.lerp(1.0, 0.35, p);
      layer.saturation = Cesium.Math.lerp(1.0, 0.12, p);
      // Cesium 的 gamma 是 pow(color, 1/gamma)，所以小于 1 才是变暗
      layer.gamma = Cesium.Math.lerp(1.0, 0.7, p);
    }
    vignetteStage.uniforms.u_dim = Cesium.Math.lerp(1.0, 0.82, p);
    vignetteStage.uniforms.u_vignette = Cesium.Math.lerp(0.0, 0.8, p);
  }

  // ---------------- 状态同步 ----------------
  function syncFromProgress() {
    const p = state.progress;
    state.dim = p;
    state.glow = p;
    state.alpha = Cesium.Math.lerp(1.0, 0.06, p);

    applyDim(p);
    xrayShader.setUniform("u_alpha", state.alpha);
    xrayShader.setUniform("u_mix", p);

    // 完全退出后才摘掉 customShader，恢复 OSM 原本的着色
    if (p <= 0.001 && osmTileset.customShader === xrayShader) {
      osmTileset.customShader = undefined;
    }
  }

  function tweenProgress(target, duration, complete) {
    animating = true;
    scene.tweens.addProperty({
      object: state,
      property: "progress",
      startValue: state.progress,
      stopValue: target,
      duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      update: syncFromProgress,
      complete: () => {
        animating = false;
        syncFromProgress();
        if (complete) complete();
      },
    });
  }

  // ---------------- 每帧动画：轿厢往返 ----------------
  let lastTime = performance.now();
  function onPostRender() {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (!active) return;

    const span = cfg.shaftTop - cfg.shaftBottom;
    // 单程 6 秒，到底/到顶各停 0.8 秒
    const speed = 1 / (6 * Math.max(span / 40, 0.2));
    state.cabinT += state.cabinDir * speed * dt;
    if (state.cabinT >= 1) {
      state.cabinT = 1;
      state.cabinDir = -1;
    } else if (state.cabinT <= 0) {
      state.cabinT = 0;
      state.cabinDir = 1;
    }
    coneUp.show = state.cabinDir > 0;
    coneDown.show = state.cabinDir < 0;
  }
  scene.postRender.addEventListener(onPostRender);

  // ---------------- 相机 ----------------
  const focusSphere = new Cesium.BoundingSphere(
    midPos,
    Math.max((cfg.shaftTop - cfg.shaftBottom) * 0.8, 20),
  );
  let savedView;

  function saveView() {
    const camera = viewer.camera;
    savedView = {
      destination: Cesium.Cartesian3.clone(camera.positionWC),
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
    };
  }

  function flyToTarget() {
    viewer.camera.flyToBoundingSphere(focusSphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(35),
        Cesium.Math.toRadians(-16),
        (cfg.shaftTop - cfg.shaftBottom) * 2.4,
      ),
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }

  // ---------------- 进入 / 退出 ----------------
  function enter() {
    if (active || animating) return;
    active = true;
    saveView();
    // OSM 自带的黑色描边会在 customShader 之后叠加，和我们的青色边缘光冲突
    osmTileset.showOutline = false;
    xrayEntities.forEach((e) => (e.show = true));
    osmTileset.customShader = xrayShader;
    syncFromProgress();
    tweenProgress(1, 1.8);
    flyToTarget();
    updateButton();
  }

  function exit() {
    if (!active || animating) return;
    active = false;
    tweenProgress(0, 1.2, () => {
      osmTileset.showOutline = originalShowOutline;
      xrayEntities.forEach((e) => (e.show = false));
      if (savedView) {
        viewer.camera.flyTo({
          destination: savedView.destination,
          orientation: {
            heading: savedView.heading,
            pitch: savedView.pitch,
            roll: savedView.roll,
          },
          duration: 1.6,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        });
      }
    });
    updateButton();
  }

  const toggle = () => (active ? exit() : enter());

  // ---------------- 按钮 ----------------
  const button = document.createElement("button");
  button.type = "button";
  button.style.cssText = [
    "position:fixed",
    "top:16px",
    "left:16px",
    "z-index:9999",
    "padding:10px 20px",
    "border-radius:999px",
    "border:1px solid rgba(94,231,255,.55)",
    "background:rgba(6,18,28,.72)",
    "color:#9fe9ff",
    "font:500 14px/1.2 system-ui,'Microsoft YaHei',sans-serif",
    "letter-spacing:.5px",
    "cursor:pointer",
    "backdrop-filter:blur(6px)",
    "box-shadow:0 0 18px rgba(94,231,255,.15)",
    "transition:background .25s,color .25s,box-shadow .25s",
  ].join(";");
  button.addEventListener("click", toggle);
  document.body.appendChild(button);

  function updateButton() {
    button.textContent = active ? "退出 X 光" : "X 光查看电梯";
    button.style.background = active
      ? "rgba(94,231,255,.9)"
      : "rgba(6,18,28,.72)";
    button.style.color = active ? "#04141d" : "#9fe9ff";
    button.style.boxShadow = active
      ? "0 0 26px rgba(94,231,255,.5)"
      : "0 0 18px rgba(94,231,255,.15)";
  }
  updateButton();

  function dispose() {
    scene.postRender.removeEventListener(onPostRender);
    scene.postProcessStages.remove(vignetteStage);
    if (osmTileset.customShader === xrayShader) {
      osmTileset.customShader = undefined;
    }
    osmTileset.showOutline = originalShowOutline;
    xrayEntities.forEach((e) => viewer.entities.remove(e));
    applyDim(0);
    button.remove();
  }

  return { enter, exit, toggle, dispose, button, state, cfg };
}

/** 用最精细的地形采样取地面高度；没有真实地形时返回 0 */
async function sampleGroundHeight(viewer, lon, lat) {
  const provider = viewer.scene.terrainProvider;
  if (!provider || provider instanceof Cesium.EllipsoidTerrainProvider) {
    return 0;
  }
  try {
    const [carto] = await Cesium.sampleTerrainMostDetailed(provider, [
      Cesium.Cartographic.fromDegrees(lon, lat),
    ]);
    return carto.height ?? 0;
  } catch (error) {
    console.warn("[xray] 地形采样失败，按 0 米处理：", error);
    return 0;
  }
}
