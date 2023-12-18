import {
  EnlightenmentDOMResizeOptions,
  EnlightenmentInputControllerPointerData,
  EnlightenmentInteractionEndCallback
} from 'src/_types/main'

import { eventOptions } from 'src/core/Mixins'

import { EnlightenmentColorHelper } from 'src/core/ColorHelper'
import { Enlightenment } from 'src/Enlightenment'

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
  interactionContext?: HTMLElement
  interactionContextHeight?: number
  interactionContextTranslateX?: number
  interactionContextTranslateY?: number
  interactionContextWidth?: number
  interactionContextX?: number
  interactionContextY?: number
  interactionHost?: HTMLElement
  interactionTarget?: HTMLElement

  /**
   * Should hold the current edge value while isGrabbed equals TRUE.
   */
  currentEdgeX?: number
  currentEdgeY?: number

  /**
   * Reference to the actual Element that is mutated during the interaction.
   */

  /**
   * Keep track of the interaction amount within the selected duration.
   */
  currentInteractions = 0
  currentInteractionCount = 0
  currentInteractionEvent?: MouseEvent | TouchEvent
  currentInteractionRequest?: number
  currentInteractionResponse?: number
  currentInteractionVelocityX?: number
  currentInteractionVelocityY?: number

  /**
   * Keep track of the interaction trigger that is currently used.
   */
  currentInteractionOrigin?: Element

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

  interactionTolerance?: number

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
   * Defines the actual interaction target from the optional target Property
   * attribute. The parent Web Component will be used as target fallback or use
   * the initial Slotted Element or This Component as fallback targts.
   */
  protected defineTarget(selector?: string) {
    if (this.interactionTarget) {
      return true
    }

    const target = selector
      ? this.closest(selector) || this.querySelector(selector || '')
      : undefined

    const host = this.useHost(this) as any

    // Check if the current Component exists within another Enlightenment
    // component and use the parent as context instead
    if (!this.interactionTarget && !target && host && host !== this) {
      const context = host.useContext && host.useContext()

      if (context && context !== this) {
        this.interactionTarget = context

        this.log(['Current target defined from host context:', context], 'log')
      } else {
        this.interactionTarget = host

        this.log(['Current target defined from host:', context], 'log')
      }
    }

    // Assign the existing parent target defined from the target attribute.
    if (!this.interactionTarget && target) {
      this.interactionTarget = target as HTMLElement
    } else if (!this.interactionTarget) {
      // Use the first slotted Element instead if the custom target is not
      // defined for this Component.
      const initialElement = this.useInitialElement()
      this.interactionTarget = initialElement as HTMLElement

      if (!this.interactionTarget) {
        this.interactionTarget = this as any
      }
    }

    this.log(['Current target defined:', this.interactionTarget], 'log')

    if ((this.interactionTarget as any) !== this) {
      this.interactionHost = this.useHost(this.interactionTarget)
    }

    if (!this.interactionHost) {
      this.interactionHost = this
    }

    return this.interactionTarget ? true : false
  }

  /**
   * Callback handler that should cleanup the current Drag interaction.
   *
   * @param event Inherit the optional Mouse or Touch event interface.
   */
  protected handleDragEnd(event?: MouseEvent | TouchEvent, useViewport?: boolean) {
    return new Promise<boolean>((resolve) => {
      try {
        if (event) {
          if (!this.currentInteractionEvent || !this.isCurrentInteractionEvent(event as Event)) {
            return resolve(false)
          }
        }

        this.currentInteractionRequest && cancelAnimationFrame(this.currentInteractionRequest)
        let willRender = false

        if (this.isGrabbed) {
          const context = this.useContext() as HTMLElement

          if (context) {
            willRender = true

            // Cleanup the optional running Drag Timeout.
            this.clearCurrentDragTimeout()

            // Validate the updated position and size and ensure it fits within the
            // visible viewport.
            this.clearAnimationFrame(this.currentInteractionRequest)

            this.currentInteractionResponse = this.useAnimationFrame(() =>
              this.handleDragEndCallback(context, resolve, useViewport)
            )
          }
        }

        this.isGrabbed = false

        this.updateAttributeAlias(
          'isGrabbed',
          EnlightenmentInputController.defaults.attr.grabbed,
          true
        )

        this.omitGlobalEvent('mousemove', this.handleDragUpdate)
        this.omitGlobalEvent('mouseup', this.handleDragEnd)
        this.omitGlobalEvent('touchmove', this.handleDragUpdate)
        this.omitGlobalEvent('touchend', this.handleDragEnd)

        this.currentInteractionCount = 0

        if (!willRender) {
          resolve(false)
        }
      } catch (exception) {
        exception && this.log(exception, 'error')
      }
    })
  }

  /**
   * Callback handler that is called when the current interaction has ended.
   * This method ensures the actual interaction target fit's within the visible
   * viewport.
   *
   * @param context Use the actual interactionTarget from the useContext method.
   * @param resolve Resolver to ensure the callback is handled within the last
   * requested Animation Frame.
   */
  protected handleDragEndCallback(
    context: HTMLElement,
    resolve: EnlightenmentInteractionEndCallback,
    useViewport?: boolean
  ) {
    const bounds = this.useScreenBounds(context)
    const viewport = this.useBoundingRect()

    if (this.currentInteractions <= 1) {
      this.resize(context, {
        x: this.interactionContextX,
        y: this.interactionContextY
      })
    }

    if (!this.currentEdgeX && !this.currentEdgeY) {
      const [translateX, translateY] = EnlightenmentInputController.parseMatrixValue(
        context.style.transform
      )

      const maxHeight = viewport.height - Math.abs(context.offsetTop) - Math.abs(translateY || 0)
      const maxWidth = viewport.width - Math.abs(context.offsetLeft) - Math.abs(translateX || 0)

      const initial: EnlightenmentDOMResizeOptions = {
        fit: useViewport,
        width: context.offsetWidth,
        height: context.offsetHeight,
        x: context.offsetLeft + (translateX || 0),
        y: context.offsetTop + (translateY || 0)
      }
      const commit = { ...initial }

      if (useViewport) {
        // Fit X Axis.
        if (context.offsetWidth > maxWidth) {
          commit.width = maxWidth
        }

        // Fit Y Axis.
        if (context.offsetHeight > maxHeight) {
          commit.height = maxHeight
        }

        if (initial.x && initial.x < viewport.left) {
          commit.x = 0
        }

        if (initial.y && initial.y < viewport.top) {
          commit.y = 0
        }
      }

      if (!EnlightenmentInputController.compareValue(initial, commit)) {
        this.resize(context, commit)
      }
    }

    const cache = this.useContextCache(context)

    const ariaTarget = this.interactionContext || this.useContext() || this
    ariaTarget && ariaTarget.removeAttribute(EnlightenmentInputController.defaults.attr.grabbed)

    this.clearAnimationFrame(this.currentInteractionResponse)

    this.currentInteractionRequest = undefined
    this.currentInteractionEvent &&
      this.throttle(() => {
        this.currentInteractionEvent = undefined
        this.currentInteractionResponse = undefined

        resolve(true)
      })
  }

  /**
   * Defines the default Event handler to initiate the Drag interaction for
   * Mouse & Touch devices.
   *
   * @param event The expected Mouse or Touch Event.
   * @param customTarget Use the defined HTMLElement
   * currentInteractionOrigin instead.
   */
  protected handleDragStart(event: MouseEvent | TouchEvent, customTarget?: HTMLElement) {
    if (!event || this.preventEvent) {
      return
    }

    event.preventDefault && event.preventDefault()

    // Ensures to only use the initial Pointer Mouse or Touch Event.
    if (!this.isCurrentInteractionEvent(event)) {
      return
    }

    if (event instanceof MouseEvent) {
      // Only listen for the main Mouse button.x
      if (event.button !== 0) {
        return
      }
    }

    this.currentInteractionCount = 0

    const target = customTarget || (event.target as HTMLElement)

    //@DEPRECATED
    // if (target && target.hasAttribute(EnlightenmentInputController.defaults.attrPivot)) {
    // }

    if (target) {
      this.currentInteractionOrigin = target

      // const interaction = target.getAttribute('data-interaction')
      const pivot = EnlightenmentInputController.isInteger(
        target.getAttribute(EnlightenmentInputController.defaults.attr.pivot)
      )

      this.currentPivot = pivot
    }

    // Apply the Drag behavior on the main Component context, since it should
    // contain all visible elements.
    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

    if (!this.currentInteractions) {
      this.interactionContext = context
    }

    this.currentInteractions += 1

    // Enable single & double click interactions
    if (this.currentInteractions === 1) {
      this.throttle(() => {
        this.currentInteractions = 0
      }, EnlightenmentInputController.RPS)
    }

    if (this.currentInteractions > 1) {
      return this.handleDragSecondary(event)
    }

    this.isGrabbed = true

    this.interactionContextX = context.offsetLeft
    this.interactionContextY = context.offsetTop

    // Ensure the method is called only once since a MouseEvent a TouchEvent
    // can be called together.
    if (!this.currentInteractionEvent) {
      this.currentInteractionEvent = event
    }

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

    this.stretch(context, this.currentPivot)
  }

  /**
   * Updates the required Drag position values while isGrabbed equals TRUE.
   *
   * @param event Expected Mouse or Touch event.
   */
  protected handleDragUpdate(event: MouseEvent | TouchEvent) {
    if (!event) {
      this.handleDragEnd()

      return
    }

    // Don't continue if the initial Event instance does not match with the
    // current Event parameter value.
    if (!this.isCurrentInteractionEvent(event)) {
      return
    }

    const [clientX, clientY] = this.usePointerPosition(event)

    this.currentInteractionCount += 1

    if (this.interactionTolerance && this.interactionTolerance > this.currentInteractionCount) {
      this.initialPointerX = clientX
      this.initialPointerY = clientY

      return
    }

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
      const ariaTarget = this.interactionContext || this.useContext() || this

      !ariaTarget.hasAttribute(EnlightenmentInputController.defaults.attr.grabbed) &&
        ariaTarget.setAttribute(EnlightenmentInputController.defaults.attr.grabbed, 'true')

      if (ariaTarget !== this) {
        this.setAttribute(EnlightenmentInputController.defaults.attr.grabbed, 'true')
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
    const treshold = Math.ceil(devicePixelRatio * 2)

    // Assign the current edge for both X & Y axis with the defined treshold.
    //          [top]
    //          -1
    // [left] -1 0 1 [right]
    //           1
    //        [bottom]
    if (clientY <= viewport.top + treshold) {
      this.currentEdgeY = -1
    } else if (clientY >= viewport.height - treshold) {
      this.currentEdgeY = 1
    } else {
      this.currentEdgeY = 0
    }

    if (clientX <= viewport.left + treshold) {
      this.currentEdgeX = -1
    } else if (clientX >= viewport.width - treshold) {
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

      this.handleDragUpdateCallback(this.interactionContext || (this.useContext() as HTMLElement), {
        pivot: this.currentPivot,
        clientX,
        clientY,
        x,
        y
      })

      return true
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

  // protected handleGlobalResize(event?: Event) {

  // }

  /**
   * Compares the defined Event with the current Interaction Event that was
   * assigned during the initial Interaction event.
   *
   * @param event The Event object to compare.
   */
  protected isCurrentInteractionEvent(event: Event) {
    if (
      event instanceof MouseEvent &&
      this.currentInteractionEvent &&
      this.currentInteractionEvent instanceof MouseEvent === false
    ) {
      return false
    }

    if (
      event instanceof TouchEvent &&
      this.currentInteractionEvent &&
      this.currentInteractionEvent instanceof TouchEvent === false
    ) {
      return false
    }

    if (
      event instanceof MouseEvent &&
      this.currentInteractionEvent &&
      this.currentInteractionEvent instanceof MouseEvent
    ) {
      return true
    }

    if (
      this.currentInteractionEvent instanceof TouchEvent &&
      this.currentInteractionEvent &&
      event instanceof TouchEvent
    ) {
      return true
    }

    return !this.currentInteractionEvent ? true : false
  }

  /**
   * Returns the clientX and clientY of the defined Pointer context.
   *
   * @param event Defines the Event interface from the defined MouseEvent or
   * TouchEvent.
   */
  protected usePointerPosition(event: MouseEvent | TouchEvent) {
    if (!event) {
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
