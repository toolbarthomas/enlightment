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
   * Keep track of the interaction amount within the selected duration.
   */
  currentInteractions = 0
  currentInteractionRequest?: number
  currentInteractionResponse?: number
  currentInteractionVelocityX?: number
  currentInteractionVelocityY?: number

  /**
   * Should hold the current integer X & Y values of the defined Pointer.
   */
  currentPointerX?: number
  currentPointerY?: number

  /**
   * Defines the current selected pivot from 1 to 9 that should use the defined
   * Drag interaction.
   */
  currentPivot?: number

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
   * Callback handler that should cleanup the current Drag interaction.
   *
   * @param event Inherit the optional Mouse or Touch event interface.
   */
  protected handleDragEnd(event?: MouseEvent | TouchEvent) {
    if (this.isGrabbed) {
      const context = this.useContext() as HTMLElement

      if (context) {
        this.currentInteractionRequest && cancelAnimationFrame(this.currentInteractionRequest)

        const [translateX, translateY] = EnlightenmentInputController.parseMatrixValue(
          context.style.transform
        )

        this.currentContextX = translateX || 0
        this.currentContextY = translateY || 0
      }
    }

    this.isGrabbed = false
    this.currentPivot = undefined
    this.currentInteractionResponse = undefined

    this.removeAttribute(EnlightenmentInputController.defaults.attrGrabbed)

    this.omitGlobalEvent('mousemove', this.handleDragUpdate)
    this.omitGlobalEvent('mouseup', this.handleDragEnd)
    this.omitGlobalEvent('touchmove', this.handleDragUpdate)
    this.omitGlobalEvent('touchend', this.handleDragEnd)
  }

  /**
   * Defines the default Event handler to initiate the Drag interaction for
   * Mouse & Touch devices.
   *
   * @param event The expected Mouse or Touch Event.
   */
  protected handleDragStart(event: MouseEvent | TouchEvent) {
    if (!event || this.isGrabbed || this.preventEvent) {
      return
    }

    event.preventDefault()

    // Only listen for the main Mouse button.
    if (event instanceof MouseEvent) {
      if (event.button !== 0) {
        return
      }
    }

    const target = event.target as HTMLElement

    if (target && target.hasAttribute('data-pivot')) {
      this.currentPivot = EnlightenmentInputController.isInteger(target.getAttribute('data-pivot'))
    }

    // Apply the Drag behavior on the main Component context, since it should
    // contain all visible elements.
    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

    this.currentInteractions += 1

    // Enable single & double click interactions
    if (this.currentInteractions === 1) {
      this.throttle(() => {
        this.currentInteractions = 0
      }, this.delay * 12)
    }

    if (this.currentInteractions > 1) {
      console.log('DOUBLE')
      return
    }

    this.isGrabbed = true

    this.currentContextX = context.offsetLeft
    this.currentContextY = context.offsetTop

    const [clientX, clientY] = this.usePointerPosition(event)

    this.currentPointerX = Math.round(clientX)
    this.currentPointerY = Math.round(clientY)

    this.handleCurrentElement(this)

    console.log('DRAG START')

    this.assignGlobalEvent('mousemove', this.handleDragUpdate, {
      context: document.documentElement
    })

    this.assignGlobalEvent('touchmove', this.handleDragUpdate, {
      context: document.documentElement
    })

    this.assignGlobalEvent('touchend', this.handleDragEnd, {
      once: true
    })

    this.assignGlobalEvent('mouseup', this.handleDragEnd, { once: true })
  }

  /**
   * Updates the required Drag position values while isGrabbed equals TRUE.
   *
   * @param event Expected Mouse or Touch event.
   */
  protected handleDragUpdate(event: MouseEvent | TouchEvent) {
    const [clientX, clientY] = this.usePointerPosition(event)

    if (this.preventEvent) {
      this.handleDragEnd(event)
      return
    }

    // Only accept movement changes
    if (this.previousPointerX === clientX && this.previousPointerY === clientY) {
      return
    }

    this.currentInteractionVelocityX = clientX > (this.previousPointerX || 0) ? 1 : -1
    this.currentInteractionVelocityY = clientY > (this.previousPointerY || 0) ? 1 : -1

    if (this.previousPointerX === clientX) {
      this.currentInteractionVelocityX = 0
    }

    if (this.previousPointerY === clientY) {
      this.currentInteractionVelocityY = 0
    }

    // if (this.inter)
    if (!this.currentPivot || this.currentPivot === 5) {
      !this.hasAttribute(EnlightenmentInputController.defaults.attrGrabbed) &&
        this.setAttribute(EnlightenmentInputController.defaults.attrGrabbed, 'true')
    }

    if (clientX !== undefined) {
      this.previousPointerX = clientX
    }

    if (clientY !== undefined) {
      this.previousPointerY = clientY
    }

    // @TODO Should use dynamic viewport context.
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const top = 0
    const bottom = viewportHeight
    const left = 0
    const right = viewportWidth

    // Increase the drag precision instead of the a single pixel.
    const treshhold = Math.ceil(devicePixelRatio * 2)

    // Limit the Pointer boundary within the viewport only
    if (clientY <= top + treshhold) {
      this.currentEdgeY = 'top'
    } else if (clientY >= bottom - treshhold) {
      this.currentEdgeY = 'bottom'
    } else {
      this.currentEdgeY = undefined
    }

    if (clientX <= left + treshhold) {
      this.currentEdgeX = 'left'
    } else if (clientX >= bottom - treshhold) {
      this.currentEdgeX = 'right'
    } else {
      this.currentEdgeX = undefined
    }

    // Failsafe that should exit the current Drag interaction while the current
    // pointer position is outisde the area for a certain duration.
    if (!this.currentPivot || this.currentPivot === 5) {
      if (clientX < 0 || clientX > viewportWidth || clientY < 0 || clientY > viewportHeight) {
        if (this.currentInteractionResponse === undefined) {
          this.currentInteractionResponse && clearTimeout(this.currentInteractionResponse)
          this.currentInteractionResponse = setTimeout(() => this.handleDragEnd(event), 1000)
        }
      }
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
    } else if (!EnlightenmentInputController.keyCodes.meta.includes(keyCode)) {
      this.handleCurrentElement(event.target)
    } else {
      this.throttle(() => {
        this.handleCurrentElement(document.activeElement)
      })
    }
  }

  /**
   * Returns the clientX and clientY of the defined Pointer context.
   *
   * @param event Defines the Event interface from the defined MouseEvent or
   * TouchEvent.
   */
  protected usePointerPosition(event: MouseEvent | TouchEvent) {
    if (!event || !this.isGrabbed) {
      return []
    }

    let clientX = 0
    let clientY = 0

    if (event instanceof MouseEvent) {
      clientX = event.clientX
      clientY = event.clientY
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    }

    return [clientX, clientY]
  }
}
