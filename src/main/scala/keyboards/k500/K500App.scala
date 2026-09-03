package keyboards.k500

import scala.collection.mutable
import scala.scalajs.js
import scala.scalajs.js.JSConverters.*
import org.scalajs.dom
import THREE.*
import keyboards.three.*
import keyboards.three.TypedAccess.*

object K500App:
  private val Width = 16.16
  private val Depth = 6.04
  private val FrontTop = 0.16
  private val RearTop = 0.64
  private val Pitch = 0.98
  private val RowZ = Vector(-2.47, -1.49, -0.51, 0.47, 1.45, 2.43)
  private val RowHues = Vector(0.55, 0.78, 0.34, 0.075, 0.98, 0.025)

  final case class AnimatedKey(group: Group, cap: Mesh, label: Mesh, restY: Double, var press: Double)
  final case class Glow(material: MeshBasicMaterial, row: Int)
  final case class Model(
      root: Group,
      keys: Vector[AnimatedKey],
      glows: Vector[Glow],
      stripMaterials: Vector[MeshBasicMaterial],
      legendMaterials: Vector[(MeshBasicMaterial, Int)],
      lights: Vector[RectAreaLight],
      pick: Map[Int, AnimatedKey]
  )

  def start(): Unit =
    val options = PageOptions.current()
    val context = SceneRuntime.create(options, SceneConfig(
      title = "可交互的 MECHANIKE K500 键盘三维模型",
      fov = 38, far = 110, exposure = 0.82, pixelRatios = PixelRatios(1.0, 1.75),
      background = 0x07090d, flatBackground = 0xe8e9e6, fogNear = 25, fogFar = 58,
      environmentSigma = 0.035, environmentIntensity = 0.34,
      cameraPosition = Vec3(0, 11.8, 13.7), controlTarget = Vec3(0, 0.28, 0.12),
      damping = 0.055, maxPolarRatio = 0.495, minDistance = 7.5, maxDistance = 34,
      bloom = BloomConfig(0.16, 0.22, 0.44, 1.2)
    ))
    setCameraView(context)
    SceneRuntime.addLights(context, LightingConfig(
      0xfff8eb, 1.3, Vec3(-7, 14, 10), 512, 1536, 14, -0.0004,
      0xdbe6ff, 0x19151a, 0.38, 0x8eb4ff, 0.4, Vec3(9, 5, -10)
    ))
    SceneRuntime.addGround(context, GroundConfig(
      46, 72, -0.78, 0x0b0d13, 0xe8e9e6, 0.88, 0.08,
      80, 80, 0x26314a, 0x151b27, 0.24
    ))
    val model = buildModel(context)
    context.scene.add(model.root)
    installPicking(context, model)
    val rgbEnabled = options.rgbEnabled
    SceneRuntime.animate(context) { elapsed =>
      val breathe = 0.87 + math.sin(elapsed * 1.25) * 0.13
      model.glows.foreach { glow =>
        glow.material.opacity = if rgbEnabled then 0.94 * breathe else 0
      }
      model.stripMaterials.foreach(_.opacity = if rgbEnabled then 0.94 * breathe else 0)
      model.lights.foreach { light =>
        light.intensity = if rgbEnabled then 7 * breathe else 0
      }
      model.legendMaterials.foreach { (material, row) =>
        if rgbEnabled then
          material.color.setHSL(RowHues(row), 1, 0.5)
          material.opacity = 0.8 + 0.2 * breathe
        else
          material.color.setHex(0x363a3d)
          material.opacity = 1
      }
      model.keys.foreach { key =>
        key.press *= 0.78
        key.group.position.y = key.restY - key.press * 0.13
      }
    }
    dom.window.asInstanceOf[js.Object]

  private def setCameraView(context: RenderContext): Unit =
    context.options.view.foreach {
      case "top" => context.camera.position.set(0.01, 15.8, 0.45)
      case "side" => context.camera.position.set(17.5, 4.9, 7.5)
      case "front" => context.camera.position.set(0.01, 3.9, 13.8)
      case "rear" => context.camera.position.set(-0.01, 3.9, -13.8)
      case _ => ()
    }

  private def buildModel(context: RenderContext): Model =
    val root = new Group()
    root.name = "k500-root"
    val caseMaterial = MeshPhysicalMaterial(color = 0xe8e9e5, roughness = 0.68, metalness = 0.02, clearcoat = 0.06, clearcoatRoughness = 0.76)
    caseMaterial.map = microTexture()
    val edgeMaterial = MeshStandardMaterial(color = 0xd8d9d5, roughness = 0.7, metalness = 0.02)
    val deckMaterial = MeshStandardMaterial(color = 0xd6d8d5, roughness = 0.74, metalness = 0.02)
    val socketMaterial = MeshStandardMaterial(color = 0xc5c3bd, roughness = 0.72, metalness = 0.01)
    val stemMaterial = MeshStandardMaterial(color = 0xe2d1dc, roughness = 0.58, metalness = 0)
    val capMaterial = MeshPhysicalMaterial(color = 0xf1f0eb, roughness = 0.56, metalness = 0, clearcoat = 0.035, clearcoatRoughness = 0.72)
    val accentMaterial = MeshPhysicalMaterial(color = 0xe9e8e3, roughness = 0.56, metalness = 0, clearcoat = 0.035, clearcoatRoughness = 0.72)

    if context.options.stripped then
      caseMaterial.map = null
      Vector(caseMaterial, capMaterial, accentMaterial).foreach { material =>
        material.color.setHex(0x9c9c9c)
        material.metalness = 0
        material.roughness = 1
        material.updates.needsUpdate = true
      }
      Vector(edgeMaterial, deckMaterial, socketMaterial, stemMaterial).foreach { material =>
        material.color.setHex(0x9c9c9c)
        material.metalness = 0
        material.roughness = 1
        material.updates.needsUpdate = true
      }

    val lowerCase = shadowed(new Mesh(wedgeGeometry(Width, Depth, -0.67, FrontTop, -0.67, RearTop), caseMaterial), "wedge-case-shell")
    root.add(lowerCase)
    val lip = shadowed(new Mesh(new RoundedBoxGeometry(Width - 0.1, 0.16, Depth - 0.08, 2, 0.045), edgeMaterial), "lower-case-lip")
    lip.position.y = -0.58
    root.add(lip)
    val deck = shadowed(new Mesh(new RoundedBoxGeometry(Width - 0.16, 0.1, Depth - 0.14, 2, 0.035), deckMaterial), "recessed-key-deck")
    deck.rotation.x = math.toRadians(4.35)
    deck.position.y = 0.39
    root.add(deck)
    root.add(brandPlane(rear = true), brandPlane(rear = false))

    val legends = new TextureFactory.Legends(darkText = false)
    val glowTexture = radialGlowTexture()
    val keys = mutable.ArrayBuffer.empty[AnimatedKey]
    val glows = mutable.ArrayBuffer.empty[Glow]
    val legendMaterials = mutable.ArrayBuffer.empty[(MeshBasicMaterial, Int)]
    val pick = mutable.Map.empty[Int, AnimatedKey]
    K500Layout.rows.zipWithIndex.foreach { (row, rowIndex) =>
      val units = row.map(_.width).sum
      var cursor = -(units * Pitch) / 2
      row.zipWithIndex.foreach { (legend, column) =>
        val x = cursor + legend.width * Pitch / 2
        val state = createKey(root, legend, x, RowZ(rowIndex), rowIndex, column, socketMaterial, stemMaterial,
          if rowIndex == 0 || legend.width > 1.2 then accentMaterial else capMaterial, legends, glowTexture)
        keys += state._1
        glows += state._2
        legendMaterials += state._3 -> rowIndex
        pick += state._1.cap.id -> state._1
        pick += state._1.label.id -> state._1
        cursor += legend.width * Pitch
      }
    }
    val lights = RowZ.zipWithIndex.map { (z, row) =>
      val light = RectAreaLight(new Color().setHSL(RowHues(row), 1, 0.56), if context.options.rgbEnabled then 7 else 0, Width - 0.7, 0.34)
      light.position.set(0, deckHeight(z) + 0.19, z)
      light.rotation.x = math.Pi / 2
      root.add(light)
      light
    }
    val stripMaterials = (1 until RowZ.length).map { row =>
      val z = (RowZ(row - 1) + RowZ(row)) / 2
      val material = MeshBasicMaterial(color = 0xffffff)
      material.color.setHSL(RowHues(row), 1, 0.5)
      material.transparent = true
      material.opacity = if context.options.rgbEnabled then 0.94 else 0
      material.depthWrite = false
      material.toneMapped = false
      val strip = new Mesh(new PlaneGeometry(Width - 0.18, 0.1), material)
      strip.name = s"rgb-row-slot-$row"
      strip.rotation.x = -math.Pi / 2
      strip.position.set(0, deckHeight(z) + 0.235, z)
      root.add(strip)
      material
    }.toVector
    Model(root, keys.toVector, glows.toVector, stripMaterials, legendMaterials.toVector, lights, pick.toMap)

  private def createKey(
      root: Group, key: KeyLegend, x: Double, z: Double, row: Int, column: Int,
      socketMaterial: Material, stemMaterial: Material, capMaterial: Material,
      legends: TextureFactory.Legends, glowTexture: Texture
  ): (AnimatedKey, Glow, MeshBasicMaterial) =
    val group = new Group()
    group.name = s"key-${key.primary}-$row-$column"
    val restY = deckHeight(z)
    group.position.set(x, restY, z)
    val socketWidth = key.width * Pitch - 0.07
    val socket = shadowed(new Mesh(new RoundedBoxGeometry(socketWidth, 0.16, 0.78, 2, 0.035), socketMaterial), "switch-housing")
    socket.position.y = 0.08
    group.add(socket)
    val stem = new Mesh(new RoundedBoxGeometry(0.26, 0.18, 0.26, 2, 0.025), stemMaterial)
    stem.name = "short-switch-stem"
    stem.position.y = 0.19
    group.add(stem)
    val capWidth = key.width * Pitch - 0.035
    val cap = shadowed(new Mesh(taperedGeometry(capWidth, 0.7, 0.93), capMaterial), "traditional-trapezoid-keycap")
    cap.position.y = 0.48
    group.add(cap)
    val legendMaterial = MeshBasicMaterial(map = legends(key.primary, key.secondary, key.corner))
    if PageOptions.current().rgbEnabled then legendMaterial.color.setHSL(RowHues(row), 1, 0.5)
    else legendMaterial.color.setHex(0x363a3d)
    legendMaterial.transparent = true
    legendMaterial.depthWrite = false
    legendMaterial.toneMapped = false
    val label = new Mesh(new PlaneGeometry(math.min(capWidth * 0.76, 1.42), 0.62), legendMaterial)
    label.rotation.x = -math.Pi / 2
    label.position.y = 0.837
    group.add(label)
    val hue = euclideanModulo(RowHues(row) + x / Width * 0.035, 1)
    val glowMaterial = MeshBasicMaterial(map = glowTexture)
    glowMaterial.color.setHSL(hue, 1, 0.5)
    glowMaterial.transparent = true
    glowMaterial.opacity = 0.94
    glowMaterial.blending = AdditiveBlending
    glowMaterial.depthWrite = false
    glowMaterial.toneMapped = false
    val glow = new Mesh(new PlaneGeometry(math.max(1.3, socketWidth * 1.04), 1.27), glowMaterial)
    glow.rotation.x = -math.Pi / 2
    glow.position.y = 0.205
    group.add(glow)
    root.add(group)
    (AnimatedKey(group, cap, label, restY, 0), Glow(glowMaterial, row), legendMaterial)

  private def installPicking(context: RenderContext, model: Model): Unit =
    val raycaster = new Raycaster()
    val pointer = new Vector2()
    var down: Option[(Double, Double)] = None
    context.renderer.domElement.addEventListener("pointerdown", (raw: dom.Event) =>
      val event = raw.asInstanceOf[dom.PointerEvent]
      down = Some((event.clientX, event.clientY))
    )
    context.renderer.domElement.addEventListener("pointerup", (raw: dom.Event) =>
      val event = raw.asInstanceOf[dom.PointerEvent]
      down.foreach { (x, y) =>
        if math.hypot(event.clientX - x, event.clientY - y) <= 5 then
          pointer.x = event.clientX / dom.window.innerWidth * 2 - 1
          pointer.y = -(event.clientY / dom.window.innerHeight) * 2 + 1
          raycaster.setFromCamera(pointer, context.camera)
          raycaster.intersectObjects(model.root.children, true).iterator
            .flatMap(hit => model.pick.get(hit.`object`.id)).take(1).foreach(_.press = 1)
      }
      down = None
    )

  private def deckHeight(z: Double): Double =
    val t = math.max(0, math.min(1, (Depth / 2 - z) / Depth))
    FrontTop + (RearTop - FrontTop) * t + 0.04

  private def taperedGeometry(width: Double, height: Double, depth: Double): BufferGeometry =
    val geometry = new RoundedBoxGeometry(width, height, depth, 2, 0.018)
    val positions = geometry.editable.attributes.position
    (0 until positions.count).foreach { index =>
      val t = math.max(0, math.min(1, positions.getY(index) / height + 0.5))
      val x = positions.getX(index)
      positions.setX(index, math.signum(x) * math.max(0, math.abs(x) - 0.085 * t))
      positions.setZ(index, positions.getZ(index) * (1 - 0.16 * t))
      if t > 0.86 then
        val nx = math.abs(positions.getX(index)) / (width * 0.41)
        val nz = math.abs(positions.getZ(index)) / (depth * 0.42)
        val centerWeight = math.max(0, 1 - math.max(nx, nz))
        positions.setY(index, positions.getY(index) - centerWeight * 0.03)
    }
    positions.needsUpdate = true
    geometry.editable.computeVertexNormals()
    geometry

  private def wedgeGeometry(width: Double, depth: Double, frontBottom: Double, frontTop: Double, rearBottom: Double, rearTop: Double): BufferGeometry =
    val x0 = -width / 2; val x1 = width / 2; val z0 = -depth / 2; val z1 = depth / 2
    val values = js.Array[Double](
      x0,frontBottom,z1, x1,frontBottom,z1, x1,frontTop,z1, x0,frontTop,z1,
      x1,rearBottom,z0, x0,rearBottom,z0, x0,rearTop,z0, x1,rearTop,z0,
      x0,frontBottom,z1, x0,frontTop,z1, x0,rearTop,z0, x0,rearBottom,z0,
      x1,frontBottom,z1, x1,rearBottom,z0, x1,rearTop,z0, x1,frontTop,z1,
      x0,frontTop,z1, x1,frontTop,z1, x1,rearTop,z0, x0,rearTop,z0,
      x0,frontBottom,z1, x0,rearBottom,z0, x1,rearBottom,z0, x1,frontBottom,z1
    )
    val indices = (0 until 6).flatMap(i => Vector(i*4, i*4+1, i*4+2, i*4, i*4+2, i*4+3)).toJSArray
    val geometry = new BufferGeometry()
    geometry.editable.setAttribute("position", new BufferAttribute(new js.typedarray.Float32Array(values.map(_.toFloat)), 3))
    geometry.editable.setIndex(indices)
    geometry.editable.computeVertexNormals()
    geometry

  private def microTexture(): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(256)
    g.fillStyle = "#ecece8"
    g.fillRect(0, 0, 256, 256)
    (0 until 1300).foreach { _ =>
      val light = 220 + math.floor(math.random() * 25).toInt
      g.fillStyle = s"rgba($light,$light,${light - 2},${0.035 + math.random() * 0.05})"
      val size = if math.random() > 0.88 then 2 else 1
      g.fillRect(math.random() * 256, math.random() * 256, size, size)
    }
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = ThreeConstants.RepeatWrappingMode
    texture.wrapT = ThreeConstants.RepeatWrappingMode
    texture.repeat.x = 5
    texture.repeat.y = 2
    texture

  private def radialGlowTexture(): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(96)
    val gradient = g.createRadialGradient(48, 48, 3, 48, 48, 47)
    gradient.addColorStop(0, "rgba(255,255,255,.82)")
    gradient.addColorStop(0.22, "rgba(255,255,255,.48)")
    gradient.addColorStop(0.6, "rgba(255,255,255,.17)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = gradient
    g.fillRect(0, 0, 96, 96)
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture

  private def rearBrandTexture(): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(1024)
    canvas.height = 160
    g.clearRect(0, 0, canvas.width, canvas.height)
    g.save()
    g.translate(275, 0)
    g.fillStyle = "#1f2021"
    g.font = "600 30px Arial, sans-serif"
    g.fillText("MECHANIKE", 88, 62)
    g.font = "600 18px Arial, sans-serif"
    g.fillText("AS COOL AS YOU ARE", 90, 91)
    g.fillRect(360, 29, 10, 77)
    g.font = "900 82px Impact, Arial Black, sans-serif"
    g.fillText("K500", 386, 102)
    (0 until 8).foreach { index =>
      g.save()
      g.translate(90 + index * 35, 120)
      g.rotate(-0.72)
      g.fillRect(0, 0, 9, 39)
      g.restore()
    }
    g.fillRect(386, 123, 358, 11)
    g.restore()
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture

  private def frontBrandTexture(): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(768)
    canvas.height = 144
    g.clearRect(0, 0, canvas.width, canvas.height)
    g.fillStyle = "#242526"
    (0 until 3).foreach { index =>
      g.save()
      g.translate(34 + index * 30, 37)
      g.rotate(0.72)
      g.fillRect(0, 0, 12, 64)
      g.restore()
    }
    g.font = "700 33px Arial, sans-serif"
    g.fillText("MECHANIKE K500", 142, 58)
    g.font = "700 26px Arial, sans-serif"
    g.fillText("MECHANICAL KEYBOARD", 142, 100)
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture

  private def brandPlane(rear: Boolean): Mesh =
    val texture = if rear then rearBrandTexture() else frontBrandTexture()
    val material = MeshBasicMaterial(map = texture)
    material.transparent = true
    material.depthWrite = false
    material.toneMapped = false
    val mesh = new Mesh(new PlaneGeometry(if rear then 7.5 else 4.35, if rear then 1.18 else 0.82), material)
    mesh.name = if rear then "rear-k500-branding" else "front-left-mechanike-branding"
    mesh.position.set(if rear then -4.25 else -5.67, if rear then -0.22 else -0.28, (if rear then -1 else 1) * (Depth / 2 + 0.013))
    if rear then mesh.rotation.y = math.Pi
    mesh

  private def shadowed(mesh: Mesh, name: String): Mesh =
    mesh.name = name
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh

  private def euclideanModulo(n: Double, m: Double): Double = ((n % m) + m) % m
