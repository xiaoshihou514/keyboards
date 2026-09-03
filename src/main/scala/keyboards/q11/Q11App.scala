package keyboards.q11

import org.scalajs.dom

object Q11App:
  def start(): Unit =
    try Q11Scene.start(Q11Layout.default)
    catch case error: Throwable => dom.console.error("Q11 initialization failed", error.getMessage)
