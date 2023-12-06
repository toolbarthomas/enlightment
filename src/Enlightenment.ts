import { EnlightenmentKernel } from './core/Kernel'
import { EnlightenmentDOM } from './core/DOM'
import { EnlightenmentGlobals } from './providers/Globals'
import { EnlightenmentTheme } from './providers/Theme'
import { EnlightenmentMixins } from './core/Mixins'
import { EnlightenmentParser } from './core/Parser'
import { EnlightenmentInputController } from './core/InputController'
import { PropertyValueMap } from 'lit'
import { EnlightenmentColorHelper } from './core/ColorHelper'

export { createRef, css, customElement, html, property, ref } from './core/Mixins'

export class Enlightenment extends EnlightenmentInputController {
  /**
   * Alias the Enlightment static methoeds to the main Enlightment class
   * instance.
   */
  // static convertToSelector = EnlightenmentDOM.convertToSelector
  static filterProperty = EnlightenmentMixins.filterPropertyValue
  // static generateTimestampID = EnlightenmentMixins.generateTimestampID
  // static getElements = EnlightenmentDOM.getElements
  // static getElementsFromSlot = EnlightenmentDOM.getElementsFromSlot
  // static getRelatedComponents = EnlightenmentDOM.getRelatedComponents
  // static imageExtensions = EnlightenmentKernel.imageExtensions
  // static isBoolean = EnlightenmentMixins.isBoolean
  // static isExternal = EnlightenmentMixins.isExternalURL
  // static isInteger = EnlightenmentMixins.isInteger
  // static isWithinViewport = EnlightenmentDOM.isWithinViewport
  // static keyCodes = EnlightenmentInputController.keyCodes
  // static parseJSON = EnlightenmentParser.parseJSON
  static parseMatrix = EnlightenmentParser.parseMatrixValue
  // static sanitizeHTML = EnlightenmentParser.sanitizeHTML
  // static strip = EnlightenmentParser.strip
  static url = EnlightenmentParser.resolveURL
  // static useElementID = EnlightenmentDOM.useElementID
  static useOption = EnlightenmentParser.usePropertyValue
  // static webfontExtensions = EnlightenmentKernel.webfontExtensions

  static isTarget(value: any) {
    return EnlightenmentMixins.filterPropertyValue(value, ['_self', '_blank', '_parent', '_top'])
  }

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

    this.throttle(this.useMode)

    this.dispatchUpdate('updated')
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
    this.updateAttributeAlias('currentElement', 'aria-current')
    this.updateAttributeAlias('isCollapsed', 'aria-collapsed')
    this.updateAttributeAlias('isExpanded', 'aria-expanded')
    this.updateAttributeAlias('pending', 'aria-busy')

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
    const customStylesheet = Enlightenment.theme.assignComponentStylesheets(this)
    this.assignCustomStyleSheet(customStylesheet)

    if (this.enableDocumentEvents) {
      console.log('ENAB:E')
      this.assignGlobalEvent('click', this.handleGlobalClick)
      this.assignGlobalEvent('keydown', this.handleGlobalKeydown)
      this.assignGlobalEvent('focus', this.handleGlobalFocus)
      this.assignGlobalEvent('focusin', this.handleGlobalFocus)
      this.assignGlobalEvent('resize', this.handleGlobalResize, { context: window })
    }

    this.throttle(this.assignListeners)
    this.dispatchUpdate('connected')

    // Fallback to ensure the parent component is updated when the initial
    // component is connected.
    const host = this.useHost(this)
    if (host && typeof host.dispatchUpdate === 'function' && host !== this) {
      host.dispatchUpdate()
    }

    this.assignGlobalEvent('ready', this.handleReady, { context: this })
  }

  public useHost(context: any) {
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
