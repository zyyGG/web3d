import MathUtils from "./MathUtils";

export default class Renderer {
  /**@type {HTMLCanvasElement} */
  domElement = null;
  /**
   * 
   * @param {Number} width 
   * @param {Number} height 
   * @param {Object} options 
   * @returns 
   */
  constructor(width, height){
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if(!gl){
      console.error('当前浏览器不支持webgl2.0');
      return;
    }
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); // 深度测试
    gl.depthFunc(gl.LESS); // 近大远小
    gl.clearDepth(1.0); // 设置深度缓存值清除为1.0
    gl.clear(gl.DEPTH_BUFFER_BIT); // 清除深度缓存
    // gl.enable(gl.CULL_FACE); // 开启面剔除
    // gl.disable(gl.CULL_FACE)
    // gl.cullFace(gl.FRONT); // 剔除前面

    this.gl = gl;

    this.domElement = canvas;
  }

  animation(next){
    requestAnimationFrame(() => {
      this.animation(next)
    });
    next();
  }

  render(scene, camera){
    const gl = this.gl;
    let drawCount = 0;
    gl.clear(gl.COLOR_BUFFER_BIT)
    scene.children.forEach(shape => {
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, shape.material.vertexShader);
      gl.compileShader(vertexShader);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, shape.material.fragmentShader);
      gl.compileShader(fragmentShader);
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // 设置相机矩阵
      camera.updateMatrixWorld(); // 更新相机在世界坐标中的位置
      camera.updateProjectionMatrix(); // 更新投影矩阵
      const viewMatrix = camera.viewMatrix;
      const projectionMatrix = camera.projectionMatrix;
      const modelViewMatrix = shape.modelMatrix.clone().multiply(viewMatrix);

      const modelViewMatrixLocation = gl.getUniformLocation(program, 'modelViewMatrix');
      gl.uniformMatrix4fv(modelViewMatrixLocation, false, new Float32Array(modelViewMatrix.elements));
      const projectionMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix');
      gl.uniformMatrix4fv(projectionMatrixLocation, false, new Float32Array(projectionMatrix.elements));

      if(shape.isMesh) {
        // 绑定attribute position
        const positionAttributeLocation = gl.getAttribLocation(program, 'position'); // 绑定position
        if(positionAttributeLocation >= 0) {
          const positionBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(shape.geometry.positions),
            gl.STATIC_DRAW
          );
          gl.enableVertexAttribArray(positionAttributeLocation);
          gl.vertexAttribPointer(
            positionAttributeLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0
          );
        }
        // 绑定attribute normal
        const normalAttributeLocation = gl.getAttribLocation(program, 'normal'); // 绑定normal
        if(normalAttributeLocation >= 0) {
          const normalBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(shape.geometry.normals),
            gl.STATIC_DRAW
          );
          gl.enableVertexAttribArray(normalAttributeLocation);
          gl.vertexAttribPointer(
            normalAttributeLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0
          );
        }
      }

      // 设置uniforms
      shape.material.uniforms && Object.keys(shape.material.uniforms).forEach(key => {
        const uniform = shape.material.uniforms[key];
        const location = gl.getUniformLocation(program, key);
        gl[`uniform${uniform.type}`](location, new Float32Array(uniform.value));
      })

      drawCount+=shape.geometry.indices.length;
      // 绘制
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(shape.geometry.indices),
        gl.STATIC_DRAW
      );
    })
    gl.drawElements(gl.TRIANGLES, drawCount, gl.UNSIGNED_SHORT, 0);
  }
}