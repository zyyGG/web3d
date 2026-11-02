import {
  createShader,
  createProgram,
  createSampleShape,
  createSphereShape,
  createProjectionMatrix,
  createViewMatrix,
} from "./webgl2/utils";

// 初始化canvas
const app = document.querySelector("#app");
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.aspectRatio = `${window.innerWidth} / ${window.innerHeight}`;
const dpr = window.devicePixelRatio || 1;
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width = `${window.innerWidth}px`;
canvas.style.height = `${window.innerHeight}px`;
app.appendChild(canvas);

// 初始化webgl2上下文
const gl = canvas.getContext("webgl2");
if (!gl) {
  throw new Error("无法创建 WebGL 2 上下文");
}

if (!gl.getExtension("EXT_color_buffer_float")) {
  throw new Error("当前设备不支持 RGBA16F G-buffer");
}

// 等会3个通道的接收
const gBuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer);

const gTextures = [];
for(let i = 0; i < 3; i++) {
  const texture = gl.createTexture(); // 创建纹理
  gl.bindTexture(gl.TEXTURE_2D, texture); // 绑定纹理
  /*
    1. 纹理类型: gl.TEXTURE_2D
    2. mipmap层级: 0
    3. 内部格式: gl.RGBA16F 16位浮点数的RGBA格式
    4. 宽度: canvas.width
    5. 高度: canvas.height
    6. 边框: 0
    7. 格式: gl.RGBA
    8. 数据类型: gl.HALF_FLOAT 半精度浮点数
    9. 数据: null
  */
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.HALF_FLOAT, null);
  /* 
    1. 纹理类型: gl.TEXTURE_2D
    2. 纹理参数名称: gl.TEXTURE_MIN_FILTER 纹理缩小过滤器
    3. 纹理参数值: gl.NEAREST 纹理采样时使用最近邻插值
  */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  /*
    1. 纹理类型: gl.TEXTURE_2D
    2. 纹理参数名称: gl.TEXTURE_MAG_FILTER 纹理放大过滤器
    3. 纹理参数值: gl.NEAREST 纹理采样时使用最近邻插值
  */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  /*
    1. 绑定帧缓冲区 gl.FRAMEBUFFER
    2. 附着点 gl.COLOR_ATTACHMENT0 + i
    3. 纹理类型 gl.TEXTURE_2D
    4. 纹理对象 texture
    5. mipmap层级 0
  */
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
  gTextures.push(texture);
}

gl.drawBuffers([
  gl.COLOR_ATTACHMENT0,
  gl.COLOR_ATTACHMENT1,
  gl.COLOR_ATTACHMENT2
])

const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
/*
  1. 渲染缓冲区类型: gl.RENDERBUFFER
  2. 内部格式: gl.DEPTH_COMPONENT24 24位深度缓冲区
  3. 宽度: canvas.width
  4. 高度: canvas.height
*/
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, canvas.width, canvas.height);
/*
  1. 绑定帧缓冲区 gl.FRAMEBUFFER
  2. 附着点 gl.DEPTH_ATTACHMENT
  3. 渲染缓冲区类型 gl.RENDERBUFFER
  4. 渲染缓冲区对象 depthBuffer
*/
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
  throw new Error("G-buffer 创建失败")
}

gl.bindFramebuffer(gl.FRAMEBUFFER, null); // 解绑帧缓冲区

// 准备屏幕相关的参数
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // 设置视口
gl.clearColor(0, 0, 0, 1.0); // 设置清空颜色缓冲区的颜色
gl.enable(gl.DEPTH_TEST);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 清空颜色缓冲区

const vertexShaderSource = /* glsl */ `#version 300 es
layout (location = 0) in vec4 pos;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uv;

out vec3 vNormal;
out vec3 vWorldPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(pos.xyz, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos.xyz, 1.0);
  vNormal = transpose(inverse(mat3(uModelMatrix))) * normal;
  vWorldPosition = worldPosition.xyz;
}
`;
const fragmentShaderSource = /* glsl */ `#version 300 es
precision highp float; // 高精度

// out vec4 outColor;
layout (location = 0) out vec4 gColor;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gPosition;

in vec3 vNormal;
in vec3 vWorldPosition;

void main() {
  // vec3 color = dot(vNormal, )
  // float angle = uTime;
  // vec3 lightDirection = vec3(cos(angle), 0.0, sin(angle)); // 平行光的传播方向
  // float emLight = 0.1; // 环境光
  // float diffuse = max(dot(normalize(vNormal), -lightDirection), emLight);
  // vec3 color = vec3(1.0, 1.0, 0.0) * diffuse; //黄色
  vec3 color = vec3(1.0, 1.0, 0.0); // 颜色附件, 光照交给延迟光照处理
  // outColor = vec4(color, 1.0);
  gColor = vec4(color, 1.0);
  gNormal = vec4(normalize(vNormal), 1.0);
  gPosition = vec4(vWorldPosition, 1.0);
}
`;
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// 创建postProgram
const postVertexShaderSource = /* glsl */ `#version 300 es
layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec2 aUv;

out vec2 vUv;

void main() {
  vUv = aUv;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
const postFragmentShaderSource = /* glsl */ `#version 300 es
precision highp float; // 高精度

in vec2 vUv;

uniform sampler2D uColorTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uPositionTexture;
uniform float uTime;

out vec4 outColor;

void main() {
  vec4 colorData = texture(uColorTexture, vUv);
  if (colorData.a == 0.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 albedo = colorData.rgb;
  vec3 normal = normalize(texture(uNormalTexture, vUv).rgb);
  vec3 position = texture(uPositionTexture, vUv).rgb;

  vec3 lighting = albedo * 0.1; // 环境光只加一次

  // 绿灯
  vec3 greenLightPosition = vec3(cos(uTime) * 2.0, 1.5, sin(uTime) * 2.0);
  vec3 toGreenLight = greenLightPosition - position;
  float greenDistance = length(toGreenLight);
  vec3 greenDirection = normalize(toGreenLight);
  float greenDiffuse = max(dot(normal, greenDirection), 0.0);
  float greenAttenuation = 1.0 / (1.0 + 0.1 * greenDistance + 0.05 * greenDistance * greenDistance);
  vec3 greenColor = vec3(0.0, 1.0, 0.0);
  float greenIntensity = 0.3;
  lighting += albedo * greenColor * greenDiffuse * greenAttenuation * greenIntensity;

  // 红灯
  vec3 redLightPosition = vec3(cos(uTime) * 2.0, 1.5, -sin(uTime) * 2.0);
  vec3 toRedLight = redLightPosition - position;
  float redDistance = length(toRedLight);
  vec3 redDirection = normalize(toRedLight);
  float redDiffuse = max(dot(normal, redDirection), 0.0);
  float redAttenuation = 1.0 / (1.0 + 0.1 * redDistance + 0.05 * redDistance * redDistance);
  vec3 redColor = vec3(1.0, 0.0, 0.0);
  float redIntensity = 0.3;
  lighting += albedo * redColor * redDiffuse * redAttenuation * redIntensity;

  outColor = vec4(lighting, 1.0);
  // outColor = vec4(albedo, 1.0);
  // outColor = vec4(position, 1.0);
  // outColor = vec4(normal, 1.0);
}
`;
const postVertexShader = createShader(gl, gl.VERTEX_SHADER, postVertexShaderSource);
const postFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, postFragmentShaderSource);
const postProgram = createProgram(gl, postVertexShader, postFragmentShader);

// 全屏 quad：每个顶点包含裁剪空间位置和 UV
const screenVertices = new Float32Array([
  -1, -1, 0, 0,
   1, -1, 1, 0,
   1,  1, 1, 1,
  -1, -1, 0, 0,
   1,  1, 1, 1,
  -1,  1, 0, 1,
]);
const screenVao = gl.createVertexArray();
const screenBuffer = gl.createBuffer();
gl.bindVertexArray(screenVao); // 绑定VAO
gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer);
gl.bufferData(gl.ARRAY_BUFFER, screenVertices, gl.STATIC_DRAW);

// const screenPositionLocation = gl.getAttribLocation(postProgram, "aPosition");
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);

// const screenUvLocation = gl.getAttribLocation(postProgram, "aUv");
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
gl.bindVertexArray(null); // 解绑VAO

// 创建模型
const model = createSampleShape(1, 1.5, 0.3);
const model2 = createSphereShape(0.7, 24, 16);
model.position.set(-0.9, 0, 0);
model2.position.set(0.9, 0, 0);
const models = [model, model2];

const drawables = models.map((model) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // 传递位置属性
  // const positionAttributeLocation = gl.getAttribLocation(program, "pos");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(model.positions),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0); // 得启用这个属性
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // 传递法线属性
  // const normalAttributeLocation = gl.getAttribLocation(program, "normal");
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(model.normal),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(1); // 得启用这个属性
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // 传递uv属性
  // const uvAttributeLocation = gl.getAttribLocation(program, "uv");
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.uv), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2); // 得启用这个属性
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

  return { model, vao };
});

// gl.ARRAY_BUFFER: 用于顶点属性数据的缓冲区
// gl.STATIC_DRAW: 数据不会或几乎不会改变

// 准备绘制
gl.useProgram(program);
const modelMatrixLocation = gl.getUniformLocation(program, "uModelMatrix");
const viewMatrixLocation = gl.getUniformLocation(program, "uViewMatrix");
const projectionMatrixLocation = gl.getUniformLocation(
  program,
  "uProjectionMatrix",
);
const viewMatrix = createViewMatrix([0, 0, 3], [0, 0, 0]);
const projectionMatrix = createProjectionMatrix(
  Math.PI / 3,
  canvas.width / canvas.height,
  0.1,
  100,
);
gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

gl.useProgram(postProgram);
const postSamplerNames = [
  "uColorTexture",
  "uNormalTexture",
  "uPositionTexture",
];
postSamplerNames.forEach((name, textureUnit) => {
  const location = gl.getUniformLocation(postProgram, name);
  gl.uniform1i(location, textureUnit);
});
const postTimeLocation = gl.getUniformLocation(postProgram, "uTime");

let time = 0.0;
function render() {
  requestAnimationFrame(render);
  time += 0.01;

  // Pass 1：绘制模型并将材质数据写入 G-buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(program);
  drawables.forEach(({ model, vao }) => {
    gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(modelMatrixLocation, false, model.modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, model.positions.length / 3); // 绘制三角形
  });

  // Pass 2：全屏 quad 采样 G-buffer，并将光照结果输出到屏幕
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(postProgram);
  gl.uniform1f(postTimeLocation, time);
  for (let i = 0; i < gTextures.length; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, gTextures[i]);
  }
  gl.bindVertexArray(screenVao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
render();
