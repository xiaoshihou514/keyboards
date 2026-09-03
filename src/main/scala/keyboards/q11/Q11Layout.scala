package keyboards.q11

/** The four Vial layers used by the Q11 model, compiled into the application.
  * `KC_NO` and physical matrix gaps are both represented by [[KeyCode.Empty]].
  */
final case class Q11Layout(layers: Vector[Vector[Vector[KeyCode]]]):
  require(layers.nonEmpty, "Q11 layout must contain at least one layer")
  require(layers.forall(_.length == 12), "Every Q11 layer must contain 12 matrix rows")
  require(layers.forall(_.forall(_.length == 9)), "Every Q11 matrix row must contain 9 columns")

  val layerCount: Int = layers.length

  def baseRow(row: Int): Vector[KeyCode] = layers.head(row)

  def at(layer: Int, row: Int, column: Int): KeyCode =
    layers.lift(layer).flatMap(_.lift(row)).flatMap(_.lift(column)).getOrElse(KeyCode.Empty)

  def keyLayers(row: Int, column: Int): KeyLayers =
    KeyLayers(layers.indices.map(at(_, row, column)).toVector)

object Q11Layout:
  private val X = "-"

  private def row(codes: String*): Vector[KeyCode] = codes.map {
    case X | "KC_NO" => KeyCode.Empty
    case code => KeyCode.Named(code)
  }.toVector

  val default: Q11Layout = Q11Layout(Vector(
    Vector(
      row("KC_MUTE", "KC_ESCAPE", "KC_F1", "KC_F2", "KC_F3", "KC_F4", "KC_F5", "KC_F6", X),
      row("LGUI(KC_1)", "KC_GRAVE", "KC_1", "KC_2", "KC_3", "KC_4", "KC_5", "KC_6", X),
      row("LGUI(KC_2)", "KC_TAB", "KC_Q", "KC_W", "KC_E", X, "KC_R", "KC_T", X),
      row("LGUI(KC_3)", "KC_LCTRL", "KC_A", "KC_S", "KC_D", "KC_F", "KC_G", X, X),
      row("LGUI(KC_4)", X, "KC_GESC", "KC_Z", "KC_X", "KC_C", "KC_V", "KC_B", X),
      row("KC_BTN1", "KC_LALT", "KC_BTN2", "USER04", "KC_SPACE", X, "LSFT_T(KC_SPACE)", X, X),
      row("KC_F7", "KC_F8", "KC_F9", "KC_F10", "KC_F11", "KC_F12", "KC_END", "KC_DELETE", "KC_MUTE"),
      row("KC_7", "KC_8", "KC_9", "KC_0", "KC_MINUS", "KC_EQUAL", "KC_BSPACE", X, "LGUI(KC_PGUP)"),
      row("KC_Y", "KC_U", "KC_I", "KC_O", "KC_P", "KC_LBRACKET", "KC_RBRACKET", "KC_BSLASH", "LGUI(KC_PGDOWN)"),
      row("KC_H", "KC_J", "KC_K", "KC_L", "KC_SCOLON", "KC_QUOTE", X, "KC_ENTER", "KC_HOME"),
      row("KC_N", "KC_M", "KC_COMMA", "KC_DOT", "KC_SLASH", "KC_RSHIFT", X, "KC_UP", X),
      row(X, "LT1(KC_SPACE)", "MO(2)", "DF(1)", "KC_RCTRL", X, "KC_LEFT", "KC_DOWN", "KC_RIGHT")
    ),
    Vector(
      row(X, X, "KC_BRID", "KC_BRIU", "RM_ON", "RM_OFF", "RGB_RMOD", "RGB_MOD", X),
      row(X, X, X, X, X, X, X, X, X),
      row(X, "LCTL(KC_TAB)", X, "LCTL(KC_BSPACE)", "KC_END", X, X, X, X),
      row(X, X, "KC_HOME", X, X, "KC_RIGHT", X, X, X),
      row(X, X, X, X, X, "C_S(KC_C)", "C_S(KC_V)", "KC_LEFT", X),
      row(X, X, X, X, X, X, X, X, X),
      row("KC_MPRV", "KC_MPLY", "KC_MNXT", "KC_MUTE", "KC_VOLD", "KC_VOLU", X, X, X),
      row(X, X, X, X, X, X, X, X, X),
      row(X, X, X, X, "KC_UP", X, X, X, X),
      row("KC_BSPACE", "KC_PGDOWN", "KC_PGUP", X, X, X, X, X, X),
      row("KC_DOWN", X, X, X, X, X, X, "KC_MS_U", X),
      row(X, X, X, "DF(2)", X, X, "KC_MS_L", "KC_MS_D", "KC_MS_R")
    ),
    Vector(
      row(X, X, X, X, X, X, X, X, X),
      row(X, X, X, X, X, X, X, X, X),
      row(X, "C_S(KC_TAB)", X, "KC_UP", "KC_WH_D", X, X, X, X),
      row(X, X, "KC_LEFT", "KC_DOWN", "KC_RIGHT", "LCTL(KC_RIGHT)", X, X, X),
      row(X, X, "KC_ESCAPE", X, X, X, X, "LCTL(KC_LEFT)", X),
      row("KC_ENTER", X, X, X, X, X, X, X, X),
      row(X, X, X, X, X, X, X, X, X),
      row(X, X, X, X, X, X, X, X, X),
      row("KC_WH_U", X, X, X, X, X, X, X, X),
      row(X, X, X, X, X, X, X, X, X),
      row(X, X, X, X, X, X, X, X, X),
      row(X, X, X, "DF(0)", X, X, X, X, X)
    ),
    Vector.fill(12)(row(X, X, X, X, X, X, X, X, X))
  ))
