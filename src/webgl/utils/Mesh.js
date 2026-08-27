import Vector3 from './Vector3.js';
import Matrix4 from './Math/Matrix4.js'
import MathUtils from './MathUtils.js';

export default class Mesh {
  isMesh = true;
  position = new Vector3(0, 0, 0);
  scale = new Vector3(1, 1, 1);
  rotation = new Vector3(0, 0, 0);
 
  constructor(geometry, material){
    this.geometry = geometry;
    this.material = material;
  }

  get modelMatrix(){
    const result = new Matrix4()
    .identity()
    .multiply(new Matrix4( // 缩放
      this.scale.x, 0, 0, 0,
      0, this.scale.y, 0, 0,
      0, 0, this.scale.z, 0,
      0, 0, 0, 1,
    ))
    .multiply(new Matrix4( // x 旋转
      1, 0, 0, 0,
      0, Math.cos(MathUtils.degToRad(this.rotation.x)), -Math.sin(MathUtils.degToRad(this.rotation.x)), 0,
      0, Math.sin(MathUtils.degToRad(this.rotation.x)), Math.cos(MathUtils.degToRad(this.rotation.x)), 0,
      0, 0, 0, 1,
    ))
    .multiply(new Matrix4( // y 旋转
      Math.cos(MathUtils.degToRad(this.rotation.y)), 0, Math.sin(MathUtils.degToRad(this.rotation.y)), 0,
      0, 1, 0, 0,
      -Math.sin(MathUtils.degToRad(this.rotation.y)), 0, Math.cos(MathUtils.degToRad(this.rotation.y)), 0,
      0, 0, 0, 1,
    ))
    .multiply(new Matrix4( // z 旋转
      Math.cos(MathUtils.degToRad(this.rotation.z)), -Math.sin(MathUtils.degToRad(this.rotation.z)), 0, 0,
      Math.sin(MathUtils.degToRad(this.rotation.z)), Math.cos(MathUtils.degToRad(this.rotation.z)), 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ))
    .multiply(new Matrix4( // 平移
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      this.position.x, this.position.y, this.position.z, 1,
    ));
    return result;
  }
}