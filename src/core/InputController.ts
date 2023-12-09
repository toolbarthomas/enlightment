import {
  GlobalEvent,
  GlobalEventHandler,
  GlobalEventOptions,
  GlobalEventType
} from 'src/_types/main'

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
  currentContextX?: number
  currentContextY?: number
  currentContextWidth?: number
  currentContextHeight?: number
  currentContextTranslateX?: number
  currentContextTranslateY?: number

  /**
   * Stores the previous defined Context properties to use for the next
   * Interaction callback.
   */
  currentContextCache?: {
    x: number
    y: number
    width: number
    height: number
  }

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

  private updateCurrentContextCache(context: HTMLElement) {
    if (!context) {
      return
    }

    const [translateX, translateY] = EnlightenmentInputController.parseMatrixValue(
      context.style.transform
    )

    this.currentContextCache = {
      x: context.offsetLeft + (translateX || 0),
      y: context.offsetLeft + (translateY || 0),
      width: context.offsetWidth,
      height: context.offsetHeight
    }
  }

  protected assignCurrentDragTimeout() {
    if (this.currentInteractionResponse === undefined) {
      this.currentInteractionResponse = setTimeout(() => this.handleDragEnd(event), 1000)
    }
  }

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
        // Cleanup the optional running Drag Timeout.
        this.clearCurrentDragTimeout()

        // Validate the updated position and size and ensure it fits within the
        // visible viewport.
        this.currentInteractionRequest = requestAnimationFrame(() => {
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
   */
  protected handleDragStart(event: MouseEvent | TouchEvent) {
    if (!event || this.isGrabbed || this.preventEvent) {
      return
    }

    event.preventDefault()

    // Only listen for the main Mouse button.x
    if (event instanceof MouseEvent) {
      if (event.button !== 0) {
        return
      }
    }

    const target = event.target as HTMLElement

    if (target && target.hasAttribute(EnlightenmentInputController.defaults.attrPivot)) {
    }

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
  }

  /**
   * Callback handler that should initiate when the secondary Pointer
   * interaction is triggered.
   * @param event
   * @returns
   */
  protected handleDragSecondary(event) {
    this.isGrabbed = false

    // Ensure the previous DragEnd method is canceled to ensure it does not
    // interfere with this callback.
    // this.currentInteractionResponse && cancelAnimationFrame(this.currentInteractionResponse)

    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

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
    const viewport = this.useViewport()
    // const top = 0
    // const bottom = viewportHeight
    // const left = 0
    // const right = viewportWidth

    // Increase the drag precision instead of the a single pixel.
    const treshhold = Math.ceil(devicePixelRatio * 2)

    // Assign the current edge for both X & Y axis with the defined treshhold.
    //          [top]
    //          -1
    // [left] -1 0 1 [right]
    //           1
    //        [bottom]
    if (clientY <= top + treshhold) {
      this.currentEdgeY = -1
    } else if (clientY >= viewport.height - treshhold) {
      this.currentEdgeY = 1
    } else {
      this.currentEdgeY = 0
    }

    if (clientX <= 0 + treshhold) {
      this.currentEdgeX = -1
    } else if (clientX >= viewport.height - treshhold) {
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

    this.currentInteractionRequest = requestAnimationFrame(() => {
      let x = clientX - this.initialPointerX
      let y = clientY - this.initialPointerY

      if (clientX < viewport.left) {
        x = viewport.left
        console.log('RESET MIN')
      } else if (clientX > viewport.width) {
        x = x + (clientX - viewport.width)
        console.log('RESET MAX')
      }

      if (clientY < viewport.top) {
        console.log(this.previ)

        y = viewport
      } else if (clientY > viewport.height) {
        y = y + (clientY - viewport.height)
      }

      if (this.isCenterPivot()) {
        this.handleDragUpdateMove(this.useContext(), x, y)
      } else if (this.currentPivot) {
        this.handleDragUpdateResize(this.useContext(), clientX, clientY, this.currentPivot)
      }
    })
  }

  protected handleDragUpdateMove(context: HTMLElement, x: number, y: number) {
    const target = this.currentInteractionTarget

    let left = x
    let top = y

    if (target) {
      const axis = EnlightenmentInputController.filterPropertyValue(
        target.getAttribute(EnlightenmentInputController.defaults.attrAxis),
        ['x', 'y']
      )

      // Limit the current Drag interaction to the optional Axis
      if (axis === 'x') {
        top = 0
      } else if (axis === 'y') {
        left = 0
      }
    }

    //@todo should inherit [fit] from actual modula
    this.transform(context, left, top, true)
  }
  protected handleDragUpdateResize(context: HTMLElement, x: number, y: number, pivot: number) {
    if (!context) {
      return
    }

    if (!this.currentContextWidth) {
      this.currentContextWidth = context.offsetWidth
    }

    if (!this.currentContextHeight) {
      this.currentContextHeight = context.offsetHeight
    }

    const resizeX = EnlightenmentInputController.pivots.x.includes(pivot)
    const resizeY = EnlightenmentInputController.pivots.y.includes(pivot)

    const left = x - this.initialPointerX
    const top = y - this.initialPointerY
    const viewport = this.useViewport()
    let height = 0
    let width = 0
    const [fallbackX, fallbackY] = EnlightenmentInputController.parseMatrixValue(
      context.style.transform
    )

    let translateX = fallbackX || 0
    let translateY = fallbackY || 0

    const bounds = this.useBounds(context, fallbackX, fallbackY)

    if (bounds.top || bounds.right || bounds.bottom || bounds.left) {
      this.assignCurrentDragTimeout()
    } else if (this.isWithinViewport(x, y)) {
      this.clearCurrentDragTimeout()
    }

    if (resizeX) {
      if ((bounds.right && this.currentInteractionVelocityX !== -1) || x > viewport.width) {
        // width = window.innerWidth - context.offsetLeft
        // this.currentWidth = context.offsetWidth
        console.log('TOO WIDE', this.edgeX)
      } else {
        // const right = clientX <= context.offsetLeft && [1, 4, 7].includes(this.currentPivot)
        // const left = clientX <= context.offsetLeft && [1, 4, 7].includes(this.currentPivot)mbv

        let rtl = false

        if (this.currentInteractionVelocityX !== -1 && [3, 6, 9].includes(this.currentPivot)) {
          rtl = true
          console.log('RTL1')
        } else if (
          this.currentInteractionVelocityX !== 1 &&
          [3, 6, 9].includes(this.currentPivot)
        ) {
          console.log('RTL2')
          rtl = true

          if (x <= context.offsetLeft) {
            console.log('THIS?')
            return this.handleDragEnd()
          }
        } else if (
          this.currentInteractionVelocityX !== 1 &&
          [1, 4, 7].includes(this.currentPivot)
        ) {
          console.log('RTL3', left)
          rtl = false
          if (!bounds.left) {
            translateX = left
          }
        } else if (
          this.currentInteractionVelocityX !== -1 &&
          [1, 4, 7].includes(this.currentPivot)
        ) {
          console.log('RTL4', translateX, x, context.offsetLeft)
          // console.log('RTL4', this.currentInteractionVelocityX, this.currentInteractionVelocityY)
          translateX = left
          rtl = false

          if (x >= (fallbackX || 0) + context.offsetLeft + context.offsetWidth) {
            return this.handleDragEnd()
          }
        }

        if (rtl) {
          width = this.currentContextWidth + left
          console.log('REV', x <= viewport.width)
        } else if (!rtl) {
          width = this.currentContextWidth - left
        } else {
          width = context.offsetWidth
        }

        if (!this.currentInteractionVelocityX) {
          width = context.offsetWidth
        }

        // Limit the final height within the viewport
        if (context.offsetLeft + translateX + width > viewport.width) {
          width = viewport.width - context.offsetLeft
        }

        // Prevent the resize to flip while the context width is mirrored.
        if (width && width <= 200) {
          translateX = translateX
        } else if (width <= viewport.left) {
          return this.assignCurrentDragTimeout()
        }

        // if ([1, 4, 7].includes(this.currentPivot)) {
        //   width = this.currentWidth - x

        //   // if () {
        //   translateX = x
        //   // }
        // } else {
        //   width = this.currentWidth + x
        // }

        // let left = clientX <= context.offsetLeft

        // console.log('POINTER', this.previousPointerX, clientX)

        // if (clientX >= context.offsetLeft && [1, 4, 7].includes(this.currentPivot)) {
        //   left = false
        //   console.log('Should move left')
        // }

        // // left
        // if (left) {
        // } else {
        //   // right'
        //   width = this.currentWidth + x
        // }
      }
    }

    if (resizeY) {
      if (context.offsetTop + context.offsetHeight >= viewport.height && bounds.bottom) {
        height = viewport.height - context.offsetTop
        console.log('TOO HIGH', height, height)
      } else {
        // if ([1, 2, 3].includes(this.currentPivot)) {
        //   height = this.currentHeight - y

        let btt = false

        if (this.currentInteractionVelocityY === 1 && [7, 8, 9].includes(this.currentPivot)) {
          btt = true
        } else if (
          this.currentInteractionVelocityY == -1 &&
          [7, 8, 9].includes(this.currentPivot)
        ) {
          btt = true

          if (y <= context.offsetTop) {
            console.log('STOP')

            return this.handleDragEnd()
          }
        } else if (
          this.currentInteractionVelocityY === -1 &&
          [1, 2, 3].includes(this.currentPivot)
        ) {
          btt = false
          if (!bounds.top) {
            translateY = top
          }
        } else if (
          this.currentInteractionVelocityY === 1 &&
          [1, 2, 3].includes(this.currentPivot)
        ) {
          translateY = top
          btt = false

          if (y >= (fallbackY || 0) + context.offsetTop + context.offsetHeight) {
            console.log('STOP')
            return this.handleDragEnd()
          }
        }

        //   // if () {
        //   translateY = y
        // } else {
        // }
        if (btt && !bounds.bottom) {
          height = this.currentContextHeight + top
          console.log('RESET?', height)
        } else if (!bounds.top && y >= 0 && y <= viewport.height) {
          console.log('fallback', this.currentContextHeight, top)
          height = this.currentContextHeight - top
        } else {
          height = context.offsetHeight
          console.log('RRRR', height)
        }

        if (!this.currentInteractionVelocityY) {
          height = context.offsetHeight
        }

        // Limit the final height within the viewport
        if (context.offsetTop + translateY + height > viewport.height) {
          height = viewport.height - context.offsetTop
        }

        // Prevent the resize to flip while the context height is mirrored.
        if (height && height <= 200) {
          translateY = fallbackY
        } else if (height <= viewport.top) {
          console.log('RRRR, RRRR')
          return this.assignCurrentDragTimeout()
        }
      }
    }

    //@DEPRECATED
    // if (!this.currentInteractionVelocityX && !bounds.left && !bounds.right) {
    //   width = context.offsetWidth
    // }

    // if (!this.currentInteractionVelocityY && !bounds.top && !bounds.bottom) {
    //   height = context.offsetHeight
    // }

    if (width) {
      if (width < 300) {
        width = 300
      }

      if (context.offsetWidth === width && fallbackX) {
        translateX = fallbackX
      }

      context.style.width = `${width}px`
    }

    if (height) {
      if (height < 200) {
        console.log('fallback', height)
        height = 200
      }

      if (context.offsetHeight === height && fallbackY) {
        console.log('fallback')
        // translateY = fallbackY
      }

      context.style.height = `${height}px`
    }

    console.log('tx', translateY)

    if (translateX || translateY) {
      this.transform(context, translateX || fallbackX, translateY || fallbackY)
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
