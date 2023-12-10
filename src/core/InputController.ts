import { EnlightenmentInputControllerPointerData } from 'src/_types/main'

import { eventOptions } from 'src/core/Mixins'

import { EnlightenmentColorHelper } from 'src/core/ColorHelper'

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
   * Defines the possible interaction Type values to use from the
   * [data-interaction] Data Attribute that should be assigned from the
   * handleDragStart() target element.
   */
  static interactionTypes = ['move', 'move-x', 'move-y', 'resize', 'resize-x', 'resize-y']

  /**
   * Should contain the updated Resize values for the selected Drag context.
   */
  currentContext?: HTMLElement
  currentContextX?: number
  currentContextY?: number
  currentContextWidth?: number
  currentContextHeight?: number
  currentContextTranslateX?: number
  currentContextTranslateY?: number

  /**
   * Should hold the current edge value while isGrabbed equals TRUE.
   */
  currentEdgeX?: number
  currentEdgeY?: number

  /**
   * Keep track of the interaction amount within the selected duration.
   */
  currentInteractions = 0
  currentInteractionRequest?: number
  currentInteractionResponse?: number
  currentInteractionType?: string
  currentInteractionVelocityX?: number
  currentInteractionVelocityY?: number

  /**
   * Keep track of the interaction trigger that is currently used.
   */
  currentInteractionTarget?: Element

  /**
   * Optional flag that should be used by the loaded FocusTrap custom Element to
   * hold the current focus within the defined context.
   */
  hasActiveFocusTrap?: boolean = false

  /**
   * Should hold the current integer X & Y values of the defined Pointer.
   */
  initialPointerX?: number
  initialPointerY?: number

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
   * Assigns a new Interaction response callback that should end the current
   * interaction. This should stop any interaction when the Pointer position
   * is outside the visible viewport.
   */
  protected assignCurrentDragTimeout() {
    if (this.currentInteractionResponse === undefined) {
      this.currentInteractionResponse = setTimeout(() => this.handleDragEnd(), 3000)
    }
  }

  /**
   * Clears the existing Interaction response callback and remove the initial
   * timeout ID.
   */
  protected clearCurrentDragTimeout() {
    this.currentInteractionResponse && clearTimeout(this.currentInteractionResponse)
    this.currentInteractionResponse = undefined
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
    this.currentInteractionRequest && cancelAnimationFrame(this.currentInteractionRequest)

    const context = this.useContext() as HTMLElement

    if (this.isGrabbed) {
      if (context) {
        this.currentContext = undefined

        // Cleanup the optional running Drag Timeout.
        this.clearCurrentDragTimeout()

        // Validate the updated position and size and ensure it fits within the
        // visible viewport.
        this.clearAnimationFrame(this.currentInteractionRequest)
        this.currentInteractionResponse = this.useAnimationFrame(() => {
          const bounds = this.useBounds(context)

          if (this.currentInteractions <= 1) {
            this.resize(context, {
              x: this.currentContextX,
              y: this.currentContextY
            })
          }

          if (bounds.right) {
            this.resize(context, { width: window.innerWidth - context.offsetLeft })
          } else if (bounds.left) {
            this.resize(context, { x: 0, width: context.offsetWidth + context.offsetLeft })
          }

          if (bounds.bottom) {
            this.resize(context, { height: window.innerHeight - context.offsetTop })
          } else if (bounds.top) {
            this.resize(context, { y: 0, height: context.offsetHeight + context.offsetTop })
          }

          const ariaTarget = this.currentContext || this.useContext() || this
          ariaTarget &&
            ariaTarget.removeAttribute(EnlightenmentInputController.defaults.attrGrabbed)

          this.currentInteractionRequest = undefined
        })
      }
    }

    this.currentContextHeight = undefined
    this.currentContextWidth = undefined
    this.currentInteractionResponse = undefined
    this.currentInteractionTarget = undefined
    this.currentPivot = undefined
    this.isGrabbed = false
    this.updateAttributeAlias('isGrabbed', EnlightenmentInputController.defaults.attrGrabbed, true)

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
   * @param customTarget Use the defined HTMLElement
   * currentInteractionTarget instead.
   */
  @eventOptions({ passive: true })
  protected handleDragStart(event: MouseEvent | TouchEvent, customTarget?: HTMLElement) {
    if (!event || this.isGrabbed || this.preventEvent) {
      return
    }

    // Only listen for the main Mouse button.x
    if (event instanceof MouseEvent) {
      if (event.button !== 0) {
        return
      }
    }

    const target = customTarget || (event.target as HTMLElement)

    //@DEPRECATED
    // if (target && target.hasAttribute(EnlightenmentInputController.defaults.attrPivot)) {
    // }

    if (target) {
      this.currentInteractionTarget = target

      // const interaction = target.getAttribute('data-interaction')
      const pivot = EnlightenmentInputController.isInteger(
        target.getAttribute(EnlightenmentInputController.defaults.attrPivot)
      )

      this.currentPivot = pivot
    }

    // Apply the Drag behavior on the main Component context, since it should
    // contain all visible elements.
    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

    this.currentContext = context

    this.currentInteractions += 1

    // Enable single & double click interactions
    if (this.currentInteractions === 1) {
      this.throttle(() => {
        this.currentInteractions = 0
      }, this.delay * 12)
    }

    if (this.currentInteractions > 1) {
      return this.handleDragSecondary(event)
    }

    this.isGrabbed = true

    this.currentContextX = context.offsetLeft
    this.currentContextY = context.offsetTop

    const [clientX, clientY] = this.usePointerPosition(event)

    this.initialPointerX = Math.round(clientX)
    this.initialPointerY = Math.round(clientY)

    this.handleCurrentElement(this)

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

    // Ensure the interaction is limited to the defined FPS.
    this.assignAnimationTimestamp()
  }

  /**
   * Callback handler that should initiate when the secondary Pointer
   * interaction is triggered.
   * @param event
   * @returns
   */
  protected handleDragSecondary(event: MouseEvent | TouchEvent) {
    this.isGrabbed = false

    // Ensure the previous DragEnd method is canceled to ensure it does not
    // interfere with this callback.
    // this.currentInteractionResponse && cancelAnimationFrame(this.currentInteractionResponse)

    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

    console.log('STRETCH', context, this.currentPivot)

    this.strech(context, this.currentPivot)
  }

  /**
   * Updates the required Drag position values while isGrabbed equals TRUE.
   *
   * @param event Expected Mouse or Touch event.
   */
  protected handleDragUpdate(event: MouseEvent | TouchEvent) {
    if (!event) {
      return this.handleDragEnd()
    }

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
    if (this.isCenterPivot()) {
      const ariaTarget = this.currentContext || this.useContext() || this

      !ariaTarget.hasAttribute(EnlightenmentInputController.defaults.attrGrabbed) &&
        ariaTarget.setAttribute(EnlightenmentInputController.defaults.attrGrabbed, 'true')

      if (ariaTarget !== this) {
        this.setAttribute(EnlightenmentInputController.defaults.attrGrabbed, 'true')
      }
    }

    if (clientX !== undefined) {
      this.previousPointerX = clientX
    }

    if (clientY !== undefined) {
      this.previousPointerY = clientY
    }

    // @TODO Should use dynamic viewport context.
    const viewport = this.useBoundingRect()

    // Increase the drag precision instead of the a single pixel.
    const treshhold = Math.ceil(devicePixelRatio * 2)

    // Assign the current edge for both X & Y axis with the defined treshhold.
    //          [top]
    //          -1
    // [left] -1 0 1 [right]
    //           1
    //        [bottom]
    if (clientY <= viewport.top + treshhold) {
      this.currentEdgeY = -1
    } else if (clientY >= viewport.height - treshhold) {
      this.currentEdgeY = 1
    } else {
      this.currentEdgeY = 0
    }

    if (clientX <= viewport.left + treshhold) {
      this.currentEdgeX = -1
    } else if (clientX >= viewport.width - treshhold) {
      this.currentEdgeX = 1
    } else {
      this.currentEdgeX = 0
    }

    // Failsafe that should exit the current Drag interaction while the current
    // pointer position is outisde the area for a certain duration.
    if (!this.isWithinViewport(clientX, clientY)) {
      this.assignCurrentDragTimeout()
    } else {
      this.clearCurrentDragTimeout()
    }

    this.currentInteractionRequest = this.useAnimationFrame(() => {
      let x = clientX - (this.initialPointerX || 0)
      let y = clientY - (this.initialPointerY || 0)
      if (clientX < viewport.left) {
        x = viewport.left
      } else if (clientX > viewport.width) {
        x = x + (clientX - viewport.width)
      }
      if (clientY < viewport.top) {
        y = viewport.top
      } else if (clientY > viewport.height) {
        y = y + (clientY - viewport.height)
      }

      this.handleDragUpdateCallback(this.currentContext || (this.useContext() as HTMLElement), {
        pivot: this.currentPivot,
        clientX,
        clientY,
        x,
        y
      })
    })

    // this.currentInteractionRequest = requestAnimationFrame(() => {
    //   let x = clientX - (this.initialPointerX || 0)
    //   let y = clientY - (this.initialPointerY || 0)

    //   if (clientX < viewport.left) {
    //     x = viewport.left
    //   } else if (clientX > viewport.width) {
    //     x = x + (clientX - viewport.width)
    //   }

    //   if (clientY < viewport.top) {
    //     y = viewport.top
    //   } else if (clientY > viewport.height) {
    //     y = y + (clientY - viewport.height)
    //   }

    //   if (this.isCenterPivot()) {
    //     this.handleDragUpdateMove(this.useContext() as HTMLElement, x, y)
    //   } else if (this.currentPivot) {
    //     this.handleDragUpdateResize(
    //       this.useContext() as HTMLElement,
    //       clientX,
    //       clientY,
    //       this.currentPivot
    //     )
    //   }
    // })
  }

  /**
   * Placeholder callback that is initiated within the request Animation Frame;
   * triggered by the last Drag Interaction. The actual component can ignore
   * the initial constructor.
   *
   * You can use this callback to call the required methods from your component,
   * like move, resizing or any othcer draggable operation.
   *
   * @param context Should apply any interaction logic on the defined context
   * Element.
   * @param properties Defines the related Pointer data defined from the
   * selected Animation frame; like the Pointer position and delta values.
   */
  protected handleDragUpdateCallback(
    context: HTMLElement,
    properties: EnlightenmentInputControllerPointerData
  ) {
    return [context, properties]
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
