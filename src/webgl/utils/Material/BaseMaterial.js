// 超基础颜色
import Material from './Material.js';
export default class BaseMaterial extends Material {
  /**
   * 
   * @param {Object} options 
   * @param {Color} options.color 材质颜色
   * @param {Object} options.uniforms 自定义uniforms
   * @param {String} options.vertexShader 顶点着色器代码
   * @param {String} options.fragmentShader 片元着色器代码
   */
  constructor(options = {}){
    super(options);
    this.uniforms = {
      uColor: { value: [this.color.r, this.color.g, this.color.b], type: '3fv'},
    }
    this.vertexShader = /* glsl */`
      attribute vec3 position;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;

      void main()
      {
        vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = pos;
      }
    `;
    this.fragmentShader = /* glsl */`
      precision mediump float;
      uniform vec3 uColor;  

      void main()
      {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `;
  }
}