package keyboards.sofle

final case class Legend(main: String, sub: String = "")
final case class SofleKey(x: Double, y: Double, rotation: Double, code: Option[String], layers: Vector[Legend])

object SofleLayout:
  val Unit = 17.5
  val caseOutline = Vector(
    (-0.35,-0.35),(7.25,-0.35),(7.25,4.45),(7.45,4.95),(7.10,5.55),
    (5.70,5.05),(4.70,4.90),(2.70,4.80),(0.40,4.30),(-0.35,3.95)
  )
  val plateau = Vector((6.05,-0.35),(7.25,-0.35),(7.25,4.45),(6.05,3.88))

  private val staggerLeft = Vector(0.0, 0.0, -0.4, -0.6, -0.3, -0.2)
  private val staggerRight = Vector(-0.2, -0.3, -0.6, -0.4, 0.0, 0.0)

  private def legends(rows: String*): Vector[Vector[Legend]] = rows.toVector.map { row =>
    row.split("¦", -1).toVector.map { item =>
      val parts = item.split("~", -1)
      Legend(parts.headOption.getOrElse(""), parts.lift(1).getOrElse(""))
    }
  }

  private val leftLayers = Vector(
    legends("`~¦1!¦2@¦3#¦4$¦5%", "Tab¦Q¦W¦E¦R¦T", "Ctrl¦A¦S¦D¦F¦G", "Esc¦Z¦X¦C¦V¦B"),
    legends("UG~Tog¦F1¦F2¦F3¦F4¦F5", "LC~Tab¦¦LC~Bksp¦End¦¦", "UG~Next¦¦¦Home¦→¦", "UG~Prev¦¦¦LC+LS~(C)¦LC+LS~(V)¦←"),
    legends("BT~CLR¦F21¦F20¦¦¦", "¦¦↑¦¦¦", "¦←¦↓¦→¦LC~(→)¦", "Esc¦¦¦¦¦LC~(←)")
  )
  private val rightLayers = Vector(
    legends("6^¦7&¦8*¦9(¦0)¦Bksp", "Y¦U¦I¦O¦P¦\\|", "H¦J¦K¦L¦;:¦'\"", "N¦M¦,<¦.>¦/?¦TO1"),
    legends("F6¦F7¦F8¦F9¦F10¦F11", "¦¦-_¦=+¦↑¦F12", "Bksp¦PgDn¦PgUp¦[{¦]}¦", "↓¦¦¦¦¦TO2"),
    legends("⏮¦⏯¦⏭¦⏄¦Vol-¦Vol+", "¦¦¦¦¦", "¦¦¦¦¦", "¦¦¦¦¦TO0")
  )

  private val codesLeft = Vector(
    Vector("Backquote","Digit1","Digit2","Digit3","Digit4","Digit5"),
    Vector("Tab","KeyQ","KeyW","KeyE","KeyR","KeyT"),
    Vector("ControlLeft","KeyA","KeyS","KeyD","KeyF","KeyG"),
    Vector("Escape","KeyZ","KeyX","KeyC","KeyV","KeyB")
  )
  private val codesRight = Vector(
    Vector("Digit6","Digit7","Digit8","Digit9","Digit0","Backspace"),
    Vector("KeyY","KeyU","KeyI","KeyO","KeyP","Backslash"),
    Vector("KeyH","KeyJ","KeyK","KeyL","Semicolon","Quote"),
    Vector("KeyN","KeyM","Comma","Period","Slash","")
  )

  val left: Vector[SofleKey] = grid(staggerLeft, leftLayers, codesLeft) ++ Vector(
    extra(2.5,4.1,0,None, Legend("LCLK"),Legend("UG","Bri+")),
    extra(3.5,3.9,0,None, Legend("RCLK"),Legend("UG","Bri-")),
    extra(4.5,4.2,0,Some("ArrowUp"), Legend("Ctrl")),
    extra(5.55,4.35,14,Some("MetaLeft"), Legend("⊞")),
    extra(6.5,4.8,30,Some("Space"), Legend("Spc"))
  )
  val right: Vector[SofleKey] = grid(staggerRight, rightLayers, codesRight) ++ Vector(
    extra(1.5,4.2,0,None, Legend("M2")),
    extra(2.5,3.9,0,Some("ShiftRight"), Legend("⇧")),
    extra(3.5,4.1,0,Some("Delete"), Legend("Del")),
    extra(-0.5,4.8,-30,None, Legend("M1")),
    extra(0.45,4.35,-14,Some("Enter"), Legend("Enter"))
  )

  private def grid(stagger: Vector[Double], layerRows: Vector[Vector[Vector[Legend]]], codes: Vector[Vector[String]]): Vector[SofleKey] =
    for
      row <- (0 until 4).toVector
      column <- (0 until 6).toVector
    yield SofleKey(
      column + 0.5,
      row + stagger(column) + 0.5,
      0,
      Option(codes(row)(column)).filter(_.nonEmpty),
      layerRows.map(layer => layer(row)(column))
    )

  private def extra(x: Double, y: Double, rotation: Double, code: Option[String], values: Legend*): SofleKey =
    SofleKey(x, y, rotation, code, values.toVector.padTo(3, Legend("")))
