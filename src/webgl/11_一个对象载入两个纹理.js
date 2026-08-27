import { GUI } from "dat.gui"
import { gsap } from "gsap";
import Stats from 'three/addons/libs/stats.module.js'; // 性能监视工具

// 创建gui
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement);


const width = window.innerWidth
const height = window.innerHeight

// 初始化画布
const canvas = document.createElement('canvas')
canvas.width = width
canvas.height = height
const gl = canvas.getContext('webgl2')
if (!gl) {
  window.alert('WebGL2 not supported')
  throw new Error('WebGL2 not supported')
}
gl.viewport(0, 0, width, height)
gl.clearColor(0.0, 0.0, 0.0, 1.0) // 黑色背景
gl.clear(gl.COLOR_BUFFER_BIT)
const app = document.getElementById('app')
app.appendChild(canvas)

function loadImage(url){
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = url
    image.onload = () => {
      resolve(image)
    }
  })
}
Promise.all([
  loadImage('/images/image.png'),
  loadImage('/textures/blue_wool_s.png')
])
.then(images => {
  const image1 = images[0]
  const image2 = images[1]
  const vertexShaderSource = /*glsl*/`
    attribute vec3 position;
    attribute vec2 a_textureCoord_01;
    attribute vec2 a_textureCoord_02;

    uniform vec2 uResolution;
    uniform vec2 uTranslation;
    uniform float uScale;

    varying vec2 v_textureCoord_01;
    varying vec2 v_textureCoord_02;

    void main() {
      vec2 zeroToOne = (position.xy * uScale + uTranslation) * vec2(1.0, -1.0) / uResolution ;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - vec2(1.0, -1.0);
      gl_Position = vec4(clipSpace, 0, 1);

      v_textureCoord_01 = a_textureCoord_01;
      v_textureCoord_02 = a_textureCoord_02;
    }
  `
  const fragmentShaderSource = /*glsl*/`
    precision mediump float;

    uniform sampler2D u_image_0;
    uniform sampler2D u_image_1;

    varying vec2 v_textureCoord_01;
    varying vec2 v_textureCoord_02;

    // 高斯模糊， 消除边缘锯齿
    void main() {
      vec4 image_0 = texture2D(u_image_0, v_textureCoord_01);
      vec4 image_1 = texture2D(u_image_1, v_textureCoord_02);

      vec3 image = (image_0.rgb + image_1.rgb) / 2.0;
      vec3 color = image;
      // vec3 color = vec3(1.0, 0.0, 0.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `
    
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertexShader, vertexShaderSource)
  gl.compileShader(vertexShader)

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fragmentShader, fragmentShaderSource)
  gl.compileShader(fragmentShader)

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.useProgram(program) // 使用着色程序

  // 传递uniform 数据
  const resolutionUniformLocation = gl.getUniformLocation(program, 'uResolution')
  gl.uniform2f(resolutionUniformLocation, width, height)
  const translationUniformLocation = gl.getUniformLocation(program, 'uTranslation')
  gl.uniform2f(translationUniformLocation, 0, 0)
  const scaleLocation = gl.getUniformLocation(program, 'uScale')
  gl.uniform1f(scaleLocation, 1.0)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  const positions = setRectangle(0, 0, image1.width, image1.height)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  const positionAttributeLocation = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(positionAttributeLocation)
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)
  const textureCoord01inates = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ])
  const textureCoord01Location = gl.getAttribLocation(program, 'a_textureCoord_01')
  const textureBuffer1 = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer1)
  gl.bufferData(gl.ARRAY_BUFFER, textureCoord01inates, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(textureCoord01Location)
  gl.vertexAttribPointer(textureCoord01Location, 2, gl.FLOAT, false, 0, 0)

  const textureCoord02inates = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ])
  const textureCoord02Location = gl.getAttribLocation(program, 'a_textureCoord_02')
  const textureBuffer2 = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer2)
  gl.bufferData(gl.ARRAY_BUFFER, textureCoord02inates, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(textureCoord02Location)
  gl.vertexAttribPointer(textureCoord02Location, 2, gl.FLOAT, false, 0, 0)

  // 创建纹理
  const texture01 = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture01)
  
  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST) // gl.NEAREST 临近点插值  gl.LINEAR 线性插值
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1) // 这里意思是纹理单元 0

  const texture02 = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture02)
  
  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST) // gl.NEAREST 临近点插值  gl.LINEAR 线性插值
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2) // 这里意思是纹理单元 0
  gl.activeTexture(gl.TEXTURE0) // 激活纹理单元0
  gl.bindTexture(gl.TEXTURE_2D, texture01) // 绑定纹理到纹理单元0

  gl.activeTexture(gl.TEXTURE1) // 激活纹理单元1
  gl.bindTexture(gl.TEXTURE_2D, texture02) // 绑定纹理到纹理单元1

  // 告诉webgl我们使用的是纹理单元0
  const u_imageLocation = gl.getUniformLocation(program, 'u_image_0')
  gl.uniform1i(u_imageLocation, 0) // 0 对应 gl.TEXTURE0
  
  const u_imageLocation1 = gl.getUniformLocation(program, 'u_image_1')
  gl.uniform1i(u_imageLocation1, 1) // 1 对应 gl.TEXTURE1

  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3)
})

function setRectangle(x, y, width ,height){
  return new Float32Array([
    x, y, 0.0,
    x + width, y, 0.0,
    x, y + height, 0.0,
    x, y + height, 0.0,
    x + width, y, 0.0,
    x + width, y + height, 0.0
  ])
}


// 循环渲染
function animation(){
  requestAnimationFrame(animation)
  stats.update()
  // gl.clear(gl.COLOR_BUFFER_BIT) // 每次重绘时清除画布，否则会重影
}

animation()

