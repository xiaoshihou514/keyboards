package keyboards.three

import org.scalajs.dom
import THREE.*
import keyboards.three.TypedAccess.*
import keyboards.three.ThreeConstants.*

final case class PageOptions(
    embed: Boolean,
    shot: Boolean,
    flat: Boolean,
    stripped: Boolean,
    view: Option[String],
    rgbEnabled: Boolean
)

object PageOptions:
  def current(defaultRgb: Boolean = true): PageOptions =
    val params = new dom.URLSearchParams(dom.window.location.search)
    PageOptions(
      embed = params.has("embed"),
      shot = params.has("shot"),
      flat = params.has("flat"),
      stripped = params.has("stripped"),
      view = Option(params.get("view")),
      rgbEnabled = Option(params.get("rgb")).forall(_ != "0") && defaultRgb
    )

final case class Vec3(x: Double, y: Double, z: Double)
final case class PixelRatios(embed: Double, full: Double)
final case class BloomConfig(embedStrength: Double, fullStrength: Double, radius: Double, threshold: Double)

final case class SceneConfig(
    title: String,
    fov: Double,
    far: Double,
    exposure: Double,
    pixelRatios: PixelRatios,
    background: Int,
    flatBackground: Int,
    fogNear: Double,
    fogFar: Double,
    environmentSigma: Double,
    environmentIntensity: Double,
    cameraPosition: Vec3,
    controlTarget: Vec3,
    damping: Double,
    maxPolarRatio: Double,
    minDistance: Double,
    maxDistance: Double,
    bloom: BloomConfig
)

final case class LightingConfig(
    keyColor: Int,
    keyIntensity: Double,
    keyPosition: Vec3,
    shadowMapEmbed: Int,
    shadowMapFull: Int,
    shadowSpan: Double,
    shadowBias: Double,
    skyColor: Int,
    groundColor: Int,
    hemisphereIntensity: Double,
    rimColor: Int,
    rimIntensity: Double,
    rimPosition: Vec3
)

final case class GroundConfig(
    radius: Double,
    segments: Int,
    y: Double,
    color: Int,
    flatColor: Int,
    roughness: Double,
    metalness: Double,
    gridSize: Double,
    gridDivisions: Int,
    gridCenterColor: Int,
    gridColor: Int,
    gridOpacity: Double
)

final case class RenderContext(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    controls: OrbitControls,
    composer: EffectComposer,
    bloom: UnrealBloomPass,
    options: PageOptions
)

object SceneRuntime:
  def create(options: PageOptions, config: SceneConfig): RenderContext =
    val renderer = WebGLRenderer(
      antialias = !options.embed,
      powerPreference = if options.embed then "low-power" else "high-performance"
    )
    renderer.setPixelRatio(math.min(dom.window.devicePixelRatio, if options.embed then config.pixelRatios.embed else config.pixelRatios.full))
    renderer.setSize(dom.window.innerWidth, dom.window.innerHeight)
    renderer.shadows.enabled = true
    renderer.shadows.`type` = PCFSoftShadowMap.asInstanceOf[Int]
    renderer.toneMapping = AcesFilmicToneMapping
    renderer.toneMappingExposure = config.exposure
    renderer.colorSpace.outputColorSpace = SRGBColorSpace
    renderer.domElement.setAttribute("aria-label", config.title)
    dom.document.body.appendChild(renderer.domElement)

    val scene = new Scene()
    scene.background = new Color(if options.flat then config.flatBackground else config.background)
    if !options.flat then scene.fog = Fog(config.background, config.fogNear, config.fogFar)
    val pmrem = new PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), config.environmentSigma).texture
    pmrem.dispose()
    scene.environmentSettings.environmentIntensity = config.environmentIntensity

    val camera = new PerspectiveCamera(config.fov, dom.window.innerWidth / dom.window.innerHeight, 0.1, config.far)
    camera.position.set(config.cameraPosition.x, config.cameraPosition.y, config.cameraPosition.z)
    val controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(config.controlTarget.x, config.controlTarget.y, config.controlTarget.z)
    controls.enableDamping = true
    controls.dampingFactor = config.damping
    controls.minDistance = config.minDistance
    controls.maxDistance = config.maxDistance
    controls.limits.maxPolarAngle = math.Pi * config.maxPolarRatio

    val composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    val bloomStrength = if options.embed then config.bloom.embedStrength else config.bloom.fullStrength
    val bloom = new UnrealBloomPass(
      new Vector2(dom.window.innerWidth, dom.window.innerHeight),
      bloomStrength,
      config.bloom.radius,
      config.bloom.threshold
    )
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    dom.window.addEventListener("resize", (_: dom.Event) =>
      camera.aspect = dom.window.innerWidth / dom.window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(dom.window.innerWidth, dom.window.innerHeight)
      composer.setSize(dom.window.innerWidth, dom.window.innerHeight)
    )
    if options.shot then
      controls.enableRotate = false
      controls.enableZoom = false
      controls.enablePan = false
    RenderContext(renderer, scene, camera, controls, composer, bloom, options)

  def addLights(context: RenderContext, config: LightingConfig): Unit =
    val key = new DirectionalLight(config.keyColor, config.keyIntensity)
    key.position.set(config.keyPosition.x, config.keyPosition.y, config.keyPosition.z)
    key.castShadow = true
    val shadowSize = if context.options.embed then config.shadowMapEmbed.toDouble else config.shadowMapFull.toDouble
    key.shadow.mapSize.x = shadowSize
    key.shadow.mapSize.y = shadowSize
    key.shadowSettings.camera.left = -config.shadowSpan
    key.shadowSettings.camera.bottom = -config.shadowSpan
    key.shadowSettings.camera.right = config.shadowSpan
    key.shadowSettings.camera.top = config.shadowSpan
    key.shadow.bias = config.shadowBias
    context.scene.add(key)
    context.scene.add(new NativeHemisphereLight(config.skyColor, config.groundColor, config.hemisphereIntensity))
    val rim = new DirectionalLight(config.rimColor, config.rimIntensity)
    rim.position.set(config.rimPosition.x, config.rimPosition.y, config.rimPosition.z)
    context.scene.add(rim)

  def addGround(context: RenderContext, config: GroundConfig): Unit =
    val color = if context.options.flat then config.flatColor else config.color
    val floor = new Mesh(
      new CircleGeometry(config.radius, config.segments),
      MeshStandardMaterial(color = color, roughness = config.roughness, metalness = config.metalness)
    )
    floor.rotation.x = -math.Pi / 2
    floor.position.y = config.y
    floor.receiveShadow = true
    context.scene.add(floor)
    val grid = new GridHelper(config.gridSize, config.gridDivisions, config.gridCenterColor, config.gridColor)
    grid.position.y = config.y + 0.015
    grid.gridMaterial.transparent = true
    grid.gridMaterial.opacity = config.gridOpacity
    grid.visible = !context.options.flat
    context.scene.add(grid)

  def animate(context: RenderContext)(update: Double => Unit): Unit =
    def frame(timestamp: Double): Unit =
      update(timestamp / 1000.0)
      context.controls.update()
      context.composer.render()
      dom.window.requestAnimationFrame((next: Double) => frame(next))
    dom.window.requestAnimationFrame((timestamp: Double) => frame(timestamp))
