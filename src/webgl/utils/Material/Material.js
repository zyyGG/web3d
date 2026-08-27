export default class Material {
  /**
   * 
   * @param {Object} options 
   * @param {Color} options.color 材质颜色
   * @param {Object} options.uniforms 自定义uniforms
   * @param {String} options.vertexShader 顶点着色器代码
   * @param {String} options.fragmentShader 片元着色器代码
   */
  constructor(options = {}){
    this.color = options.color || { r: 1, g: 1, b: 1 };
    this.uniforms = {}
    this.vertexShader = '';
    this.fragmentShader = '';
  }
}