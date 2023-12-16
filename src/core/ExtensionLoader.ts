import { EnlightenmentInputController } from 'src/core/InputController'

export class EnlightenmentExtensionLoader extends EnlightenmentInputController {
  /**
   * Disables the core Extension import while the Query URL parameter
   * [disableEnlightenmentExtensions] exists within the current URL.
   */
  static canImportExtension() {
    const disableExtensions = new URL(window.location as any).searchParams.has(
      'disableEnlightenmentExtensions'
    )

    return !disableExtensions
  }

  /**
   * Defines the optional fixed Extension imports for the actual Compiler.
   *
   * The default exported extensions are assigned from these methods and are not
   * included by the core Enlightenment package. You need to call the required
   * extension loaders: (useDraggable, useFocusTrap etc.) within your Component,
   * in order to use the actual Extension Element in the defined Component context.
   *
   * @see /src/Enlightenment.ts
   */
  static importDraggable = () =>
    EnlightenmentExtensionLoader.canImportExtension() && import('src/extensions/Draggable')
  static importFocusTrap = () =>
    EnlightenmentExtensionLoader.canImportExtension() && import('src/extensions/FocusTrap')
  static importScrollable = () =>
    EnlightenmentExtensionLoader.canImportExtension() && import('src/extensions/Scrollable')
}
