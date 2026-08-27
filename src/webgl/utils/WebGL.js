import Renderer from "./Renderer.js";
import ShaderMaterial from "./ShaderMaterial.js"
import BaseMaterial from "./Material/BaseMaterial.js";
import Geometry from "./Geometry/Geometry.js";
import Scene from "./Scene.js";
import Mesh from "./Mesh.js";

export default class WebGL {
  static Renderer = Renderer
  static ShaderMaterial = ShaderMaterial
  static BaseMaterial = BaseMaterial
  static Geometry = Geometry
  static Scene = Scene
  static Mesh = Mesh
  constructor(){}
}
