// CESIUM_BASE_URL 通过 vite.config.js 的 define 配置，在编译阶段替换
// 静态资源目录 (Workers, ThirdParty, Assets, Widgets) 已复制到 public/Cesium/

import { Cartesian3, createOsmBuildingsAsync, EllipsoidTerrainProvider, Ion, Math as CesiumMath, Terrain, Viewer, Camera, Rectangle, Ellipsoid, SkyBox } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

// Your access token can be found at: https://ion.cesium.com/tokens.
// This is the default access token from your ion account

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

// 必须在 new Viewer() 之前设置默认视图，否则不生效！
// 定在中国北京
// Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(115.25, 39.75, 116.25, 40.25);
// 缩放级别，数值越小缩放越近（0 = 刚好贴合矩形，1 = 更远）
Camera.DEFAULT_VIEW_FACTOR = 0.1;

// 晴天天空盒（在 Viewer 构造前定义，以便传入构造参数）
const sunnySkyBox = new SkyBox({
  sources: {
    positiveX: "/textures/skybox/sunny/rightav9.jpg",
    negativeX: "/textures/skybox/sunny/leftav9.jpg",
    positiveY: "/textures/skybox/sunny/frontav9.jpg",
    negativeY: "/textures/skybox/sunny/backav9.jpg",
    positiveZ: "/textures/skybox/sunny/topav9.jpg",
    negativeZ: "/textures/skybox/sunny/bottomav9.jpg",
  }
})

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer('app', {
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
  // terrain: Terrain.fromWorldTerrain(), // 使用 Cesium World Terrain，包含全球高分辨率地形数据
  terrainProvider: new EllipsoidTerrainProvider(), // 不使用地形 — 平滑椭球体地球
  baseLayer: undefined, // false 不使用底图, undefined 使用默认底图, 其他值使用 Cesium.ImageryProvider 作为底图
  skyBox: sunnySkyBox, // 默认使用晴天天空盒

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

// Add Cesium OSM Buildings, a global 3D buildings layer.
const buildingTileset = await createOsmBuildingsAsync();
viewer.scene.primitives.add(buildingTileset);   

// 晚霞天空盒
const sunsetSkyBox = new SkyBox({
  sources: {
    positiveX: "/textures/skybox/sunset/SunSetRight.png",
    negativeX: "/textures/skybox/sunset/SunSetLeft.png",
    positiveY: "/textures/skybox/sunset/SunSetFront.png",
    negativeY: "/textures/skybox/sunset/SunSetBack.png",
    positiveZ: "/textures/skybox/sunset/SunSetUp.png",
    negativeZ: "/textures/skybox/sunset/SunSetDown.png",
  }
})
// 蓝天天空盒
const blueSkyBox = new SkyBox({
  sources: {
    positiveX: "/textures/skybox/blue_sky/Right.jpg",
    negativeX: "/textures/skybox/blue_sky/Left.jpg",
    positiveY: "/textures/skybox/blue_sky/Front.jpg",
    negativeY: "/textures/skybox/blue_sky/Back.jpg",
    positiveZ: "/textures/skybox/blue_sky/Up.jpg",
    negativeZ: "/textures/skybox/blue_sky/Down.jpg",
  }
})
// 夜晚天空盒
const nightSkyBox = new SkyBox({
  sources: {
    positiveX: "/textures/skybox/night/posx.jpg",
    negativeX: "/textures/skybox/night/negx.jpg",
    positiveY: "/textures/skybox/night/posz.jpg",
    negativeY: "/textures/skybox/night/negz.jpg",
    positiveZ: "/textures/skybox/night/posy.jpg",
    negativeZ: "/textures/skybox/night/negy.jpg",
  }
})
// 默认天空盒
const defaultSkyBox = viewer.scene.skyBox;

// 顶层增加切换按钮

const htmlButtonContainer = document.createElement("div");
htmlButtonContainer.style.position = "absolute";
htmlButtonContainer.style.top = "10px";
htmlButtonContainer.style.left = "10px";
htmlButtonContainer.style.zIndex = "1";
htmlButtonContainer.classList.add("skybox-button-container");
document.body.appendChild(htmlButtonContainer);
htmlButtonContainer.innerHTML = `
<style>
.skybox-button-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.skybox-button-container button {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}
</style>
  <button id="sunny">晴天</button>
  <button id="sunset">晚霞</button>
  <button id="blue">蓝天</button>
  <button id="night">夜晚</button>
  <button id="none">默认</button>
`

document.getElementById("sunny").addEventListener("click", () => changeSkyBox(0));
document.getElementById("sunset").addEventListener("click", () => changeSkyBox(1));
document.getElementById("blue").addEventListener("click", () => changeSkyBox(2));
document.getElementById("night").addEventListener("click", () => changeSkyBox(3));
document.getElementById("none").addEventListener("click", () => changeSkyBox(4));


function changeSkyBox(index) {
  switch (index) {
    case 0: viewer.scene.skyBox = sunnySkyBox; break;
    case 1: viewer.scene.skyBox = sunsetSkyBox; break;
    case 2: viewer.scene.skyBox = blueSkyBox; break;
    case 3: viewer.scene.skyBox = nightSkyBox; break;
    default: viewer.scene.skyBox = defaultSkyBox; break;
  }
}