package keyboards.k500

final case class KeyLegend(primary: String, secondary: String = "", width: Double = 1.0, corner: String = "")

object K500Layout:
  val rows: Vector[Vector[KeyLegend]] = Vector(
    Vector(
      KeyLegend("Esc"), KeyLegend("▣", "F1"), KeyLegend("⌕", "F2"), KeyLegend("▤", "F3"),
      KeyLegend("⌨", "F4"), KeyLegend("|◀", "F5"), KeyLegend("▶|", "F6"), KeyLegend("▶Ⅱ", "F7"),
      KeyLegend("■", "F8"), KeyLegend("◖×", "F9"), KeyLegend("◖−", "F10"), KeyLegend("◖+", "F11"),
      KeyLegend("▣", "F12"), KeyLegend("PrtSc"), KeyLegend("Pause"), KeyLegend("Del")
    ),
    Vector(
      KeyLegend("`", "~"), KeyLegend("1", "!", corner = "L1"), KeyLegend("2", "@", corner = "L2"),
      KeyLegend("3", "#", corner = "L3"), KeyLegend("4", "$", corner = "L4"), KeyLegend("5", "%", corner = "L5"),
      KeyLegend("6", "^", corner = "L6"), KeyLegend("7", "&", corner = "L7"), KeyLegend("8", "*", corner = "L8"),
      KeyLegend("9", "(", corner = "LR1"), KeyLegend("0", ")", corner = "LR2"), KeyLegend("-", "_"),
      KeyLegend("=", "+"), KeyLegend("←", width = 2), KeyLegend("Home", corner = "LR")
    ),
    Vector(
      KeyLegend("Tab", width = 1.5), KeyLegend("Q"), KeyLegend("W"), KeyLegend("E"), KeyLegend("R"), KeyLegend("T"),
      KeyLegend("Y"), KeyLegend("U"), KeyLegend("I"), KeyLegend("O"), KeyLegend("P"), KeyLegend("[", "{", corner = "Ins"),
      KeyLegend("]", "}", corner = "ScrLk"), KeyLegend("\\", "|", width = 1.5), KeyLegend("End", corner = "S")
    ),
    Vector(
      KeyLegend("CapsLk", width = 1.75), KeyLegend("A"), KeyLegend("S"), KeyLegend("D"), KeyLegend("F"), KeyLegend("G"),
      KeyLegend("H"), KeyLegend("J"), KeyLegend("K"), KeyLegend("L"), KeyLegend(";", ":"), KeyLegend("'", "\""),
      KeyLegend("↵", width = 2.25), KeyLegend("PgUp")
    ),
    Vector(
      KeyLegend("Shift", width = 2.25), KeyLegend("Z"), KeyLegend("X"), KeyLegend("C"), KeyLegend("V"), KeyLegend("B"),
      KeyLegend("N"), KeyLegend("M"), KeyLegend(",", "<"), KeyLegend(".", ">"), KeyLegend("/", "?"),
      KeyLegend("Shift", width = 1.75), KeyLegend("↑"), KeyLegend("PgDn")
    ),
    Vector(
      KeyLegend("Ctrl", width = 1.25), KeyLegend("Win", width = 1.25), KeyLegend("Alt", width = 1.25),
      KeyLegend("▬", width = 6.25), KeyLegend("Alt"), KeyLegend("FN"), KeyLegend("Ctrl"),
      KeyLegend("←"), KeyLegend("↓"), KeyLegend("→")
    )
  )
