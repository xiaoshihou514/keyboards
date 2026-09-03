package keyboards

import org.scalajs.dom.document
import keyboards.k500.K500App
import keyboards.landing.LandingApp

object Main:
  def main(args: Array[String]): Unit =
    val page = Option(document.body.getAttribute("data-page")).getOrElse("landing")
    page match
      case "landing" => LandingApp.start()
      case "k500" => K500App.start()
      case "q11" => keyboards.q11.Q11App.start()
      case "sofle" => keyboards.sofle.SofleApp.start()
      case unknown => throw new IllegalArgumentException(s"Unknown keyboard page: $unknown")
