package keyboards.sofle

import scala.collection.mutable
import org.scalajs.dom
import THREE.*
import keyboards.three.TypedAccess.canvas2d

/** Literal Scala port of keyboard.js' black-on-clear Sofle legend decals. */
final class SofleLegendFactory:
  private val cache = mutable.Map.empty[String, CanvasTexture]
  private val shifted = Set("`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+", "[{", "]}", "\\|", ";:", "'\"", ",<", ".>", "/?")
  private val aliases = Map(
    "↑" -> "up", "↓" -> "down", "←" -> "left", "→" -> "right", "⇧" -> "shift", "⊞" -> "linux",
    "⏮" -> "prev", "⏯" -> "playpause", "⏭" -> "next", "⏄" -> "eject",
    "bt" -> "bluetooth", "bksp" -> "backspace", "backspace" -> "backspace", "home" -> "home", "end" -> "end",
    "tab" -> "tab", "enter" -> "return", "del" -> "delete", "delete" -> "delete", "spc" -> "space",
    "pgup" -> "pageUp", "pgdn" -> "pageDown", "ctrl" -> "control", "lc" -> "control",
    "lclk" -> "mouseLeft", "rclk" -> "mouseRight", "ug" -> "underglow",
    "tog" -> "power", "next" -> "next", "prev" -> "prev", "bri+" -> "plus", "bri-" -> "minus",
    "vol-" -> "volumeDown", "vol+" -> "volumeUp"
  )

  def apply(main: String, sub: String = ""): CanvasTexture =
    cache.getOrElseUpdate(s"$main|$sub", draw(main, sub))

  private def draw(main: String, sub: String): CanvasTexture =
    val (canvas, g) = canvas2d(256)
    g.clearRect(0, 0, 256, 256)
    val a = main.trim
    val b = sub.trim
    val combo = s"$a $b".toLowerCase.replace("(", "").replace(")", "").replace("+", "-").replaceAll("\\s+", "-")
    val special = combo match
      case "c-s-c" | "lc-ls-c" => Some("copy")
      case "c-s-v" | "lc-ls-v" => Some("pastePlain")
      case "lc-bksp" => Some("ctrlBackspace")
      case "lc-tab" => Some("ctrlTab")
      case "lc-←" | "lc-left" => Some("ctrlLeft")
      case "lc-→" | "lc-right" => Some("ctrlRight")
      case _ => None
    val symbolName = special.orElse(aliases.get(a.toLowerCase)).orElse(aliases.get(a))
    val displaySub = if special.nonEmpty then "" else b
    if a.nonEmpty || symbolName.nonEmpty then
      g.fillStyle = "#0a0a0a"; g.strokeStyle = "#0a0a0a"; g.textAlign = "center"; g.textBaseline = "middle"
      symbolName match
        case Some(symbol) => drawSymbol(g, symbol, 128, if displaySub.nonEmpty then 102 else 128, if displaySub.nonEmpty then 82 else 96)
        case None if displaySub.isEmpty && shifted(a) => drawShifted(g, a)
        case None =>
          val size = if a.length >= 3 then 64 else if a.length == 2 then 88 else 122
          g.font = s"800 ${size}px \"Segoe UI\", system-ui, sans-serif"
          g.fillText(a, 128, if displaySub.nonEmpty then 108 else 128)
      if displaySub.nonEmpty then aliases.get(displaySub.toLowerCase).orElse(aliases.get(displaySub)) match
        case Some(symbol) => drawSymbol(g, symbol, 128, 192, 52)
        case None => g.font = "700 46px \"Segoe UI\", system-ui, sans-serif"; g.fillText(displaySub, 128, 192)
    val texture = new CanvasTexture(canvas)
    texture.anisotropy = 4
    texture

  private def drawShifted(g: dom.CanvasRenderingContext2D, value: String): Unit =
    g.font = "900 58px \"Segoe UI\", Arial, sans-serif"; g.lineWidth = 2.4
    g.strokeText(value.drop(1), 128, 72); g.fillText(value.drop(1), 128, 72)
    g.font = "900 98px \"Segoe UI\", Arial, sans-serif"; g.lineWidth = 3.2
    g.strokeText(value.take(1), 128, 170); g.fillText(value.take(1), 128, 170)

  private def drawSymbol(g: dom.CanvasRenderingContext2D, name: String, cx: Double, cy: Double, size: Double): Unit =
    val half = size / 2
    g.strokeStyle = "#0a0a0a"; g.fillStyle = "#0a0a0a"; g.lineWidth = size * 0.15; g.lineCap = "round"; g.lineJoin = "round"
    def arrow(dx: Double, dy: Double): Unit =
      val px = -dy; val py = dx; val hx = cx + dx * half * 0.85; val hy = cy + dy * half * 0.85
      g.beginPath(); g.moveTo(cx - dx * half * 0.85, cy - dy * half * 0.85); g.lineTo(hx, hy)
      g.moveTo(hx, hy); g.lineTo(hx - dx * half * 0.5 + px * half * 0.38, hy - dy * half * 0.5 + py * half * 0.38)
      g.moveTo(hx, hy); g.lineTo(hx - dx * half * 0.5 - px * half * 0.38, hy - dy * half * 0.5 - py * half * 0.38); g.stroke()
    def triangle(direction: Double): Unit =
      g.beginPath(); g.moveTo(cx + direction * half * 0.7, cy); g.lineTo(cx - direction * half * 0.45, cy - half * 0.62); g.lineTo(cx - direction * half * 0.45, cy + half * 0.62); g.closePath(); g.fill()
    def bar(offset: Double, width: Double): Unit = g.fillRect(cx + offset - width / 2, cy - half * 0.62, width, half * 1.24)
    name match
      case "up" => arrow(0, -1)
      case "down" => arrow(0, 1)
      case "left" => arrow(-1, 0)
      case "right" => arrow(1, 0)
      case "shift" =>
        g.beginPath(); g.moveTo(cx, cy - half); g.lineTo(cx + half * 0.78, cy - half * 0.02); g.lineTo(cx + half * 0.34, cy - half * 0.02)
        g.lineTo(cx + half * 0.34, cy + half); g.lineTo(cx - half * 0.34, cy + half); g.lineTo(cx - half * 0.34, cy - half * 0.02)
        g.lineTo(cx - half * 0.78, cy - half * 0.02); g.closePath(); g.fill()
      case "linux" => drawLinux(g, cx, cy, size * 1.14)
      case "bluetooth" => drawBluetooth(g, cx, cy, size)
      case "backspace" => drawBackspace(g, cx, cy, size)
      case "home" => drawHome(g, cx, cy, size)
      case "end" => drawEnd(g, cx, cy, size)
      case "copy" => drawCopy(g, cx, cy, size)
      case "pastePlain" => drawPastePlain(g, cx, cy, size)
      case "control" => drawControl(g, cx, cy, size)
      case "tab" => drawTab(g, cx, cy, size)
      case "return" => drawReturn(g, cx, cy, size)
      case "delete" => drawDelete(g, cx, cy, size)
      case "pageUp" => drawPage(g, cx, cy, size, up = true)
      case "pageDown" => drawPage(g, cx, cy, size, up = false)
      case "underglow" => drawUnderglow(g, cx, cy, size)
      case "plus" => drawPlusMinus(g, cx, cy, size, plus = true)
      case "minus" => drawPlusMinus(g, cx, cy, size, plus = false)
      case "power" => drawPower(g, cx, cy, size)
      case "volumeDown" => drawVolume(g, cx, cy, size, plus = false)
      case "volumeUp" => drawVolume(g, cx, cy, size, plus = true)
      case "space" => g.beginPath(); g.moveTo(cx - half * 0.75, cy + half * 0.18); g.lineTo(cx + half * 0.75, cy + half * 0.18); g.stroke()
      case "mouseLeft" => drawMouse(g, cx, cy, size, left = true)
      case "mouseRight" => drawMouse(g, cx, cy, size, left = false)
      case "ctrlBackspace" => drawBackspace(g, cx, cy - half * 0.06, size * 0.84); drawControl(g, cx, cy + half * 0.59, size * 0.3)
      case "ctrlTab" => drawTab(g, cx, cy - half * 0.06, size * 0.84); drawControl(g, cx, cy + half * 0.59, size * 0.3)
      case "ctrlLeft" => drawSymbol(g, "left", cx, cy - half * 0.06, size * 0.82); drawControl(g, cx, cy + half * 0.59, size * 0.3)
      case "ctrlRight" => drawSymbol(g, "right", cx, cy - half * 0.06, size * 0.82); drawControl(g, cx, cy + half * 0.59, size * 0.3)
      case "prev" => bar(-half * 0.62, size * 0.13); triangle(-1)
      case "next" => triangle(1); bar(half * 0.62, size * 0.13)
      case "playpause" =>
        g.beginPath(); g.moveTo(cx - half * 0.2, cy); g.lineTo(cx - half * 0.75, cy - half * 0.45); g.lineTo(cx - half * 0.75, cy + half * 0.45); g.closePath(); g.fill()
        bar(half * 0.25, size * 0.11); bar(half * 0.62, size * 0.11)
      case "eject" =>
        g.beginPath(); g.moveTo(cx, cy - half * 0.85); g.lineTo(cx + half * 0.72, cy + half * 0.12); g.lineTo(cx - half * 0.72, cy + half * 0.12); g.closePath(); g.fill()
        g.fillRect(cx - half * 0.72, cy + half * 0.42, half * 1.44, size * 0.13)
      case _ => ()

  private def drawBackspace(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val w = size * 0.94; val h = size * 0.58; val x = cx - w / 2; val y = cy - h / 2
    g.beginPath(); g.moveTo(x + w * 0.23, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w * 0.23, y + h); g.lineTo(x, cy); g.closePath(); g.stroke()
    g.beginPath(); g.moveTo(x + w * 0.47, y + h * 0.28); g.lineTo(x + w * 0.78, y + h * 0.72); g.moveTo(x + w * 0.78, y + h * 0.28); g.lineTo(x + w * 0.47, y + h * 0.72); g.stroke()

  private def drawHome(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val h = size / 2; g.beginPath(); g.moveTo(cx-h*.78,cy-h*.02); g.lineTo(cx,cy-h*.72); g.lineTo(cx+h*.78,cy-h*.02); g.lineTo(cx+h*.63,cy-h*.02); g.lineTo(cx+h*.63,cy+h*.72); g.lineTo(cx-h*.63,cy+h*.72); g.lineTo(cx-h*.63,cy-h*.02); g.stroke()
    g.beginPath(); g.moveTo(cx-h*.12,cy+h*.72); g.lineTo(cx-h*.12,cy+h*.2); g.lineTo(cx+h*.2,cy+h*.2); g.lineTo(cx+h*.2,cy+h*.72); g.stroke()

  private def drawEnd(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val h=size/2; g.beginPath(); g.moveTo(cx-h*.75,cy); g.lineTo(cx+h*.55,cy); g.moveTo(cx+h*.2,cy-h*.34); g.lineTo(cx+h*.55,cy); g.lineTo(cx+h*.2,cy+h*.34); g.moveTo(cx+h*.72,cy-h*.65); g.lineTo(cx+h*.72,cy+h*.65); g.stroke()

  private def drawCopy(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val h=size/2; val w=h*.9; g.strokeRect(cx-h*.62,cy-h*.68,w,w*1.02); g.strokeRect(cx-h*.1,cy-h*.28,w,w*1.02)

  private def drawPastePlain(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val h=size/2; val left=cx-h*.58; val top=cy-h*.58; val width=h*1.16; val height=h*1.38; val radius=h*.12
    g.lineWidth=size*.085; g.beginPath(); g.moveTo(left+radius,top); g.lineTo(left+width-radius,top); g.quadraticCurveTo(left+width,top,left+width,top+radius)
    g.lineTo(left+width,top+height-radius); g.quadraticCurveTo(left+width,top+height,left+width-radius,top+height); g.lineTo(left+radius,top+height)
    g.quadraticCurveTo(left,top+height,left,top+height-radius); g.lineTo(left,top+radius); g.quadraticCurveTo(left,top,left+radius,top); g.stroke(); g.fillRect(cx-h*.25,top-h*.12,h*.5,h*.24)
    g.lineWidth=size*.1; g.beginPath(); g.moveTo(cx-h*.33,cy-h*.2); g.lineTo(cx+h*.33,cy-h*.2); g.moveTo(cx,cy-h*.2); g.lineTo(cx,cy+h*.18)
    g.moveTo(cx-h*.34,cy+h*.42); g.lineTo(cx+h*.34,cy+h*.42); g.moveTo(cx-h*.34,cy+h*.65); g.lineTo(cx+h*.14,cy+h*.65); g.stroke()

  private def drawMouse(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double, left: Boolean): Unit =
    val h=size/2; val w=h*.68; val top=cy-h*.78; val bottom=cy+h*.78; val split=cy-h*.02
    def body(): Unit = { g.beginPath(); g.moveTo(cx,top); g.bezierCurveTo(cx-w,top,cx-w,cy-h*.25,cx-w,cy+h*.05); g.bezierCurveTo(cx-w,bottom,cx+w,bottom,cx+w,cy+h*.05); g.bezierCurveTo(cx+w,cy-h*.25,cx+w,top,cx,top); g.closePath() }
    g.save(); body(); g.clip(); g.fillRect(if left then cx-w else cx, top-1, w, split-top+1); g.restore(); g.lineWidth=size*.085; body(); g.stroke()
    g.beginPath(); g.moveTo(cx,top); g.lineTo(cx,split); g.moveTo(cx-w,split); g.lineTo(cx+w,split); g.stroke(); g.lineWidth=size*.09; g.beginPath(); g.moveTo(cx,cy-h*.5); g.lineTo(cx,cy-h*.22); g.stroke()

  private def drawBluetooth(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val h=size/2; g.beginPath(); g.moveTo(cx,cy-h*.9); g.lineTo(cx,cy+h*.9); g.moveTo(cx,cy-h*.9); g.lineTo(cx+h*.62,cy-h*.38); g.lineTo(cx-h*.52,cy+h*.42); g.moveTo(cx,cy+h*.9); g.lineTo(cx+h*.62,cy+h*.38); g.lineTo(cx-h*.52,cy-h*.42); g.stroke()

  private def drawLinux(g: dom.CanvasRenderingContext2D, cx: Double, cy: Double, size: Double): Unit =
    val h=size/2; g.save(); g.fillStyle="#0a0a0a"; g.beginPath(); g.ellipse(cx-h*.52,cy+h*.2,h*.2,h*.48,-.42,0,math.Pi*2); g.ellipse(cx+h*.52,cy+h*.2,h*.2,h*.48,.42,0,math.Pi*2); g.fill()
    g.beginPath(); g.ellipse(cx,cy+h*.18,h*.52,h*.66,0,0,math.Pi*2); g.ellipse(cx,cy-h*.38,h*.44,h*.43,0,0,math.Pi*2); g.fill(); g.fillStyle="#f4f0f8"; g.beginPath()
    g.ellipse(cx,cy+h*.28,h*.33,h*.46,0,0,math.Pi*2); g.ellipse(cx-h*.16,cy-h*.42,h*.17,h*.21,-.08,0,math.Pi*2); g.ellipse(cx+h*.16,cy-h*.42,h*.17,h*.21,.08,0,math.Pi*2); g.fill()
    g.fillStyle="#0a0a0a"; g.beginPath(); g.arc(cx-h*.11,cy-h*.39,h*.065,0,math.Pi*2); g.arc(cx+h*.11,cy-h*.39,h*.065,0,math.Pi*2); g.fill(); g.fillStyle="#e8930c"; g.beginPath()
    g.moveTo(cx-h*.24,cy-h*.24); g.lineTo(cx+h*.24,cy-h*.24); g.lineTo(cx,cy+h*.01); g.closePath(); g.fill(); g.beginPath(); g.ellipse(cx-h*.3,cy+h*.74,h*.27,h*.13,-.2,0,math.Pi*2); g.ellipse(cx+h*.3,cy+h*.74,h*.27,h*.13,.2,0,math.Pi*2); g.fill(); g.restore()

  private def drawControl(g: dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double):Unit = { val h=size/2; g.beginPath(); g.moveTo(cx-h*.62,cy+h*.25); g.lineTo(cx,cy-h*.48); g.lineTo(cx+h*.62,cy+h*.25); g.stroke() }
  private def drawTab(g: dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double):Unit = { val h=size/2; g.beginPath(); g.moveTo(cx-h*.7,cy); g.lineTo(cx+h*.38,cy); g.moveTo(cx+h*.05,cy-h*.34); g.lineTo(cx+h*.38,cy); g.lineTo(cx+h*.05,cy+h*.34); g.moveTo(cx+h*.7,cy-h*.62); g.lineTo(cx+h*.7,cy+h*.62); g.stroke() }
  private def drawReturn(g: dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double):Unit = { val h=size/2; g.beginPath(); g.moveTo(cx+h*.7,cy-h*.3); g.lineTo(cx+h*.7,cy+h*.35); g.lineTo(cx-h*.35,cy+h*.35); g.moveTo(cx-h*.65,cy+h*.35); g.lineTo(cx-h*.35,cy+h*.05); g.moveTo(cx-h*.65,cy+h*.35); g.lineTo(cx-h*.35,cy+h*.65); g.stroke() }
  private def drawDelete(g: dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double):Unit = { val h=size/2; g.beginPath(); g.moveTo(cx-h*.68,cy); g.lineTo(cx-h*.35,cy-h*.38); g.lineTo(cx+h*.68,cy-h*.38); g.lineTo(cx+h*.68,cy+h*.38); g.lineTo(cx-h*.35,cy+h*.38); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(cx-h*.57,cy-h*.15); g.lineTo(cx-h*.26,cy+h*.15); g.moveTo(cx-h*.26,cy-h*.15); g.lineTo(cx-h*.57,cy+h*.15); g.stroke() }
  private def drawPage(g:dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double,up:Boolean):Unit = { val h=size/2; val tip=cy+(if up then -h*.45 else h*.45); val tail=cy+(if up then h*.35 else -h*.35); g.beginPath(); g.moveTo(cx,tail); g.lineTo(cx,tip); g.moveTo(cx,tip); g.lineTo(cx-h*.25,tip+(if up then h*.22 else -h*.22)); g.moveTo(cx,tip); g.lineTo(cx+h*.25,tip+(if up then h*.22 else -h*.22)); g.moveTo(cx-h*.58,cy+h*.62); g.lineTo(cx+h*.58,cy+h*.62); g.stroke() }
  private def drawUnderglow(g:dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double):Unit = { val h=size/2; g.beginPath(); g.moveTo(cx,cy-h*.7); g.bezierCurveTo(cx-h*.62,cy-h*.7,cx-h*.68,cy+h*.08,cx-h*.26,cy+h*.4); g.lineTo(cx-h*.26,cy+h*.58); g.lineTo(cx+h*.26,cy+h*.58); g.lineTo(cx+h*.26,cy+h*.4); g.bezierCurveTo(cx+h*.68,cy+h*.08,cx+h*.62,cy-h*.7,cx,cy-h*.7); g.stroke(); g.beginPath(); g.moveTo(cx-h*.3,cy+h*.72); g.lineTo(cx+h*.3,cy+h*.72); g.moveTo(cx-h*.22,cy+h*.86); g.lineTo(cx+h*.22,cy+h*.86); g.stroke() }
  private def drawPlusMinus(g:dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double,plus:Boolean):Unit = { val h=size/2; g.lineWidth=size*.16; g.beginPath(); g.moveTo(cx-h*.68,cy); g.lineTo(cx+h*.68,cy); if plus then { g.moveTo(cx,cy-h*.68); g.lineTo(cx,cy+h*.68) }; g.stroke() }
  private def drawPower(g:dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double):Unit = { val h=size/2; g.lineWidth=size*.14; g.beginPath(); g.moveTo(cx,cy-h*.9); g.lineTo(cx,cy-h*.14); g.stroke(); g.beginPath(); g.arc(cx,cy+h*.08,h*.68,-math.Pi*.25,math.Pi*1.25); g.stroke() }
  private def drawVolume(g:dom.CanvasRenderingContext2D,cx:Double,cy:Double,size:Double,plus:Boolean):Unit = { val h=size/2; g.beginPath(); g.moveTo(cx-h*.86,cy-h*.28); g.lineTo(cx-h*.51,cy-h*.28); g.lineTo(cx-h*.12,cy-h*.66); g.lineTo(cx-h*.12,cy+h*.66); g.lineTo(cx-h*.51,cy+h*.28); g.lineTo(cx-h*.86,cy+h*.28); g.closePath(); g.fill(); g.lineWidth=size*.13; val x=cx+h*.5; g.beginPath(); g.moveTo(x-h*.3,cy); g.lineTo(x+h*.3,cy); if plus then { g.moveTo(x,cy-h*.3); g.lineTo(x,cy+h*.3) }; g.stroke() }
