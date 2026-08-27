export default class ShaderMaterial{
  constructor(params){
    this.uniforms = params.uniforms || {};
    this.vertexShader = params.vertexShader || '';
    this.fragmentShader = params.fragmentShader || '';
  }
}
