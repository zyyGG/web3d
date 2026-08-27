import * as THREE from "three"

/**
 * @description: 天地图切片加载
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @param {Object} options 配置项
 * @param {string} options.tk 天地图tk
 * @param {number} options.radius 半径
 * @param {number} options.tileSize 切片大小
 */
export function loadTDTMap(lng, lat, options) {
  return new Promise((resolve, reject) => {
    // 处理options
    options = options || {};
    if (!options.tk) {
      reject("请提供天地图tk");
      return;
    }
    const tk = options.tk;
    const radius = options.radius || 6;
    const tileSize = options.tileSize || 50;

    // 处理坐标
    if (lng === undefined || lat === undefined) {
      reject("请提供经纬度");
      return;
    }

    // WGS84转Web墨卡托
    const webPosition = LonLat2WebMercator(lng, lat);
    // Web墨卡托转成tile上的像素坐标
    const tileInfo = WebMercator2Tileimage(
      webPosition.x,
      webPosition.y
    ).tileinfo;
    console.log(webPosition)
    const tileGroup = new THREE.Group();
    // 加载tile
    for(let i = -radius; i <= radius; i++) {
      for(let j = -radius; j <= radius; j++) {
        try {
           loadImageTile(tileInfo.x + i, tileInfo.y + j, tileSize, tk)
           .then((mesh) => {
            mesh.position.set(
              i * tileSize,
              0,
              j * tileSize
            );
            mesh.rotation.x = -Math.PI / 2;
            tileGroup.add(mesh);
          })
        } catch(error){
          reject(error); // 加载失败
        }
      }
    }
    resolve(tileGroup);
  });
}

// WGS84转Web墨卡托
export function LonLat2WebMercator(lng, lat) {
  // 重写计算公式
  let x = lng * 20037508.34 / 180
  let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  y = y * 20037508.34 / 180;
  return {x, y}

  // let x = (lng / 180.0) * 20037508.3427892;
  // let y;
  // if (lat > 85.05112) {
  //   lat = 85.05112;
  // }
  // if (lat < -85.05112) {
  //   lat = -85.05112;
  // }
  // y = (Math.PI / 180.0) * lat;
  // let tmp = Math.PI / 4.0 + y / 2.0;
  // y = (20037508.3427892 * Math.log(Math.tan(tmp))) / Math.PI;
  // let result = {
  //   x: x,
  //   y: y,
  // };
  // return result;
}

//Web墨卡托转成tile上的像素坐标，返回像素坐标，以及tile编号，在所在tile上的偏移
function WebMercator2Tileimage(x, y) {
  //对于第18级地图, 对于我国而言
  let level = 18;
  let r = 20037508.3427892;
  y = r - y;
  x = r + x;
  let size = Math.pow(2, level) * 256;
  let imgx = (x * size) / (r * 2);
  let imgy = (y * size) / (r * 2);
  //当前位置在全球切片编号
  let col = Math.floor(imgx / 256);
  let row = Math.floor(imgy / 256);
  // console.log("col", col, "row", row);
  //当前位置对应于tile图像中的位置
  let imgdx = imgx % 256;
  let imgdy = imgy % 256;

  //像素坐标
  let position = {
    x: imgx,
    y: imgy,
  };
  //tile编号
  let tileinfo = {
    x: col,
    y: row,
    level: 18,
  };
  //在所在tile上的偏移
  let offset = {
    x: imgdx,
    y: imgdy,
  };

  let result = {
    position: position,
    tileinfo: tileinfo,
    offset: offset,
  };
  return result;
}

/**
 * 加载一个切图
 * @param {Object} xno tile编号x
 * @param {Object} yno tile编号y
 * @param {Object} callback
 */
function loadImageTile(xno, yno, tileSize, tk) {

  // https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL=27248&TILEROW=13189&TILEMATRIX=15&tk=YOUR_TK
  const level = 18;
  // var url = serverURL + level + "/" + xno + "/" + yno + ".png";
  const url =
    "https://t0.tianditu.gov.cn/img_w/wmts?tk=" +
    tk +
    "&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=" +
    level +
    "&TILEROW=" +
    yno +
    "&TILECOL=" +
    xno +
    "&FORMAT=tiles";
  const loader = new THREE.TextureLoader();
  //跨域加载图片
  loader.crossOrigin = true;
  return new Promise((resolve, reject) => {
    try {
      loader.load(url, function (texture) {
        const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.FrontSide, //双面显示
        });
        const mesh = new THREE.Mesh(geometry, material);
        resolve(mesh);
      });
    } catch(error){
      reject(error);
    }
  })
}
