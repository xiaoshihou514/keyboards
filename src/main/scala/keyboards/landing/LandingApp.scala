package keyboards.landing

import org.scalajs.dom

object LandingApp:
  def start(): Unit =
    dom.document.querySelectorAll("[data-fullscreen]").foreach { node =>
      node.addEventListener("click", (event: dom.Event) =>
        val link = event.currentTarget.asInstanceOf[dom.html.Anchor]
        val card = link.closest(".keyboard-card")
        val frame = Option(card).flatMap(element => Option(element.querySelector("iframe")))
          .map(_.asInstanceOf[dom.html.IFrame])
        frame.foreach { iframe =>
          event.preventDefault()
          val fullscreen = iframe.asInstanceOf[FullscreenFrame]
          fullscreen.requestFullscreen()
        }
      )
    }

  @scala.scalajs.js.native
  private trait FullscreenFrame extends scala.scalajs.js.Object:
    def requestFullscreen(): Unit = scala.scalajs.js.native
