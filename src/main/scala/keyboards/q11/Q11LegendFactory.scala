package keyboards.q11

import scala.collection.mutable
import org.scalajs.dom
import THREE.*
import keyboards.three.TypedAccess.canvas2d

/** Literal Scala port of q11-main.js' canvas legend renderer. */
final class Q11LegendFactory:
  private val cache = mutable.Map.empty[String, CanvasTexture]
  private val Ink = "#f7f3e9"

  def apply(primary: String, secondary: String = ""): CanvasTexture =
    cache.getOrElseUpdate(s"$primary|$secondary", draw(primary, secondary))

  private def draw(primary: String, secondary: String): CanvasTexture =
    val (canvas, g) = canvas2d(256)
    g.clearRect(0, 0, 256, 256)
    g.fillStyle = Ink
    g.textAlign = "center"
    g.textBaseline = "middle"
    val primarySize = if primary.length > 7 then 48 else if primary.length > 4 then 60 else 88
    if primary.startsWith("@") then
      symbol(g, primary.drop(1), 128, if secondary.nonEmpty then 102 else 128, if secondary.nonEmpty then 82 else 106)
      if secondary.nonEmpty then
        if secondary.startsWith("@") then symbol(g, secondary.drop(1), 128, 198, 48)
        else
          g.font = "700 50px Inter, Arial, sans-serif"
          g.fillText(secondary, 128, 198)
    else if secondary.startsWith("@") then
      symbol(g, secondary.drop(1), 128, 69, 72)
      g.font = s"700 ${primarySize}px Inter, Arial, sans-serif"
      g.fillText(primary, 128, 164)
    else if secondary.nonEmpty then
      val secondarySize = if secondary.length > 5 then 50 else 68
      g.font = s"700 ${secondarySize}px Inter, Arial, sans-serif"
      g.fillText(secondary, 128, 69)
      g.font = s"700 ${primarySize}px Inter, Arial, sans-serif"
      g.fillText(primary, 128, 164)
    else
      g.font = s"700 ${primarySize}px Inter, Arial, sans-serif"
      g.fillText(primary, 128, 130)
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture

  private def symbol(g: dom.CanvasRenderingContext2D, name: String, cx: Double, cy: Double, size: Double): Unit =
    val half = size / 2
    g.strokeStyle = Ink
    g.fillStyle = Ink
    g.lineWidth = size * 0.13
    g.lineCap = "round"
    g.lineJoin = "round"

    def triangle(direction: Double): Unit =
      g.beginPath()
      g.moveTo(cx + direction * half * 0.68, cy)
      g.lineTo(cx - direction * half * 0.42, cy - half * 0.62)
      g.lineTo(cx - direction * half * 0.42, cy + half * 0.62)
      g.closePath()
      g.fill()

    def arrow(dx: Double, dy: Double, scale: Double = 1): Unit =
      val length = half * 0.78 * scale
      val head = half * 0.42 * scale
      val endX = cx + dx * length
      val endY = cy + dy * length
      val sideX = -dy
      val sideY = dx
      g.beginPath()
      g.moveTo(cx - dx * length, cy - dy * length)
      g.lineTo(endX, endY)
      g.lineTo(endX - dx * head + sideX * head * 0.58, endY - dy * head + sideY * head * 0.58)
      g.moveTo(endX, endY)
      g.lineTo(endX - dx * head - sideX * head * 0.58, endY - dy * head - sideY * head * 0.58)
      g.stroke()

    def plusMinus(x: Double, sign: Int): Unit =
      g.beginPath()
      g.moveTo(x - half * 0.25, cy)
      g.lineTo(x + half * 0.25, cy)
      if sign > 0 then
        g.moveTo(x, cy - half * 0.25)
        g.lineTo(x, cy + half * 0.25)
      g.stroke()

    def speaker(): Unit =
      g.beginPath()
      g.moveTo(cx - half * 0.86, cy - half * 0.24)
      g.lineTo(cx - half * 0.52, cy - half * 0.24)
      g.lineTo(cx - half * 0.16, cy - half * 0.6)
      g.lineTo(cx - half * 0.16, cy + half * 0.6)
      g.lineTo(cx - half * 0.52, cy + half * 0.24)
      g.lineTo(cx - half * 0.86, cy + half * 0.24)
      g.closePath()
      g.fill()

    name match
      case "up" | "mouseUp" => arrow(0, -1)
      case "down" | "mouseDown" => arrow(0, 1)
      case "left" | "mouseLeftMove" => arrow(-1, 0)
      case "right" | "mouseRightMove" => arrow(1, 0)
      case "tab" =>
        g.beginPath()
        g.moveTo(cx - half * 0.92, cy - half * 0.48); g.lineTo(cx + half * 0.54, cy - half * 0.48); g.lineTo(cx + half * 0.2, cy - half * 0.76)
        g.moveTo(cx + half * 0.92, cy + half * 0.48); g.lineTo(cx - half * 0.54, cy + half * 0.48); g.lineTo(cx - half * 0.2, cy + half * 0.76)
        g.moveTo(cx - half * 0.92, cy - half * 0.8); g.lineTo(cx - half * 0.92, cy - half * 0.16)
        g.moveTo(cx + half * 0.92, cy + half * 0.16); g.lineTo(cx + half * 0.92, cy + half * 0.8)
        g.stroke()
      case "escape" =>
        g.beginPath(); g.arc(cx, cy, half * 0.72, -math.Pi * 0.18, math.Pi * 1.48); g.stroke()
        g.beginPath(); g.moveTo(cx + half * 0.16, cy + half * 0.12); g.lineTo(cx - half * 0.58, cy - half * 0.58); g.lineTo(cx - half * 0.14, cy - half * 0.52)
        g.moveTo(cx - half * 0.58, cy - half * 0.58); g.lineTo(cx - half * 0.54, cy - half * 0.14); g.stroke()
      case "backspace" | "delete" =>
        val direction = if name == "backspace" then -1.0 else 1.0
        g.beginPath(); g.moveTo(cx - direction * half * 0.9, cy); g.lineTo(cx - direction * half * 0.46, cy - half * 0.62)
        g.lineTo(cx + direction * half * 0.88, cy - half * 0.62); g.lineTo(cx + direction * half * 0.88, cy + half * 0.62)
        g.lineTo(cx - direction * half * 0.46, cy + half * 0.62); g.closePath(); g.stroke()
        g.beginPath(); g.moveTo(cx - half * 0.18, cy - half * 0.25); g.lineTo(cx + half * 0.34, cy + half * 0.25)
        g.moveTo(cx + half * 0.34, cy - half * 0.25); g.lineTo(cx - half * 0.18, cy + half * 0.25); g.stroke()
      case "return" =>
        g.beginPath(); g.moveTo(cx + half * 0.74, cy - half * 0.72); g.lineTo(cx + half * 0.74, cy + half * 0.12)
        g.quadraticCurveTo(cx + half * 0.74, cy + half * 0.55, cx + half * 0.3, cy + half * 0.55)
        g.lineTo(cx - half * 0.72, cy + half * 0.55); g.lineTo(cx - half * 0.35, cy + half * 0.22)
        g.moveTo(cx - half * 0.72, cy + half * 0.55); g.lineTo(cx - half * 0.35, cy + half * 0.88); g.stroke()
      case "shift" =>
        g.beginPath(); g.moveTo(cx, cy - half * 0.92); g.lineTo(cx + half * 0.78, cy - half * 0.02); g.lineTo(cx + half * 0.34, cy - half * 0.02)
        g.lineTo(cx + half * 0.34, cy + half * 0.86); g.lineTo(cx - half * 0.34, cy + half * 0.86); g.lineTo(cx - half * 0.34, cy - half * 0.02)
        g.lineTo(cx - half * 0.78, cy - half * 0.02); g.closePath(); g.fill()
      case "control" =>
        g.beginPath(); g.moveTo(cx - half * 0.72, cy + half * 0.34); g.lineTo(cx, cy - half * 0.42); g.lineTo(cx + half * 0.72, cy + half * 0.34); g.stroke()
      case "home" =>
        g.beginPath(); g.moveTo(cx - half * 0.82, cy - half * 0.05); g.lineTo(cx, cy - half * 0.76); g.lineTo(cx + half * 0.82, cy - half * 0.05)
        g.moveTo(cx - half * 0.58, cy - half * 0.15); g.lineTo(cx - half * 0.58, cy + half * 0.75); g.lineTo(cx + half * 0.58, cy + half * 0.75); g.lineTo(cx + half * 0.58, cy - half * 0.15); g.stroke()
      case "end" =>
        arrow(1, 0, 0.78); g.beginPath(); g.moveTo(cx + half * 0.9, cy - half * 0.78); g.lineTo(cx + half * 0.9, cy + half * 0.78); g.stroke()
      case "pageUp" | "pageDown" =>
        g.strokeRect(cx - half * 0.68, cy - half * 0.82, half * 1.36, half * 1.64)
        arrow(0, if name == "pageUp" then -1 else 1, 0.48)
      case "space" =>
        g.beginPath(); g.moveTo(cx - half * 0.8, cy + half * 0.16); g.lineTo(cx - half * 0.8, cy + half * 0.48)
        g.lineTo(cx + half * 0.8, cy + half * 0.48); g.lineTo(cx + half * 0.8, cy + half * 0.16); g.stroke()
      case "mouseLeft" | "mouseRight" =>
        g.save(); g.beginPath(); g.ellipse(cx, cy, half * 0.62, half * 0.92, 0, 0, math.Pi * 2); g.clip()
        g.fillRect(if name == "mouseLeft" then cx - half * 0.62 else cx, cy - half * 0.92, half * 0.62, half * 0.8); g.restore()
        g.beginPath(); g.ellipse(cx, cy, half * 0.62, half * 0.92, 0, 0, math.Pi * 2); g.moveTo(cx, cy - half * 0.92); g.lineTo(cx, cy - half * 0.12)
        g.moveTo(cx - half * 0.62, cy - half * 0.12); g.lineTo(cx + half * 0.62, cy - half * 0.12); g.stroke()
        val direction = if name == "mouseLeft" then -1.0 else 1.0
        val arrowX = cx + direction * half * 0.1; val arrowY = cy + half * 0.42
        g.beginPath(); g.moveTo(arrowX + direction * half * 0.34, arrowY); g.lineTo(arrowX - direction * half * 0.18, arrowY - half * 0.28)
        g.lineTo(arrowX - direction * half * 0.18, arrowY + half * 0.28); g.closePath(); g.fill()
      case "wheelUp" | "wheelDown" =>
        val mouseX = cx - half * 0.25
        g.beginPath(); g.ellipse(mouseX, cy, half * 0.54, half * 0.88, 0, 0, math.Pi * 2); g.moveTo(mouseX, cy - half * 0.88); g.lineTo(mouseX, cy - half * 0.16); g.stroke()
        g.fillRect(mouseX - half * 0.1, cy - half * 0.7, half * 0.2, half * 0.3)
        val direction = if name == "wheelUp" then -1.0 else 1.0
        val arrowX = cx + half * 0.62; val arrowEndY = cy + direction * half * 0.56
        g.beginPath(); g.moveTo(arrowX, cy - direction * half * 0.45); g.lineTo(arrowX, arrowEndY); g.lineTo(arrowX - half * 0.23, arrowEndY - direction * half * 0.25)
        g.moveTo(arrowX, arrowEndY); g.lineTo(arrowX + half * 0.23, arrowEndY - direction * half * 0.25); g.stroke()
      case "copy" =>
        g.strokeRect(cx - half * 0.72, cy - half * 0.72, half * 1.05, half * 1.05); g.strokeRect(cx - half * 0.28, cy - half * 0.28, half * 1.05, half * 1.05)
      case "pastePlain" =>
        g.strokeRect(cx - half * 0.62, cy - half * 0.55, half * 1.24, half * 1.36)
        g.beginPath(); g.moveTo(cx - half * 0.28, cy - half * 0.72); g.lineTo(cx + half * 0.28, cy - half * 0.72); g.lineTo(cx + half * 0.28, cy - half * 0.38)
        g.lineTo(cx - half * 0.28, cy - half * 0.38); g.closePath(); g.stroke(); g.font = s"800 ${size * 0.62}px Inter, Arial, sans-serif"; g.fillText("T", cx, cy + half * 0.2)
      case "ctrlTab" | "ctrlBackspace" | "ctrlLeft" | "ctrlRight" =>
        val main = Map("ctrlTab" -> "tab", "ctrlBackspace" -> "backspace", "ctrlLeft" -> "left", "ctrlRight" -> "right")(name)
        symbol(g, main, cx, cy - half * 0.22, size * 0.68); symbol(g, "control", cx, cy + half * 0.62, size * 0.42)
      case "ctrlShiftTab" =>
        symbol(g, "tab", cx, cy - half * 0.3, size * 0.58); symbol(g, "control", cx - half * 0.35, cy + half * 0.58, size * 0.38); symbol(g, "shift", cx + half * 0.35, cy + half * 0.58, size * 0.34)
      case "shiftSpace" | "spaceLayer1" =>
        symbol(g, if name == "shiftSpace" then "shift" else "space", cx, cy - half * 0.28, size * 0.62)
        symbol(g, if name == "shiftSpace" then "space" else "layer1", cx, cy + half * 0.58, size * 0.34)
      case layer if layer.matches("layer\\d(Hold)?") =>
        val number = layer.charAt(5).toString
        g.lineWidth = size * 0.11; g.beginPath()
        Vector(-0.52, 0.0, 0.52).foreach { offset => g.moveTo(cx - half * 0.82, cy + half * offset); g.lineTo(cx - half * 0.22, cy + half * offset) }
        g.stroke(); g.font = s"900 ${size * 0.98}px Inter, Arial, sans-serif"; g.fillText(number, cx + half * 0.38, cy + half * 0.04)
        if layer.endsWith("Hold") then { g.beginPath(); g.arc(cx + half * 0.8, cy + half * 0.72, half * 0.12, 0, math.Pi * 2); g.fill() }
      case "bulbMinus" | "bulbPlus" =>
        val bulbX = cx - half * 0.22
        g.beginPath(); g.moveTo(bulbX, cy - half * 0.72)
        g.bezierCurveTo(bulbX - half * 0.52, cy - half * 0.72, bulbX - half * 0.58, cy, bulbX - half * 0.22, cy + half * 0.3)
        g.lineTo(bulbX - half * 0.22, cy + half * 0.48); g.lineTo(bulbX + half * 0.22, cy + half * 0.48); g.lineTo(bulbX + half * 0.22, cy + half * 0.3)
        g.bezierCurveTo(bulbX + half * 0.58, cy, bulbX + half * 0.52, cy - half * 0.72, bulbX, cy - half * 0.72); g.stroke()
        plusMinus(cx + half * 0.58, if name == "bulbPlus" then 1 else -1)
      case "powerOn" | "powerOff" =>
        g.beginPath(); g.moveTo(cx, cy - half * 0.9); g.lineTo(cx, cy - half * 0.14); g.stroke()
        g.beginPath(); g.arc(cx, cy + half * 0.08, half * 0.68, -math.Pi * 0.25, math.Pi * 1.25); g.stroke()
        if name == "powerOff" then { g.beginPath(); g.moveTo(cx - half * 0.78, cy - half * 0.72); g.lineTo(cx + half * 0.78, cy + half * 0.72); g.stroke() }
      case "modePrev" | "modeNext" =>
        val direction = if name == "modeNext" then 1.0 else -1.0
        g.beginPath(); g.arc(cx, cy, half * 0.68, if direction > 0 then math.Pi * 0.3 else math.Pi * 0.7, if direction > 0 then math.Pi * 1.72 else -math.Pi * 0.72, direction < 0); g.stroke()
        val tipX = cx + direction * half * 0.66; val tipY = cy - half * 0.34
        g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(tipX - direction * half * 0.42, tipY - half * 0.08); g.moveTo(tipX, tipY); g.lineTo(tipX - direction * half * 0.18, tipY + half * 0.38); g.stroke()
      case "prev" | "next" =>
        val direction = if name == "next" then 1.0 else -1.0
        g.fillRect(cx - direction * half * 0.58 - size * 0.055, cy - half * 0.6, size * 0.11, half * 1.2); triangle(direction)
      case "playPause" =>
        triangle(1); g.fillRect(cx + half * 0.25, cy - half * 0.58, size * 0.1, half * 1.16); g.fillRect(cx + half * 0.58, cy - half * 0.58, size * 0.1, half * 1.16)
      case "mute" | "volumeDown" | "volumeUp" =>
        speaker()
        if name == "mute" then
          g.beginPath(); g.moveTo(cx + half * 0.24, cy - half * 0.34); g.lineTo(cx + half * 0.76, cy + half * 0.34)
          g.moveTo(cx + half * 0.76, cy - half * 0.34); g.lineTo(cx + half * 0.24, cy + half * 0.34); g.stroke()
        else plusMinus(cx + half * 0.5, if name == "volumeUp" then 1 else -1)
      case _ => ()
