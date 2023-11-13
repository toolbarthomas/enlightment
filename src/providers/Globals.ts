import {
  ColorMode,
  EnlightenmentProvider,
  EnlightenmentProviders,
  EnligtenmentTarget
} from 'src/_types/main'

/**
 * The EnlightenmentGlobals implements the mandatory global variables and
 * method helpers that are used for every Enlightenment Component.
 *
 * It is used within the Core Enlightenment class in combination with the
 * defined global Events; like (un)setting the current Element, Color mode
 * management and many more.
 */
export class EnlightenmentGlobals {
  // Keeps track of the selected components and optional child components.
  // The current Element is attached and detached by the Global Event listeners.
  currentElements: Element[] = []

  // Defines the Attribute name to use when the initial component has been
  // flagged as currentElement.
  currentAttribute: string = 'aria-current'

  // Use the accepted Color mode for all Components with undefined [mode]
  // HTML Attributes.
  mode?: ColorMode = 'light'

  // Unique string identifier for running Enlightenment static context.
  namespace: string

  // Enables verbose logging and outputs all message types within the log()
  // method.
  verbose?: boolean

  // Reference array of the constructed Enlightenment Providers.
  providers: EnlightenmentProviders = []

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

      context.setAttribute(this.currentAttribute, 'true')
    }
  }

  /**
   * Assigns the defined provider to the actual instance.
   *
   * @param provider The provider to assign.
   */
  assignProvider(provider?: EnlightenmentProvider) {
    if (!provider || this.hasProvider(provider)) {
      return
    }

    if (provider === this) {
      return
    }

    this.providers.push(provider)
  }

  /**
   * Checks if the defined provider is assigned to the instance.
   *
   * @param provider The actual provider to check.
   */
  hasProvider(provider?: EnlightenmentProvider) {
    if (!this.providers.length || !provider) {
      return false
    }

    return this.providers.includes(provider)
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

      context.setAttribute(this.currentAttribute, 'false')
    }
  }
}
