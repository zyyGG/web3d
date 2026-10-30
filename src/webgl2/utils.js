/**
 * @typedef {[number, number, number]} Vector3
 */

/**
 * @typedef {"position" | "rotation" | "scale"} TransformKey
 */

/**
 * @typedef {object} TransformVector
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {(x: number, y: number, z: number) => TransformVector} set
 */

/**
 * @typedef {object} ShapeModel
 * @property {number[]} positions 顶点位置，每三个数值组成一个顶点
 * @property {number[]} uv 顶点 UV，每两个数值组成一组
 * @property {number[]} normal 顶点法线，每三个数值组成一组
 * @property {Float32Array} modelMatrix 列主序模型矩阵
 * @property {TransformVector} position 模型平移
 * @property {TransformVector} rotation 模型旋转，单位为弧度
 * @property {TransformVector} scale 模型缩放
 */

/**
 * @typedef {object} ShapeBuilder
 * @property {(vertices: Vector3[], uvs: [number, number][], faceNormals: Vector3 | Vector3[]) => void} addTriangle
 * @property {() => ShapeModel} build
 */

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type
 * @param {string} source 
 * @returns {WebGLShader}
 */
export function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error("无法创建 WebGL 着色器")
  }
  gl.shaderSource(shader, source) // 将着色器源码传入着色器对象
  gl.compileShader(shader) // 编译着色器
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) // 检查编译状态
  if(success){
    return shader
  }

  console.error(gl.getShaderInfoLog(shader)) // 输出编译错误信息
  gl.deleteShader(shader) // 删除着色器对象
  throw new Error("WebGL 着色器编译失败")
}

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vertexShader 
 * @param {WebGLShader} fragmentShader 
 * @returns {WebGLProgram}
 */
export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram() // 创建程序对象
  if (!program) {
    throw new Error("无法创建 WebGL 程序")
  }
  gl.attachShader(program, vertexShader) // 将顶点着色器附加到程序对象
  gl.attachShader(program, fragmentShader) // 将片段着色器附加到程序对象
  gl.linkProgram(program) // 链接程序对象
  const success = gl.getProgramParameter(program, gl.LINK_STATUS) // 检查链接状态
  if(success){
    return program
  }

  console.error(gl.getProgramInfoLog(program)) // 输出链接错误信息
  gl.deleteProgram(program) // 删除程序对象
  throw new Error("WebGL 程序链接失败")
}

/**
 * 创建列主序的透视投影矩阵，视野角使用弧度。
 * @param {number} fovYRadians 垂直视野角
 * @param {number} aspect 宽高比（视口宽度 / 高度）
 * @param {number} near 近裁剪面距离
 * @param {number} far 远裁剪面距离
 * @returns {Float32Array}
 */
export function createProjectionMatrix(fovYRadians, aspect, near, far) {
  if (!Number.isFinite(fovYRadians) || fovYRadians <= 0 || fovYRadians >= Math.PI) {
    throw new RangeError("fovYRadians 必须在 0 到 PI 之间")
  }
  if (!Number.isFinite(aspect) || aspect <= 0) {
    throw new RangeError("aspect 必须是大于 0 的有限数")
  }
  if (!Number.isFinite(near) || !Number.isFinite(far) || near <= 0 || far <= near) {
    throw new RangeError("near 和 far 必须满足 0 < near < far")
  }

  const f = 1 / Math.tan(fovYRadians / 2)
  const range = near - far

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / range, -1,
    0, 0, (2 * far * near) / range, 0,
  ])
}

/**
 * 创建右手坐标系的列主序视图矩阵。
 * @param {Vector3} eye 相机位置
 * @param {Vector3} target 相机看向的位置
 * @param {Vector3} [up=[0, 1, 0]] 相机上方向
 * @returns {Float32Array}
 */
export function createViewMatrix(eye, target, up = [0, 1, 0]) {
  for (const [name, vector] of [["eye", eye], ["target", target], ["up", up]]) {
    if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(Number.isFinite)) {
      throw new TypeError(`${name} 必须是包含 3 个有限数值的数组`)
    }
  }

  const backward = [
    eye[0] - target[0],
    eye[1] - target[1],
    eye[2] - target[2],
  ]
  const backwardLength = Math.hypot(...backward)
  if (backwardLength === 0) {
    throw new RangeError("eye 和 target 不能相同")
  }
  for (let i = 0; i < 3; i++) backward[i] /= backwardLength

  const right = [
    up[1] * backward[2] - up[2] * backward[1],
    up[2] * backward[0] - up[0] * backward[2],
    up[0] * backward[1] - up[1] * backward[0],
  ]
  const rightLength = Math.hypot(...right)
  if (rightLength === 0) {
    throw new RangeError("up 不能与相机视线平行")
  }
  for (let i = 0; i < 3; i++) right[i] /= rightLength

  const cameraUp = [
    backward[1] * right[2] - backward[2] * right[1],
    backward[2] * right[0] - backward[0] * right[2],
    backward[0] * right[1] - backward[1] * right[0],
  ]
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

  return new Float32Array([
    right[0], cameraUp[0], backward[0], 0,
    right[1], cameraUp[1], backward[1], 0,
    right[2], cameraUp[2], backward[2], 0,
    -dot(right, eye), -dot(cameraUp, eye), -dot(backward, eye), 1,
  ])
}

/**
 * @returns {ShapeBuilder}
 */
function createShapeBuilder() {
  /** @type {number[]} */
  const positions = []
  /** @type {number[]} */
  const uv = []
  /** @type {number[]} */
  const normal = []

  /**
   * @param {Vector3[]} vertices
   * @param {[number, number][]} uvs
   * @param {Vector3 | Vector3[]} faceNormals
   */
  function addTriangle(vertices, uvs, faceNormals) {
    for (let i = 0; i < vertices.length; i++) {
      positions.push(...vertices[i])
      uv.push(...uvs[i])
      /** @type {Vector3} */
      const vertexNormal = Array.isArray(faceNormals[0]) ? faceNormals[i] : faceNormals
      normal.push(...vertexNormal)
    }
  }

  /**
   * @returns {ShapeModel}
   */
  function build() {
    const modelMatrix = new Float32Array(16)
    const transforms = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    }

    function updateModelMatrix() {
      const { x: rx, y: ry, z: rz } = transforms.rotation
      const cosX = Math.cos(rx)
      const sinX = Math.sin(rx)
      const cosY = Math.cos(ry)
      const sinY = Math.sin(ry)
      const cosZ = Math.cos(rz)
      const sinZ = Math.sin(rz)
      const { x: sx, y: sy, z: sz } = transforms.scale
      const { x: tx, y: ty, z: tz } = transforms.position

      modelMatrix.set([
        cosZ * cosY * sx,
        sinZ * cosY * sx,
        -sinY * sx,
        0,
        (cosZ * sinY * sinX - sinZ * cosX) * sy,
        (sinZ * sinY * sinX + cosZ * cosX) * sy,
        cosY * sinX * sy,
        0,
        (cosZ * sinY * cosX + sinZ * sinX) * sz,
        (sinZ * sinY * cosX - cosZ * sinX) * sz,
        cosY * cosX * sz,
        0,
        tx, ty, tz, 1,
      ])
    }

    /**
     * @param {TransformKey} key
     * @returns {TransformVector}
     */
    function createTransformVector(key) {
      const values = transforms[key]
      /** @type {("x" | "y" | "z")[]} */
      const components = ["x", "y", "z"]
      const vector = {
        set(nextX, nextY, nextZ) {
          if (![nextX, nextY, nextZ].every(Number.isFinite)) {
            throw new TypeError("变换分量必须是有限数值")
          }
          values.x = nextX
          values.y = nextY
          values.z = nextZ
          updateModelMatrix()
          return this
        },
      }

      for (const component of components) {
        Object.defineProperty(vector, component, {
          get: () => values[component],
          set: (value) => {
            if (!Number.isFinite(value)) {
              throw new TypeError("变换分量必须是有限数值")
            }
            values[component] = value
            updateModelMatrix()
          },
        })
      }

      return vector
    }

    /** @type {ShapeModel} */
    const model = {
      positions,
      uv,
      normal,
      modelMatrix,
      position: createTransformVector("position"),
      rotation: createTransformVector("rotation"),
      scale: createTransformVector("scale"),
    }
    updateModelMatrix()
    return model
  }

  return {
    addTriangle,
    build,
  }
}

/**
 * 创建一个平面，位于 XY 平面并朝向 +Z。
 * @param {number} width
 * @param {number} height
 * @returns {ShapeModel}
 */
export function createPlaneShape(width = 1, height = 1) {
  const { addTriangle, build } = createShapeBuilder()
  const vertices = [
    [-width / 2, -height / 2, 0],
    [width / 2, -height / 2, 0],
    [width / 2, height / 2, 0],
    [-width / 2, height / 2, 0],
  ]
  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]]

  addTriangle([vertices[0], vertices[1], vertices[2]], [uvs[0], uvs[1], uvs[2]], [0, 0, 1])
  addTriangle([vertices[0], vertices[2], vertices[3]], [uvs[0], uvs[2], uvs[3]], [0, 0, 1])

  return build()
}

/**
 * 创建一个以原点为中心的长方体。
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @returns {ShapeModel}
 */
export function createBoxShape(width = 1, height = 1, depth = 1) {
  const { addTriangle, build } = createShapeBuilder()
  const half = [width / 2, height / 2, depth / 2]
  const faces = [
    { center: [0, 0, half[2]], u: [half[0], 0, 0], v: [0, half[1], 0], normal: [0, 0, 1] },
    { center: [0, 0, -half[2]], u: [-half[0], 0, 0], v: [0, half[1], 0], normal: [0, 0, -1] },
    { center: [half[0], 0, 0], u: [0, half[1], 0], v: [0, 0, half[2]], normal: [1, 0, 0] },
    { center: [-half[0], 0, 0], u: [0, -half[1], 0], v: [0, 0, half[2]], normal: [-1, 0, 0] },
    { center: [0, half[1], 0], u: [0, 0, half[2]], v: [half[0], 0, 0], normal: [0, 1, 0] },
    { center: [0, -half[1], 0], u: [half[0], 0, 0], v: [0, 0, half[2]], normal: [0, -1, 0] },
  ]
  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]]

  for (const { center, u, v, normal } of faces) {
    const vertices = [
      center.map((value, i) => value - u[i] - v[i]),
      center.map((value, i) => value + u[i] - v[i]),
      center.map((value, i) => value + u[i] + v[i]),
      center.map((value, i) => value - u[i] + v[i]),
    ]

    addTriangle([vertices[0], vertices[1], vertices[2]], [uvs[0], uvs[1], uvs[2]], normal)
    addTriangle([vertices[0], vertices[2], vertices[3]], [uvs[0], uvs[2], uvs[3]], normal)
  }

  return build()
}

/**
 * 创建一个边长相等、以原点为中心的立方体。
 * @param {number} size
 * @returns {ShapeModel}
 */
export function createCubeShape(size = 1) {
  return createBoxShape(size, size, size)
}

/**
 * 创建一个以原点为中心的 UV 球体。
 * @param {number} radius
 * @param {number} widthSegments
 * @param {number} heightSegments
 * @returns {ShapeModel}
 */
export function createSphereShape(radius = 1, widthSegments = 24, heightSegments = 16) {
  const { addTriangle, build } = createShapeBuilder()
  const columns = Math.max(3, Math.floor(widthSegments))
  const rows = Math.max(2, Math.floor(heightSegments))

  function getVertex(row, column) {
    const u = column / columns
    const v = row / rows
    const theta = v * Math.PI
    const phi = u * Math.PI * 2
    const normal = [
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi),
    ]

    return {
      position: normal.map((component) => component * radius),
      normal,
      uv: [u, 1 - v],
    }
  }

  function addVertexTriangle(a, b, c) {
    addTriangle(
      [a.position, b.position, c.position],
      [a.uv, b.uv, c.uv],
      [a.normal, b.normal, c.normal],
    )
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const topLeft = getVertex(row, column)
      const topRight = getVertex(row, column + 1)
      const bottomLeft = getVertex(row + 1, column)
      const bottomRight = getVertex(row + 1, column + 1)

      if (row > 0) {
        addVertexTriangle(topLeft, topRight, bottomLeft)
      }
      if (row < rows - 1) {
        addVertexTriangle(topRight, bottomRight, bottomLeft)
      }
    }
  }

  return build()
}

/**
 * 创建一个F字母模型
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @returns {ShapeModel}
 */
export function createSampleShape(width = 2, height = 3, depth = 0.5) {
  const { addTriangle, build } = createShapeBuilder()
  const frontZ = depth / 2
  const backZ = -frontZ
  const stemWidth = width * 0.35
  const barHeight = height * 0.2
  const middleBarBottom = height * 0.4

  const toPosition = (x, y, z) => [x - width / 2, y - height / 2, z]
  const toUv = (x, y) => [x / width, y / height]

  const rectangles = [
    [0, 0, stemWidth, height],
    [stemWidth, height - barHeight, width, height],
    [stemWidth, middleBarBottom, width * 0.85, middleBarBottom + barHeight],
  ]

  for (const [left, bottom, right, top] of rectangles) {
    const corners = [
      [left, bottom],
      [right, bottom],
      [right, top],
      [left, top],
    ]
    const front = corners.map(([x, y]) => toPosition(x, y, frontZ))
    const back = corners.map(([x, y]) => toPosition(x, y, backZ))
    const faceUvs = corners.map(([x, y]) => toUv(x, y))

    addTriangle([front[0], front[1], front[2]], [faceUvs[0], faceUvs[1], faceUvs[2]], [0, 0, 1])
    addTriangle([front[0], front[2], front[3]], [faceUvs[0], faceUvs[2], faceUvs[3]], [0, 0, 1])
    addTriangle([back[0], back[2], back[1]], [faceUvs[0], faceUvs[2], faceUvs[1]], [0, 0, -1])
    addTriangle([back[0], back[3], back[2]], [faceUvs[0], faceUvs[3], faceUvs[2]], [0, 0, -1])
  }

  const outline = [
    [0, 0],
    [0, height],
    [width, height],
    [width, height - barHeight],
    [stemWidth, height - barHeight],
    [stemWidth, middleBarBottom + barHeight],
    [width * 0.85, middleBarBottom + barHeight],
    [width * 0.85, middleBarBottom],
    [stemWidth, middleBarBottom],
    [stemWidth, 0],
  ]
  let distance = 0

  for (let i = 0; i < outline.length; i++) {
    const start = outline[i]
    const end = outline[(i + 1) % outline.length]
    const dx = end[0] - start[0]
    const dy = end[1] - start[1]
    const edgeLength = Math.hypot(dx, dy)
    const sideNormal = [-dy / edgeLength, dx / edgeLength, 0]
    const startFront = toPosition(start[0], start[1], frontZ)
    const endFront = toPosition(end[0], end[1], frontZ)
    const startBack = toPosition(start[0], start[1], backZ)
    const endBack = toPosition(end[0], end[1], backZ)
    const startUv = [distance, 0]
    const endUv = [distance + edgeLength, 0]
    const endBackUv = [distance + edgeLength, depth]
    const startBackUv = [distance, depth]

    addTriangle([startFront, endFront, endBack], [startUv, endUv, endBackUv], sideNormal)
    addTriangle([startFront, endBack, startBack], [startUv, endBackUv, startBackUv], sideNormal)
    distance += edgeLength
  }

  return build()
}