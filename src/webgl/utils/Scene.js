class Scene {
  constructor(options = {}){
    this.children = []
  }

  /**
   * 主要就是添加mesh
   * @param {*} shape 
   */
  add(shape){
    this.children.push(shape);
  }
}

export default Scene;