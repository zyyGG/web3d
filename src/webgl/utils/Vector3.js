export default class Vector3 {
  constructor(x=0, y=0, z=0){
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z){
    this.x = x;
    this.y = y || x;
    this.z = z || x;
  }

  clone(){
    return new Vector3(this.x, this.y, this.z);
  }

  // 向量相加
  sub(v){
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  // 归一化
  normalize(){
    // 三条边的平方和开根号
    const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if(length === 0) return new Vector3(0, 0, 0);
    // 返回长度为1的向量
    return new Vector3(this.x / length, this.y / length, this.z / length);
  }

  // 向量叉乘
  cross(v){
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  // 向量点乘
  dot(v){
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
}