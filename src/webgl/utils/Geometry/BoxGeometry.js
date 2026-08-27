import Geometry from "./Geometry.js"

export default class BoxGeometry extends Geometry {
  constructor(width, height, depth, segment = 1) {
    super();
    const position = []
    const normal = []
    const uv = []
    const indices = []
    let numberOfVertices = 0;

    // 这里创建6个面，来生成一个立方体
    

    buildPlane("z", "y", "x", -1, -1, depth, height, width); // px
    buildPlane("z", "y", "x", 1, -1, depth, height, -width); // nx

    buildPlane("x", "z", "y", 1, 1, width, depth, height); // py
    buildPlane("x", "z", "y", 1, -1, width, depth, -height); // ny

    buildPlane("x", "y", "z", 1, -1, width, height, depth); // pz
    buildPlane("x", "y", "z", -1, -1, width, height, -depth); // nz

    // 画一个立方体盒子就是画6个面
    // u v w 分别代表xyz轴
    // uDir vDir代表正负方向， 假如传的是-1就是负方向，1就是正方向
    function buildPlane(u, v, w, uDir, vDir, width, height, depth){
      const segmentWidth = width / segment;
      const segmentHeight = height / segment;
      const z = depth / 2;
      let vertexCounter = 0;
      
      // (s + 1)^2
      for(let iy = 0; iy <= segment + 1; iy++){
        const y = iy * segmentHeight - height / 2;
        for(let ix = 0; ix <= segment + 1; ix++){
          const x = ix * segmentWidth - width / 2;

          const vector = { x: 0, y: 0, z: 0 };
          vector[u] = x * uDir;
          vector[v] = y * vDir;
          vector[w] = z;
          // 写入positions数组
          position.push(vector.x, vector.y, vector.z);
          // 写入normals数组
          vector[u] = x * uDir;
          vector[v] = y * vDir;
          vector[w] = depth > 0 ? 1 : -1;
          normal.push(vector.x, vector.y, vector.z);
          // 写入uv数组
          uv.push(ix / segment, 1 - iy / segment);

          vertexCounter += 1;
        }
      }

      // 创建indices
      for(let iy = 0; iy < segment; iy++){
        for(let ix = 0; ix < segment; ix++){
          const a = numberOfVertices + ix + (segment + 2) * iy;
          const b = numberOfVertices + ix + (segment + 2) * (iy + 1);
          const c = numberOfVertices + (ix + 1) + (segment + 2) * (iy + 1);
          const d = numberOfVertices + (ix + 1) + (segment + 2) * iy;
          // 三角形1
          indices.push(a, b, d);
          // 三角形2
          indices.push(b, c, d);
        }
      }

      numberOfVertices += vertexCounter;
    }
    this.positions = new Float32Array(position);
    this.normals = new Float32Array(normal);
    this.uv = new Float32Array(uv);
    this.indices = new Uint16Array(indices);
    
  }
}