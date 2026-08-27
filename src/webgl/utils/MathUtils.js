class Matrix {
  elements = []
  constructor(){}
  multiply(){
    console.log("后代类实现具体方法");
  }
  identity(){}
}


class Matrix2 {
  get elements(){
    return [
      this.num1, this.num2,
      this.num3, this.num4,
    ]
  }
  constructor(num1, num2, num3, num4){
    this.num1 = num1;
    this.num2 = num2;
    this.num3 = num3;
    this.num4 = num4;
  }
}

class Matrix3 {
  get elements(){
    return [
      this.num1, this.num2, this.num3,
      this.num4, this.num5, this.num6,
      this.num7, this.num8, this.num9,
    ]
  }
  constructor(num1, num2, num3, num4, num5, num6, num7, num8, num9){
    this.num1 = num1;
    this.num2 = num2;
    this.num3 = num3;
    this.num4 = num4;
    this.num5 = num5;
    this.num6 = num6;
    this.num7 = num7;
    this.num8 = num8;
    this.num9 = num9;
  }
}

export class Matrix4 {
  get elements(){
    return [
      this.num1, this.num2, this.num3, this.num4,
      this.num5, this.num6, this.num7, this.num8,
      this.num9, this.num10, this.num11, this.num12,
      this.num13, this.num14, this.num15, this.num16,
    ]
  }
  /**
   * 
   * @param {Number} num1 
   * @param {Number} num2 
   * @param {Number} num3 
   * @param {Number} num4 
   * @param {Number} num5 
   * @param {Number} num6 
   * @param {Number} num7 
   * @param {Number} num8 
   * @param {Number} num9 
   * @param {Number} num10 
   * @param {Number} num11 
   * @param {Number} num12 
   * @param {Number} num13 
   * @param {Number} num14 
   * @param {Number} num15 
   * @param {Number} num16 
   */
  constructor(
    num1 = 1, num2 = 0, num3 = 0, num4 = 0, 
    num5 = 0, num6 = 1, num7 = 0, num8 = 0, 
    num9 = 0, num10 = 0, num11 = 1, num12 = 0, 
    num13 = 0, num14 = 0, num15 = 0, num16 = 1){
      if(num1 instanceof Array  && num1.length === 16){
        this.num1 = num1[0];
        this.num2 = num1[1];
        this.num3 = num1[2];
        this.num4 = num1[3];
        this.num5 = num1[4];
        this.num6 = num1[5];
        this.num7 = num1[6];
        this.num8 = num1[7];
        this.num9 = num1[8];
        this.num10 = num1[9];
        this.num11 = num1[10];
        this.num12 = num1[11];
        this.num13 = num1[12];
        this.num14 = num1[13];
        this.num15 = num1[14];
        this.num16 = num1[15];
        return;
      } 
      
      else if(num1 instanceof Matrix4){
        for(let i =0; i < 16; i++){
          this['num'+(i+1)] = num1['num'+(i+1)];
        }
        console.log(this)
      }
      
      else {
        this.num1 = num1;
        this.num2 = num2;
        this.num3 = num3;
        this.num4 = num4;
        this.num5 = num5;
        this.num6 = num6;
        this.num7 = num7;
        this.num8 = num8;
        this.num9 = num9;
        this.num10 = num10;
        this.num11 = num11;
        this.num12 = num12;
        this.num13 = num13;
        this.num14 = num14;
        this.num15 = num15;
        this.num16 = num16;
      }
  }

  static getTranslationMatrix(x, y, z){
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    )
  }

  static getRotationMatrix(rx, ry, rz){
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cz = Math.cos(rz);
    const sz = Math.sin(rz);

    return new Matrix4(
      cy*cz,            -cy*sz,           sy,    0,
      sx*sy*cz + cx*sz, -sx*sy*sz + cx*cz, -sx*cy, 0,
      -cx*sy*cz + sx*sz, cx*sy*sz + sx*cz,  cx*cy, 0,
      0,                 0,                0,     1
    )
  }

  static getScaleMatrix(sx, sy, sz){
    return new Matrix4(
      sx, 0,  0,  0,
      0,  sy, 0,  0,
      0,  0,  sz, 0,
      0,  0,  0,  1
    )
  }

  multiply(matrix){
    const result = new Matrix4();
    if(matrix instanceof Number) {
      // 数乘运算
      result.num1 = this.num1 * matrix;
      result.num2 = this.num2 * matrix;
      result.num3 = this.num3 * matrix;
      result.num4 = this.num4 * matrix;
      result.num5 = this.num5 * matrix;
      result.num6 = this.num6 * matrix;
      result.num7 = this.num7 * matrix;
      result.num8 = this.num8 * matrix;
      result.num9 = this.num9 * matrix;
      result.num10 = this.num10 * matrix;
      result.num11 = this.num11 * matrix;
      result.num12 = this.num12 * matrix;
      result.num13 = this.num13 * matrix;
      result.num14 = this.num14 * matrix;
      result.num15 = this.num15 * matrix;
      result.num16 = this.num16 * matrix;
    } else if(matrix instanceof Matrix4) {
       // 4x4矩阵乘法运算
      result.num1 = this.num1 * matrix.num1 + this.num2 * matrix.num5 + this.num3 * matrix.num9 + this.num4 * matrix.num13;
      result.num2 = this.num1 * matrix.num2 + this.num2 * matrix.num6 + this.num3 * matrix.num10 + this.num4 * matrix.num14;
      result.num3 = this.num1 * matrix.num3 + this.num2 * matrix.num7 + this.num3 * matrix.num11 + this.num4 * matrix.num15;
      result.num4 = this.num1 * matrix.num4 + this.num2 * matrix.num8 + this.num3 * matrix.num12 + this.num4 * matrix.num16;
      result.num5 = this.num5 * matrix.num1 + this.num6 * matrix.num5 + this.num7 * matrix.num9 + this.num8 * matrix.num13;
      result.num6 = this.num5 * matrix.num2 + this.num6 * matrix.num6 + this.num7 * matrix.num10 + this.num8 * matrix.num14;
      result.num7 = this.num5 * matrix.num3 + this.num6 * matrix.num7 + this.num7 * matrix.num11 + this.num8 * matrix.num15;
      result.num8 = this.num5 * matrix.num4 + this.num6 * matrix.num8 + this.num7 * matrix.num12 + this.num8 * matrix.num16;
      result.num9 = this.num9 * matrix.num1 + this.num10 * matrix.num5 + this.num11 * matrix.num9 + this.num12 * matrix.num13;
      result.num10 = this.num9 * matrix.num2 + this.num10 * matrix.num6 + this.num11 * matrix.num10 + this.num12 * matrix.num14;
      result.num11 = this.num9 * matrix.num3 + this.num10 * matrix.num7 + this.num11 * matrix.num11 + this.num12 * matrix.num15;
      result.num12 = this.num9 * matrix.num4 + this.num10 * matrix.num8 + this.num11 * matrix.num12 + this.num12 * matrix.num16;
      result.num13 = this.num13 * matrix.num1 + this.num14 * matrix.num5 + this.num15 * matrix.num9 + this.num16 * matrix.num13;
      result.num14 = this.num13 * matrix.num2 + this.num14 * matrix.num6 + this.num15 * matrix.num10 + this.num16 * matrix.num14;
      result.num15 = this.num13 * matrix.num3 + this.num14 * matrix.num7 + this.num15 * matrix.num11 + this.num16 * matrix.num15;
      result.num16 = this.num13 * matrix.num4 + this.num14 * matrix.num8 + this.num15 * matrix.num12 + this.num16 * matrix.num16;
    }
    return result
  }

  // 单位矩阵
  identity(){
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    )
  }

  /**
   * 
   * @deprecated 已废弃
   * @param {*} x 
   * @param {*} y 
   * @param {*} z 
   * @returns 
   */
  makeTranslation(x, y, z){
    console.warn("MathUtils.makeTranslation该方法已弃用");
    this.num1 = 1; this.num2 = 0; this.num3 = 0; this.num4 = 0;
    this.num5 = 0; this.num6 = 1; this.num7 = 0; this.num8 = 0;
    this.num9 = 0; this.num10 = 0; this.num11 = 1; this.num12 = 0;
    this.num13 = x; this.num14 = y; this.num15 = z; this.num16 = 1;
    return this;
  }

  // 矩阵求逆
  invert(){
    const m00 = this.num1
    const m01 = this.num2
    const m02 = this.num3
    const m03 = this.num4
    const m10 = this.num5
    const m11 = this.num6
    const m12 = this.num7
    const m13 = this.num8
    const m20 = this.num9
    const m21 = this.num10
    const m22 = this.num11
    const m23 = this.num12
    const m30 = this.num13
    const m31 = this.num14
    const m32 = this.num15
    const m33 = this.num16
    // 计算矩阵的余子式
    const temp_0 = m22 * m33
    const temp_1 = m32 * m23
    const temp_2 = m12 * m33
    const temp_3 = m32 * m13
    const temp_4 = m12 * m23
    const temp_5 = m22 * m13
    const temp_6 = m02 * m33
    const temp_7 = m32 * m03
    const temp_8 = m02 * m23
    const temp_9 = m22 * m03
    const temp_10 = m02 * m13
    const temp_11 = m12 * m03
    const temp_12 = m20 * m31
    const temp_13 = m30 * m21
    const temp_14 = m10 * m31
    const temp_15 = m30 * m11
    const temp_16 = m10 * m21
    const temp_17 = m20 * m11
    const temp_18 = m00 * m31
    const temp_19 = m30 * m01
    const temp_20 = m00 * m21
    const temp_21 = m20 * m01
    const temp_22 = m00 * m11
    const temp_23 = m10 * m01

    // 计算行列式
    const t0 = (temp_0 * m11 + temp_3 * m21 + temp_4 * m31) - (temp_1 * m11 + temp_2 * m21 + temp_5 * m31)
    const t1 = (temp_1 * m01 + temp_6 * m21 + temp_9 * m31) - (temp_0 * m01 + temp_7 * m21 + temp_8 * m31)
    const t2 = (temp_2 * m01 + temp_7 * m11 + temp_10 * m31) - (temp_3 * m01 + temp_6 * m11 + temp_11 * m31)
    const t3 = (temp_5 * m01 + temp_8 * m11 + temp_11 * m21) - (temp_4 * m01 + temp_9 * m11 + temp_10 * m21)
    const det = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3)

    return new Matrix4(
      det * t0,
      det * t1,
      det * t2,
      det * t3,
      det * ((temp_1 * m10 + temp_2 * m20 + temp_5 * m30) - (temp_0 * m10 + temp_3 * m20 + temp_4 * m30)),
      det * ((temp_0 * m00 + temp_7 * m20 + temp_8 * m30) - (temp_1 * m00 + temp_6 * m20 + temp_9 * m30)),
      det * ((temp_3 * m00 + temp_6 * m10 + temp_11 * m30) - (temp_2 * m00 + temp_7 * m10 + temp_10 * m30)),
      det * ((temp_4 * m00 + temp_9 * m10 + temp_10 * m20) - (temp_5 * m00 + temp_8 * m10 + temp_11 * m20)),
      det * ((temp_12 * m13 + temp_15 * m23 + temp_16 * m33) - (temp_13 * m13 + temp_14 * m23 + temp_17 * m33)),
      det * ((temp_13 * m03 + temp_18 * m23 + temp_21 * m33) - (temp_12 * m03 + temp_19 * m23 + temp_20 * m33)),
      det * ((temp_14 * m03 + temp_19 * m13 + temp_22 * m33) - (temp_15 * m03 + temp_18 * m13 + temp_23 * m33)),
      det * ((temp_17 * m03 + temp_20 * m13 + temp_23 * m23) - (temp_16 * m03 + temp_21 * m13 + temp_22 * m23)),
      det * ((temp_14 * m22 + temp_17 * m32 + temp_13 * m12) - (temp_16 * m32 + temp_12 * m12 + temp_15 * m22)),
      det * ((temp_20 * m32 + temp_12 * m02 + temp_19 * m22) - (temp_18 * m22 + temp_21 * m32 + temp_13 * m02)),
      det * ((temp_18 * m12 + temp_23 * m32 + temp_15 * m02) - (temp_22 * m32 + temp_14 * m02 + temp_19 * m12)),
      det * ((temp_22 * m22 + temp_16 * m02 + temp_21 * m12) - (temp_20 * m12 + temp_23 * m22 + temp_17 * m02)),
    )
  }

  // 转置矩阵
  transpose(){
    return new Matrix4(
      this.num1, this.num5, this.num9, this.num13,
      this.num2, this.num6, this.num10, this.num14,
      this.num3, this.num7, this.num11, this.num15,
      this.num4, this.num8, this.num12, this.num16
    )
  }

  clone(){
    return new Matrix4(
      this.num1, this.num2, this.num3, this.num4,
      this.num5, this.num6, this.num7, this.num8,
      this.num9, this.num10, this.num11, this.num12,
      this.num13, this.num14, this.num15, this.num16
    );
  }
}

export default class MathUtils {
  /**@type {typeof Matrix2} */
  static Matrix2 = Matrix2
  /**@type {typeof Matrix3} */
  static Matrix3 = Matrix3
  /**@type {Matrix4} */
  static Matrix4 = Matrix4
  constructor(num1, num2, num3, num4, num5, num6, num7, num8, num9, num10, num11, num12, num13, num14, num15, num16){
    if(arguments.length === 4){
      return new Matrix2(num1, num2, num3, num4);
    } else if(arguments.length === 9){
      return new Matrix3(num1, num2, num3, num4, num5, num6, num7, num8, num9);
    } else if(arguments.length === 16){
      return new Matrix4(num1, num2, num3, num4, num5, num6, num7, num8, num9, num10, num11, num12, num13, num14, num15, num16);
    }
  }

  static degToRad(deg){
    return deg * Math.PI / 180;
  }

  static radToDeg(rad){
    return rad * 180 / Math.PI;
  }

  static m4Multiply(...rest){
    const a = rest[0]
    const b = rest[1]
    if(a.length !== 16 || b.length !==16){
      console.error("只能计算4x4矩阵的乘法");
      return;
    }
    const result = new Matrix4(a);
    result.multiply(new Matrix4(b))
    for(let i = 2; i < rest.length; i++){
      result.multiply(new Matrix4(rest[i]))
    }
    return result.elements;
  }

  static normalizeVector3(v){
    const length = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); // 获得向量的模长
    if(length === 0){
      return [0, 0, 0]; // 加入模长是0的特殊处理
    }
    return [v[0]/length, v[1]/length, v[2]/length]; // 向量除以模长得到单位向量
  }

  // 3维向量相减
  static subtractVector3(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]];
  }

  // 3维向量叉乘
  static crossVector3(v1, v2){
    return [
      v1[1]*v2[2] - v1[2]*v2[1],
      v1[2]*v2[0] - v1[0]*v2[2],
      v1[0]*v2[1] - v1[1]*v2[0],
    ];
  }

  // 转置矩阵
  static m4Transpose(m4){
    const matrix = new Matrix4(m4);
    return [
      matrix.num1, matrix.num5, matrix.num9, matrix.num13,
      matrix.num2, matrix.num6, matrix.num10, matrix.num14,
      matrix.num3, matrix.num7, matrix.num11, matrix.num15,
      matrix.num4, matrix.num8, matrix.num12, matrix.num16,
    ]
  }

  // 逆矩阵
  static m4Inverse(m4){
    const matrix = new Matrix4(m4);
    const m00 = matrix.num1
    const m01 = matrix.num2
    const m02 = matrix.num3
    const m03 = matrix.num4
    const m10 = matrix.num5
    const m11 = matrix.num6
    const m12 = matrix.num7
    const m13 = matrix.num8
    const m20 = matrix.num9
    const m21 = matrix.num10
    const m22 = matrix.num11
    const m23 = matrix.num12
    const m30 = matrix.num13
    const m31 = matrix.num14
    const m32 = matrix.num15
    const m33 = matrix.num16
    // 计算矩阵的余子式
    const temp_0 = m22 * m33
    const temp_1 = m32 * m23
    const temp_2 = m12 * m33
    const temp_3 = m32 * m13
    const temp_4 = m12 * m23
    const temp_5 = m22 * m13
    const temp_6 = m02 * m33
    const temp_7 = m32 * m03
    const temp_8 = m02 * m23
    const temp_9 = m22 * m03
    const temp_10 = m02 * m13
    const temp_11 = m12 * m03
    const temp_12 = m20 * m31
    const temp_13 = m30 * m21
    const temp_14 = m10 * m31
    const temp_15 = m30 * m11
    const temp_16 = m10 * m21
    const temp_17 = m20 * m11
    const temp_18 = m00 * m31
    const temp_19 = m30 * m01
    const temp_20 = m00 * m21
    const temp_21 = m20 * m01
    const temp_22 = m00 * m11
    const temp_23 = m10 * m01

    // 计算行列式
    const t0 = (temp_0 * m11 + temp_3 * m21 + temp_4 * m31) - (temp_1 * m11 + temp_2 * m21 + temp_5 * m31)
    const t1 = (temp_1 * m01 + temp_6 * m21 + temp_9 * m31) - (temp_0 * m01 + temp_7 * m21 + temp_8 * m31)
    const t2 = (temp_2 * m01 + temp_7 * m11 + temp_10 * m31) - (temp_3 * m01 + temp_6 * m11 + temp_11 * m31)
    const t3 = (temp_5 * m01 + temp_8 * m11 + temp_11 * m21) - (temp_4 * m01 + temp_9 * m11 + temp_10 * m21)
    const det = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3)

    

    return [
      det * t0,
      det * t1,
      det * t2,
      det * t3,
      det * ((temp_1 * m10 + temp_2 * m20 + temp_5 * m30) - (temp_0 * m10 + temp_3 * m20 + temp_4 * m30)),
      det * ((temp_0 * m00 + temp_7 * m20 + temp_8 * m30) - (temp_1 * m00 + temp_6 * m20 + temp_9 * m30)),
      det * ((temp_3 * m00 + temp_6 * m10 + temp_11 * m30) - (temp_2 * m00 + temp_7 * m10 + temp_10 * m30)),
      det * ((temp_4 * m00 + temp_9 * m10 + temp_10 * m20) - (temp_5 * m00 + temp_8 * m10 + temp_11 * m20)),
      det * ((temp_12 * m13 + temp_15 * m23 + temp_16 * m33) - (temp_13 * m13 + temp_14 * m23 + temp_17 * m33)),
      det * ((temp_13 * m03 + temp_18 * m23 + temp_21 * m33) - (temp_12 * m03 + temp_19 * m23 + temp_20 * m33)),
      det * ((temp_14 * m03 + temp_19 * m13 + temp_22 * m33) - (temp_15 * m03 + temp_18 * m13 + temp_23 * m33)),
      det * ((temp_17 * m03 + temp_20 * m13 + temp_23 * m23) - (temp_16 * m03 + temp_21 * m13 + temp_22 * m23)),
      det * ((temp_14 * m22 + temp_17 * m32 + temp_13 * m12) - (temp_16 * m32 + temp_12 * m12 + temp_15 * m22)),
      det * ((temp_20 * m32 + temp_12 * m02 + temp_19 * m22) - (temp_18 * m22 + temp_21 * m32 + temp_13 * m02)),
      det * ((temp_18 * m12 + temp_23 * m32 + temp_15 * m02) - (temp_22 * m32 + temp_14 * m02 + temp_19 * m12)),
      det * ((temp_22 * m22 + temp_16 * m02 + temp_21 * m12) - (temp_20 * m12 + temp_23 * m22 + temp_17 * m02)),
    ]
  }
}