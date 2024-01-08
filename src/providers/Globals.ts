import { ColorMode, EnlightenmentProvider, EnlightenmentProviders } from '../_types/main'

import { Enlightenment } from '../Enlightenment'

/**
 * The EnlightenmentGlobals implements the mandatory global variables and
 * method helpers that are used for every Enlightenment Component.
 *
 * It is used within the Core Enlightenment class in combination with the
 * defined global Events; like (un)setting the current Element, Color mode
 * management and many more.
 */
export class EnlightenmentGlobals {
  /**
   * Keeps track of the selected components and optional child components.
   * The current Element is attached and detached by the Global Event listeners.
   */
  currentElements: Element[] = []

  /**
   * Defines the Attribute name to use when the initial component has been
   * flagged as currentElement
   */
  currentAttribute: string = 'aria-current'

  /**
   * Use the accepted Color mode for all Components with undefined [mode] HTML
   * Attributes.
   */
  mode?: ColorMode = 'light'

  /**
   * Unique string identifier for running Enlightenment static context.
   */
  namespace: string

  /**
   * Enables verbose logging and outputs all message types within the log()
   * method.
   */
  verbose?: boolean

  /**
   * Reference array of the constructed Enlightenment Providers.
   */
  providers: EnlightenmentProviders = []

  /**
   * Contains the assigned instances defined from assignInstance()
   */
  instances: (Enlightenment | HTMLElement | undefined)[] = []

  /**
   * Reference to the current Timeout ID that should cleanup the instance.
   */
  cleanupRequest?: number

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

      if (!context.hasAttribute(this.currentAttribute)) {
        context.setAttribute(this.currentAttribute, 'true')
      }
    }
  }

  /**
   * Assigns the defined Enlightenment instance to the instances Global.
   * @param instance The instance to assign.
   */
  assignInstance(instance: HTMLElement | Enlightenment) {
    if (!Array.isArray(this.instances)) {
      return false
    }

    if (instance && this.instances.includes(instance)) {
      return false
    } else if (instance) {
      this.instances.push(instance)
      return true
    }

    return false
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
   * Callback handler that removes undefined references.
   */
  cleanup() {
    this.clearInstances()
  }

  /**
   * Removes the cleared instance references.
   */
  clearInstances() {
    this.instances = this.instances.filter((i) => i)
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

      if (context.getAttribute(this.currentAttribute) !== 'false') {
        context.setAttribute(this.currentAttribute, 'false')
      }
    }
  }

  /**
   * Removes the defined instance subscription from the Global entry.
   *
   * @param instance The instance to omit.
   */
  omitInstance(instance: HTMLElement | Enlightenment) {
    if (!instance || !this.instances) {
      return false
    }

    if (!this.instances.includes(instance)) {
      return false
    }

    const index = this.instances.indexOf(instance)

    this.instances[index] = undefined

    this.requestGlobalCleanup()

    return true
  }

  /**
   * Create a new cleanup request that will initiate after 60 seconds to ensure
   * it is only called once.
   */
  requestGlobalCleanup() {
    if (this.cleanupRequest) {
      clearTimeout(this.cleanupRequest)
    }

    this.cleanupRequest = setTimeout(() => this.cleanup(), 1000 * 60) as unknown as number
  }
}
