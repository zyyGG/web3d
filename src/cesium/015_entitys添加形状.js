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


const gui = new GUI();
console.log("Cesium version:", Cesium.VERSION);

// ===========================
// point
// ===========================
const pointParams = {
  // position
  lon: 116.391193,
  lat: 39.906776,
  height: 100,
  // 
  color: [1.0, 0.0, 0.0, 1.0], // hsl 
  // outline
  outlineColor: [0.0, 0.0, 0.0, 1.0], // hsl
  outlineWidth: 2, // 轮廓宽度
  
  pixelSize: 10, // 点的像素大小
  heightReference: Cesium.HeightReference.NONE, // 高度参考 NONE: 不贴地，CLAMP_TO_GROUND: 贴地，RELATIVE_TO_GROUND: 相对地面
  // translucencyByDistance: new Cesium.NearFarScalar(100, 1.0, 10000, 0.0), // 根据相机距离改变透明度

};
const pointEntity = new Cesium.PointGraphics({
  color: new Cesium.Color(...pointParams.color), // 红色
  outlineColor: new Cesium.Color(...pointParams.outlineColor), // 黑色
  outlineWidth: pointParams.outlineWidth, // 轮廓宽度
  pixelSize: pointParams.pixelSize,
  heightReference: pointParams.heightReference,
  // translucencyByDistance: pointParams.translucencyByDistance,
});

const point = viewer.entities.add({
  position: Cartesian3.fromDegrees(pointParams.lon, pointParams.lat, pointParams.height),
  point: pointEntity,
});

const pointFolder = gui.addFolder("point");
pointFolder.add(pointParams, "lon", 110, 125, 0.0001).name("经度");
pointFolder.add(pointParams, "lat", 30, 45, 0.0001).name("纬度");
pointFolder.add(pointParams, "height", 0, 10000, 1).name("高度(m)");
pointFolder.addColor(pointParams, "color").name("颜色")
pointFolder.addColor(pointParams, "outlineColor").name("轮廓颜色");
pointFolder.add(pointParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
pointFolder.add(pointParams, "pixelSize", 1, 100, 1).name("像素大小");
pointFolder.add(pointParams, "heightReference", {
  "不贴地": Cesium.HeightReference.NONE,
  "贴地": Cesium.HeightReference.CLAMP_TO_GROUND,
  "相对地面": Cesium.HeightReference.RELATIVE_TO_GROUND,
}).name("高度参考");
pointFolder.add({ zoom: () => { viewer.flyTo(point, {duration: 2}) } }, "zoom").name("缩放");
pointFolder.close();
// gui.onChange 监听所有控件变化，一次搞定
pointFolder.onFinishChange(pointUpdate);
function pointUpdate() {
  point.position.setValue(Cartesian3.fromDegrees(pointParams.lon, pointParams.lat, pointParams.height));
  point.point.color = new Cesium.Color(...pointParams.color);
  point.point.outlineColor = new Cesium.Color(...pointParams.outlineColor);
  point.point.outlineWidth = pointParams.outlineWidth;
  point.point.pixelSize = pointParams.pixelSize;
  point.point.heightReference = pointParams.heightReference;
}


// ===========================
// billboard
// ===========================
const billboardParams = {
  x: 116.391193 + 1,
  y: 39.906776,
  z: 100,
  image: "https://www.dmoe.cc/random.php",
  width: 256,
  height: 128,
  scale: 1.0,
  pixelOffsetX: 0,
  pixelOffsetY: 0,
}
const billboardEntity = new Cesium.BillboardGraphics({
  image: billboardParams.image,
  width: billboardParams.width,
  height: billboardParams.height,
  scale: billboardParams.scale,
  pixelOffset: new Cesium.Cartesian2(billboardParams.pixelOffsetX, billboardParams.pixelOffsetY),
  scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 10000, 0.0), // 根据相机距离改变缩放
});
const billboard = viewer.entities.add({
  position: Cartesian3.fromDegrees(billboardParams.x, billboardParams.y, billboardParams.z),
  billboard: billboardEntity,
})
const billboardFolder = gui.addFolder("billboard");
billboardFolder.add(billboardParams, "x", 110, 125, 0.0001).name("经度");
billboardFolder.add(billboardParams, "y", 30, 45, 0.0001).name("纬度");
billboardFolder.add(billboardParams, "z", 0, 10000, 1).name("高度(m)");
billboardFolder.add(billboardParams, "image").name("图片 URL");
billboardFolder.add(billboardParams, "width", 1, 512, 1).name("宽度");
billboardFolder.add(billboardParams, "height", 1, 512, 1).name("高度");
billboardFolder.add(billboardParams, "scale", 0.1, 10, 0.1).name("缩放");
billboardFolder.add(billboardParams, "pixelOffsetX", -512, 512, 1).name("像素偏移 X");
billboardFolder.add(billboardParams, "pixelOffsetY", -512, 512, 1).name("像素偏移 Y");
billboardFolder.add({ zoom: () => { viewer.flyTo(billboard, {duration: 2}) } }, "zoom").name("缩放");
billboardFolder.close();
billboardFolder.onFinishChange(billboardUpdate);
function billboardUpdate() {
  billboard.position.setValue(Cartesian3.fromDegrees(billboardParams.x, billboardParams.y, billboardParams.z));
  billboard.billboard.image = billboardParams.image;
  billboard.billboard.width = billboardParams.width;
  billboard.billboard.height = billboardParams.height;
  billboard.billboard.scale = billboardParams.scale;
  billboard.billboard.pixelOffset = new Cesium.Cartesian2(billboardParams.pixelOffsetX, billboardParams.pixelOffsetY);
}

// ===========================
// label
// ===========================
const labelParams = {
  // position
  lon: 116.391193 + 2,
  lat: 39.906776,
  height: 100,
  // text
  text: "Hello Cesium",
  font: "24px sans-serif",
  fillColor: [1.0, 1.0, 1.0, 1.0], // rgba 文字颜色
  // outline
  outlineColor: [0.0, 0.0, 0.0, 1.0], // rgba 描边颜色
  outlineWidth: 2, // 描边宽度
  style: Cesium.LabelStyle.FILL_AND_OUTLINE, // 填充 / 填充+描边 / 纯描边
  // transform
  scale: 1.0, // 缩放
  pixelOffsetX: 0, // 水平偏移(px)
  pixelOffsetY: 0, // 垂直偏移(px)
  verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直对齐
  horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平对齐
  heightReference: Cesium.HeightReference.NONE, // 高度参考
}
const labelEntity = new Cesium.LabelGraphics({
  text: labelParams.text,
  font: labelParams.font,
  fillColor: new Cesium.Color(...labelParams.fillColor),
  outlineColor: new Cesium.Color(...labelParams.outlineColor),
  outlineWidth: labelParams.outlineWidth,
  style: labelParams.style,
  scale: labelParams.scale,
  pixelOffset: new Cesium.Cartesian2(labelParams.pixelOffsetX, labelParams.pixelOffsetY),
  verticalOrigin: labelParams.verticalOrigin,
  horizontalOrigin: labelParams.horizontalOrigin,
  heightReference: labelParams.heightReference,
})
const label = viewer.entities.add({
  position: Cartesian3.fromDegrees(labelParams.lon, labelParams.lat, labelParams.height),
  label: labelEntity,
})
const labelFolder = gui.addFolder("label");
labelFolder.add(labelParams, "lon", 110, 125, 0.0001).name("经度");
labelFolder.add(labelParams, "lat", 30, 45, 0.0001).name("纬度");
labelFolder.add(labelParams, "height", 0, 10000, 1).name("高度(m)");
labelFolder.add(labelParams, "text").name("文字");
labelFolder.add(labelParams, "font").name("字体");
labelFolder.addColor(labelParams, "fillColor").name("文字颜色");
labelFolder.addColor(labelParams, "outlineColor").name("描边颜色");
labelFolder.add(labelParams, "outlineWidth", 0, 10, 1).name("描边宽度");
labelFolder.add(labelParams, "style", {
  "纯填充": Cesium.LabelStyle.FILL,
  "填充+描边": Cesium.LabelStyle.FILL_AND_OUTLINE,
  "纯描边": Cesium.LabelStyle.OUTLINE,
}).name("样式");
labelFolder.add(labelParams, "scale", 0.1, 5, 0.1).name("缩放");
labelFolder.add(labelParams, "pixelOffsetX", -200, 200, 1).name("水平偏移");
labelFolder.add(labelParams, "pixelOffsetY", -200, 200, 1).name("垂直偏移");
labelFolder.add(labelParams, "verticalOrigin", {
  "底": Cesium.VerticalOrigin.BOTTOM,
  "中": Cesium.VerticalOrigin.CENTER,
  "顶": Cesium.VerticalOrigin.TOP,
}).name("垂直对齐");
labelFolder.add(labelParams, "horizontalOrigin", {
  "左": Cesium.HorizontalOrigin.LEFT,
  "中": Cesium.HorizontalOrigin.CENTER,
  "右": Cesium.HorizontalOrigin.RIGHT,
}).name("水平对齐");
labelFolder.add(labelParams, "heightReference", {
  "不贴地": Cesium.HeightReference.NONE,
  "贴地": Cesium.HeightReference.CLAMP_TO_GROUND,
  "相对地面": Cesium.HeightReference.RELATIVE_TO_GROUND,
}).name("高度参考");
labelFolder.add({ zoom: () => { viewer.flyTo(label, {duration: 2}) } }, "zoom").name("缩放");
labelFolder.close();
labelFolder.onFinishChange(labelUpdate);
function labelUpdate() {
  label.position.setValue(Cartesian3.fromDegrees(labelParams.lon, labelParams.lat, labelParams.height));
  label.label.text = labelParams.text;
  label.label.font = labelParams.font;
  label.label.fillColor = new Cesium.Color(...labelParams.fillColor);
  label.label.outlineColor = new Cesium.Color(...labelParams.outlineColor);
  label.label.outlineWidth = labelParams.outlineWidth;
  label.label.style = labelParams.style;
  label.label.scale = labelParams.scale;
  label.label.pixelOffset = new Cesium.Cartesian2(labelParams.pixelOffsetX, labelParams.pixelOffsetY);
  label.label.verticalOrigin = labelParams.verticalOrigin;
  label.label.horizontalOrigin = labelParams.horizontalOrigin;
  label.label.heightReference = labelParams.heightReference;
}



// ===========================
// polyline
// ===========================
const polylineParams = {
  // 折线经过的点（增删就在这里改，GUI 里每个点一个子文件夹）
  points: [
    { lon: 116.391193 - 0.1, lat: 39.906776 - 0.05, height: 100 },
    { lon: 116.391193, lat: 39.906776, height: 200 },
    { lon: 116.391193 + 0.1, lat: 39.906776 + 0.05, height: 100 },
  ],
  width: 2, // 线宽(px)
  color: [1.0, 0.0, 1.0, 1.0], // rgba 颜色
  clampToGround: false, // 是否贴地
  arcType: Cesium.ArcType.GEODESIC, // GEODESIC 大地线 / NONE 直线 / RHUMB 恒向线
}
const polylineEntity = new Cesium.PolylineGraphics({
  positions: Cesium.Cartesian3.fromDegreesArrayHeights(
    polylineParams.points.flatMap(p => [p.lon, p.lat, p.height]),
  ),
  width: polylineParams.width,
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...polylineParams.color)),
  clampToGround: polylineParams.clampToGround,
  arcType: polylineParams.arcType,
})
const polyline = viewer.entities.add({
  polyline: polylineEntity,
})
const polylineFolder = gui.addFolder("polyline");
// 每个点一个子文件夹，方便控制折线形状
polylineParams.points.forEach((p, i) => {
  const pointFolder = polylineFolder.addFolder(`点 ${i + 1}`);
  pointFolder.add(p, "lon", 110, 125, 0.0001).name("经度");
  pointFolder.add(p, "lat", 30, 45, 0.0001).name("纬度");
  pointFolder.add(p, "height", 0, 10000, 1).name("高度(m)");
  pointFolder.onFinishChange(polylineUpdate);
  pointFolder.open();
});
polylineFolder.add(polylineParams, "width", 1, 20, 1).name("线宽");
polylineFolder.addColor(polylineParams, "color").name("颜色");
polylineFolder.add(polylineParams, "clampToGround").name("贴地");
polylineFolder.add(polylineParams, "arcType", {
  "大地线": Cesium.ArcType.GEODESIC,
  "直线": Cesium.ArcType.NONE,
  "恒向线": Cesium.ArcType.RHUMB,
}).name("弧线类型");
polylineFolder.add({ zoom: () => viewer.flyTo(polyline, { duration: 2 }) }, "zoom").name("缩放");
polylineFolder.close();
polylineFolder.onFinishChange(polylineUpdate);
function polylineUpdate() {
  // positions 必须是 Property，用 ConstantProperty 包裹（不能直接赋数组）
  polyline.polyline.positions = new Cesium.ConstantProperty(
    Cesium.Cartesian3.fromDegreesArrayHeights(
      polylineParams.points.flatMap(p => [p.lon, p.lat, p.height]),
    ),
  );
  polyline.polyline.width = polylineParams.width;
  polyline.polyline.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...polylineParams.color));
  polyline.polyline.clampToGround = polylineParams.clampToGround;
  polyline.polyline.arcType = polylineParams.arcType;
}

// ===========================
// polylineVolume
// ===========================
const polylineVolumeParams = {
  // 路径点（增删就在这里改，GUI 里每个点一个子文件夹）
  points: [
    { lon: 116.391193 - 0.1, lat: 39.906776 - 0.05, height: 100 },
    { lon: 116.391193, lat: 39.906776, height: 200 },
    { lon: 116.391193 + 0.1, lat: 39.906776 + 0.05, height: 100 },
  ],
  // 整体偏移（加到每个路径点上，实现整体平移）
  offsetLon: 0, // 经度偏移
  offsetLat: 0, // 纬度偏移
  offsetHeight: 0, // 高度偏移(m)
  // 截面形状：自定义顶点数组 [{x, y}]，单位米，相对路径中心（预设切换会覆盖它）
  shape: [],
  shapePreset: "矩形", // 矩形 / 三角形 / 菱形 / 圆形
  color: [1.0, 1.0, 0.0, 1.0], // rgba 颜色
  cornerType: Cesium.CornerType.ROUNDED, // ROUNDED 圆角 / MITERED 尖角 / BEVELED 斜角
}
// 截面形状预设（单位米，相对路径中心）
const SHAPE_PRESETS = {
  "矩形": [[-5, -5], [5, -5], [5, 5], [-5, 5]],
  "三角形": [[0, 6], [-5, -5], [5, -5]],
  "菱形": [[0, 6], [5, 0], [0, -5], [-5, 0]],
  "圆形": Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.cos(a) * 5, Math.sin(a) * 5];
  }),
};
// 应用预设：把 [x, y] 数组转成 {x, y} 对象（方便 GUI 绑定顶点）
function applyShapePreset() {
  polylineVolumeParams.shape = SHAPE_PRESETS[polylineVolumeParams.shapePreset].map(([x, y]) => ({ x, y }));
}
applyShapePreset();
// 生成带偏移的路径坐标
function polylineVolumePositions() {
  return Cesium.Cartesian3.fromDegreesArrayHeights(
    polylineVolumeParams.points.flatMap(p => [
      p.lon + polylineVolumeParams.offsetLon,
      p.lat + polylineVolumeParams.offsetLat,
      p.height + polylineVolumeParams.offsetHeight,
    ]),
  );
}
// 生成横截面形状（Cesium.Cartesian2[]）
function polylineVolumeShape() {
  return polylineVolumeParams.shape.map(p => new Cesium.Cartesian2(p.x, p.y));
}
const polylineVolumeEntity = new Cesium.PolylineVolumeGraphics({
  positions: polylineVolumePositions(),
  shape: polylineVolumeShape(),
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...polylineVolumeParams.color)),
  cornerType: polylineVolumeParams.cornerType,
})
const polylineVolume = viewer.entities.add({
  polylineVolume: polylineVolumeEntity,
})
const polylineVolumeFolder = gui.addFolder("polylineVolume");
// 路径点控制
polylineVolumeParams.points.forEach((p, i) => {
  const pointFolder = polylineVolumeFolder.addFolder(`路径点 ${i + 1}`);
  pointFolder.add(p, "lon", 110, 125, 0.0001).name("经度");
  pointFolder.add(p, "lat", 30, 45, 0.0001).name("纬度");
  pointFolder.add(p, "height", 0, 10000, 1).name("高度(m)");
  pointFolder.onFinishChange(polylineVolumeUpdate);
  pointFolder.open();
});
// 整体偏移控制
polylineVolumeFolder.add(polylineVolumeParams, "offsetLon", -1, 1, 0.0001).name("经度偏移");
polylineVolumeFolder.add(polylineVolumeParams, "offsetLat", -1, 1, 0.0001).name("纬度偏移");
polylineVolumeFolder.add(polylineVolumeParams, "offsetHeight", -1000, 1000, 10).name("高度偏移(m)");
// 截面形状：预设下拉 + 顶点编辑
polylineVolumeFolder.add(polylineVolumeParams, "shapePreset", Object.keys(SHAPE_PRESETS)).name("形状预设")
  .onChange(() => { applyShapePreset(); buildShapePointsFolder(); polylineVolumeUpdate(); });
// 截面顶点控制（预设切换时动态重建）
let shapePointsFolder;
function buildShapePointsFolder() {
  if (shapePointsFolder) shapePointsFolder.destroy();
  shapePointsFolder = polylineVolumeFolder.addFolder("截面顶点");
  polylineVolumeParams.shape.forEach((p, i) => {
    const vf = shapePointsFolder.addFolder(`顶点 ${i + 1}`);
    vf.add(p, "x", -20, 20, 0.5).name("x(m)");
    vf.add(p, "y", -20, 20, 0.5).name("y(m)");
    vf.onFinishChange(polylineVolumeUpdate);
    vf.open();
  });
  shapePointsFolder.open();
}
buildShapePointsFolder();
polylineVolumeFolder.addColor(polylineVolumeParams, "color").name("颜色");
polylineVolumeFolder.add(polylineVolumeParams, "cornerType", {
  "圆角": Cesium.CornerType.ROUNDED,
  "尖角": Cesium.CornerType.MITERED,
  "斜角": Cesium.CornerType.BEVELED,
}).name("转角类型");
polylineVolumeFolder.add({ zoom: () => viewer.flyTo(polylineVolume, { duration: 2 }) }, "zoom").name("缩放");
polylineVolumeFolder.close();
polylineVolumeFolder.onFinishChange(polylineVolumeUpdate);
function polylineVolumeUpdate() {
  polylineVolume.polylineVolume.positions = new Cesium.ConstantProperty(polylineVolumePositions());
  polylineVolume.polylineVolume.shape = new Cesium.ConstantProperty(polylineVolumeShape());
  polylineVolume.polylineVolume.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...polylineVolumeParams.color));
  polylineVolume.polylineVolume.cornerType = polylineVolumeParams.cornerType;
}

// ===========================
// corridor
// ===========================
const corridorParams = {
  // 路径点（L 形拐弯，整体移到东侧避开其他实体）
  points: [
    { lon: 116.491193, lat: 39.856776 }, // 西南起点
    { lon: 116.491193, lat: 39.906776 }, // 向北
    { lon: 116.541193, lat: 39.906776 }, // 向东
  ],
  width: 50, // 走廊宽度(m)
  height: 0, // 底面高度(m)
  extrudedHeight: 200, // 顶面高度(m)，与 height 不同即为立体走廊
  color: [0.0, 1.0, 1.0, 1.0], // rgba 填充颜色
  cornerType: Cesium.CornerType.ROUNDED, // ROUNDED 圆角 / MITERED 尖角 / BEVELED 斜角
  // outline
  outline: true, // 是否显示轮廓线
  outlineColor: [0.0, 0.0, 0.0, 1.0], // rgba 轮廓颜色
  outlineWidth: 2, // 轮廓宽度(px)
}
const corridorEntity = new Cesium.CorridorGraphics({
  positions: Cesium.Cartesian3.fromDegreesArray(
    corridorParams.points.flatMap(p => [p.lon, p.lat]),
  ),
  width: corridorParams.width,
  height: corridorParams.height,
  extrudedHeight: corridorParams.extrudedHeight,
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...corridorParams.color)),
  cornerType: corridorParams.cornerType,
  outline: corridorParams.outline,
  outlineColor: new Cesium.Color(...corridorParams.outlineColor),
  outlineWidth: corridorParams.outlineWidth,
})
const corridor = viewer.entities.add({
  corridor: corridorEntity,
})
const corridorFolder = gui.addFolder("corridor");
// 路径点控制
corridorParams.points.forEach((p, i) => {
  const pointFolder = corridorFolder.addFolder(`路径点 ${i + 1}`);
  pointFolder.add(p, "lon", 110, 125, 0.0001).name("经度");
  pointFolder.add(p, "lat", 30, 45, 0.0001).name("纬度");
  pointFolder.onFinishChange(corridorUpdate);
  pointFolder.open();
});
// 尺寸与外观
corridorFolder.add(corridorParams, "width", 1, 500, 1).name("宽度(m)");
corridorFolder.add(corridorParams, "height", 0, 1000, 1).name("底面高度(m)");
corridorFolder.add(corridorParams, "extrudedHeight", 0, 1000, 1).name("顶面高度(m)");
corridorFolder.addColor(corridorParams, "color").name("填充颜色");
corridorFolder.add(corridorParams, "cornerType", {
  "圆角": Cesium.CornerType.ROUNDED,
  "尖角": Cesium.CornerType.MITERED,
  "斜角": Cesium.CornerType.BEVELED,
}).name("转角类型");
corridorFolder.add(corridorParams, "outline").name("轮廓线");
corridorFolder.addColor(corridorParams, "outlineColor").name("轮廓颜色");
corridorFolder.add(corridorParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
corridorFolder.add({ zoom: () => viewer.flyTo(corridor, { duration: 2 }) }, "zoom").name("缩放");
corridorFolder.close();
corridorFolder.onFinishChange(corridorUpdate);
function corridorUpdate() {
  corridor.corridor.positions = new Cesium.ConstantProperty(
    Cesium.Cartesian3.fromDegreesArray(
      corridorParams.points.flatMap(p => [p.lon, p.lat]),
    ),
  );
  corridor.corridor.width = corridorParams.width;
  corridor.corridor.height = corridorParams.height;
  corridor.corridor.extrudedHeight = corridorParams.extrudedHeight;
  corridor.corridor.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...corridorParams.color));
  corridor.corridor.cornerType = corridorParams.cornerType;
  corridor.corridor.outline = corridorParams.outline;
  corridor.corridor.outlineColor = new Cesium.Color(...corridorParams.outlineColor);
  corridor.corridor.outlineWidth = corridorParams.outlineWidth;
}



// ===========================
// polygon（西南角）
// ===========================
const polygonParams = {
  // 多边形顶点（封闭区域，增删在这里改）
  points: [
    { lon: 116.191193, lat: 39.756776 },
    { lon: 116.291193, lat: 39.756776 },
    { lon: 116.291193, lat: 39.856776 },
    { lon: 116.191193, lat: 39.856776 },
  ],
  height: 0, // 底面高度(m)
  extrudedHeight: 100, // 顶面高度(m)，>height 则为立体多边形
  color: [0.0, 1.0, 0.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
  arcType: Cesium.ArcType.GEODESIC, // GEODESIC 大地线 / NONE 直线 / RHUMB 恒向线
}
const polygonEntity = new Cesium.PolygonGraphics({
  hierarchy: new Cesium.PolygonHierarchy(
    Cesium.Cartesian3.fromDegreesArray(polygonParams.points.flatMap(p => [p.lon, p.lat])),
  ),
  height: polygonParams.height,
  extrudedHeight: polygonParams.extrudedHeight,
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...polygonParams.color)),
  outline: polygonParams.outline,
  outlineColor: new Cesium.Color(...polygonParams.outlineColor),
  outlineWidth: polygonParams.outlineWidth,
  arcType: polygonParams.arcType,
})
const polygon = viewer.entities.add({ polygon: polygonEntity })
const polygonFolder = gui.addFolder("polygon");
polygonParams.points.forEach((p, i) => {
  const pointFolder = polygonFolder.addFolder(`顶点 ${i + 1}`);
  pointFolder.add(p, "lon", 110, 125, 0.0001).name("经度");
  pointFolder.add(p, "lat", 30, 45, 0.0001).name("纬度");
  pointFolder.onFinishChange(polygonUpdate);
  pointFolder.open();
});
polygonFolder.add(polygonParams, "height", 0, 1000, 1).name("底面高度(m)");
polygonFolder.add(polygonParams, "extrudedHeight", 0, 1000, 1).name("顶面高度(m)");
polygonFolder.addColor(polygonParams, "color").name("填充颜色");
polygonFolder.add(polygonParams, "outline").name("轮廓线");
polygonFolder.addColor(polygonParams, "outlineColor").name("轮廓颜色");
polygonFolder.add(polygonParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
polygonFolder.add(polygonParams, "arcType", {
  "大地线": Cesium.ArcType.GEODESIC,
  "直线": Cesium.ArcType.NONE,
  "恒向线": Cesium.ArcType.RHUMB,
}).name("弧线类型");
polygonFolder.add({ zoom: () => viewer.flyTo(polygon, { duration: 2 }) }, "zoom").name("缩放");
polygonFolder.close();
polygonFolder.onFinishChange(polygonUpdate);
function polygonUpdate() {
  polygon.polygon.hierarchy = new Cesium.PolygonHierarchy(
    Cesium.Cartesian3.fromDegreesArray(polygonParams.points.flatMap(p => [p.lon, p.lat])),
  );
  polygon.polygon.height = polygonParams.height;
  polygon.polygon.extrudedHeight = polygonParams.extrudedHeight;
  polygon.polygon.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...polygonParams.color));
  polygon.polygon.outline = polygonParams.outline;
  polygon.polygon.outlineColor = new Cesium.Color(...polygonParams.outlineColor);
  polygon.polygon.outlineWidth = polygonParams.outlineWidth;
  polygon.polygon.arcType = polygonParams.arcType;
}

// ===========================
// rectangle（西北角）
// ===========================
const rectangleParams = {
  west: 116.191193, // 西边界(经度)
  south: 39.956776, // 南边界(纬度)
  east: 116.291193, // 东边界(经度)
  north: 40.056776, // 北边界(纬度)
  height: 0, // 底面高度(m)
  extrudedHeight: 100, // 顶面高度(m)
  rotation: 0, // 旋转角度(rad)
  color: [1.0, 0.5, 0.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
}
const rectangleEntity = new Cesium.RectangleGraphics({
  coordinates: Cesium.Rectangle.fromDegrees(
    rectangleParams.west, rectangleParams.south, rectangleParams.east, rectangleParams.north,
  ),
  height: rectangleParams.height,
  extrudedHeight: rectangleParams.extrudedHeight,
  rotation: rectangleParams.rotation,
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...rectangleParams.color)),
  outline: rectangleParams.outline,
  outlineColor: new Cesium.Color(...rectangleParams.outlineColor),
  outlineWidth: rectangleParams.outlineWidth,
})
const rectangle = viewer.entities.add({ rectangle: rectangleEntity })
const rectangleFolder = gui.addFolder("rectangle");
rectangleFolder.add(rectangleParams, "west", 110, 125, 0.0001).name("西边界");
rectangleFolder.add(rectangleParams, "south", 30, 45, 0.0001).name("南边界");
rectangleFolder.add(rectangleParams, "east", 110, 125, 0.0001).name("东边界");
rectangleFolder.add(rectangleParams, "north", 30, 45, 0.0001).name("北边界");
rectangleFolder.add(rectangleParams, "height", 0, 1000, 1).name("底面高度(m)");
rectangleFolder.add(rectangleParams, "extrudedHeight", 0, 1000, 1).name("顶面高度(m)");
rectangleFolder.add(rectangleParams, "rotation", 0, Math.PI * 2, 0.01).name("旋转(rad)");
rectangleFolder.addColor(rectangleParams, "color").name("填充颜色");
rectangleFolder.add(rectangleParams, "outline").name("轮廓线");
rectangleFolder.addColor(rectangleParams, "outlineColor").name("轮廓颜色");
rectangleFolder.add(rectangleParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
rectangleFolder.add({ zoom: () => viewer.flyTo(rectangle, { duration: 2 }) }, "zoom").name("缩放");
rectangleFolder.close();
rectangleFolder.onFinishChange(rectangleUpdate);
function rectangleUpdate() {
  rectangle.rectangle.coordinates = Cesium.Rectangle.fromDegrees(
    rectangleParams.west, rectangleParams.south, rectangleParams.east, rectangleParams.north,
  );
  rectangle.rectangle.height = rectangleParams.height;
  rectangle.rectangle.extrudedHeight = rectangleParams.extrudedHeight;
  rectangle.rectangle.rotation = rectangleParams.rotation;
  rectangle.rectangle.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...rectangleParams.color));
  rectangle.rectangle.outline = rectangleParams.outline;
  rectangle.rectangle.outlineColor = new Cesium.Color(...rectangleParams.outlineColor);
  rectangle.rectangle.outlineWidth = rectangleParams.outlineWidth;
}

// ===========================
// ellipse（东北角）
// ===========================
const ellipseParams = {
  lon: 116.441193, // 中心经度
  lat: 39.956776, // 中心纬度
  height: 0, // 高度(m)
  semiMajorAxis: 4000, // 半长轴(m)
  semiMinorAxis: 2500, // 半短轴(m)
  rotation: 0, // 旋转(rad)
  color: [1.0, 0.0, 1.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
}
const ellipseEntity = new Cesium.EllipseGraphics({
  semiMajorAxis: ellipseParams.semiMajorAxis,
  semiMinorAxis: ellipseParams.semiMinorAxis,
  rotation: ellipseParams.rotation,
  height: ellipseParams.height,
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...ellipseParams.color)),
  outline: ellipseParams.outline,
  outlineColor: new Cesium.Color(...ellipseParams.outlineColor),
  outlineWidth: ellipseParams.outlineWidth,
})
const ellipse = viewer.entities.add({
  position: Cartesian3.fromDegrees(ellipseParams.lon, ellipseParams.lat, ellipseParams.height),
  ellipse: ellipseEntity,
})
const ellipseFolder = gui.addFolder("ellipse");
ellipseFolder.add(ellipseParams, "lon", 110, 125, 0.0001).name("经度");
ellipseFolder.add(ellipseParams, "lat", 30, 45, 0.0001).name("纬度");
ellipseFolder.add(ellipseParams, "height", 0, 1000, 1).name("高度(m)");
ellipseFolder.add(ellipseParams, "semiMajorAxis", 100, 10000, 100).name("半长轴(m)");
ellipseFolder.add(ellipseParams, "semiMinorAxis", 100, 10000, 100).name("半短轴(m)");
ellipseFolder.add(ellipseParams, "rotation", 0, Math.PI * 2, 0.01).name("旋转(rad)");
ellipseFolder.addColor(ellipseParams, "color").name("填充颜色");
ellipseFolder.add(ellipseParams, "outline").name("轮廓线");
ellipseFolder.addColor(ellipseParams, "outlineColor").name("轮廓颜色");
ellipseFolder.add(ellipseParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
ellipseFolder.add({ zoom: () => viewer.flyTo(ellipse, { duration: 2 }) }, "zoom").name("缩放");
ellipseFolder.close();
ellipseFolder.onFinishChange(ellipseUpdate);
function ellipseUpdate() {
  ellipse.position.setValue(Cartesian3.fromDegrees(ellipseParams.lon, ellipseParams.lat, ellipseParams.height));
  ellipse.ellipse.semiMajorAxis = ellipseParams.semiMajorAxis;
  ellipse.ellipse.semiMinorAxis = ellipseParams.semiMinorAxis;
  ellipse.ellipse.rotation = ellipseParams.rotation;
  ellipse.ellipse.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...ellipseParams.color));
  ellipse.ellipse.outline = ellipseParams.outline;
  ellipse.ellipse.outlineColor = new Cesium.Color(...ellipseParams.outlineColor);
  ellipse.ellipse.outlineWidth = ellipseParams.outlineWidth;
}

// ===========================
// wall（东南角）
// ===========================
const wallParams = {
  // 墙体顶点（带高度，形成竖起的墙面，增删在这里改）
  positions: [
    { lon: 116.441193, lat: 39.756776, height: 0 },
    { lon: 116.491193, lat: 39.756776, height: 100 },
    { lon: 116.491193, lat: 39.806776, height: 200 },
  ],
  color: [0.5, 0.0, 1.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
}
const wallEntity = new Cesium.WallGraphics({
  positions: Cesium.Cartesian3.fromDegreesArrayHeights(
    wallParams.positions.flatMap(p => [p.lon, p.lat, p.height]),
  ),
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...wallParams.color)),
  outline: wallParams.outline,
  outlineColor: new Cesium.Color(...wallParams.outlineColor),
  outlineWidth: wallParams.outlineWidth,
})
const wall = viewer.entities.add({ wall: wallEntity })
const wallFolder = gui.addFolder("wall");
wallParams.positions.forEach((p, i) => {
  const pointFolder = wallFolder.addFolder(`顶点 ${i + 1}`);
  pointFolder.add(p, "lon", 110, 125, 0.0001).name("经度");
  pointFolder.add(p, "lat", 30, 45, 0.0001).name("纬度");
  pointFolder.add(p, "height", 0, 1000, 1).name("高度(m)");
  pointFolder.onFinishChange(wallUpdate);
  pointFolder.open();
});
wallFolder.addColor(wallParams, "color").name("填充颜色");
wallFolder.add(wallParams, "outline").name("轮廓线");
wallFolder.addColor(wallParams, "outlineColor").name("轮廓颜色");
wallFolder.add(wallParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
wallFolder.add({ zoom: () => viewer.flyTo(wall, { duration: 2 }) }, "zoom").name("缩放");
wallFolder.close();
wallFolder.onFinishChange(wallUpdate);
function wallUpdate() {
  wall.wall.positions = Cesium.Cartesian3.fromDegreesArrayHeights(
    wallParams.positions.flatMap(p => [p.lon, p.lat, p.height]),
  );
  wall.wall.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...wallParams.color));
  wall.wall.outline = wallParams.outline;
  wall.wall.outlineColor = new Cesium.Color(...wallParams.outlineColor);
  wall.wall.outlineWidth = wallParams.outlineWidth;
}

// ===========================
// box（西侧）
// ===========================
const boxParams = {
  lon: 115.891193, // 位置经度
  lat: 39.906776, // 位置纬度
  height: 100, // 位置高度(m)
  length: 500, // 长(m)
  width: 300, // 宽(m)
  depth: 200, // 高(m)
  color: [1.0, 1.0, 0.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
}
const boxEntity = new Cesium.BoxGraphics({
  dimensions: new Cesium.Cartesian3(boxParams.length, boxParams.width, boxParams.depth),
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...boxParams.color)),
  outline: boxParams.outline,
  outlineColor: new Cesium.Color(...boxParams.outlineColor),
  outlineWidth: boxParams.outlineWidth,
})
const box = viewer.entities.add({
  position: Cartesian3.fromDegrees(boxParams.lon, boxParams.lat, boxParams.height),
  box: boxEntity,
})
const boxFolder = gui.addFolder("box");
boxFolder.add(boxParams, "lon", 110, 125, 0.0001).name("经度");
boxFolder.add(boxParams, "lat", 30, 45, 0.0001).name("纬度");
boxFolder.add(boxParams, "height", 0, 10000, 1).name("高度(m)");
boxFolder.add(boxParams, "length", 1, 2000, 10).name("长(m)");
boxFolder.add(boxParams, "width", 1, 2000, 10).name("宽(m)");
boxFolder.add(boxParams, "depth", 1, 2000, 10).name("高(m)");
boxFolder.addColor(boxParams, "color").name("填充颜色");
boxFolder.add(boxParams, "outline").name("轮廓线");
boxFolder.addColor(boxParams, "outlineColor").name("轮廓颜色");
boxFolder.add(boxParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
boxFolder.add({ zoom: () => viewer.flyTo(box, { duration: 2 }) }, "zoom").name("缩放");
boxFolder.close();
boxFolder.onFinishChange(boxUpdate);
function boxUpdate() {
  box.position.setValue(Cartesian3.fromDegrees(boxParams.lon, boxParams.lat, boxParams.height));
  box.box.dimensions = new Cesium.Cartesian3(boxParams.length, boxParams.width, boxParams.depth);
  box.box.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...boxParams.color));
  box.box.outline = boxParams.outline;
  box.box.outlineColor = new Cesium.Color(...boxParams.outlineColor);
  box.box.outlineWidth = boxParams.outlineWidth;
}

// ===========================
// cylinder（北侧）
// ===========================
const cylinderParams = {
  lon: 116.091193, // 位置经度
  lat: 40.106776, // 位置纬度
  height: 100, // 底面高度(m)
  length: 300, // 圆柱高度(m)
  topRadius: 150, // 顶面半径(m)
  bottomRadius: 150, // 底面半径(m)，与顶半径不同则为圆台
  color: [0.0, 1.0, 1.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
}
const cylinderEntity = new Cesium.CylinderGraphics({
  length: cylinderParams.length,
  topRadius: cylinderParams.topRadius,
  bottomRadius: cylinderParams.bottomRadius,
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...cylinderParams.color)),
  outline: cylinderParams.outline,
  outlineColor: new Cesium.Color(...cylinderParams.outlineColor),
  outlineWidth: cylinderParams.outlineWidth,
})
const cylinder = viewer.entities.add({
  position: Cartesian3.fromDegrees(cylinderParams.lon, cylinderParams.lat, cylinderParams.height),
  cylinder: cylinderEntity,
})
const cylinderFolder = gui.addFolder("cylinder");
cylinderFolder.add(cylinderParams, "lon", 110, 125, 0.0001).name("经度");
cylinderFolder.add(cylinderParams, "lat", 30, 45, 0.0001).name("纬度");
cylinderFolder.add(cylinderParams, "height", 0, 10000, 1).name("底面高度(m)");
cylinderFolder.add(cylinderParams, "length", 10, 2000, 10).name("高度(m)");
cylinderFolder.add(cylinderParams, "topRadius", 10, 1000, 10).name("顶半径(m)");
cylinderFolder.add(cylinderParams, "bottomRadius", 10, 1000, 10).name("底半径(m)");
cylinderFolder.addColor(cylinderParams, "color").name("填充颜色");
cylinderFolder.add(cylinderParams, "outline").name("轮廓线");
cylinderFolder.addColor(cylinderParams, "outlineColor").name("轮廓颜色");
cylinderFolder.add(cylinderParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
cylinderFolder.add({ zoom: () => viewer.flyTo(cylinder, { duration: 2 }) }, "zoom").name("缩放");
cylinderFolder.close();
cylinderFolder.onFinishChange(cylinderUpdate);
function cylinderUpdate() {
  cylinder.position.setValue(Cartesian3.fromDegrees(cylinderParams.lon, cylinderParams.lat, cylinderParams.height));
  cylinder.cylinder.length = cylinderParams.length;
  cylinder.cylinder.topRadius = cylinderParams.topRadius;
  cylinder.cylinder.bottomRadius = cylinderParams.bottomRadius;
  cylinder.cylinder.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...cylinderParams.color));
  cylinder.cylinder.outline = cylinderParams.outline;
  cylinder.cylinder.outlineColor = new Cesium.Color(...cylinderParams.outlineColor);
  cylinder.cylinder.outlineWidth = cylinderParams.outlineWidth;
}

// ===========================
// ellipsoid（西南侧）
// ===========================
const ellipsoidParams = {
  lon: 115.891193, // 位置经度
  lat: 39.756776, // 位置纬度
  height: 100, // 位置高度(m)
  xRadius: 300, // X 轴半径(m)
  yRadius: 300, // Y 轴半径(m)
  zRadius: 400, // Z 轴半径(m)，不同则为扁/长椭球
  color: [1.0, 0.0, 1.0, 1.0], // rgba 填充颜色
  // outline
  outline: true,
  outlineColor: [0.0, 0.0, 0.0, 1.0],
  outlineWidth: 2,
}
const ellipsoidEntity = new Cesium.EllipsoidGraphics({
  radii: new Cesium.Cartesian3(ellipsoidParams.xRadius, ellipsoidParams.yRadius, ellipsoidParams.zRadius),
  material: new Cesium.ColorMaterialProperty(new Cesium.Color(...ellipsoidParams.color)),
  outline: ellipsoidParams.outline,
  outlineColor: new Cesium.Color(...ellipsoidParams.outlineColor),
  outlineWidth: ellipsoidParams.outlineWidth,
})
const ellipsoid = viewer.entities.add({
  position: Cartesian3.fromDegrees(ellipsoidParams.lon, ellipsoidParams.lat, ellipsoidParams.height),
  ellipsoid: ellipsoidEntity,
})
const ellipsoidFolder = gui.addFolder("ellipsoid");
ellipsoidFolder.add(ellipsoidParams, "lon", 110, 125, 0.0001).name("经度");
ellipsoidFolder.add(ellipsoidParams, "lat", 30, 45, 0.0001).name("纬度");
ellipsoidFolder.add(ellipsoidParams, "height", 0, 10000, 1).name("高度(m)");
ellipsoidFolder.add(ellipsoidParams, "xRadius", 10, 2000, 10).name("X 半径(m)");
ellipsoidFolder.add(ellipsoidParams, "yRadius", 10, 2000, 10).name("Y 半径(m)");
ellipsoidFolder.add(ellipsoidParams, "zRadius", 10, 2000, 10).name("Z 半径(m)");
ellipsoidFolder.addColor(ellipsoidParams, "color").name("填充颜色");
ellipsoidFolder.add(ellipsoidParams, "outline").name("轮廓线");
ellipsoidFolder.addColor(ellipsoidParams, "outlineColor").name("轮廓颜色");
ellipsoidFolder.add(ellipsoidParams, "outlineWidth", 0, 10, 1).name("轮廓宽度");
ellipsoidFolder.add({ zoom: () => viewer.flyTo(ellipsoid, { duration: 2 }) }, "zoom").name("缩放");
ellipsoidFolder.close();
ellipsoidFolder.onFinishChange(ellipsoidUpdate);
function ellipsoidUpdate() {
  ellipsoid.position.setValue(Cartesian3.fromDegrees(ellipsoidParams.lon, ellipsoidParams.lat, ellipsoidParams.height));
  ellipsoid.ellipsoid.radii = new Cesium.Cartesian3(ellipsoidParams.xRadius, ellipsoidParams.yRadius, ellipsoidParams.zRadius);
  ellipsoid.ellipsoid.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...ellipsoidParams.color));
  ellipsoid.ellipsoid.outline = ellipsoidParams.outline;
  ellipsoid.ellipsoid.outlineColor = new Cesium.Color(...ellipsoidParams.outlineColor);
  ellipsoid.ellipsoid.outlineWidth = ellipsoidParams.outlineWidth;
}

// ===========================
// model（东北侧，加载 glb 模型）
// ===========================
const modelParams = {
  lon: 116.241193, // 位置经度
  lat: 40.106776, // 位置纬度
  height: 0, // 位置高度(m)
  uri: "/models/anime01.glb", // 模型路径(glb/gltf)
  scale: 1.0, // 缩放
  minimumPixelSize: 100, // 最小像素尺寸，避免太远看不见
  maximumScale: 10000, // 最大缩放上限(m)
  color: [1.0, 1.0, 1.0, 1.0], // rgba 着色（白=原色）
  silhouetteColor: [0.0, 1.0, 0.0, 1.0], // rgba 描边颜色
  silhouetteSize: 0, // 描边宽度，0 关闭
}
const modelEntity = new Cesium.ModelGraphics({
  uri: modelParams.uri,
  scale: modelParams.scale,
  minimumPixelSize: modelParams.minimumPixelSize,
  maximumScale: modelParams.maximumScale,
  color: new Cesium.Color(...modelParams.color),
  silhouetteColor: new Cesium.Color(...modelParams.silhouetteColor),
  silhouetteSize: modelParams.silhouetteSize,
})
const model = viewer.entities.add({
  position: Cartesian3.fromDegrees(modelParams.lon, modelParams.lat, modelParams.height),
  model: modelEntity,
})
const modelFolder = gui.addFolder("model");
modelFolder.add(modelParams, "lon", 110, 125, 0.0001).name("经度");
modelFolder.add(modelParams, "lat", 30, 45, 0.0001).name("纬度");
modelFolder.add(modelParams, "height", 0, 10000, 1).name("高度(m)");
modelFolder.add(modelParams, "uri").name("模型 URL");
modelFolder.add(modelParams, "scale", 0.01, 100, 0.01).name("缩放");
modelFolder.add(modelParams, "minimumPixelSize", 0, 500, 1).name("最小像素");
modelFolder.add(modelParams, "maximumScale", 0, 100000, 100).name("最大缩放(m)");
modelFolder.addColor(modelParams, "color").name("着色");
modelFolder.addColor(modelParams, "silhouetteColor").name("描边颜色");
modelFolder.add(modelParams, "silhouetteSize", 0, 10, 0.5).name("描边宽度");
modelFolder.add({ zoom: () => viewer.flyTo(model, { duration: 2 }) }, "zoom").name("缩放");
modelFolder.close();
modelFolder.onFinishChange(modelUpdate);
function modelUpdate() {
  model.position.setValue(Cartesian3.fromDegrees(modelParams.lon, modelParams.lat, modelParams.height));
  model.model.uri = modelParams.uri;
  model.model.scale = modelParams.scale;
  model.model.minimumPixelSize = modelParams.minimumPixelSize;
  model.model.maximumScale = modelParams.maximumScale;
  model.model.color = new Cesium.Color(...modelParams.color);
  model.model.silhouetteColor = new Cesium.Color(...modelParams.silhouetteColor);
  model.model.silhouetteSize = modelParams.silhouetteSize;
}

