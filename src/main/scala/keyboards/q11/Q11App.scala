package keyboards.q11

import scala.scalajs.js
import scala.scalajs.js.annotation.*
import org.scalajs.dom
import keyboards.three.VialDocument

object Q11App:
  def start(): Unit =
    try Q11Scene.start(js.JSON.parse(RawKeymap.asInstanceOf[String]).asInstanceOf[VialDocument])
    catch case error: Throwable => dom.console.error("Q11 initialization failed", error.getMessage)

  @js.native
  @JSImport("./real/keymap.vil?raw", "default")
  private object RawKeymap extends js.Object
