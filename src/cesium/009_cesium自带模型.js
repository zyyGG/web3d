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
} from "cesium";
import * as Cesium from "cesium";
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
  // terrainProvider: false, // 不使用地形 — 平滑椭球体地球

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
// cesium自带的模型

// viewer.camera.position = Cartesian3.fromDegrees(-122.39053, 37.61779, 0);

const gui = new GUI();

const params = {
  types: "Box"
}

gui.add(params, 'types', ['Box', 'Corridor', 'Cylinder', 'Ellipse', "Ellipsoid", "Polyline", "Polygon"]).name('模型类型').onChange((value => {
  switch(value) {
    case "Box":initBox();break;
    case "Corridor":initCorridor();break;
    case "Cylinder":initCylinder();break;
    case "Ellipse":initEllipse();break;
    case "Ellipsoid":initEllipsoid();break;
    case "Polyline":initPolyline();break;
    case "Polygon":initPolygon();break;
  }
}));

let model = null;

function initScene(){
  const position = Cartesian3.fromDegrees(-122.39053, 37.61779, 200)
  const cameraPosition = Cartesian3.fromDegrees(-122.39053, 37.61779, 500);
  if(model) viewer.entities.remove(model);
  viewer.camera.setView({
    destination: cameraPosition,
  })
  return position;
}

// 初始化盒子模型
function initBox(){
  const position = initScene()
  model = viewer.entities.add({
    name: "box",
    position: position,
    box: {
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      dimensions: new Cartesian3(100.0, 100.0, 100.0),
      fill: true,
      material: Cesium.Color.RED.withAlpha(0.5),
      shadows: Cesium.ShadowMode.DISABLED, // 是否开启阴影
      show: true,
      distanceDisplayCondition : new Cesium.DistanceDisplayCondition(0.0, 1000.0), // 在距离 0 到 1000 米之间显示
      heightReference : Cesium.HeightReference.CLAMP_TO_GROUND, // 模型贴地, 这个设置之后,会无视模型的高度, 也就是模型会贴在地面上, 而不是悬浮在空中
    }
  })
  
}

// 初始化走廊模型
function initCorridor() {
  const position = initScene()
  model = viewer.entities.add({
    name: "corridor",
    position: position,
    corridor: {
      show: true,
      positions: Cesium.Cartesian3.fromDegreesArray([
        -122.39053, 37.61779,
        -122.39053, 37.62779,
        -122.40053, 37.62779,
      ]),
      height: 200.0, // 决定走廊的高度
      heightReference: Cesium.HeightReference.NONE,
      width: 100.0, // 决定走廊的宽度
      extrudedHeight: 100.0, // 决定走廊的挤出高度
      extrudedHeightReference: Cesium.HeightReference.NONE,
      cornerType: Cesium.CornerType.ROUNDED, // 决定走廊的拐角类型
      granularity: CesiumMath.RADIANS_PER_DEGREE, // 决定走廊的精度
      fill: true,
      material: Cesium.Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      shadows: Cesium.ShadowMode.DISABLED, // 是否开启阴影
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 1000.0), // 在距离 0 到 1000 米之间显示
      classificationType: Cesium.ClassificationType.BOTH, // 指定该走廊在地面时是分类地形、三维瓦片还是两者
      // zIndex: 0, // 决定走廊的渲染顺序，数值越大越靠上
    }
  })
}

// 初始化圆柱模型
function initCylinder() {
  const position = initScene()
  model = viewer.entities.add({
    name: "cylinder",
    position: position,
    cylinder: {
      length: 100.0,
      topRadius: 50.0,
      bottomRadius: 50.0,
      slices: 6, // 决定圆柱的精度，数值越大越平滑
      material: Cesium.Color.GREEN.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      shadows: Cesium.ShadowMode.DISABLED,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 1000.0),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  })
}

// 初始化椭圆模型
function initEllipse() {
  const position = initScene()
  model = viewer.entities.add({
    name: "ellipse",
    position: position,
    ellipse: {
      semiMajorAxis: 100.0, // 决定椭圆的长轴
      semiMinorAxis: 50.0, // 决定椭圆的短轴
      rotation: CesiumMath.toRadians(45.0), // 决定椭圆的旋转角度
      stRotation: CesiumMath.toRadians(0.0), // 决定椭圆的纹理旋转角度
      granularity: CesiumMath.RADIANS_PER_DEGREE, // 决定椭圆的精度

      material: Cesium.Color.YELLOW.withAlpha(0.5),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    }
  })
}

// 初始化椭球模型
function initEllipsoid() {
  const position = initScene()
  model = viewer.entities.add({
    name: "ellipsoid",
    position: position,
    ellipsoid: {
      radii: new Cartesian3(50,50, 50), // 决定椭球的半径
      // innerRadii: new Cartesian3(75, 25.0, 37.5), // 决定椭球的内半径
      minimumClock: CesiumMath.toRadians(0.0), // 决定椭球的最小时钟角度
      maximumClock: CesiumMath.toRadians(240.0), // 决定椭球的最大时钟角度
      minimumCone: CesiumMath.toRadians(0.0), // 决定椭球的最小圆锥角度
      maximumCone: CesiumMath.toRadians(150), // 决定椭球的最大圆锥角度
      stackPartitions: 64, // 决定椭球的堆叠分区数，数值越大越平滑
      slicePartitions: 64, // 决定椭球的切片分区数，数值越大越平滑
      material: Cesium.Color.PURPLE.withAlpha(0.5),
    }
  })
}

// 初始化折线模型
function initPolyline(){
  const position = initScene()
  model = viewer.entities.add({
    name: "polyline",
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        -122.39053, 37.61779,
        -122.39053, 37.62779,
        -122.40053, 37.62779,
      ]),
      width: 5.0,
      depthFailMaterial: Cesium.Color.RED.withAlpha(0.5), // 决定折线在深度测试失败时的材质
      arcType: Cesium.ArcType.RHUMB, // 决定折线的弧类型
      clampToGround: true, // 决定折线是否贴地
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.YELLOW.withAlpha(0.5),
        dashLength: 16.0, // 决定虚线的长度
        dashPattern: 255.0, // 决定虚线的模式
      })
    }
  })
}

// 初始化多边形模型
function initPolygon(){
  const position = initScene()
  model = viewer.entities.add({
    name: "polygon",
    position: position,
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        -122.39053, 37.61779,
        -122.39053, 37.62779,
        -122.40053, 37.62779,
      ]),
      extrudedHeight: 100.0, // 决定多边形的挤出高度
      material: Cesium.Color.CYAN.withAlpha(0.5),
    }
  })
}

initBox();