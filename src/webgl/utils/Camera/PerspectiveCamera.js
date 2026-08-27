// 正交投影相机
import Camera from "./Camera.js";
import Vector3 from "../Vector3.js";
import Matrix4 from "../Math/Matrix4.js";

export default class PerspectiveCamera extends Camera {
  /**@type {Number} */
  fov = 50; // 视野角度
  /**@type {Number} */
  aspect = 1; // 宽高比
  /**@type {Number} */
  near = 0.1; // 近裁剪面
  /**@type {Number} */
  far = 2000; // 远裁剪面
  
  position = new Vector3(0, 0, 0);
  target = new Vector3(0, 0, 0);

  viewMatrix = null; // 视图矩阵
  projectionMatrix = null; // 投影矩阵

  constructor(fov, aspect, near, far){
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  updateMatrixWorld(){
    // 计算 viewMatrix
    const zAxis = this.position.clone().sub(this.target).normalize(); // 相机的观察方向
    const xAxis = new Vector3(0, 1, 0).cross(zAxis).normalize(); // 相机的右方向
    const yAxis = zAxis.clone().cross(xAxis).normalize(); // 相机的上方向

    // 视图矩阵，用来把世界坐标转换为相机坐标
    this.viewMatrix = new Matrix4(
      xAxis.x, xAxis.y, xAxis.z, 0,
      yAxis.x, yAxis.y, yAxis.z, 0,
      zAxis.x, zAxis.y, zAxis.z, 0,
      this.position.x, this.position.y, this.position.z, 1
    ).invert();
  }

  updateProjectionMatrix(){
    const fovRad = this.fov * Math.PI / 180;
    const f = 1.0 / Math.tan(fovRad / 2);
    const rangeInv = 1.0 / (this.near - this.far); // 因为视角是看向-z方向，所以实际上near会比far大， 所以需要near - far
    // 投影矩阵，用来把相机坐标转换为裁剪坐标
    this.projectionMatrix = new Matrix4(
      f / this.aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (this.near + this.far) * rangeInv, -1,
      0, 0, this.near * this.far * rangeInv * 2, 0
    );
  }

  lookAt(x, y, z) {
    this.target.set(x, y, z);
    this.updateMatrixWorld();
  }
}