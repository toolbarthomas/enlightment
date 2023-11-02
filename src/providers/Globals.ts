import { ColorMode, EnligtenmentTarget } from 'src/_types/main'

export class Globals {
  currentElements: Element[] = []
  mode?: ColorMode = 'light'
  namespace: string
  verbose?: boolean

  constructor(namespace: string) {
    this.namespace = namespace
  }

  /**
   * Assigns the defined target as currentElement when selected by the defined
   * Keyboard and Pointer interfaces.
   *
   * @param context The current context element.
   */
  assignCurrentElement(context: Element) {
    if (!context) {
      return
    }

    if (!this.currentElements) {
      return
    }

    if (!this.currentElements.filter((currentElement) => currentElement === context).length) {
      this.currentElements.push(context)

      context.setAttribute('aria-current', 'true')
    }
  }

  /**
   * Validates the defined current elements and omit any element
   * from the defined context.
   *
   * @param context Omit the deselected Elements from the defined context.
   */
  omitCurrentElement(context: Element) {
    if (!context) {
      return
    }

    if (this.currentElements && this.currentElements.length) {
      const commit = this.currentElements.filter((currentElement) => currentElement !== context)

      this.currentElements = commit

      context.setAttribute('aria-current', 'false')
    }
  }
}
