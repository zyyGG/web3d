import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "dat.gui"
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具
import { animate, createTimeline } from "animejs"



// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);

// 渲染器初始化
const renderer = new THREE.WebGLRenderer({
  antialias: true, // 抗锯齿
})
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
// 主要代码写在这里
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0xfeffcc, flatShading:true, shininess: 150 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


  //切图在scene中的大小
  var tileSize = 50;
  //地图切片服务地址
  // var serverURL = "https://c.tile.osm.org/";
  // 天地图官网申请tk
  var mytk = import.meta.env.VITE_TDT_TOKEN;
  //设置中心经纬度
  var centerLng = 0
    , centerLat = 0;

  //WGS84转Web墨卡托
  //参考：http://www.opengsc.com/archives/137
  function LonLat2WebMercator(lng, lat) {
    var x = (lng / 180.0) * 20037508.3427892;
    var y;
    if (lat > 85.05112) {
      lat = 85.05112;
    }
    if (lat < -85.05112) {
      lat = -85.05112;
    }
    y = (Math.PI / 180.0) * lat;
    var tmp = Math.PI / 4.0 + y / 2.0;
    y = 20037508.3427892 * Math.log(Math.tan(tmp)) / Math.PI;
    var result = {
      x: x,
      y: y
    };
    return result;
  }

  //Web墨卡托转成tile上的像素坐标，返回像素坐标，以及tile编号，在所在tile上的偏移
  function WebMercator2Tileimage(x, y) {
    //对于第18级地图, 对于我国而言
    var level = 18;
    var r = 20037508.3427892;
    y = r - y;
    x = r + x;
    var size = Math.pow(2, level) * 256;
    var imgx = x * size / (r * 2);
    var imgy = y * size / (r * 2);
    //当前位置在全球切片编号
    var col = Math.floor(imgx / 256);
    var row = Math.floor(imgy / 256);
    console.log("col", col, "row", row);
    //当前位置对应于tile图像中的位置
    var imgdx = imgx % 256;
    var imgdy = imgy % 256;

    //像素坐标
    var position = {
      x: imgx,
      y: imgy
    };
    //tile编号
    var tileinfo = {
      x: col,
      y: row,
      level: 18
    };
    //在所在tile上的偏移
    var offset = {
      x: imgdx,
      y: imgdy
    };

    var result = {
      position: position,
      tileinfo: tileinfo,
      offset: offset
    };
    return result;
  }

  //经纬度到tile，再到WebGL坐标
  function LonLat2WebGL(lng, lat) {
    var webMercator = LonLat2WebMercator(lng, lat);
    var tilePos = WebMercator2Tileimage(webMercator.x, webMercator.y).position;

    var centerWM = LonLat2WebMercator(centerLng, centerLat);
    // var centerWM = LonLat2WebMercator(lng, lat);
    var centerTP = WebMercator2Tileimage(centerWM.x, centerWM.y);
    //相对偏移修正（以centerLng,centerLat所在点tile中心点为原点，导致的偏移）
    var x = (tilePos.x - centerTP.position.x + (centerTP.offset.x - 256 / 2)) * tileSize / 256;
    var y = (tilePos.y - centerTP.position.y + (-centerTP.offset.y + 256 / 2)) * tileSize / 256;

    var result = {
      x: x,
      y: y
    };
    return result;
  }

  /**
   * 加载一个切图
   * @param {Object} xno tile编号x
   * @param {Object} yno tile编号y
   * @param {Object} callback
   */
  function loadImageTile(xno, yno, callback) {
    var level = 18;
    // var url = serverURL + level + "/" + xno + "/" + yno + ".png";
    var url = 'https://t1.tianditu.gov.cn/img_w/wmts?tk=' + mytk + '&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&TILEMATRIX=' + level + '&TILEROW=' + yno + '&TILECOL=' + xno + '&FORMAT=tiles'
    var loader = new THREE.TextureLoader();
    //跨域加载图片
    loader.crossOrigin = true;
    loader.load(url, function (texture) {
      var geometry = new THREE.PlaneGeometry(tileSize, tileSize, 1);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.FrontSide//双面显示
      });
      var mesh = new THREE.Mesh(geometry, material);
      callback(mesh);
    });
  }
let mapGroup = new THREE.Group()
  scene.add(mapGroup)
  mapGroup.rotateX(-Math.PI / 2);
  /**
   * 将加载的切图放到scene
   * @param {Object} mesh
   * @param {Object} x坐标  WebGL坐标
   * @param {Object} y坐标
   */
  function addTileToScene(mesh, x, y) {
    //mesh的中心位置
    mesh.position.x = x;
    mesh.position.y = y;
    // mesh.rotateZ(-Math.PI / 2);
    mapGroup.add(mesh);
  }

  /**
   * 辅助函数，用于计算tile应该放在何处
   * @param {Object} dx  tile间相对位置，也就是编号差
   * @param {Object} dy
   */
  function addTileToSceneHelper(dx, dy) {
    var x = tileSize * dx;
    var y = -tileSize * dy;
    return function (mesh) {
      addTileToScene(mesh, x, y)
    };
  }

  /**
   * 加载地图
   * @param {Object} centerX 地图中间的切图编号
   * @param {Object} centerY 地图中间的切图编号
   */
  function loadMap(centerX, centerY) {
    var radius = 10;
    for (var i = centerX - radius; i <= centerX + radius; i++) {
      for (var j = centerY - radius; j <= centerY + radius; j++) {
        //console.log("try to load",i,j,i-centerX,j-centerY);
        console.log("try to load");
        loadImageTile(i, j, addTileToSceneHelper(i - centerX, j - centerY));
      }
    }
  }

  /**
   * 标记出当前位置
   * @param {Object} x webGL坐标
   * @param {Object} y
   */
  function markCurrentPosition(x, y) {
    var geometry = new THREE.SphereGeometry(10, 30, 30);
    var material = new THREE.MeshBasicMaterial({
      color: 0xff0000
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = x;
    mesh.position.y = y;
    scene.add(mesh);
  }

  function main() {
    // navigator.geolocation.getCurrentPosition(function (position) {
    //   var lng = position.coords.longitude;
    //   var lat = position.coords.latitude;
    //   console.log("current position in world", lat, lng);
    //   centerLat = lat;
    //   centerLng = lng;
    //
    //   var webMercator = LonLat2WebMercator(lng, lat);
    //   var tilePos = WebMercator2Tileimage(webMercator.x, webMercator.y);
    //
    //   //以centerLng所在点tile中心点为中心，加载tile
    //   loadMap(tilePos.tileinfo.x, tilePos.tileinfo.y);
    //
    //   //标记当前位置
    //   var currentWebGLPos = LonLat2WebGL(lng, lat);
    //   markCurrentPosition(currentWebGLPos.x, currentWebGLPos.y);
    // });
    // 先转换成WebMercator坐标
    var webMercator = LonLat2WebMercator(119.71897227089664, 32.56081717055707);
    var tilePos = WebMercator2Tileimage(webMercator.x, webMercator.y);
    loadMap(tilePos.tileinfo.x, tilePos.tileinfo.y);
    // var currentWebGLPos = LonLat2WebGL(115.650846, 34.415643);
    // markCurrentPosition(currentWebGLPos.x, currentWebGLPos.y);
  }

  main()


///--------------------------------------------------------------------


// 渲染场景
function animations() {
  renderer.render(scene, camera)
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