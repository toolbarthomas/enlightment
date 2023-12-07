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
   * Defines the 9 possible pivots to use within the 2D Axis:
   *
   *    [1][2][3]
   *    [4][5][6]
   *    [7][8][9]
   */
  static pivots = {
    x: [1, 3, 4, 6, 7, 9],
    y: [1, 2, 3, 7, 8, 9]
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

    if (this.isGrabbed) {
      const context = this.useContext() as HTMLElement

      if (context) {
        this.currentInteractionResponse && clearTimeout(this.currentInteractionResponse)
        this.currentInteractionRequest = requestAnimationFrame(() => {
          console.log('BAR', this.currentInteractions, this.isGrabbed)

          if (this.currentInteractions <= 1) {
            this.resize(context, {
              x: this.currentContextX,
              y: this.currentContextY
            })
          }

          this.currentInteractionRequest = undefined
        })
      }
    }

    this.currentInteractionResponse = undefined
    this.currentInteractionTarget = undefined
    this.currentPivot = undefined
    this.isGrabbed = false

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

      const interaction = target.getAttribute('data-interaction')
      const pivot = EnlightenmentInputController.isInteger(
        target.getAttribute(EnlightenmentInputController.defaults.attrPivot)
      )

      this.currentPivot = pivot
      this.currentInteractionType = interaction
        ? EnlightenmentInputController.filterPropertyValue(
            interaction,
            EnlightenmentInputController.interactionTypes
          )
        : undefined
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
    console.log('CI', this.currentInteractions)

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

  protected handleDragSecondary(event) {
    this.isGrabbed = false

    console.log('Secondary', this.isGrabbed)
    // Ensure the previous DragEnd method is canceled to ensure it does not
    // interfere with this callback.
    // this.currentInteractionResponse && cancelAnimationFrame(this.currentInteractionResponse)

    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

    let initialStyle = {
      width: context.offsetWidth,
      height: context.offsetHeight,
      x: context.offsetLeft,
      y: context.offsetTop
    }
    let updatedStyle = { ...initialStyle }

    // console.log('TTT', this.currentPivot)

    switch (this.currentPivot) {
      case 1:
        updatedStyle.width = context.offsetLeft + context.offsetWidth
        updatedStyle.height = context.offsetTop + context.offsetHeight
        updatedStyle.x = 0
        updatedStyle.y = 0
        break

      case 2:
        updatedStyle.width = context.offsetWidth
        updatedStyle.height = context.offsetTop + context.offsetHeight
        updatedStyle.x = context.offsetLeft
        updatedStyle.y = 0
        break

      case 3:
        updatedStyle.width = window.innerWidth - context.offsetLeft
        updatedStyle.height = context.offsetTop + context.offsetHeight
        updatedStyle.x = context.offsetLeft
        updatedStyle.y = 0
        break

      case 4:
        updatedStyle.width = context.offsetLeft + context.offsetWidth
        updatedStyle.height = context.offsetHeight
        updatedStyle.x = 0
        break

      case 6:
        updatedStyle.width = window.innerWidth - context.offsetLeft
        updatedStyle.height = context.offsetHeight
        updatedStyle.x = context.offsetLeft
        break

      case 7:
        updatedStyle.width = context.offsetLeft + context.offsetWidth
        updatedStyle.height = window.innerHeight - context.offsetTop
        updatedStyle.x = 0
        break

      case 8:
        updatedStyle.width = context.offsetWidth
        updatedStyle.height = window.innerHeight - context.offsetTop
        updatedStyle.x = context.offsetLeft
        updatedStyle.y = context.offsetTop
        break

      case 9:
        updatedStyle.width = window.innerWidth - context.offsetLeft
        updatedStyle.height = window.innerHeight - context.offsetTop
        updatedStyle.x = context.offsetLeft
        updatedStyle.y = context.offsetTop
        break

      default:
        updatedStyle.width = window.innerWidth
        updatedStyle.height = window.innerHeight
        updatedStyle.x = 0
        updatedStyle.y = 0

        break
    }

    if (EnlightenmentColorHelper.compareValue(initialStyle, updatedStyle)) {
      if (this.currentContextCache) {
        this.resize(context, this.currentContextCache)
        this.updateCurrentContextCache()
      }
    } else {
      this.updateCurrentContextCache(context)
      this.resize(context, { ...updatedStyle, fit: true })
    }

    console.log('SECONDARY result', initialStyle, updatedStyle)
  }

  protected isCenterPivot() {
    return (
      !this.currentPivot ||
      (!EnlightenmentInputController.pivots.x.includes(this.currentPivot) &&
        !EnlightenmentInputController.pivots.y.includes(this.currentPivot))
    )
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
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
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
    } else if (clientY >= viewportHeight - treshhold) {
      this.currentEdgeY = 1
    } else {
      this.currentEdgeY = 0
    }

    if (clientX <= 0 + treshhold) {
      this.currentEdgeX = -1
    } else if (clientX >= viewportHeight - treshhold) {
      this.currentEdgeX = 1
    } else {
      this.currentEdgeX = 0
    }

    // Failsafe that should exit the current Drag interaction while the current
    // pointer position is outisde the area for a certain duration.
    if (this.isCenterPivot()) {
      if (clientX < 0 || clientX > viewportWidth || clientY < 0 || clientY > viewportHeight) {
        if (this.currentInteractionResponse === undefined) {
          this.currentInteractionResponse && clearTimeout(this.currentInteractionResponse)
          this.currentInteractionResponse = setTimeout(() => this.handleDragEnd(event), 1000)
        }
      }

      this.currentInteractionRequest = requestAnimationFrame(() => {
        let x = clientX - this.initialPointerX
        let y = clientY - this.initialPointerY

        const target = this.currentInteractionTarget

        if (target) {
          const axis = EnlightenmentInputController.filterPropertyValue(
            target.getAttribute(EnlightenmentInputController.defaults.attrAxis),
            ['x', 'y']
          )

          // Limit the current Drag interaction to the optional Axis
          if (axis === 'x') {
            y = 0
          } else if (axis === 'y') {
            x = 0
          }
        }

        //@todo should inherit [fit] from actual modula
        this.transform(this.useContext(), x, y, true)
      })
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
