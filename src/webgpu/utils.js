/**
 * 检查gpu是否可用
 * @returns {Promise<{adapter: global.GPUAdapter, device: global.GPUDevice}>}
 */
export async function checkGPU(){
  if(!navigator.gpu) {
    console.warn("this browser does not support WebGPU");
    return 
  }
  const adapter = await navigator.gpu.requestAdapter()
  if(!adapter) {
    console.warn('this browser supports webgpu but it appears disabled')
    return 
  }
  const device = await adapter.requestDevice()
  device.lost.then((info) => {
    console.error(`WebGPU device was lost: ${info.message}`)

    if(info.reason !== 'destroyed') {
      // 重试
      checkGPU()
    }
  })

  return {adapter, device}
}

/**
 * @description: 解析 obj 模型文件, 把顶点/法线/uv 等数据整理成 WebGPU 可直接使用的属性, 不处理材质
 * @param {string} url obj 文件地址
 * @param {Object} [options] 配置项
 * @param {boolean} [options.flipUV] 是否翻转 uv 的 v 分量, obj 的 uv 原点在左下角, 图片数据的原点在左上角, 用贴图时一般需要翻转
 * @returns {Promise<{
 *   positions: Float32Array,
 *   normals: Float32Array,
 *   uvs: Float32Array,
 *   indices: Uint16Array | Uint32Array,
 *   indexFormat: GPUIndexFormat,
 *   vertexCount: number,
 *   indexCount: number,
 *   vertexBufferLayouts: GPUVertexBufferLayout[]
 * }>} 每个顶点属性各占一个缓冲区, 布局见 vertexBufferLayouts, 可直接用于管线的 vertex.buffers
 */
export async function OBJParse(url, options = {}) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`obj 文件加载失败: ${url} (${response.status})`)
  }
  return parseOBJ(await response.text(), options)
}

/**
 * @description: 解析 obj 文本
 * @param {string} text obj 文件内容
 * @param {Object} [options] 配置项, 同 OBJParse
 * @returns {Object} WebGPU 可读的属性数据
 */
function parseOBJ(text, options = {}) {
  const flipUV = options.flipUV || false

  const positions = [] // obj 中的 v, 每 3 个一组
  const texcoords = [] // obj 中的 vt, 每 2 个一组
  const normals = [] // obj 中的 vn, 每 3 个一组

  // 输出的顶点属性. obj 的 v/vt/vn 索引是各自独立的, 这里以 (v, vt, vn) 组合为一个顶点, 去重后展开
  const outPositions = []
  const outNormals = []
  const outUVs = []
  const outIndices = []
  const outVIndex = [] // 展开后每个顶点对应的原始 v 索引, 用于计算平滑法线
  const vertexMap = new Map() // "v/vt/vn" -> 展开后的顶点索引

  // obj 的索引从 1 开始, 负数表示从末尾往前数, 属性不存在时返回 -1
  const resolveIndex = (str, count) => {
    const index = parseInt(str, 10)
    if (Number.isNaN(index)) return -1
    const resolved = index < 0 ? count + index : index - 1
    // 文件不规范导致索引越界时, 同样按缺失处理, 避免把 undefined 写进属性数组
    return resolved < 0 || resolved >= count ? -1 : resolved
  }

  const addVertex = (vIndex, vtIndex, vnIndex) => {
    const key = `${vIndex}/${vtIndex}/${vnIndex}`
    const cached = vertexMap.get(key)
    if (cached !== undefined) return cached

    const index = outPositions.length / 3
    vertexMap.set(key, index)

    outPositions.push(
      positions[vIndex * 3],
      positions[vIndex * 3 + 1],
      positions[vIndex * 3 + 2]
    )
    // 面里没写 uv/vn 时先用 0 占位, 法线在解析结束后再补
    outUVs.push(
      vtIndex < 0 ? 0 : texcoords[vtIndex * 2],
      vtIndex < 0 ? 0 : texcoords[vtIndex * 2 + 1]
    )
    outNormals.push(
      vnIndex < 0 ? 0 : normals[vnIndex * 3],
      vnIndex < 0 ? 0 : normals[vnIndex * 3 + 1],
      vnIndex < 0 ? 0 : normals[vnIndex * 3 + 2]
    )
    outVIndex.push(vIndex)
    return index
  }

  // "1/2/3" -> [v索引, vt索引, vn索引], 也支持 "1", "1//3", "1/2" 这几种写法
  const parseFaceVertex = (token) => {
    const [v, vt, vn] = token.split("/")
    return [
      resolveIndex(v, positions.length / 3),
      resolveIndex(vt, texcoords.length / 2),
      resolveIndex(vn, normals.length / 3),
    ]
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const parts = line.split(/\s+/)
    switch (parts[0]) {
      case "v":
        positions.push(+parts[1], +parts[2], +parts[3])
        break
      case "vt": {
        const u = parts[1] === undefined ? 0 : +parts[1]
        const v = parts[2] === undefined ? 0 : +parts[2]
        texcoords.push(u, flipUV ? 1 - v : v)
        break
      }
      case "vn":
        normals.push(+parts[1], +parts[2], +parts[3])
        break
      case "f": {
        // 一个面可能是多边形, 按三角扇拆成三角形
        const face = []
        for (let i = 1; i < parts.length; i++) {
          face.push(parseFaceVertex(parts[i]))
        }
        for (let i = 1; i < face.length - 1; i++) {
          outIndices.push(
            addVertex(...face[0]),
            addVertex(...face[i]),
            addVertex(...face[i + 1])
          )
        }
        break
      }
      // o/g/s/usemtl/mtllib 等关键字不影响几何数据, 直接忽略
    }
  }

  // obj 里可能完全没有法线, 也可能只有部分面有法线, 缺失的用法线补一份平滑法线
  const needNormal = outNormals.some((value, i) => i % 3 === 0 && value === 0 &&
    outNormals[i + 1] === 0 && outNormals[i + 2] === 0)
  if (needNormal) {
    const smoothNormals = new Float32Array(positions.length)
    for (let i = 0; i < outIndices.length; i += 3) {
      const a = outVIndex[outIndices[i]] * 3
      const b = outVIndex[outIndices[i + 1]] * 3
      const c = outVIndex[outIndices[i + 2]] * 3
      const abx = positions[b] - positions[a]
      const aby = positions[b + 1] - positions[a + 1]
      const abz = positions[b + 2] - positions[a + 2]
      const acx = positions[c] - positions[a]
      const acy = positions[c + 1] - positions[a + 1]
      const acz = positions[c + 2] - positions[a + 2]
      // 叉积得到面法线, 这里不归一化, 长度与面积成正比, 累加后相当于按面积加权平均
      const nx = aby * acz - abz * acy
      const ny = abz * acx - abx * acz
      const nz = abx * acy - aby * acx
      for (const vi of [a, b, c]) {
        smoothNormals[vi] += nx
        smoothNormals[vi + 1] += ny
        smoothNormals[vi + 2] += nz
      }
    }

    for (let i = 0; i < outVIndex.length; i++) {
      const ni = i * 3
      if (outNormals[ni] !== 0 || outNormals[ni + 1] !== 0 || outNormals[ni + 2] !== 0) continue
      const vi = outVIndex[i] * 3
      const x = smoothNormals[vi]
      const y = smoothNormals[vi + 1]
      const z = smoothNormals[vi + 2]
      const length = Math.hypot(x, y, z)
      if (length === 0) {
        // 退化面(面积为 0)算不出法线, 给个默认值, 避免着色器里 normalize(0) 得到 NaN
        outNormals[ni + 2] = 1
      } else {
        outNormals[ni] = x / length
        outNormals[ni + 1] = y / length
        outNormals[ni + 2] = z / length
      }
    }
  }

  const vertexCount = outPositions.length / 3
  const indexFormat = vertexCount > 65535 ? "uint32" : "uint16"
  const indices = indexFormat === "uint32" ? new Uint32Array(outIndices) : new Uint16Array(outIndices)

  return {
    positions: new Float32Array(outPositions),
    normals: new Float32Array(outNormals),
    uvs: new Float32Array(outUVs),
    indices,
    indexFormat,
    vertexCount,
    indexCount: indices.length,
    // 每个属性单独一个缓冲区, 顺序与着色器里的 shaderLocation 对应
    vertexBufferLayouts: [
      { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }, // position
      { arrayStride: 12, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }] }, // normal
      { arrayStride: 8, attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }] }, // uv
    ],
  }
}