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

// 创建第二个shape
// const program2 = gl.createProgram()
// gl.attachShader(program2, vertexShader)
// gl.attachShader(program2, fragmentShader)
// gl.linkProgram(program2)
// gl.useProgram(program2) // 使用着色程序
// // 传递uniform shuju
// const resolutionUniformLocation2 = gl.getUniformLocation(program2, 'uResolution')
// gl.uniform2f(resolutionUniformLocation2, width, height)
// // 位移
// const translationUniformLocation2 = gl.getUniformLocation(program2, 'uTranslation')
// gl.uniform2f(translationUniformLocation2, 200, 200)
// const scaleLocation2 = gl.getUniformLocation(program2, 'uScale')
// gl.uniform1f(scaleLocation2, 1.0)
// gl.drawArrays(gl.TRIANGLES, 0, shape.length / 3)

let drawCount = 0;


// 纹理读取
const image = new Image()
image.src = '/images/image.png'
image.onload = () => {drawImage([50, 50], 1.0, image)}

const image2 = new Image()
image2.src = '/textures/blue_wool_s.png'
image2.onload = () => {drawImage([500, 0], 0.5, image2)}

function drawImage(position, scale, image){
  
  const vertexShaderSource = /*glsl*/`
    attribute vec3 position;
    attribute vec2 a_textureCoord;

    uniform vec2 uResolution;
    uniform vec2 uTranslation;
    uniform float uScale;

    varying vec2 v_textureCoord;

    void main() {
      vec2 zeroToOne = (position.xy * uScale + uTranslation) * vec2(1.0, -1.0) / uResolution ;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - vec2(1.0, -1.0);
      gl_Position = vec4(clipSpace, 0, 1);

      v_textureCoord = a_textureCoord;
    }
  `
  const fragmentShaderSource = /*glsl*/`
    precision mediump float;

    uniform sampler2D u_image;

    varying vec2 v_textureCoord;

    // 高斯模糊， 消除边缘锯齿
    vec3 fuzzy(vec3 color){
      float offset = 1.0 / 200.0; // 偏移量，控制模糊程度
      vec3 result = vec3(0.0);
      result += texture2D(u_image, v_textureCoord + vec2(-offset, -offset)).rgb * 1.0;
      result += texture2D(u_image, v_textureCoord + vec2(0.0, -offset)).rgb * 2.0;
      result += texture2D(u_image, v_textureCoord + vec2(offset, -offset)).rgb * 1.0;
      result += texture2D(u_image, v_textureCoord + vec2(-offset, 0.0)).rgb * 2.0;
      result += texture2D(u_image, v_textureCoord).rgb * 4.0;
      result += texture2D(u_image, v_textureCoord + vec2(offset, 0.0)).rgb * 2.0;
      result += texture2D(u_image, v_textureCoord + vec2(-offset, offset)).rgb * 1.0;
      result += texture2D(u_image, v_textureCoord + vec2(0.0, offset)).rgb * 2.0;
      result += texture2D(u_image, v_textureCoord + vec2(offset, offset)).rgb * 1.0;
      result /= 16.0; // 归一化
      return result;
    }

    void main() {
      vec4 image = texture2D(u_image, v_textureCoord);
      vec3 color = max(fuzzy(image.rgb), vec3(0.0, 0.0, 0.0));
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
  gl.uniform2f(translationUniformLocation, position[0], position[1])
  const scaleLocation = gl.getUniformLocation(program, 'uScale')
  gl.uniform1f(scaleLocation, scale)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  const positions = setRectangle(0, 0, image.width, image.height)
  drawCount += positions.length / 3;
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  const positionAttributeLocation = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(positionAttributeLocation)
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)
  const textureCoordLocation = gl.getAttribLocation(program, 'a_textureCoord')
  const textureBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)
  const textureCoordinates = new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0
  ])
  gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(textureCoordLocation)
  gl.vertexAttribPointer(textureCoordLocation, 2, gl.FLOAT, false, 0, 0)

  // 创建纹理
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  
  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST) // gl.NEAREST 临近点插值  gl.LINEAR 线性插值
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image) // 这里意思是纹理单元 0

  
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3)
}


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
  // gl.clear(gl.COLOR_BUFFER_BIT)
}

animation()

