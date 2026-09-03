package keyboards.three

import scala.collection.mutable
import org.scalajs.dom
import THREE.*
import keyboards.three.TypedAccess.canvas2d

object TextureFactory:
  def radialGlow(size: Int = 128): CanvasTexture =
    val (canvas, g) = canvas2d(size)
    val center = size / 2.0
    val gradient = g.createRadialGradient(center, center, 3, center, center, center - 2)
    gradient.addColorStop(0, "rgba(255,255,255,.92)")
    gradient.addColorStop(0.28, "rgba(255,255,255,.56)")
    gradient.addColorStop(0.7, "rgba(255,255,255,.2)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = gradient
    g.fillRect(0, 0, size, size)
    val texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture

  final class Legends(darkText: Boolean):
    private val cache = mutable.Map.empty[String, CanvasTexture]

    def apply(primary: String, secondary: String = "", corner: String = ""): CanvasTexture =
      cache.getOrElseUpdate(s"$primary|$secondary|$corner", draw(primary, secondary, corner))

    private def draw(primary: String, secondary: String, corner: String): CanvasTexture =
      val (canvas, g) = canvas2d(256)
      g.clearRect(0, 0, 256, 256)
      g.fillStyle = if darkText then "#111318" else "#ffffff"
      g.textAlign = "center"
      g.textBaseline = "middle"
      if secondary.nonEmpty || corner.nonEmpty then
        g.font = "700 48px Arial, sans-serif"
        if secondary.nonEmpty then g.fillText(secondary, 128, 58)
        g.font = s"700 ${if primary.length > 3 then 50 else 66}px Arial, sans-serif"
        g.fillText(primary, 128, if corner.nonEmpty then 132 else 166)
        if corner.nonEmpty then
          g.strokeStyle = g.fillStyle
          g.lineWidth = 4
          g.strokeRect(96, 174, 64, 43)
          g.font = "700 27px Arial, sans-serif"
          g.fillText(corner, 128, 196)
      else
        val size = if primary.length > 5 then 44 else if primary.length > 3 then 52 else 72
        g.font = s"700 ${size}px Arial, sans-serif"
        g.fillText(primary, 128, 128)
      val texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
      texture

