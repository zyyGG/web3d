/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type
 * @param {string} source 
 */
export function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source) // 将着色器源码传入着色器对象
  gl.compileShader(shader) // 编译着色器
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) // 检查编译状态
  if(success){
    return shader
  }

  console.error(gl.getShaderInfoLog(shader)) // 输出编译错误信息
  gl.deleteShader(shader) // 删除着色器对象
}

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vertexShader 
 * @param {WebGLShader} fragmentShader 
 */
export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram() // 创建程序对象
  gl.attachShader(program, vertexShader) // 将顶点着色器附加到程序对象
  gl.attachShader(program, fragmentShader) // 将片段着色器附加到程序对象
  gl.linkProgram(program) // 链接程序对象
  const success = gl.getProgramParameter(program, gl.LINK_STATUS) // 检查链接状态
  if(success){
    return program
  }

  console.error(gl.getProgramInfoLog(program)) // 输出链接错误信息
  gl.deleteProgram(program) // 删除程序对象
}