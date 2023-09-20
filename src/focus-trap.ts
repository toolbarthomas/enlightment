import { createFocusTrap, FocusTrap } from 'focus-trap';

import { createRef, customElement, Enlightenment, html, property, ref, Ref } from '@toolbarthomas/enlightenment'

@customElement('focus-trap')
class EnlightenmentFocusTrap extends Enlightenment {
  focusContext: Ref<HTMLElement> = createRef()
  focusTrap?: FocusTrap

  constructor() {
    super();
  }

  firstUpdated() {
    super.firstUpdated()

    const context = this.useRef(this.focusContext) || this

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
  }

  updated() {
    console.log('foobar')
  }

  disconnectedCallback() {
    try {
      if (this.focusTrap && this.focusTrap.active) {
        this.releaseFocusTrap()
      }
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  lockFocusTrap() {
    if (!this.focusTrap || this.preventEvent || this.isDisabled) {
      return
    }

    this.throttle(() => {
      this.focusTrap?.activate()
      this.commit('hasFocusTrap', true)
    })
  }

  render() {
    if (this.focusTrap && this.focusTrap.active && this.useRef(this.focusContext) !== this) {
      this.focusTrap.updateContainerElements(this as HTMLElement)
    }

    return html`<slot ref=${ref(this.focusContext)}></slot>`
  }

  releaseFocusTrap() {
    if (!this.focusTrap) {
      return
    }

    this.throttle(() => {
      this.focusTrap.deactivate()
      this.commit('hasFocusTrap', false)
    })
  }
}
