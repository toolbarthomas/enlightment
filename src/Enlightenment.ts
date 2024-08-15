import { PropertyValueMap, PropertyValues } from 'lit'

import { EnlightenmentTheme } from './providers/Theme'

export {
  createRef,
  css,
  customElement,
  eventOptions,
  html,
  nothing,
  property,
  ref
} from './core/Mixins'

import { EnlightenmentExtensionLoader } from './core/ExtensionLoader'

export class Enlightenment extends EnlightenmentExtensionLoader {
  /**
   * Alias the Enlightment static methoeds to the main Enlightment class
   * instance.
   */
  static filterProperty = Enlightenment.filterPropertyValue
  static parseMatrix = Enlightenment.parseMatrixValue
  static p = Enlightenment.resolveURL
  static useOption = Enlightenment.usePropertyValue

  constructor() {
    super()
  }

  /**
   * Setup the actual featuers for the constructed Enlightenment component.
   *
   * @param properties Defines the previous state of the updated properties.
   */
  protected firstUpdated(properties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(properties)

    this.dispatchUpdate()
  }

  /**
   * Callback handler that should be called only after the Component has been
   * rendered everything.
   *
   * @param event Event context of the dispatched ready hook.
   */
  protected handleReady(event: Event) {
    if (this.domReady) {
      this.throttle(() => {
        this.updateAttributeAlias('domReady', 'ready', true)

        this.throttle(this.useMode)
      })
    }
  }

  /**
   * Callback handler to use after component.updated() is triggered.
   *
   * @param name Dispatch the optional hook
   */
  protected handleUpdate(name?: string) {
    // Defines the current Color mode from the Component context or it's host.
    this.useMode(undefined, Enlightenment)

    // Reflect the updated properties or attributes vice versa only once.
    this.updateAttribute('accent', this.accent)
    this.updateAttribute('mode', this.mode, true)
    this.updateAttribute('neutral', this.neutral)
    this.updateAttribute('viewport', this.viewport)
    this.updateAttribute('direction', this.direction)
    this.updateAttributeAlias('currentElement', 'aria-current')
    this.updateAttributeAlias('isCollapsed', 'aria-collapsed')
    this.updateAttributeAlias('isExpanded', 'aria-expanded')
    this.updateAttributeAlias('pending', 'aria-busy')

    !this.currentElement && this.throttle(this.handleDragEnd)

    this.updateCustomStyleSheet()
    this.updatePreventEvent()

    this.updateAttributeAlias('preventEvent', 'disabled', true)

    this.assignSlots()
    this.dispatchUpdate(name)
  }

  /**
   * Callback to use after a component update.
   *
   * @param properties Defines the previous state of the updated properties.
   */
  protected updated(properties: PropertyValues): void {
    super.updated(properties)

    this.throttle(this.handleUpdate, this.delay, 'updated')
  }

  /**
   * Defines the initial setup for the constructed Enlightenment element.
   */
  public connectedCallback(): void {
    super.connectedCallback()

    // Includes the required viewport meta tags to ensure the responsive
    // layout behaves correctly.
    Enlightenment.theme.assignViewport()
    this.handleCurrentViewport()

    // Invoke the defined Enlightenment providers once and include them
    // to the constructed Enlightenment Globals.
    if (!Enlightenment.globals.hasProvider(Enlightenment.theme)) {
      // Define the required styles in order to use the additional Enlightenment
      // features.
      Enlightenment.theme.assignDefaultStyleSheets()

      // Expose the custom space properties.
      Enlightenment.theme.assignSpaceProperties()

      // Epose the custom depth related properties.
      Enlightenment.theme.assignElevationProperties(EnlightenmentTheme.stackingContext)

      // Epose the custom depth related properties.
      Enlightenment.theme.assignEasingProperties()

      // Epose the default Device breakpoints
      Enlightenment.theme.assignDocumentProperties(
        Object.entries(EnlightenmentTheme.breakpoints).map(
          ([name, breakpoint]) => `--breakpoint-${name}: ${breakpoint}px;`
        )
      )

      // Define the global Color Chart custom properties.
      Enlightenment.theme.assignColorStylesheet(EnlightenmentTheme.colorChart.colors, {
        accent: EnlightenmentTheme.colorChart.accent,
        neutral: EnlightenmentTheme.colorChart.neutral,
        delta: EnlightenmentTheme.colorChart.delta,
        type: EnlightenmentTheme.colorChart.type
      })

      // Ensure the assigned StyleSheets are only assigned once. We don't
      // need to worry about removing them since they are bound to the
      // Custom Element.
      Enlightenment.globals.assignProvider(Enlightenment.theme)
    }

    // Create reference of the custom StyleSheets that will update from their
    // component property values.
    const customStylesheet = Enlightenment.theme.assignComponentStyleSheet(this)
    this.assignCustomStyleSheet(customStylesheet)

    if (this.enableDocumentEvents) {
      this.assignGlobalEvent('click', this.handleGlobalClick)
      this.assignGlobalEvent('keydown', this.handleGlobalKeydown)
      this.assignGlobalEvent('focus', this.handleGlobalFocus)
      this.assignGlobalEvent('focusin', this.handleGlobalFocus)
      this.assignGlobalEvent('resize', this.handleGlobalResize, { context: window })
    }

    // Fallback to ensure the parent component is updated when the initial
    // component is connected.
    const host = this.useHost(this) as HTMLElement
    host && this.hook('updated', { context: host })

    Enlightenment.globals.assignInstance(this)

    this.dispatchUpdate('connected')

    this.assignGlobalEvent('ready', this.handleReady, { context: this })

    this.throttle(this.assignListeners)
  }

  /**
   * Run the defined cleanup handlers before disconnecting the Component.
   */
  public disconnectedCallback(): void {
    try {
      this.clearThrottler()

      Enlightenment.globals.omitInstance(this)

      this.omitGlobalEvent('click', this.handleGlobalClick)
      this.omitGlobalEvent('focus', this.handleGlobalFocus)
      this.omitGlobalEvent('focusin', this.handleGlobalFocus)
      this.omitGlobalEvent('keydown', this.handleGlobalKeydown)
      this.omitGlobalEvent('updated', this._process)
      this.omitGlobalEvent('resize', this.handleGlobalResize)
      this.clearGlobalEvent('ready', this)

      this.clearListeners()

      const slots = this.shadowRoot && this.shadowRoot.querySelectorAll('slot')

      if (slots && slots.length) {
        // Clear the assigned Slotchange event manually since the slotchange
        // Event can be ignored at this point.
        this.clearGlobalEvent('slotchange', slots)

        // Ensure the Slotted Events are removed.
        Object.values(slots).forEach((slot) => this.clearSlottedEvents(slot))
      }

      // Use this.hook directly since the context would not exist anymore after
      // the throttled handler is called.
      this.hook('disconnected')

      super.disconnectedCallback()
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  /**
   * Traverse from the defined context and return the host Component
   *
   * @param context The existing context Element to traverse from.
   */
  public useHost(context: any): undefined | Enlightenment {
    if (!context) {
      return
    }

    let target: Element | undefined = undefined

    if (!target) {
      let current: any = context

      while (current.parentNode && !target) {
        if (context.parentNode instanceof Enlightenment) {
          target = context.parentNode
        }

        if (context.host && context.host instanceof Enlightenment) {
          target = context.host
        }

        if (current && current.host && !Object.values(current).length) {
          target = current.host || current
        }

        if (!target && current && current.host !== context) {
          target = current.host
        }

        if (target) {
          break
        }

        current = current.parentNode as Element
      }

      if (!target && current && current.host !== context) {
        target = current.host
      }
    }

    return super.useHost(target) as Enlightenment
  }
}

/**
 * Alternative helper function that should be used when the default
 * 'customElement' class decorator is not available.
 *
 * @param instance The expected Custom Element constructor to assign to the
 * Custom Element Registry.
 * @param tag The custom tagName to use for the new custom Element.
 */
export const defineCustomElement = (tag: string, instance: any) => {
  let result = false

  if (!instance || !tag) {
    return result
  }

  if (!customElements || customElements.get(tag)) {
    return result
  }

  try {
    customElements.define(tag, instance)
    result = true
  } catch (exception) {
    console && console.error(exception)
  }

  return result
}
