import { EnlightenmentExtensionImports } from 'src/_types/main'
import { EnlightenmentInputController } from 'src/core/InputController'

export class EnlightenmentExtensionLoader extends EnlightenmentInputController {
  extensions: string[] = []
  extensionInstances: EnlightenmentExtensionImports = {}

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

  constructor() {
    super()

    this.throttle(this.preload)
  }

  /**
   * Preloads the defined Enlightenment Extensions for the constructed
   * Component.
   */
  protected preload() {
    if (!this.extensions || !this.extensions.length) {
      return
    }

    let completed = 0

    this.extensions.forEach(async (extension, index) => {
      const importer: any = (EnlightenmentExtensionLoader as any)[`import${extension}`]

      if (typeof importer !== 'function') {
        return
      }

      if (this.extensionInstances[extension] === importer) {
        this.log(`Extension already preloaded: ${extension}`, 'log')
        return
      }

      let abort = false

      try {
        this.extensionInstances[extension] = await importer()
      } catch (exception) {
        if (exception) {
          this.log(exception, 'error')
          abort = true
        }
      }

      if (abort) {
        delete this.extensionInstances[extension]
      }

      this.log('Extension loaded', 'info')

      this.dispatchUpdate()

      completed += 1

      if (completed >= this.extensions.length) {
        this.hook('preload')
      }
    })
  }
}
