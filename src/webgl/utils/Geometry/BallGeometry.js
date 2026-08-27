import Geometry from "./Geometry.js"

/**
 * @deprecated 请使用 SphereGeometry
 */
export default class BallGeometry extends Geometry {
  constructor(radius = 1, segments = 32) {
    super();
    const positions = [];
    const normals = [];
    const uv = [];

    for (let y = 0; y <= segments; y++) {
      const theta = y * Math.PI / segments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let x = 0; x <= segments; x++) {
        const phi = x * 2 * Math.PI / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const px = radius * sinTheta * cosPhi;
        const py = radius * cosTheta;
        const pz = radius * sinTheta * sinPhi;
        positions.push(px, py, pz);
        const nx = sinTheta * cosPhi;
        const ny = cosTheta;
        const nz = sinTheta * sinPhi;
        normals.push(nx, ny, nz);
        uv.push(x / segments, y / segments);
      }
    }

    const indices = [];
    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const first = (y * (segments + 1)) + x;
        const second = first + segments + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    this.positions = new Float32Array(positions);
    this.normals = new Float32Array(normals);
    this.uv = new Float32Array(uv);
    this.indices = new Uint16Array(indices);
  }
}