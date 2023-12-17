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

  static importTresholdDrag = () =>
    EnlightenmentExtensionLoader.canImportExtension() && import('src/extensions/TresholdDrag')

  /**
   * Preload the required Enlightenment extensions that can be requested by any
   * Enlightenment constructor.
   *
   * Using the [disableEnlightenmentExtension] within
   * the current URL query string will disable the default extension Interfaces
   * and prevents any automatic import from the default extension exports.
   */
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

    const queue = this.extensions.map(
      (extension) =>
        new Promise<boolean>((next) => {
          const importer: any = (EnlightenmentExtensionLoader as any)[`import${extension}`]

          if (typeof importer !== 'function') {
            next(false)

            return
          }

          if (this.extensionInstances[extension] === importer) {
            this.log(`Extension already preloaded: ${extension}`, 'log')

            next(false)

            return
          }

          this.extensionInstances[extension] = importer()

          this.extensionInstances[extension].catch &&
            this.extensionInstances[extension].catch((exception) => {
              this.log(exception, 'error')

              next(false)
            })

          this.extensionInstances[extension].then &&
            this.extensionInstances[extension].then(() => {
              this.log(`Extension imported: ${this.uuid}@${extension}`, 'info')

              this.hook('preload', { data: { extension } })

              next(true)
            })
        })
    )

    if (!queue.length) {
      this.log(`Ignore initial preload from: ${this.uuid}`)

      return
    }

    try {
      Promise.all(queue).then((result) => {
        if (!result || !result.length) {
          return
        }

        if (!result.filter((r) => !r).length) {
          this.log(`Unable to import extension for ${this.uuid}`, 'warning')

          return
        }

        this.dispatchUpdate('preloaded')

        this.throttle(this.requestUpdate)
      })
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }
}
