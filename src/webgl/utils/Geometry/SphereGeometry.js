
class SphereGeometry {
  /**
   * 初始化球体几何体
   * @params {number} radius 半径
   * @params {number} widthSegments 水平分段数
   * @params {number} heightSegments 垂直分段数
   * @params {number} phiStart 水平起始角度
   * @params {number} phiLength 水平扫过角度
   * @params {number} thetaStart 垂直起始角度
   * @params {number} thetaLength 垂直扫过角度
   */
  constructor(radius = 1, widthSegments = 32, heightSegments = 16, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    this.radius = radius
    this.widthSegments = Math.max(3, Math.floor(widthSegments))
    this.heightSegments = Math.max(2, Math.floor(heightSegments))
    this.phiStart = phiStart
    this.phiLength = phiLength
    this.thetaStart = thetaStart
    this.thetaLength = thetaLength

    const positions = []
    const normals = []
    const uv = []
    const indices = []

    const thetaEnd = Math.min(this.thetaStart + this.thetaLength, Math.PI)

    let index = 0
    const grid = []

    // 生成顶点、法线和uv坐标
    for (let iy = 0; iy <= this.heightSegments; iy++) {
      const verticesRow = []
      const v = iy / this.heightSegments

      // 极点特殊处理
      let uOffset = 0
      if (iy === 0 && this.thetaStart === 0) {
        uOffset = 0.5 / this.widthSegments
      } else if (iy === this.heightSegments && thetaEnd === Math.PI) {
        uOffset = -0.5 / this.widthSegments
      }

      for (let ix = 0; ix <= this.widthSegments; ix++) {
        const u = ix / this.widthSegments

        // 球面参数方程
        const x = -this.radius * Math.cos(this.phiStart + u * this.phiLength) * Math.sin(this.thetaStart + v * thetaEnd)
        const y = this.radius * Math.cos(this.thetaStart + v * thetaEnd)
        const z = this.radius * Math.sin(this.phiStart + u * this.phiLength) * Math.sin(this.thetaStart + v * thetaEnd)

        // 顶点
        positions.push(x, y, z)

        // 法线
        const len = Math.sqrt(x * x + y * y + z * z)
        normals.push(x / len, y / len, z / len)
        // uv
        uv.push(u + uOffset, 1 - v)

        verticesRow.push(index++)
      }
      grid.push(verticesRow)
    }

    // 生成索引
    for (let iy = 0; iy < this.heightSegments; iy++) {
      for (let ix = 0; ix < this.widthSegments; ix++) {
        const a = grid[iy][ix + 1]
        const b = grid[iy][ix]
        const c = grid[iy + 1][ix]
        const d = grid[iy + 1][ix + 1]

        if (iy !== 0 || this.thetaStart > 0) {
          indices.push(a, b, d)
        }
        if (iy !== this.heightSegments - 1 || thetaEnd < Math.PI) {
          indices.push(b, c, d)
        }
      }
    }

    this.positions = new Float32Array(positions)
    this.normals = new Float32Array(normals)
    this.uv = new Float32Array(uv)
    this.indices = new Uint16Array(indices)
  }
}

export default SphereGeometry