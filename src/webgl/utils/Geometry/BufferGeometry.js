
import Geometry from "./Geometry.js"

/**
 * @description: 缓冲几何体类
 * @example
 * // sample use
 * const geometry = new BufferGeometry();
 * geometry.setPosition([...]);
 * 
 * // if you need normal, uv
 * geometry.computedNormal();
 * geometry.computedUv();
 * 
 * // also you can add index
 * geometry.setIndexes([...]);
 */
class BufferGeometry extends Geometry {
  constructor() {
    super();
  }

  setPosition(array){
    this.positions = new Float32Array(array);
    this.normals = new Float32Array(this.positions.length); // 初始化法线数组
    this.uv = new Float32Array((this.positions.length/3)*2);
  }

  setNormal(array){
    this.normals = new Float32Array(array);
  }

  setUV(array){
    this.uv = new Float32Array(array);
  }

  setIndexes(array){
    this.indices = new Uint16Array(array);
  }

  /**强制计算normal */
  computedNormal(){
    this.normals = new Float32Array(this.positions.length);

    // 这里indices就是最终的顶点
    // 全部归0
    for(let i = 0; i < this.indices.length; i += 3){
      const aIndex = this.indices[i] * 3;
      const bIndex = this.indices[i + 1] * 3;
      const cIndex = this.indices[i + 2] * 3;
      const a = [
        this.positions[aIndex],
        this.positions[aIndex + 1],
        this.positions[aIndex + 2],
      ]
      const b = [
        this.positions[bIndex],
        this.positions[bIndex + 1],
        this.positions[bIndex + 2],
      ]
      const c = [
        this.positions[cIndex],
        this.positions[cIndex + 1],
        this.positions[cIndex + 2],
      ]
      const ab = [
        b[0] - a[0],
        b[1] - a[1],
        b[2] - a[2],
      ]
      const ac = [
        c[0] - a[0],
        c[1] - a[1],
        c[2] - a[2],
      ]
      const normal = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ]
      const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
      normal[0] /= length;
      normal[1] /= length;
      normal[2] /= length;
      // 累加法线
      this.normals[aIndex] += normal[0];
      this.normals[aIndex + 1] += normal[1];
      this.normals[aIndex + 2] += normal[2];
      this.normals[bIndex] += normal[0];
      this.normals[bIndex + 1] += normal[1];
      this.normals[bIndex + 2] += normal[2];
      this.normals[cIndex] += normal[0];
      this.normals[cIndex + 1] += normal[1];
      this.normals[cIndex + 2] += normal[2];
      // 归一化
      const aLength = Math.sqrt(
        this.normals[aIndex] * this.normals[aIndex] +
        this.normals[aIndex + 1] * this.normals[aIndex + 1] +
        this.normals[aIndex + 2] * this.normals[aIndex + 2]
      );
      this.normals[aIndex] /= aLength;
      this.normals[aIndex + 1] /= aLength;
      this.normals[aIndex + 2] /= aLength;
      const bLength = Math.sqrt(
        this.normals[bIndex] * this.normals[bIndex] +
        this.normals[bIndex + 1] * this.normals[bIndex + 1] +
        this.normals[bIndex + 2] * this.normals[bIndex + 2]
      );
      this.normals[bIndex] /= bLength;
      this.normals[bIndex + 1] /= bLength;
      this.normals[bIndex + 2] /= bLength;
      const cLength = Math.sqrt(
        this.normals[cIndex] * this.normals[cIndex] +
        this.normals[cIndex + 1] * this.normals[cIndex + 1] +
        this.normals[cIndex + 2] * this.normals[cIndex + 2]
      );
      this.normals[cIndex] /= cLength;
      this.normals[cIndex + 1] /= cLength;
      this.normals[cIndex + 2] /= cLength;
      
    }
  }

  computedUv(){
    this.uv = new Float32Array((this.positions.length/3)*2);
    // 默认全部归0
    for(let i=0;i<this.uv.length;i++){
      this.uv[i] = 0;
    }
  }

  computedIndices(){
    this.indices = new Uint16Array(this.positions.length/3);
    for(let i=0;i<this.indices.length;i++){
      this.indices[i] = i;
    }
  }
}

export default BufferGeometry;