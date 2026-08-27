import Geometry from "./Geometry.js"

export default class PlaneGeometry extends Geometry {
  constructor(width, height, segments) {
    super();
    const points = [];
    const normal = [];
    const uv = [];
    const indices = []
    for (let y = 0; y <= segments; y++) {
      const py = height / segments * y - height / 2;
      for (let x = 0; x <= segments; x++) {
        const px = width / segments * x - width / 2;
        points.push(px, -py, 0);
        normal.push(0, 0, 1);
        uv.push(x / segments, y / segments);
      }
    }

    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const first = y * (segments + 1) + x;
        const second = first + segments + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    this.positions = new Float32Array(points);
    this.normals = new Float32Array(normal);
    this.uv = new Float32Array(uv);
    this.indices = new Uint16Array(indices);
  }
}