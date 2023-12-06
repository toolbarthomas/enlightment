import {
  GlobalEvent,
  GlobalEventHandler,
  GlobalEventOptions,
  GlobalEventType
} from 'src/_types/main'

import { EnlightenmentColorHelper } from './ColorHelper'

export class EnlightenmentInputController extends EnlightenmentColorHelper {
  /**
   * Assign the required keyboard control codes to a semantic name.
   */
  static keyCodes = {
    // Keyboard action trigger signal
    confirm: [13, 32],
    // Keyboard action exit signal
    exit: [27],
    // Keyboard additional action trigger signal
    meta: [9, 16, 17, 18, 20]
  }

  /**
   * Optional flag that should be used by the loaded FocusTrap custom Element to
   * hold the current focus within the defined context.
   */
  hasActiveFocusTrap?: boolean = false

  /**
   * Enable the usage for the Aria grabbed Attribute so it can be used within
   * the updateAttributeAlias method.
   */
  isGrabbed?: boolean = false

  /**
   * Should hold the previously defined Pointer position values.
   */
  previousPointerX?: number
  previousPointerY?: number

  constructor() {
    super()
  }

  /**
   * Assign a new Global Event for each existing component context that is
   * defined the listen property.
   */
  protected assignListeners() {
    if (!this.observe || !this.observe.length) {
      return
    }

    // Don't assign the actual Event Listener to the initial Component to
    // prevent an update loop.
    const queue = Array.from(this.observe).filter((l) => l !== this && document.contains(l))

    if (!queue.length) {
      return
    }

    for (let i = queue.length; i--; ) {
      this.assignGlobalEvent('updated', this._process, { context: queue[i] })
    }
  }

  /**
   * Defines the global keyboard Event listener for the element context.
   *
   * Unmark the currentElement property from the constructed Enlightenment
   * element during a keyboard event within the element context.
   *
   * @param event The initial Keyboard Event interface.
   */
  protected handleGlobalKeydown(event: KeyboardEvent) {
    if (this.preventEvent) {
      return
    }

    const { keyCode, target } = event || {}

    if (EnlightenmentInputController.keyCodes.exit.includes(keyCode)) {
      this.handleCurrentElement(null)

      // this.commit('currentElement', false)
      const t = target as HTMLElement

      if (t && this.isComponentContext(t) && t.blur) {
        t.blur()
      }
    } else if (!Enlightenment.keyCodes.meta.includes(keyCode)) {
      this.handleCurrentElement(event.target)
    } else {
      this.throttle(() => {
        this.handleCurrentElement(document.activeElement)
      })
    }
  }
}
