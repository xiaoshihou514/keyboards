package keyboards.q11

import scala.collection.mutable
import scala.scalajs.js
import scala.scalajs.js.JSConverters.*
import org.scalajs.dom
import THREE.*
import keyboards.three.*
import keyboards.three.TypedAccess.*
import keyboards.three.ThreeConstants.*

object Q11Scene:
  private val CaseDepth = 6.75
  private val CaseWidths = Map("left" -> 8.4, "right" -> 9.2)
  private val HalfX = Map("left" -> -5.5, "right" -> 5.4)
  private val HalfZ = Map("left" -> 0.15, "right" -> -0.2)
  private val HalfRotation = Map("left" -> 10.5, "right" -> -10.5)
  private val LeftStarts = Vector(-3.08, -3.9, -3.9, -3.9, -3.9, -3.9)
  private val RightStarts = Vector(-4.05, -4.4, -4.6, -4.2, -3.85, -4.05)
  private val Unit = 0.82
  private val Gap = 0.07

  final case class KeyState(
      group: Group,
      cap: Mesh,
      legendMaterial: MeshBasicMaterial,
      ledMaterial: MeshBasicMaterial,
      diffuserMaterial: MeshBasicMaterial,
      housingMaterial: MeshPhysicalMaterial,
      stemMaterial: MeshPhysicalMaterial,
      capMaterial: MeshPhysicalMaterial,
      layers: KeyLayers,
      restY: Double,
      worldX: Double,
      worldZ: Double,
      var press: Double
  )

  final case class Materials(
      shell: MeshPhysicalMaterial,
      bevel: MeshStandardMaterial,
      deck: MeshStandardMaterial,
      socket: MeshStandardMaterial,
      stem: MeshPhysicalMaterial,
      alpha: MeshPhysicalMaterial,
      modifier: MeshPhysicalMaterial,
      accent: MeshPhysicalMaterial,
      knob: MeshStandardMaterial,
      post: MeshStandardMaterial
  )

  def start(document: VialDocument): Unit =
    if document.layout.isEmpty || document.layout(0).length != 12 then
      throw new IllegalArgumentException("real/keymap.vil must provide the Q11 12-row base matrix")
    val options = PageOptions.current()
    val context = SceneRuntime.create(options, SceneConfig(
      title = "可交互的 Q11 分体键盘三维模型",
      fov = 40, far = 120, exposure = 1.05, pixelRatios = PixelRatios(1.0, 2),
      background = 0x07090d, flatBackground = 0xf1f1ee, fogNear = 25, fogFar = 62,
      environmentSigma = 0.04, environmentIntensity = 0.52,
      cameraPosition = Vec3(0, 16.5, 12.5), controlTarget = Vec3(0, 0.45, 0.2),
      damping = 0.055, maxPolarRatio = 0.49, minDistance = 8, maxDistance = 36,
      bloom = BloomConfig(if options.rgbEnabled then 0.32 else 0, if options.rgbEnabled then 0.4 else 0, 0.48, 0.68)
    ))
    options.view.foreach {
      case "side" => context.camera.position.set(17.5, 7.4, 3.2)
      case "top" => context.camera.position.set(0.01, 21.5, 0.8)
      case _ => ()
    }
    SceneRuntime.addLights(context, LightingConfig(
      0xfff8ee, 2.7, Vec3(-7, 15, 10), 512, 2048, 18, -0.00045,
      0xb7c5ff, 0x111017, 0.5, 0x7395ff, 1.05, Vec3(10, 6, -11)
    ))
    SceneRuntime.addGround(context, GroundConfig(
      50, 96, -0.86, 0x0b0d13, 0xf1f1ee, 0.86, 0.14,
      90, 90, 0x26314a, 0x141a27, 0.28
    ))
    val materials = createMaterials()
    val board = new Group()
    board.name = "q11-root"
    board.rotation.x = math.toRadians(-3.2)
    context.scene.add(board)
    val legends = new Q11LegendFactory()
    val glowTexture = TextureFactory.radialGlow()
    val keys = mutable.ArrayBuffer.empty[KeyState]
    makeHalf("left", 0, board, document, materials, legends, glowTexture, keys)
    makeHalf("right", 6, board, document, materials, legends, glowTexture, keys)
    val glowPoints = (0 until 8).map { index =>
      val x = -8.4 + index * 2.4
      val z = 0.2 + (index % 2) * 1.8
      val light = new NativePointLight(0xffffff, 0, 3.2, 1.7)
      light.position.set(x, 0.44, z)
      board.add(light)
      (light, x, z)
    }.toVector
    var layer = requestedLayer(document.layout.length)
    var rgb = options.rgbEnabled && !options.flat
    def updateLegends(): Unit = keys.foreach { key =>
      val (primary, secondary) = Q11Keymap.presentation(key.layers, layer)
      key.legendMaterial.map = legends(primary, secondary)
      key.legendMaterial.updates.needsUpdate = true
    }
    def action(key: KeyState): Unit = key.layers.at(layer) match
      case KeyCode.Named(code) if code.matches("DF\\(\\d+\\)") =>
        layer = math.max(0, math.min(document.layout.length - 1, code.filter(_.isDigit).toInt))
        updateLegends()
      case KeyCode.Named("RM_ON") => rgb = true
      case KeyCode.Named("RM_OFF") => rgb = false
      case _ => ()
    updateLegends()
    installPicking(context, keys.toVector, action)
    SceneRuntime.animate(context) { elapsed =>
      val time = if options.shot then 2.4 else elapsed
      val breathe = 0.58 + (math.sin(time * 1.35) + 1) * 0.31
      keys.foreach { key =>
        if rgb then
          val hue = euclideanModulo(key.worldX * 0.042 + key.worldZ * 0.018 + 0.63, 1)
          val color = new Color().setHSL(hue, 0.99, 0.52)
          key.ledMaterial.color.copy(color)
          key.diffuserMaterial.color.copy(color)
          key.diffuserMaterial.opacity = breathe * 0.32
          key.housingMaterial.color.copy(color).lerp(materials.stem.color, 0.72)
          key.stemMaterial.color.copy(color).lerp(materials.stem.color, 0.78)
          key.housingMaterial.emissive.copy(color)
          key.housingMaterial.emissiveIntensity = breathe * 0.025
          key.stemMaterial.emissive.copy(color)
          key.stemMaterial.emissiveIntensity = breathe * 0.015
          key.capMaterial.emissive.setHex(0x000000)
          key.capMaterial.emissiveIntensity = 0
        else
          key.ledMaterial.color.setHex(0x101217)
          key.diffuserMaterial.opacity = 0
          key.housingMaterial.color.copy(materials.stem.color)
          key.stemMaterial.color.copy(materials.stem.color)
          key.housingMaterial.emissive.setHex(0x000000)
          key.housingMaterial.emissiveIntensity = 0
          key.stemMaterial.emissive.setHex(0x000000)
          key.stemMaterial.emissiveIntensity = 0
        if key.press > 0 then
          key.press = math.max(0, key.press - 0.07)
          key.cap.position.y = key.restY - math.sin(key.press * math.Pi) * 0.09
      }
      glowPoints.foreach { (point, x, z) =>
        if rgb then
          point.color.asInstanceOf[Color].setHSL(euclideanModulo(x * 0.042 + z * 0.018 + 0.63, 1), 0.99, 0.52)
          point.intensity = breathe * (if options.embed then 0.08 else 0.12)
        else point.intensity = 0
      }
    }

  private def createMaterials(): Materials =
    val switch = MeshPhysicalMaterial(color = 0xded9cf, roughness = 0.4, transmission = 0.08, thickness = 0.4)
    switch.transparent = true
    switch.opacity = 0.62
    val shell = MeshPhysicalMaterial(color = 0x1a1e22, metalness = 0.68, roughness = 0.46, clearcoat = 0.12, clearcoatRoughness = 0.58)
    shell.map = microTexture("#1b1f23", "rgba(96,102,110,.065)", "rgba(255,255,255,.014)")
    Materials(
      shell,
      MeshStandardMaterial(color = 0x111419, metalness = 0.5, roughness = 0.52),
      MeshStandardMaterial(color = 0x0d1014, metalness = 0.42, roughness = 0.62),
      MeshStandardMaterial(color = 0x080a0d, metalness = 0.08, roughness = 0.72),
      switch,
      MeshPhysicalMaterial(color = 0x203445, roughness = 0.69, metalness = 0, transmission = 0.015, thickness = 0.7),
      MeshPhysicalMaterial(color = 0x171d25, roughness = 0.69, metalness = 0, transmission = 0.015, thickness = 0.7),
      MeshPhysicalMaterial(color = 0xb92f2f, roughness = 0.69, metalness = 0, transmission = 0.015, thickness = 0.7),
      MeshStandardMaterial(color = 0x15171c, metalness = 0.92, roughness = 0.28),
      MeshStandardMaterial(color = 0x596068, metalness = 0.86, roughness = 0.3)
    )

  private def makeHalf(
      side: String, matrixOffset: Int, board: Group, document: VialDocument, materials: Materials,
      legends: Q11LegendFactory, glowTexture: Texture, keys: mutable.ArrayBuffer[KeyState]
  ): Unit =
    val group = new Group()
    group.name = s"$side-half"
    group.position.set(HalfX(side), 0, HalfZ(side))
    group.rotation.y = math.toRadians(HalfRotation(side))
    board.add(group)
    val width = CaseWidths(side)
    val shell = steppedCase(side, width, 0.6, CaseDepth, materials.shell, s"$side-case")
    shell.position.y = -0.1
    group.add(shell)
    val chamfer = steppedCase(side, width - 0.04, 0.08, CaseDepth - 0.04, materials.bevel, s"$side-perimeter-chamfer")
    chamfer.position.y = 0.24
    group.add(chamfer)
    val deck = steppedCase(side, width - 0.18, 0.12, CaseDepth - 0.18, materials.deck, s"$side-deck")
    deck.position.y = 0.32
    group.add(deck)
    placeMatrix(group, side, matrixOffset, document, materials, legends, glowTexture, keys)
    addEncoder(group, side, materials)

  private def placeMatrix(
      parent: Group, side: String, offset: Int, document: VialDocument, materials: Materials,
      legends: Q11LegendFactory, glowTexture: Texture, keys: mutable.ArrayBuffer[KeyState]
  ): Unit =
    (0 until 6).foreach { row =>
      val entries = document.layout(0)(offset + row).zipWithIndex.flatMap { (raw, column) =>
        KeyCode.from(raw) match
          case KeyCode.Named(code) if code != "KC_MUTE" => Some((code, column, Q11Keymap.layers(document, offset + row, column)))
          case _ => None
      }.toVector
      val z = -2.55 + row * 1.02
      if side == "left" then placeSequence(parent, entries, LeftStarts(row), z, row, materials, legends, glowTexture, keys)
      else
        val nav = Set("LGUI(KC_PGUP)", "LGUI(KC_PGDOWN)", "KC_HOME")
        val arrows = Set("KC_LEFT", "KC_DOWN", "KC_RIGHT")
        val navigation = entries.find(item => nav(item._1))
        val up = entries.find(_._1 == "KC_UP")
        val bottom = entries.filter(item => arrows(item._1))
        val main = entries.filterNot(item => navigation.contains(item) || up.contains(item) || arrows(item._1))
        placeSequence(parent, main, RightStarts(row), z, row, materials, legends, glowTexture, keys)
        navigation.foreach(item => placeSequence(parent, Vector(item), 3.61, z, row, materials, legends, glowTexture, keys))
        if bottom.nonEmpty then placeSequence(parent, bottom, 1.9, z, row, materials, legends, glowTexture, keys)
        up.foreach(item => placeSequence(parent, Vector(item), 2.79, z, row, materials, legends, glowTexture, keys))
    }

  private def placeSequence(
      parent: Group, items: Vector[(String, Int, KeyLayers)], start: Double, z: Double, row: Int,
      materials: Materials, legends: Q11LegendFactory, glowTexture: Texture, keys: mutable.ArrayBuffer[KeyState]
  ): Unit =
    var cursor = start
    items.foreach { (code, _, layers) =>
      val units = Q11Keymap.width(code)
      val width = Unit * units + Gap * (units - 1)
      val state = makeKey(parent, cursor + width / 2, z, code, layers, width, row, materials, legends, glowTexture)
      keys += state
      cursor += width + Gap
    }

  private def makeKey(
      parent: Group, x: Double, z: Double, code: String, layers: KeyLayers, width: Double, row: Int,
      materials: Materials, legends: Q11LegendFactory, glowTexture: Texture
  ): KeyState =
    val group = new Group()
    group.name = s"key-$code"
    group.position.set(x, 0, z)
    parent.add(group)
    val ledMaterial = MeshBasicMaterial(color = 0xffffff)
    ledMaterial.toneMapped = false
    val led = new Mesh(new CylinderGeometry(0.27, 0.34, 0.08, 18), ledMaterial)
    led.position.y = 0.49
    group.add(led)
    val socket = rounded(width * 0.66, 0.08, 0.49, 0.025, materials.socket, "switch-socket")
    socket.position.y = 0.42
    group.add(socket)
    val diffuserMaterial = MeshBasicMaterial(map = glowTexture)
    diffuserMaterial.transparent = true
    diffuserMaterial.opacity = 0.28
    diffuserMaterial.depthWrite = false
    diffuserMaterial.toneMapped = false
    diffuserMaterial.blending = AdditiveBlending
    diffuserMaterial.side = DoubleSided
    val diffuser = new Mesh(new CircleGeometry(0.62, 32), diffuserMaterial)
    diffuser.position.y = 0.478
    diffuser.rotation.x = -math.Pi / 2
    diffuser.scale.x = math.min(1.45, (width + 0.12) / 0.9)
    group.add(diffuser)
    val stemMaterial = materials.stem.cloned
    val stem = rounded(math.min(width * 0.34, 0.3), 0.08, 0.27, 0.025, stemMaterial, "switch-stem")
    stem.position.y = 0.5
    group.add(stem)
    val housingMaterial = materials.stem.cloned
    val housing = rounded(width * 0.76, 0.16, 0.57, 0.05, housingMaterial, "switch-housing")
    housing.position.y = 0.62
    group.add(housing)
    val capMaterial = (Q11Keymap.tone(code) match
      case "accent" => materials.accent
      case "modifier" => materials.modifier
      case _ => materials.alpha
    ).cloned
    val cap = new Mesh(keycapGeometry(width), capMaterial)
    cap.castShadow = true
    cap.receiveShadow = true
    val profile = Vector((1.07,-6.0), (1.05,-4.0), (1.03,-2.0), (1.02,0.0), (1.02,3.0), (1.03,5.0)).lift(row).getOrElse((1.02,0.0))
    cap.position.y = profile._1
    cap.rotation.x = math.toRadians(profile._2)
    group.add(cap)
    val (primary, secondary) = Q11Keymap.presentation(layers, 0)
    val legendMaterial = MeshBasicMaterial(map = legends(primary, secondary))
    legendMaterial.transparent = true
    legendMaterial.depthWrite = false
    legendMaterial.toneMapped = false
    val label = new Mesh(new PlaneGeometry(math.min(width * 0.78, 1.5), 0.58), legendMaterial)
    label.rotation.x = -math.Pi / 2
    label.position.y = 0.374
    cap.add(label)
    KeyState(group, cap, legendMaterial, ledMaterial, diffuserMaterial, housingMaterial, stemMaterial, capMaterial, layers, profile._1, parent.position.x.asInstanceOf[Double] + x, parent.position.z.asInstanceOf[Double] + z, 0)

  private def addEncoder(parent: Group, side: String, materials: Materials): Unit =
    val x = if side == "left" then -3.57 else 4.08
    val bezel = new Mesh(new CylinderGeometry(0.46, 0.48, 0.1, 36), materials.deck)
    bezel.position.set(x, 0.41, -2.7)
    parent.add(bezel)
    val post = new Mesh(new CylinderGeometry(0.21, 0.25, 0.32, 28), materials.post)
    post.position.set(x, 0.59, -2.7)
    parent.add(post)
    val knob = new Mesh(new CylinderGeometry(0.38, 0.4, 0.62, 36), materials.knob)
    knob.position.set(x, 1.04, -2.7)
    parent.add(knob)
    val ring = new Mesh(new TorusGeometry(0.31, 0.025, 8, 36), materials.bevel)
    ring.rotation.x = math.Pi / 2
    ring.position.set(x, 1.37, -2.7)
    parent.add(ring)

  private def steppedCase(side: String, width: Double, height: Double, depth: Double, material: Material, name: String): Mesh =
    val points = outline(side, width, depth)
    val shape = new Shape()
    shape.moveTo(points.head._1, points.head._2)
    points.tail.foreach((x, y) => shape.lineTo(x, y))
    shape.lineTo(points.head._1, points.head._2)
    val options = (new js.Object).asInstanceOf[ExtrudeOptions]
    options.depth = height
    options.bevelEnabled = true
    options.bevelSegments = 1
    options.bevelThickness = 0.045
    options.bevelSize = 0.045
    options.curveSegments = 1
    val geometry = new ExtrudeGeometry(shape, options)
    geometry.rotateX(math.Pi / 2)
    geometry.translate(0, height / 2, 0)
    roundedShadow(new Mesh(geometry, material), name)

  private def outline(side: String, width: Double, depth: Double): Vector[(Double, Double)] =
    val hw = width / 2; val hd = depth / 2; val a = -depth * 0.15; val b = 0.0; val c = depth * 0.15
    if side == "left" then Vector((-hw,-hd),(hw-.8,-hd),(hw-.8,a),(hw-1.25,a),(hw-1.25,b),(hw-1.05,b),(hw-1.05,c),(hw-.1,c),(hw-.1,hd),(-hw,hd))
    else Vector((-hw+.45,-hd),(hw,-hd),(hw,hd),(-hw+.65,hd),(-hw+.65,c),(-hw+.3,c),(-hw+.3,b),(-hw,b),(-hw,a),(-hw+.45,a))

  private def keycapGeometry(width: Double): BufferGeometry =
    val height = 0.72
    val geometry = new RoundedBoxGeometry(width, height, 0.84, 5, 0.085)
    val positions = geometry.editable.attributes.position
    (0 until positions.count).foreach { index =>
      val ratio = math.max(0, math.min(1, (positions.getY(index) + height / 2) / height))
      positions.setX(index, positions.getX(index) * (1 - 0.18 * ratio))
      positions.setZ(index, positions.getZ(index) * (1 - 0.14 * ratio))
    }
    positions.needsUpdate = true
    geometry.editable.computeVertexNormals()
    geometry

  private def rounded(width: Double, height: Double, depth: Double, radius: Double, material: Material, name: String): Mesh =
    roundedShadow(new Mesh(new RoundedBoxGeometry(width, height, depth, 4, radius), material), name)

  private def roundedShadow(mesh: Mesh, name: String): Mesh =
    mesh.name = name
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh

  private def installPicking(context: RenderContext, keys: Vector[KeyState], action: KeyState => Unit): Unit =
    val ray = new Raycaster(); val pointer = new Vector2(); var down = Option.empty[(Double,Double)]
    val byCap = keys.map(key => key.cap.id -> key).toMap
    context.renderer.domElement.addEventListener("pointerdown", (raw: dom.Event) =>
      val event = raw.asInstanceOf[dom.PointerEvent]; down = Some(event.clientX -> event.clientY)
    )
    context.renderer.domElement.addEventListener("pointerup", (raw: dom.Event) =>
      val event = raw.asInstanceOf[dom.PointerEvent]
      down.filter((x,y) => math.hypot(event.clientX-x,event.clientY-y) <= 6).foreach { _ =>
        pointer.x = event.clientX / dom.window.innerWidth * 2 - 1
        pointer.y = -(event.clientY / dom.window.innerHeight) * 2 + 1
        ray.setFromCamera(pointer, context.camera)
        ray.intersectObjects(keys.map(_.cap).toJSArray, false).headOption.flatMap(hit => byCap.get(hit.`object`.id)).foreach { key =>
          key.press = 1; action(key)
        }
      }
      down = None
    )

  private def requestedLayer(count: Int): Int =
    val params = new dom.URLSearchParams(dom.window.location.search)
    Option(params.get("layer")).flatMap(_.toIntOption).map(value => math.max(0, math.min(count - 1, value))).getOrElse(0)

  private def euclideanModulo(n: Double, m: Double): Double = ((n % m) + m) % m

  private def microTexture(base: String, fleck: String, line: String): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(256)
    g.fillStyle = base
    g.fillRect(0, 0, 256, 256)
    (0 until 256 by 7).foreach { y =>
      g.fillStyle = line
      g.fillRect(0, y, 256, 1)
    }
    g.fillStyle = fleck
    (0 until 760).foreach { _ => g.fillRect(math.random() * 256, math.random() * 256, 1, 1) }
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = ThreeConstants.RepeatWrappingMode
    texture.wrapT = ThreeConstants.RepeatWrappingMode
    texture.repeat.x = 3
    texture.repeat.y = 3
    texture
