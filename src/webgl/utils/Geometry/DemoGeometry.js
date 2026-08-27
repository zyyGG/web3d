import Geometry from "./Geometry.js";

export default class DemoGeometry extends Geometry {
  constructor(width , height, depth){
    super();
    this.positions = new Float32Array([
      // 正面
      0, 0, 0,
      0, height, 0,
      width / 3, 0, 0,
      0, height, 0,
      width / 3, height, 0,
      width / 3, 0, 0,

      width / 3 , 0, 0,
      width / 3 , height / 5, 0,
      width , 0, 0,
      width / 3 , height / 5, 0,
      width , height / 5, 0,
      width , 0, 0,

      width / 3 , height / 5 * 2, 0,
      width / 3 , height / 5 * 3, 0,
      width / 3 * 2 , height / 5 * 2, 0,
      width / 3 , height / 5 * 3, 0,
      width / 3 * 2 , height / 5 * 3, 0,
      width / 3 * 2 , height / 5 * 2, 0,

      // 左边
      0, 0, 0,
      0, 0, -depth,
      0, height, -depth,
      0, 0, 0,
      0, height, -depth,
      0, height, 0,
      
      // 背面
      0, 0, -depth,
      width / 3, 0, -depth,
      width / 3, height, -depth,
      0, 0, -depth,
      width / 3, height, -depth,
      0, height, -depth,

      width, 0, -depth,
      width, height / 5, -depth,
      width / 3, 0, -depth,
      width, height / 5, -depth,
      width / 3, height / 5, -depth,
      width / 3, 0, -depth,

      width / 3 * 2 , height / 5 * 2, -depth,
      width / 3 * 2 , height / 5 * 3, -depth,
      width / 3 , height / 5 * 2, -depth,
      width / 3 * 2 , height / 5 * 3, -depth,
      width / 3 , height / 5 * 3, -depth,
      width / 3 , height / 5 * 2, -depth,

      // 右边
      width / 3, 0, 0,
      width / 3, height, 0,
      width / 3, height, -depth,
      width / 3, 0, 0,
      width / 3, height, -depth,
      width / 3, 0, -depth,

      width , 0, 0,
      width , height / 5, 0,
      width , height / 5, -depth,
      width , 0, 0,
      width , height / 5, -depth,
      width , 0, -depth,

      width / 3 * 2 , height / 5 * 2, 0,
      width / 3 * 2 , height / 5 * 3, 0,
      width / 3 * 2 , height / 5 * 3, -depth,
      width / 3 * 2 , height / 5 * 2, 0,
      width / 3 * 2 , height / 5 * 3, -depth,
      width / 3 * 2 , height / 5 * 2, -depth,

      // 顶部
      0, 0, -depth,
      0, 0, 0,
      width, 0, 0,
      0, 0, -depth,
      width, 0, 0,
      width, 0, -depth,

      width / 3, height / 5 * 2, -depth,
      width / 3, height / 5 * 2, 0,
      width / 3 * 2, height / 5 * 2, 0,
      width / 3, height / 5 * 2, -depth,
      width / 3 * 2, height / 5 * 2, 0,
      width / 3 * 2, height / 5 * 2, -depth,

      // 底部
      0, height, 0,
      0, height, -depth,
      width / 3, height, -depth,
      0, height, 0,
      width / 3, height, -depth,
      width / 3, height, 0,

      width / 3, height / 5 * 3, 0,
      width / 3, height / 5 * 3, -depth,
      width / 3 * 2, height / 5 * 3, -depth,
      width / 3, height / 5 * 3, 0,
      width / 3 * 2, height / 5 * 3, -depth,
      width / 3 * 2, height / 5 * 3, 0,

      width / 3, height / 5, 0,
      width / 3, height / 5, -depth,
      width, height / 5, -depth,
      width / 3, height / 5, 0,
      width, height / 5, -depth,
      width, height / 5, 0,
    ])
    this.normals = new Float32Array([
      // 正面
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      // 左边
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,

      // 背面
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,

      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,

      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,

      // 右边
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      // 顶部
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // 底部
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,

      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
    ])
  }
}