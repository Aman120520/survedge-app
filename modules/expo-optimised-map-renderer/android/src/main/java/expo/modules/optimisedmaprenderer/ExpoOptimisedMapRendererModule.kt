package expo.modules.optimisedmaprenderer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoOptimisedMapRendererModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoOptimisedMapRenderer')` in JavaScript.
    Name("ExpoOptimisedMapRenderer")

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ExpoOptimisedMapRendererView::class) {
      // Defines a setter for the `points` prop.
      // This prop receives an array of point objects from JavaScript and passes them to the native view
      // for efficient rendering of 10,000+ points.
      Prop("points") { view: ExpoOptimisedMapRendererView, points: List<Map<String, Any>> ->
        view.setPoints(points)
      }
      
      // Defines a setter for the `initialRegion` prop.
      // This prop sets the initial map region (center and zoom level).
      Prop("initialRegion") { view: ExpoOptimisedMapRendererView, region: Map<String, Double> ->
        view.setInitialRegion(region)
      }
    }
  }
}
