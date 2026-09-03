package keyboards.q11

enum KeyCode:
  case Empty
  case Named(value: String)

final case class KeyLayers(values: Vector[KeyCode]):
  def at(layer: Int): KeyCode = values.lift(layer).getOrElse(KeyCode.Empty)

object Q11Keymap:
  private val labels = Map(
    "KC_ESCAPE" -> "@escape", "KC_GESC" -> "@escape", "KC_GRAVE" -> "`",
    "KC_TAB" -> "@tab", "KC_LCTRL" -> "@control", "KC_RCTRL" -> "@control",
    "KC_LALT" -> "⌥", "KC_RALT" -> "⌥", "KC_BSPACE" -> "@backspace",
    "KC_ENTER" -> "@return", "KC_RSHIFT" -> "@shift", "KC_SPACE" -> "@space",
    "KC_DELETE" -> "@delete", "KC_HOME" -> "@home", "KC_END" -> "@end",
    "KC_PGUP" -> "@pageUp", "KC_PGDOWN" -> "@pageDown", "KC_UP" -> "@up",
    "KC_DOWN" -> "@down", "KC_LEFT" -> "@left", "KC_RIGHT" -> "@right",
    "KC_MS_U" -> "@mouseUp", "KC_MS_D" -> "@mouseDown", "KC_MS_L" -> "@mouseLeftMove", "KC_MS_R" -> "@mouseRightMove",
    "KC_WH_U" -> "@wheelUp", "KC_WH_D" -> "@wheelDown", "KC_BTN1" -> "@mouseLeft", "KC_BTN2" -> "@mouseRight",
    "USER04" -> "M4", "KC_MINUS" -> "-", "KC_EQUAL" -> "=", "KC_LBRACKET" -> "[",
    "KC_RBRACKET" -> "]", "KC_BSLASH" -> "\\", "KC_SCOLON" -> ";", "KC_QUOTE" -> "'",
    "KC_COMMA" -> ",", "KC_DOT" -> ".", "KC_SLASH" -> "/",
    "KC_MPRV" -> "@prev", "KC_MPLY" -> "@playPause", "KC_MNXT" -> "@next", "KC_MUTE" -> "@mute",
    "KC_VOLD" -> "@volumeDown", "KC_VOLU" -> "@volumeUp", "KC_BRID" -> "@bulbMinus", "KC_BRIU" -> "@bulbPlus",
    "RM_ON" -> "@powerOn", "RM_OFF" -> "@powerOff", "RGB_RMOD" -> "@modePrev", "RGB_MOD" -> "@modeNext"
  )
  private val shifted = Map(
    "KC_GRAVE" -> "~", "KC_1" -> "!", "KC_2" -> "@", "KC_3" -> "#", "KC_4" -> "$",
    "KC_5" -> "%", "KC_6" -> "^", "KC_7" -> "&", "KC_8" -> "*", "KC_9" -> "(",
    "KC_0" -> ")", "KC_MINUS" -> "_", "KC_EQUAL" -> "+", "KC_LBRACKET" -> "{",
    "KC_RBRACKET" -> "}", "KC_BSLASH" -> "|", "KC_SCOLON" -> ":", "KC_QUOTE" -> "\"",
    "KC_COMMA" -> "<", "KC_DOT" -> ">", "KC_SLASH" -> "?"
  )

  def presentation(layers: KeyLayers, layer: Int): (String, String) = layers.at(layer) match
    case KeyCode.Empty => ("", "")
    case KeyCode.Named(code) =>
      val secondary = if layer == 0 then
        shifted.get(code).orElse(layers.values.lift(1).collect { case KeyCode.Named(value) if code.matches("KC_F\\d+") => label(value) }).getOrElse("")
      else shifted.getOrElse(code, "")
      (label(code), secondary)

  def label(code: String): String = labels.getOrElse(code,
    code match
      case value if value.matches("KC_[A-Z0-9]+") => value.stripPrefix("KC_")
      case "LGUI(KC_PGUP)" => "@pageUp"
      case "LGUI(KC_PGDOWN)" => "@pageDown"
      case "LSFT_T(KC_SPACE)" => "⇧␣"
      case "LT1(KC_SPACE)" => "␣1"
      case "LCTL(KC_TAB)" => "⌃⇥"
      case "C_S(KC_TAB)" => "⌃⇧⇥"
      case "LCTL(KC_BSPACE)" => "⌃⌫"
      case "LCTL(KC_LEFT)" => "⌃←"
      case "LCTL(KC_RIGHT)" => "⌃→"
      case "C_S(KC_C)" => "@copy"
      case "C_S(KC_V)" => "@pastePlain"
      case value if value.matches("LGUI\\(KC_[1-4]\\)") => s"⌘${value.filter(_.isDigit)}"
      case value if value.matches("MO\\(\\d\\)") => s"M${value.filter(_.isDigit)}"
      case value if value.matches("DF\\(\\d\\)") => s"@layer${value.filter(_.isDigit)}"
      case value => value.stripPrefix("KC_").replace("(", "").replace(")", "")
  )

  def width(code: String): Double = code match
    case "KC_SPACE" => 1.25
    case "LSFT_T(KC_SPACE)" | "LT1(KC_SPACE)" => 2.75
    case "KC_TAB" => 1.5
    case "KC_GESC" => 2.25
    case "KC_LCTRL" => 1.75
    case "KC_RCTRL" => 1.25
    case "KC_BSPACE" => 2
    case "KC_ENTER" | "KC_RSHIFT" => 2.25
    case "KC_LALT" | "KC_BTN2" | "USER04" | "MO(2)" | "DF(1)" => 1.25
    case _ => 1

  def tone(code: String): String =
    if code == "KC_ESCAPE" || code == "KC_ENTER" then "accent"
    else if code.matches("KC_F\\d+") || code.matches(".*(CTRL|ALT|SHIFT|SPACE|TAB|BSPACE|DELETE|HOME|END|PGUP|PGDOWN|LGUI|BTN|USER|MO\\(|DF\\(|LT1|LSFT_T).*") then "modifier"
    else "alpha"
