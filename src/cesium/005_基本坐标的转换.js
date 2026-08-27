// CESIUM_BASE_URL 通过 vite.config.js 的 define 配置，在编译阶段替换
// 静态资源目录 (Workers, ThirdParty, Assets, Widgets) 已复制到 public/Cesium/

import {
  Cartesian3,
  createOsmBuildingsAsync,
  Ion,
  Math as CesiumMath,
  Terrain,
  Viewer,
  Camera,
  Rectangle,
  Ellipsoid,
  EllipsoidTerrainProvider,
  Cartesian2,
  Cartographic,
  SceneTransforms,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import GUI from "lil-gui";

// Your access token can be found at: https://ion.cesium.com/tokens.
// This is the default access token from your ion account

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

// 必须在 new Viewer() 之前设置默认视图，否则不生效！
// 定在中国北京
Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
  115.25,
  39.75,
  116.25,
  40.25,
);
// 缩放级别，数值越小缩放越近（0 = 刚好贴合矩形，1 = 更远）
Camera.DEFAULT_VIEW_FACTOR = 0.1;

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("app", {
  // 空间开关
  infoBox: false, // 信息框
  geocoder: false, // 右上角搜索框
  baseLayerPicker: false, // 右上角图层选择控件
  animation: false, // 左下角动画控件
  fullscreenButton: false, // 右下角全屏控件
  vrButton: false, // 右下角 VR 控件
  homeButton: false, // 右下角 Home 控件
  sceneModePicker: false, // 右下角 2D/3D 控件
  selectionIndicator: false, // 选中高亮
  timeline: false, // 底部时间轴
  navigationHelpButton: false, // 右上角帮助控件
  projectionPicker: false, // 右上角投影方式控件
  // 场景与地形
  terrainProvider: new EllipsoidTerrainProvider(), // 不使用地形 — 平滑椭球体地球
  baseLayer: undefined, // false 不使用底图, undefined 使用默认底图, 其他值使用 Cesium.ImageryProvider 作为底图
  // skyBox: true, // 天空盒
  skyAtmosphere: false, // 大气层
  // globe: false, // 地球仪
  // sceneMode: 0, // 场景模式 0：3D，1：2D，2：Columbus View
  mapProjection: undefined, // 地图投影方式，默认使用 WebMercatorProjection
  mapMode2D: 1, // 2D 模式下地图的旋转方式，0：允许任意旋转，1：限制为北朝上
  orderIndependentTranslucency: true, // 是否启用独立排序的半透明
  shadows: false, // 是否启用阴影
  // terrainShadows: 0, // 地形阴影模式 0：无，1：仅太阳光，2：仅灯光，3：太阳光和灯光
  // 渲染和性能
  useDefaultRenderLoop: true, // 是否使用 Cesium 的默认渲染循环，设置为 false 后需要自己调用 viewer.render() 来渲染
  targetFrameRate: 60, // 目标帧率，只有在 useDefaultRenderLoop 为 true 时生效
  requestRenderMode: false, // 是否启用请求渲染模式，设置为 true 后只有在场景发生变化时才渲染，配合 useDefaultRenderLoop 使用
  maximumRenderTimeChange: 0.0, // 场景发生变化后强制渲染的最大时间间隔，单位秒，只有在 requestRenderMode 为 true 时生效
  msaaSamples: 4, // 多重采样抗锯齿级别，0 表示不使用 MSAA，2、4、8 分别表示 2x、4x、8x MSAA
  useBrowserRecommendedResolution: true, // 是否使用浏览器推荐的分辨率，设置为 false 后可以通过 resolutionScale 来调整分辨率
  showRenderLoopErrors: true, // 是否在控制台显示渲染循环错误
  blurActiveElementOnCanvasFocus: true, // 是否在画布获得焦点时模糊当前活动元素，默认为 true，可以防止在输入框等元素上使用鼠标滚轮时页面滚动
  // 时钟与数据
  shouldAnimate: false, // 是否默认自动播放时钟动画
  clockViewModel: undefined, // 时钟视图模型，控制时钟的显示和交互
  automaticallyTrackDataSourceClocks: true, // 是否自动跟踪数据源时钟，设置为 false 后需要自己管理数据源时钟
  // dataSources: undefined, // 数据源集合，可以添加 CzmlDataSource、GeoJsonDataSource、KmlDataSource 等数据源
  // 其他
  ellipsoid: Ellipsoid.default, // 地球椭球体，默认使用 WGS84
  fullscreenElement: document.body, // 全屏模式下的元素，默认为 document.body
  creditContainer: undefined, // 版权信息容器，默认为 viewer.container
  creditViewport: undefined, // 版权信息视口，默认为 viewer.scene.canvas
  contextOptions: undefined, // WebGL 上下文选项，默认为 { webgl: { alpha: true, depth: true, stencil: true, antialias: false, preserveDrawingBuffer: false } }
  depthPlaneEllipsoidOffset: 0.0, // 深度平面与椭球体之间的偏移距离，单位米，默认为 0.0，可以设置为一个小的正值来避免深度冲突
});

viewer.cesiumWidget.creditContainer.style.display = "none";

// Add Cesium OSM Buildings, a global 3D buildings layer.
const buildingTileset = await createOsmBuildingsAsync();
viewer.scene.primitives.add(buildingTileset);

const gui = new GUI();

// ========== Cesium 坐标转换示例 ==========

// 1️⃣ 经纬度(度) → 笛卡尔坐标 (Cartesian3)
const lon = 116.4, lat = 39.9, height = 300; // 北京天安门附近
const cartesian3 = Cartesian3.fromDegrees(lon, lat, height);
console.log("① 经纬度→笛卡尔:", cartesian3);

// 2️⃣ 笛卡尔坐标 → 经纬度(弧度)
const cartographic = Cartographic.fromCartesian(cartesian3);
const lonRad = cartographic.longitude;
const latRad = cartographic.latitude;
const h = cartographic.height;
console.log("② 笛卡尔→经纬度(弧度):", `lon=${lonRad}, lat=${latRad}, height=${h}`);

// 3️⃣ 经纬度(弧度) → 经纬度(度)
const lonDeg = CesiumMath.toDegrees(lonRad);
const latDeg = CesiumMath.toDegrees(latRad);
console.log("③ 弧度→度:", `lon=${lonDeg}°, lat=${latDeg}°`);

// 4️⃣ 经纬度(度) → 经纬度(弧度)
const lonRad2 = CesiumMath.toRadians(lon);
const latRad2 = CesiumMath.toRadians(lat);
console.log("④ 度→弧度:", `lon=${lonRad2}, lat=${latRad2}`);

// 5️⃣ 经纬度(度, 不传高度) → 笛卡尔坐标 (WGS84 椭球表面)
const cartesian3Surface = Cartesian3.fromDegrees(lon, lat);
console.log("⑤ 经纬度(地面)→笛卡尔:", cartesian3Surface);

// 6️⃣ 经纬度(数组批量) → 笛卡尔坐标数组
const positions = Cartesian3.fromDegreesArray([116.4, 39.9, 121.5, 31.2, 113.3, 23.1]);
console.log("⑥ 批量经纬度→笛卡尔:", positions);

// 7️⃣ 经纬度(数组+高度) → 笛卡尔坐标数组
const positionsWithHeight = Cartesian3.fromDegreesArrayHeights([116.4, 39.9, 300, 121.5, 31.2, 100]);
console.log("⑦ 批量经纬度(带高)→笛卡尔:", positionsWithHeight);

// 8️⃣ 笛卡尔坐标 → 屏幕坐标 (Cartesian2)
const screenPosition = SceneTransforms.worldToWindowCoordinates(
  viewer.scene,
  cartesian3
);
console.log("⑧ 笛卡尔→屏幕坐标:", screenPosition);

// 9️⃣ 使用 ellipsoid 将 Cartesian3 转为 Cartographic
const ellipsoid = viewer.scene.globe.ellipsoid;
const cartographic2 = ellipsoid.cartesianToCartographic(cartesian3);
console.log("⑨ ellipsoid 笛卡尔→经纬度:", {
  lon: CesiumMath.toDegrees(cartographic2.longitude),
  lat: CesiumMath.toDegrees(cartographic2.latitude),
  height: cartographic2.height,
});

// 🔟 Cartographic → Cartesian3 (另一种方式)
const cartesian3Alt = ellipsoid.cartographicToCartesian(cartographic2);
console.log("⑩ ellipsoid 经纬度→笛卡尔:", cartesian3Alt);

// 1️⃣1️⃣ 获取当前相机位置的各种坐标
const cameraPosition = viewer.camera.position;
const cameraCartographic = Cartographic.fromCartesian(cameraPosition);
console.log("⑪ 相机位置:", {
  笛卡尔: cameraPosition,
  经纬度弧度: cameraCartographic,
  经纬度度: {
    lon: CesiumMath.toDegrees(cameraCartographic.longitude),
    lat: CesiumMath.toDegrees(cameraCartographic.latitude),
    height: cameraCartographic.height,
  },
});

