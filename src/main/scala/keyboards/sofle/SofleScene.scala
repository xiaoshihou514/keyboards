package keyboards.sofle

import scala.collection.mutable
import scala.scalajs.js
import scala.scalajs.js.JSConverters.*
import org.scalajs.dom
import THREE.*
import keyboards.three.*
import keyboards.three.TypedAccess.*

object SofleScene:
  private val CapHeight = 4.6
  private val CapSize = 16.2
  private val CapTop = 14.0

  final case class KeyState(
      data: SofleKey,
      group: Group,
      cap: Mesh,
      stem: Group,
      legend: Mesh,
      legendMaterial: MeshBasicMaterial,
      led: MeshBasicMaterial,
      spill: MeshBasicMaterial,
      capGlow: MeshBasicMaterial,
      restCapY: Double,
      restStemY: Double,
      restLegendY: Double,
      waveX: Double,
      var press: Double
  )

  def start(): Unit =
    val options = PageOptions.current()
    val context = SceneRuntime.create(options, SceneConfig(
      title = "可交互的三维键盘模型",
      fov = 42, far = 200, exposure = 1.05, pixelRatios = PixelRatios(1.0, 2),
      background = 0x07070b, flatBackground = 0x07070b, fogNear = 30, fogFar = 90,
      environmentSigma = 0.04, environmentIntensity = 0.36,
      cameraPosition = Vec3(0, 16.5, 15.5), controlTarget = Vec3(0, 0.5, 1.2),
      damping = 0.06, maxPolarRatio = 0.49, minDistance = 6, maxDistance = 50,
      bloom = BloomConfig(0.74, 0.74, 0.58, 0.5)
    ))
    SceneRuntime.addLights(context, LightingConfig(
      0xffffff, 1.25, Vec3(6, 14, 8), 512, 2048, 16, -0.0004,
      0x9d8fd0, 0x0a0a12, 0.18, 0x8855ff, 0.55, Vec3(-8, 6, -10)
    ))
    SceneRuntime.addGround(context, GroundConfig(
      60, 64, -1.35, 0x0b0b12, 0x0b0b12, 0.85, 0.2,
      120, 120, 0x2a1f4a, 0x161226, 0.35
    ))
    val (board, keys) = buildKeyboard()
    context.scene.add(board)
    val byCode = keys.flatMap(key => key.data.code.map(_ -> key)).toMap
    var currentLayer = requested("layer", 0, 2)
    var rgbMode = requested("rgb", 0, 3)
    var enabled = true
    var brightness = 1.3
    val legends = new SofleLegendFactory()
    def setLayer(value: Int): Unit =
      currentLayer = math.max(0, math.min(2, value))
      keys.foreach { key =>
        val value = key.data.layers(currentLayer)
        key.legendMaterial.map = legends(value.main, value.sub)
        key.legendMaterial.updates.needsUpdate = true
      }
    def action(key: KeyState): Unit =
      val label = key.data.layers(currentLayer)
      if label.main.matches("TO[0-2]") then setLayer(label.main.last.asDigit)
      else if label.main == "UG" then label.sub match
        case "Tog" => enabled = !enabled
        case "Next" => rgbMode = (rgbMode + 1) % 4
        case "Prev" => rgbMode = (rgbMode + 3) % 4
        case "Bri+" => brightness = math.min(2, brightness + 0.2)
        case "Bri-" => brightness = math.max(0.2, brightness - 0.2)
        case _ => ()
    setLayer(currentLayer)
    installInput(context, keys, byCode, action)
    val color = new Color()
    SceneRuntime.animate(context) { elapsed =>
      val time = if options.shot then 3.7 else elapsed
      val pulse = rgbMode match
        case 0 => 0.18 + (math.sin(time * 1.45) + 1) * 0.41
        case 3 => 0.35 + (math.sin(time * 2.6) + 1) * 0.32
        case _ => 0.86
      keys.foreach { key =>
        if key.press > 0 then
          key.press = math.max(0, key.press - 0.07)
          val offset = math.sin(math.min(key.press, 1) * math.Pi) * 1.8
          key.cap.position.y = key.restCapY - offset
          key.stem.position.y = key.restStemY - offset
          key.legend.position.y = key.restLegendY - offset
        if !enabled then
          key.led.opacity = 0; key.spill.opacity = 0; key.capGlow.opacity = 0
        else
          val hue = if rgbMode == 0 then key.waveX * 0.0048 + 0.62
            else if rgbMode == 1 then key.waveX * 0.008 - time * 0.18 + 0.62
            else 0.48
          color.setHSL(euclideanModulo(hue,1), if rgbMode >= 2 then 0.9 else 0.94, 0.58)
          key.led.color.copy(color).multiplyScalar(brightness * (1.45 + pulse * 0.65))
          key.led.opacity = math.min(0.7, brightness * (0.34 + pulse * 0.22))
          key.spill.color.copy(color).multiplyScalar(brightness * (0.55 + pulse * 0.3))
          key.spill.opacity = math.min(0.4, brightness * (0.075 + pulse * 0.085))
          key.capGlow.color.copy(color).multiplyScalar(brightness * (1 + pulse * 0.25))
          key.capGlow.opacity = math.min(0.82, brightness * (0.36 + pulse * 0.2))
      }
    }

  private def buildKeyboard(): (Group, Vector[KeyState]) =
    val shellMaterial = MeshStandardMaterial(color = 0x17181a, roughness = 0.92, metalness = 0.05)
    shellMaterial.bumpMap = makePrintBump()
    shellMaterial.bumpScale = 0.5
    shellMaterial.environment.envMapIntensity = 0.4
    val plateauMaterial = MeshStandardMaterial(color = 0x35383f, roughness = 0.66, metalness = 0.07)
    val capMaterial = MeshPhysicalMaterial(color = 0xffffff, roughness = 0.2, metalness = 0, transmission = 0.9, thickness = 1.4, ior = 1.46, clearcoat = 0.75, clearcoatRoughness = 0.18)
    capMaterial.transparent = true; capMaterial.opacity = 0.78; capMaterial.depthWrite = false
    val housingMaterial = MeshPhysicalMaterial(color = 0x3a3340, roughness = 0.35, transmission = 0.55, thickness = 2)
    val stemMaterial = MeshStandardMaterial(color = 0x6e35ad, roughness = 0.32, metalness = 0)
    val cavityMaterial = MeshStandardMaterial(color = 0x24102f, roughness = 0.5, metalness = 0)
    val board = new Group()
    board.rotation.x = math.toRadians(-4)
    board.scale.set(0.1, 0.1, 0.1)
    val keys = mutable.ArrayBuffer.empty[KeyState]
    val legends = new SofleLegendFactory()
    val glowTexture = switchGlowTexture()
    val brassMaterial = MeshStandardMaterial(color = 0xc9a04e, roughness = 0.35, metalness = 0.95)
    Vector("left" -> SofleLayout.left, "right" -> SofleLayout.right).foreach { (side, data) =>
      val mirror = side == "right"
      val half = new Group()
      half.name = side
      buildCase(half, mirror, shellMaterial, plateauMaterial, brassMaterial)
      data.foreach(key => keys += makeKey(half, key, mirror, capMaterial, housingMaterial, stemMaterial, cavityMaterial, legends, glowTexture))
      val center = new Box3().setFromObject(half).getCenter(new Vector3())
      half.position.set(-center.x.getOrElse(0.0), -center.y.getOrElse(0.0), -center.z.getOrElse(0.0))
      val wrapper = new Group()
      wrapper.add(half)
      wrapper.rotation.y = math.toRadians(if mirror then 6 else -6)
      wrapper.position.set(if mirror then 92 else -92, 0, -4)
      board.add(wrapper)
    }
    (board, keys.toVector)

  private def buildCase(parent: Group, mirror: Boolean, shell: Material, plateau: Material, brass: Material): Unit =
    def mirrored(points: Vector[(Double,Double)]): Vector[(Double,Double)] = points.map { (x,y) =>
      ((if mirror then 6 * SofleLayout.Unit - x * SofleLayout.Unit else x * SofleLayout.Unit), y * SofleLayout.Unit)
    }
    val body = extruded(mirrored(SofleLayout.caseOutline), 5.5, bevel = true, shell, 0.16 * SofleLayout.Unit)
    body.geometry.asInstanceOf[BufferGeometry].translate(0, -1.6, 0)
    parent.add(body)
    val raised = extruded(mirrored(SofleLayout.plateau), 4.4, bevel = false, shell, 0.06 * SofleLayout.Unit)
    raised.geometry.asInstanceOf[BufferGeometry].translate(0, 4.4, 0)
    parent.add(raised)
    val cover = Vector((6.05,-0.05),(7.02,-0.05),(7.02,4.341),(6.05,3.88))
    val plate = extruded(mirrored(cover), 0.24, bevel = false, plateau, 0.02 * SofleLayout.Unit)
    plate.geometry.asInstanceOf[BufferGeometry].translate(0, 4.435, 0)
    parent.add(plate)
    val insert = new Mesh(new CylinderGeometry(2.1, 2.1, 1.2, 24), brass)
    insert.position.set(if mirror then 6 * SofleLayout.Unit - 6.2 * SofleLayout.Unit else 6.2 * SofleLayout.Unit, 0.35, 4.17 * SofleLayout.Unit)
    parent.add(insert)

  private def extruded(points: Vector[(Double,Double)], depth: Double, bevel: Boolean, material: Material, cornerRadius: Double): Mesh =
    val shape = roundedPoly(points, cornerRadius)
    val options = (new js.Object).asInstanceOf[ExtrudeOptions]
    options.depth = depth; options.bevelEnabled = bevel; options.bevelSegments = if bevel then 2 else 0
    options.bevelThickness = if bevel then 1.6 else 0; options.bevelSize = if bevel then 1.6 else 0; options.curveSegments = 2
    val geometry = new ExtrudeGeometry(shape, options)
    geometry.rotateX(math.Pi / 2)
    val mesh = new Mesh(geometry, material)
    mesh.castShadow = true; mesh.receiveShadow = true
    mesh

  private def makeKey(
      parent: Group, data: SofleKey, mirror: Boolean, capMaterial: Material, housingMaterial: Material,
      stemMaterial: Material, cavityMaterial: Material, legends: SofleLegendFactory, glowTexture: Texture
  ): KeyState =
    val group = new Group()
    val x = data.x * SofleLayout.Unit; val z = data.y * SofleLayout.Unit
    group.position.set(x, 0.4, z)
    group.rotation.y = math.toRadians(-data.rotation)
    val ledMaterial = glowMaterial(glowTexture, 0.9, AdditiveBlending)
    val led = new Mesh(new PlaneGeometry(5.8,5.8), ledMaterial)
    led.rotation.x = -math.Pi/2; led.position.y = 3.58; group.add(led)
    val spillMaterial = glowMaterial(glowTexture, 0.3, AdditiveBlending)
    val spill = new Mesh(new PlaneGeometry(17.8,17.8), spillMaterial)
    spill.rotation.x = -math.Pi/2; spill.position.y = 0.12; group.add(spill)
    val housing = new Mesh(new RoundedBoxGeometry(13,3.2,13,2,0.7), housingMaterial)
    housing.position.y = 1.9; group.add(housing)
    val stem = chocStem(stemMaterial, cavityMaterial)
    stem.position.y = 4.1; group.add(stem)
    val cap = new Mesh(capGeometry(), capMaterial)
    cap.position.y = 4.3; group.add(cap)
    val capGlowMaterial = glowMaterial(glowTexture, 0, NormalBlending)
    val capGlow = new Mesh(new PlaneGeometry(11.8,11.8), capGlowMaterial)
    capGlow.rotation.x = -math.Pi/2; capGlow.position.y = 4.3 + CapHeight - 0.2; capGlow.renderOrder = 3; group.add(capGlow)
    val first = data.layers.head
    val legendMaterial = MeshBasicMaterial(map = legends(first.main, first.sub))
    legendMaterial.transparent = true; legendMaterial.depthWrite = false
    val legend = new Mesh(new PlaneGeometry(12.6,12.6), legendMaterial)
    legend.rotation.x = -math.Pi/2; legend.position.y = 4.3 + CapHeight + 0.18; legend.renderOrder = 4; group.add(legend)
    parent.add(group)
    KeyState(data, group, cap, stem, legend, legendMaterial, ledMaterial, spillMaterial, capGlowMaterial,
      cap.position.y.asInstanceOf[Double], stem.position.y.asInstanceOf[Double], legend.position.y.asInstanceOf[Double], if mirror then x else x - 7*SofleLayout.Unit, 0)

  private def glowMaterial(texture: Texture, opacity: Double, blending: Int): MeshBasicMaterial =
    val material = MeshBasicMaterial(map = texture)
    material.color.setHex(0x9933ff); material.transparent = true; material.opacity = opacity
    material.blending = blending; material.depthWrite = false; material.toneMapped = false
    material

  private def capGeometry(): BufferGeometry =
    val shape = new Shape()
    val half = CapTop / 2
    val radius = 3.0
    shape.moveTo(-half + radius, -half)
    shape.lineTo(half - radius, -half); shape.quadraticCurveTo(half, -half, half, -half + radius)
    shape.lineTo(half, half - radius); shape.quadraticCurveTo(half, half, half - radius, half)
    shape.lineTo(-half + radius, half); shape.quadraticCurveTo(-half, half, -half, half - radius)
    shape.lineTo(-half, -half + radius); shape.quadraticCurveTo(-half, -half, -half + radius, -half)
    val options = (new js.Object).asInstanceOf[ExtrudeOptions]
    options.depth = CapHeight
    options.bevelEnabled = false
    options.curveSegments = 6
    val geometry = new ExtrudeGeometry(shape, options)
    geometry.rotateX(-math.Pi / 2)
    val positions = geometry.editable.attributes.position
    val taper = CapSize / CapTop - 1
    (0 until positions.count).foreach { index =>
      val factor = 1 + taper * (1 - positions.getY(index) / CapHeight)
      positions.setX(index, positions.getX(index) * factor)
      positions.setZ(index, positions.getZ(index) * factor)
    }
    positions.needsUpdate = true; geometry.editable.computeVertexNormals(); geometry

  private def chocStem(material: Material, cavity: Material): Group =
    val group = new Group()
    def box(w:Double,h:Double,d:Double,x:Double,y:Double,z:Double,mat:Material=material): Unit =
      val part = new Mesh(new RoundedBoxGeometry(w,h,d,1,0.24),mat); part.position.set(x,y,z); group.add(part)
    box(1.45,2.2,5.2,-3.675,0,0); box(1.45,2.2,5.2,3.675,0,0); box(1.9,2.45,4.45,0,0.12,-0.08)
    box(8.8,2.05,0.95,0,-0.06,-2.2); box(8.8,1.15,0.8,0,-0.5,2.2)
    box(1.78,0.32,3.15,-1.91,-0.91,0,cavity); box(1.78,0.32,3.15,1.91,-0.91,0,cavity)
    box(2.4,0.52,1.16,0,0.85,2.8); box(2.4,0.34,1.16,0,-0.82,2.8)
    box(0.44,1.55,1.16,-0.98,0,2.8); box(0.44,1.55,1.16,0.98,0,2.8)
    group

  private def roundedPoly(points: Vector[(Double, Double)], radius: Double): Shape =
    val shape = new Shape()
    val count = points.length
    points.indices.foreach { index =>
      val p0 = points((index + count - 1) % count)
      val p1 = points(index)
      val p2 = points((index + 1) % count)
      val d1x = p1._1 - p0._1; val d1y = p1._2 - p0._2
      val d2x = p2._1 - p1._1; val d2y = p2._2 - p1._2
      val l1 = math.hypot(d1x, d1y); val l2 = math.hypot(d2x, d2y)
      val ax = p1._1 - d1x / l1 * radius; val ay = p1._2 - d1y / l1 * radius
      val bx = p1._1 + d2x / l2 * radius; val by = p1._2 + d2y / l2 * radius
      if index == 0 then shape.moveTo(ax, ay) else shape.lineTo(ax, ay)
      shape.quadraticCurveTo(p1._1, p1._2, bx, by)
    }
    shape

  private def switchGlowTexture(): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(128)
    val gradient = g.createRadialGradient(64, 64, 4, 64, 64, 62)
    gradient.addColorStop(0, "rgba(255,255,255,1)")
    gradient.addColorStop(0.45, "rgba(255,255,255,0.55)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = gradient; g.fillRect(0, 0, 128, 128)
    new CanvasTexture(canvas)

  private def makePrintBump(): CanvasTexture =
    val (canvas, g) = TypedAccess.canvas2d(512)
    g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512)
    (0 until 512 by 3).foreach { y =>
      val value = 118 + math.random() * 22
      g.fillStyle = s"rgb($value,$value,$value)"; g.fillRect(0, y, 512, 1.4)
    }
    (0 until 9000).foreach { _ =>
      val value = 100 + math.random() * 60
      g.fillStyle = s"rgba($value,$value,$value,0.5)"; g.fillRect(math.random() * 512, math.random() * 512, 1.3, 1.3)
    }
    val texture = new CanvasTexture(canvas)
    texture.wrapS = ThreeConstants.RepeatWrappingMode; texture.wrapT = ThreeConstants.RepeatWrappingMode
    texture.repeat.x = 3; texture.repeat.y = 3
    texture

  private def installInput(context: RenderContext, keys: Vector[KeyState], byCode: Map[String,KeyState], action: KeyState => Unit): Unit =
    dom.window.addEventListener("keydown", (raw: dom.Event) => byCode.get(raw.asInstanceOf[dom.KeyboardEvent].code).foreach(key => {key.press=1;action(key)}))
    val ray = new Raycaster(); val pointer = new Vector2(); var down = Option.empty[(Double,Double)]
    val caps = keys.map(_.cap); val lookup = keys.map(key => key.cap.id -> key).toMap
    context.renderer.domElement.addEventListener("pointerdown", (raw: dom.Event) => { val e=raw.asInstanceOf[dom.PointerEvent]; down=Some(e.clientX->e.clientY) })
    context.renderer.domElement.addEventListener("pointerup", (raw: dom.Event) =>
      val e=raw.asInstanceOf[dom.PointerEvent]
      down.filter((x,y)=>math.hypot(e.clientX-x,e.clientY-y)<=6).foreach { _ =>
        pointer.x = e.clientX / dom.window.innerWidth * 2 - 1
        pointer.y = -(e.clientY / dom.window.innerHeight) * 2 + 1
        ray.setFromCamera(pointer,context.camera)
        ray.intersectObjects(caps.toJSArray,false).headOption.flatMap(hit=>lookup.get(hit.`object`.id)).foreach(key=>{key.press=1;action(key)})
      }
      down=None
    )

  private def requested(name:String,min:Int,max:Int): Int =
    val params=new dom.URLSearchParams(dom.window.location.search)
    Option(params.get(name)).flatMap(_.toIntOption).map(value=>math.max(min,math.min(max,value))).getOrElse(min)

  private def euclideanModulo(n: Double, m: Double): Double = ((n % m) + m) % m
