package keyboards.three

import scala.scalajs.js
import scala.scalajs.js.annotation.*
import org.scalajs.dom
import THREE.*

@js.native
@JSImport("three/addons/geometries/RoundedBoxGeometry.js", "RoundedBoxGeometry")
final class RoundedBoxGeometry(
    width: Double,
    height: Double,
    depth: Double,
    segments: Int = 2,
    radius: Double = 0.1
) extends BufferGeometry

@js.native
@JSImport("three/addons/environments/RoomEnvironment.js", "RoomEnvironment")
final class RoomEnvironment() extends Scene

/** ThreeScalaJS 0.2.0's HemisphereLight companion swaps the ground-color and
  * intensity constructor arguments. Import the native constructor directly so
  * the typed call matches Three.js.
  */
@js.native
@JSImport("three", "HemisphereLight")
final class NativeHemisphereLight(skyColor: Int, groundColor: Int, intensity: Double) extends HemisphereLight

@js.native
@JSImport("three", "PointLight")
final class NativePointLight(color: Int, intensity: Double, distance: Double, decay: Double) extends PointLight

@js.native
@JSImport("three", "PMREMGenerator")
final class PMREMGenerator(renderer: WebGLRenderer) extends js.Object:
  def fromScene(scene: Scene, sigma: Double = 0.0): RenderTarget = js.native
  def dispose(): Unit = js.native

@js.native
trait RenderTarget extends js.Object:
  val texture: Texture = js.native

@js.native
@JSImport("three", "BufferAttribute")
final class BufferAttribute(array: js.typedarray.Float32Array, itemSize: Int) extends js.Object:
  var needsUpdate: Boolean = js.native
  val count: Int = js.native
  def getX(index: Int): Double = js.native
  def getY(index: Int): Double = js.native
  def getZ(index: Int): Double = js.native
  def setX(index: Int, value: Double): this.type = js.native
  def setY(index: Int, value: Double): this.type = js.native
  def setZ(index: Int, value: Double): this.type = js.native

@js.native
trait BufferGeometryAttributes extends js.Object:
  val position: BufferAttribute = js.native

@js.native
trait GeometryAccess extends js.Object:
  val attributes: BufferGeometryAttributes = js.native
  def setAttribute(name: String, attribute: BufferAttribute): BufferGeometry = js.native
  def setIndex(index: js.Array[Int]): BufferGeometry = js.native
  def computeVertexNormals(): Unit = js.native

@js.native
trait ShadowMapSettings extends js.Object:
  var enabled: Boolean = js.native
  var `type`: Int = js.native

@js.native
trait RendererShadowAccess extends js.Object:
  val shadowMap: ShadowMapSettings = js.native

@js.native
trait RendererColorSpaceAccess extends js.Object:
  var outputColorSpace: String = js.native

@js.native
trait SceneEnvironmentAccess extends js.Object:
  var environmentIntensity: Double = js.native

@js.native
trait OrthographicShadowCamera extends js.Object:
  var left: Double = js.native
  var right: Double = js.native
  var top: Double = js.native
  var bottom: Double = js.native

@js.native
trait DirectionalShadowAccess extends js.Object:
  val camera: OrthographicShadowCamera = js.native

@js.native
trait OrbitLimits extends js.Object:
  var maxPolarAngle: Double = js.native

@js.native
trait GridMaterialAccess extends js.Object:
  val material: Material = js.native

@js.native
trait MaterialUpdateAccess extends js.Object:
  var needsUpdate: Boolean = js.native

@js.native
trait PhysicalMaterialCloneAccess extends js.Object:
  override def clone(): MeshPhysicalMaterial = js.native

@js.native
trait StandardMaterialEnvironmentAccess extends js.Object:
  var envMapIntensity: Double = js.native

@js.native
trait Intersection extends js.Object:
  val `object`: Object3D = js.native

@js.native
trait ExtrudeOptions extends js.Object:
  var depth: Double = js.native
  var bevelEnabled: Boolean = js.native
  var bevelSegments: Int = js.native
  var bevelThickness: Double = js.native
  var bevelSize: Double = js.native
  var curveSegments: Int = js.native

object TypedAccess:
  extension (renderer: WebGLRenderer)
    def shadows: ShadowMapSettings = renderer.asInstanceOf[RendererShadowAccess].shadowMap
    def colorSpace: RendererColorSpaceAccess = renderer.asInstanceOf[RendererColorSpaceAccess]

  extension (scene: Scene)
    def environmentSettings: SceneEnvironmentAccess = scene.asInstanceOf[SceneEnvironmentAccess]

  extension (light: DirectionalLight)
    def shadowSettings: DirectionalShadowAccess = light.shadow.asInstanceOf[DirectionalShadowAccess]

  extension (controls: OrbitControls)
    def limits: OrbitLimits = controls.asInstanceOf[OrbitLimits]

  extension (geometry: BufferGeometry)
    def editable: GeometryAccess = geometry.asInstanceOf[GeometryAccess]

  extension (geometry: RoundedBoxGeometry)
    def editable: GeometryAccess = geometry.asInstanceOf[GeometryAccess]

  extension (grid: GridHelper)
    def gridMaterial: Material = grid.asInstanceOf[GridMaterialAccess].material

  extension (material: Material)
    def updates: MaterialUpdateAccess = material.asInstanceOf[MaterialUpdateAccess]

  extension (material: MeshPhysicalMaterial)
    def cloned: MeshPhysicalMaterial = material.asInstanceOf[PhysicalMaterialCloneAccess].clone()

  extension (material: MeshStandardMaterial)
    def environment: StandardMaterialEnvironmentAccess = material.asInstanceOf[StandardMaterialEnvironmentAccess]

  def canvas2d(size: Int): (dom.html.Canvas, dom.CanvasRenderingContext2D) =
    val canvas = dom.document.createElement("canvas").asInstanceOf[dom.html.Canvas]
    canvas.width = size
    canvas.height = size
    val context = canvas.getContext("2d").asInstanceOf[dom.CanvasRenderingContext2D]
    (canvas, context)

object ThreeConstants:
  // ThreeScalaJS 0.2.0 exposes these two as global THREE.* values even in
  // module builds. Their numeric values are part of Three.js' public API.
  val AcesFilmicToneMapping = 4
  val DoubleSided = 2
  val RepeatWrappingMode = 1000
