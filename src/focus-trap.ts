import { createFocusTrap, FocusTrap } from 'focus-trap'

import {
  createRef,
  customElement,
  Enlightenment,
  html,
  property,
  PropertyValueMap,
  ref,
  Ref
} from '@toolbarthomas/enlightenment'

@customElement('focus-trap')

/**
 * The Enlightenment Focus Trap Component enables the usage of the Focus Trap
 * library directly or within any Web Component context. You should include
 * this component if you need to hold the current Focus within the Element that
 * is wrapped with this custom Element.
 *
 * The Focus Trap instance is created during the first update of the created
 * Component and will cleanup itself when it is removed from the DOM.
 *
 * The actual component will not render any additional elements and will render
 * any child elements within the default component Slot. The Focus Trap
 * component will try to update the focusTrap context from the optional parent
 * Enlightenment Component.
 */
class EnlightenmentFocusTrap extends Enlightenment {
  // Will hold the Focus Trap instance.
  focusTrap?: FocusTrap

  // Flag that will activate or deactivate the created Focus Trap instance.
  @property({ attribute: 'active', converter: Enlightenment.isBoolean, type: Boolean })
  isActive?: boolean

  constructor() {
    super()
  }

  /**
   * Notify the Component to activate the running Focus Trap instance.
   * The Focus Trap instance will not activate if the defined context is
   * disabled or the direct parent Enlightenment Element is disabled.
   *
   * You need to update the attribute 'active' via setAttribute to call
   * this method correctly.
   */
  protected activate() {
    this.commit('isActive', true)
  }

  /**
   * Notify the Component to deactivate the running Focus Trap instance.
   *
   * You need to remove the attribute 'active' via setAttribute to call
   * this method correctly.
   */
  protected deactivate() {
    this.commit('isActive', false)
  }

  /**
   * Setup the actual Focus Trap instance
   */
  protected firstUpdated() {
    super.firstUpdated()

    const context = this.useRef(this.context) || this

    if (context && !this.focusTrap) {
      this.focusTrap = createFocusTrap(context, {
        escapeDeactivates: false,
        allowOutsideClick: false,
        initialFocus: false,
        tabbableOptions: {
          getShadowRoot: this.minimalShadowRoot
            ? true
            : (node: HTMLElement | SVGElement) =>
                this.isComponentContext(node) ? node.shadowRoot || undefined : false
        }
      })

      this.log(`Focus Trap defined from: ${context}`, 'info')
    }

    const host: typeof Enlightenment = this.parentNode.host

    if (host instanceof Enlightenment && host !== this) {
      this.assignGlobalEvent('updated', this.refresh, host)
    }
  }

  /**
   * Toggle the actual state of the created Focus Trap instance by checking
   * the logic from the isActive Property & active Attribute. The Focus Trap
   * instance will only activate if the instance is not wihtin a disabled
   * context.
   *
   * @param properties The updated properties that is ignored in this case since
   * the expected Property/Attribute has already changed within the Class
   * instance, this means that `this` is actually checked directly and the
   * optional HTML Attribute that could exist within the DOM.
   */
  protected updated(properties: any) {
    super.updated(properties)

    if (this.focusTrap == null) {
      return
    }

    const component = this.parentNode

    let canContinue = true

    // Only activate the Focus Trap if the parent Component context is not
    // disabled.
    let host: typeof Enlightenment
    if (component && component.host instanceof Enlightenment) {
      host = component.host

      if (host.preventEvent || host.disabled || host.ariaDisabled) {
        canContinue = false
      }
    }

    // Also check if the actual context is not disabled.
    if (this.preventEvent || this.disabled || this.ariaDisabled) {
      canContinue = false
    }

    // Toggle the actual Focus Trap instance.
    if (
      this.getAttribute('active') !== 'false' &&
      this.getAttribute('active') != null &&
      canContinue
    ) {
      this.focusTrap.activate()
    } else {
      this.focusTrap.deactivate()
    }

    // Ensure the optional parent Component context is updated if the
    // Focus Trap element has mutated outside the mentioned parent context.
    this.throttle(() => {
      if (
        host &&
        !host.hasActiveFocusTrap &&
        this.focusTrap?.active &&
        this.getAttribute('active') !== 'false' &&
        this.getAttribute('active') != null
      ) {
        host.commit('hasActiveFocusTrap', true)
      } else if (
        host &&
        host.hasActiveFocusTrap &&
        !this.focusTrap?.active &&
        (this.getAttribute('active') === 'false' || this.getAttribute('active') == null)
      ) {
        host.commit('hasActiveFocusTrap', false)
      }
    })
  }

  /**
   * Callback handler to update the Focus Trap context that should be used
   * during any component update.
   */
  refresh() {
    if (this.focusTrap && this.focusTrap.active && this.useRef(this.context) !== this) {
      this.focusTrap.updateContainerElements &&
        this.throttle(this.focusTrap.updateContainerElements, Enlightenment.FPS, this)
    }
  }

  /**
   * Ensures the running Focus Trap instance is stopped and removed from the
   * current DOM.
   */
  destroy() {
    if (this.preventEvent) {
      return
    }

    if (!this.focusTrap || !this.focusTrap.deactivate) {
      return
    }

    try {
      // Deactivate the instance directly in this case since the Component
      // could ignore the updated callback if does not exist within the DOM
      // anymore.
      this.focusTrap != undefined && this.focusTrap.deactivate()

      // This is probably not required but ensure the property is reverted to
      // the initial value.
      this.commit('isActive', undefined)
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  /**
   * Ensure the running Focus Trap instance is stopped when the Component is
   * removed.
   */
  disconnectedCallback() {
    try {
      if (this.focusTrap && this.focusTrap.active) {
        this.destroy()
      }
    } catch (exception) {
      exception && this.log(exception, 'error')
    }

    super.disconnectedCallback()
  }

  /**
   * Wraps the Focus Trap instance directly within the component.
   * @returns
   */
  render() {
    this.refresh()

    return html`<slot ref=${ref(this.context)}></slot>`
  }
}
