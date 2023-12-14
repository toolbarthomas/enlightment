import {
  createRef,
  customElement,
  Enlightenment,
  eventOptions,
  html,
  property,
  ref
} from 'src/Enlightenment'

import {
  EnlightenmentDOMResizeOptions,
  EnlightenmentInputControllerPointerData
} from 'src/_types/main'

import styles from './Draggable.scss'

@customElement('draggable-element')
class EnlightenmentDraggable extends Enlightenment {
  static styles = [styles]

  /**
   * Defines the pivot position and interaction behavior for the component.
   */
  @property({
    type: Number
  })
  pivot?: number

  /**
   * Apply the requested interaction on the actual component while TRUE.
   */
  @property({
    converter: Enlightenment.isBoolean,
    type: Boolean
  })
  static?: boolean

  /**
   * Ignore the initial Screen limitation while TRUE.
   */
  @property({
    converter: Enlightenment.isBoolean,
    type: Boolean
  })
  fixed?: boolean

  /**
   * Apply the requested interaction on the defined target selector.
   */
  @property({
    type: String
  })
  target?: string

  /**
   * Reference to the actual Element that is mutated during the interaction.
   */
  currentTarget?: HTMLElement

  /**
   * Optional host reference
   */
  currentHost?: HTMLElement

  constructor() {
    super()
  }

  /**
   * Ignore the initial Context reference and us the custom target reference
   * instead. This should apply any DOM mutation on the selected target instead
   * within the Component context.
   */
  protected useContext() {
    const context = super.useContext()

    if (!this.currentTarget) {
      return context
    }

    if (context !== this.currentTarget) {
      this.log('Using defined [target] instead of initial context...', 'log')
    }

    return this.currentTarget
  }

  /**
   * Defines the actual interaction target from the optional target Property
   * attribute. The parent Web Component will be used as target fallback or use
   * the initial Slotted Element or This Component as fallback targts.
   */
  protected defineTarget() {
    if (this.currentTarget) {
      return this.currentTarget
    }

    const target = this.target
      ? this.closest(this.target) || this.querySelector(this.target || '')
      : undefined

    const host = this.useHost(this) as any

    if (this.preventEvent || (host && host.preventEvent)) {
      this.handleDragEnd()

      return false
    }

    if (this.static && !target) {
      this.currentTarget = this as any
    }

    // Check if the current Component exists within another Enlightenment
    // component and use the parent as context instead
    if (!this.currentTarget && !target && host && host !== this) {
      const context = host.useContext && host.useContext()

      if (context && context !== this) {
        this.currentTarget = context

        this.log(['Draggable target defined from host context:', context], 'log')
      } else {
        this.currentTarget = host

        this.log(['Draggable target defined from host:', context], 'log')
      }
    }

    // Assign the existing parent target defined from the target attribute.
    if (!this.currentTarget && target) {
      this.currentTarget = target as HTMLElement
    } else if (!this.currentTarget) {
      // Use the first slotted Element instead if the custom target is not
      // defined for this Component.
      const initialElement = this.useInitialElement()
      this.currentTarget = initialElement as HTMLElement

      if (!this.currentTarget) {
        this.currentTarget = this as any
      }
    }

    this.log(['Draggable target defined:', this.currentTarget], 'log')

    if (this.currentTarget) {
      this.applyCurrentTargetStyles()
    }

    if ((this.currentTarget as any) !== this) {
      this.currentHost = this.useHost(this.currentTarget)
    }

    if (!this.currentHost) {
      this.currentHost = this
    }

    return this.currentTarget ? true : false
  }

  /**
   * Ensure the Interaction target is defined within the current DOM.
   */
  handleUpdate() {
    super.handleUpdate()

    this.defineTarget()
  }

  /**
   * Removes the required interaction styles on the current target.
   */
  protected cleanupCurrentTarget() {
    if (this.currentTarget) {
      this.currentTarget.style.userSelect = ''
    }
  }

  /**
   * Validates the updated interaction after the last requested Animation Frame
   * that was defined in the InputController. This callback defines the
   * requested interaction from the given target pivot.
   *
   * @param context Validate from the defined context.
   * @param properties Defines the required Pointer data to use.
   */
  protected handleDragUpdateCallback(
    context: HTMLElement,
    properties: EnlightenmentInputControllerPointerData
  ) {
    const { clientX, clientY, pivot, x, y } = properties || {}

    if (this.isCenterPivot()) {
      this.handleDragUpdateMove(context, x, y)
    } else if (this.currentPivot) {
      this.handleDragUpdateResize(context, clientX, clientY, this.currentPivot)
    }

    return super.handleDragUpdateCallback(context, properties)
  }

  /**
   * Assign the required position styles for the actual target context to ensure
   * the interaction is displayed correctly.
   */
  protected applyCurrentTargetStyles() {
    if (this.currentTarget) {
      const { position, top, left, width, height } = this.currentTarget.style

      if (!top) {
        this.currentTarget.style.top = `${this.currentTarget.offsetTop}px`
      }

      if (!left) {
        this.currentTarget.style.left = `${this.currentTarget.offsetLeft}px`
      }

      if (!position) {
        this.currentTarget.style.position = 'absolute'
      }

      const viewport = this.useBoundingRect()

      if (!this.currentTarget.clientWidth && !width) {
        const minWidth = this.currentTarget.scrollWidth
        const maxWidth = minWidth > viewport.width ? viewport.width : minWidth

        this.currentTarget.style.width = `${maxWidth}px`
      }

      if (!this.currentTarget.clientHeight && !height) {
        const minHeight = this.currentTarget.scrollHeight
        const maxHeight = minHeight > viewport.height ? viewport.height : minHeight

        this.currentTarget.style.height = `${maxHeight}px`
      }
    }
  }

  /**
   * Callback handler that updates the X and/or Y position for the selected
   * context Element within the visible viewport.
   *
   * @param context Adjusts the current X/Y position from the current X & Y
   * delta value.
   * @param x Defines the delta X value from the initial Pointer X & defined x
   * parameter.
   * @param y Defines the delta Y value from the initial Pointer Y & defined y
   * parameter.
   */
  protected handleDragUpdateMove(context: HTMLElement, x: number, y: number) {
    const target = this.currentInteractionTarget

    let left = x
    let top = y

    if (target) {
      const axis = Enlightenment.filterPropertyValue(
        target.getAttribute(Enlightenment.defaults.attr.axis),
        ['', 'x', 'y']
      )

      // Limit the current Drag interaction to the optional Axis
      if (axis === 'x') {
        top = 0
      } else if (axis === 'y') {
        left = 0
      }
    }

    // Hold the previous translateX / translateY value while the current X / Y
    // position is outside the defined viewport.
    if (!x || !y) {
      const [translateX, translateY] = Enlightenment.parseMatrixValue(context.style.transform)

      left = translateX
      top = translateY
    }

    //@todo should inherit [fit] from actual modula
    this.transform(context, left, top, !this.fixed ? window : undefined)
  }

  /**
   * Callback handler that should resize the defined context Element within
   * the visible viewport.
   *
   * @param context Appy the resize transformation on the defined Element.
   * @param x Calculate the width from the defined X position value.
   * @param y Calculate the height from the defined X position value.
   * @param pivot Apply the actual resize from the defined pivots: (1-9). The
   * current defined 2D position will updated while the size is increased or
   * decreased from the selected pivot position.
   */
  protected handleDragUpdateResize(context: HTMLElement, x: number, y: number, pivot: number) {
    if (!context || !this.currentPivot) {
      return
    }

    if (!this.currentContextWidth) {
      this.currentContextWidth = context.offsetWidth
    }

    if (!this.currentContextHeight) {
      this.currentContextHeight = context.offsetHeight
    }

    // Check the movement for both X & Y axis.
    const resizeX = Enlightenment.pivots.x.includes(pivot)
    const resizeY = Enlightenment.pivots.y.includes(pivot)

    // Use the left and top values for the optional transform position during
    // the resize interaction.
    const left = x - (this.initialPointerX || 0)
    const top = y - (this.initialPointerY || 0)

    // Validate the Resize interaction within the defined viewport.
    const viewport = this.useBoundingRect()

    let height = 0
    let width = 0

    //
    const [initialTranslateX, initialTranslateY] = Enlightenment.parseMatrixValue(
      context.style.transform
    )

    let translateX = initialTranslateX || 0
    let translateY = initialTranslateY || 0

    const bounds = this.useScreenBounds(context, initialTranslateX, initialTranslateY)

    if (bounds.top || bounds.right || bounds.bottom || bounds.left) {
      this.assignCurrentDragTimeout()
    } else if (this.isWithinViewport(x, y)) {
      this.clearCurrentDragTimeout()
    }

    if (resizeX) {
      if ((bounds.right && this.currentInteractionVelocityX !== -1) || x > viewport.width) {
        this.assignCurrentDragTimeout()
      } else {
        let rtl = false

        if (this.currentInteractionVelocityX !== -1 && [3, 6, 9].includes(this.currentPivot)) {
          rtl = true
        } else if (
          this.currentInteractionVelocityX !== 1 &&
          [3, 6, 9].includes(this.currentPivot)
        ) {
          rtl = true

          if (x <= context.offsetLeft) {
            return this.handleDragEnd()
          }
        } else if (
          this.currentInteractionVelocityX !== 1 &&
          [1, 4, 7].includes(this.currentPivot)
        ) {
          rtl = false
          if (!bounds.left) {
            translateX = left
          }
        } else if (
          this.currentInteractionVelocityX !== -1 &&
          [1, 4, 7].includes(this.currentPivot)
        ) {
          translateX = left
          rtl = false

          if (x >= (initialTranslateX || 0) + context.offsetLeft + context.offsetWidth) {
            return this.handleDragEnd()
          }
        }

        if (rtl) {
          width = this.currentContextWidth + left
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
      }
    }

    if (resizeY) {
      if (context.offsetTop + context.offsetHeight >= viewport.height && bounds.bottom) {
        console.log('RESET?')
        height = viewport.height - context.offsetTop - (initialTranslateY || 0)
      } else {
        let btt = false

        if (this.currentInteractionVelocityY === 1 && [7, 8, 9].includes(this.currentPivot)) {
          btt = true
        } else if (
          this.currentInteractionVelocityY == -1 &&
          [7, 8, 9].includes(this.currentPivot)
        ) {
          btt = true

          if (y <= context.offsetTop) {
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

          if (y >= (initialTranslateY || 0) + context.offsetTop + context.offsetHeight) {
            return this.handleDragEnd()
          }
        }

        if (btt && !bounds.bottom) {
          height = this.currentContextHeight + top
        } else if (!bounds.top && y >= 0 && y <= viewport.height) {
          height = this.currentContextHeight - top
        } else {
          height = context.offsetHeight
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
          translateY = initialTranslateY
        } else if (height <= viewport.top) {
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

      if (context.offsetWidth === width && initialTranslateX) {
        translateX = initialTranslateX
      }

      context.style.width = `${width}px`
    }

    if (height) {
      if (height < 200) {
        height = 200
      }

      //@DEPRECATED
      // if (context.offsetHeight === height && initialTranslateY) {
      //   console.log('fallback')
      //   // translateY = initialTranslateY
      // }

      context.style.height = `${height}px`
    }

    if (translateX || translateY) {
      this.transform(context, translateX || initialTranslateX, translateY || initialTranslateY)
    }
  }

  /**
   * Reize the current Context element while the Pointer is at one of the 4
   * screen edges.
   */
  protected handleDragEdge() {
    if (this.currentHost) {
      this.currentHost.removeAttribute(Enlightenment.defaults.attr.edgeX)
      this.currentHost.removeAttribute(Enlightenment.defaults.attr.edgeY)
    }

    if (this.fixed) {
      return
    }

    if (!this.isCenterPivot(this.currentPivot)) {
      return
    }

    if (!this.currentHost || this.currentInteractions > 1) {
      return
    }

    if (!this.currentEdgeX && !this.currentEdgeY) {
      return
    }

    const context = this.currentTarget
    const viewport = this.useBoundingRect()
    const options: EnlightenmentDOMResizeOptions = {}

    // Stretch the context in the X and/or Y axis from while the Pointer has
    // reached an edge.
    // This replicates an inverted result of the stretch behavior.
    // @todo should implement seperate function?
    if (this.currentEdgeY) {
      options.width = viewport.width
      options.height = this.currentEdgeY === 1 ? Math.ceil(viewport.height / 2) : viewport.height
      options.x = viewport.left
      options.y = this.currentEdgeY === 1 ? Math.floor(viewport.height / 2) : viewport.top
    } else if (this.currentEdgeX) {
      options.width = Math.ceil(viewport.width / 2)
      options.height = viewport.height
      options.x = this.currentEdgeX === 1 ? Math.floor(viewport.width / 2) : viewport.left
      options.y = viewport.top
    }

    if (!options.width || !options.height || !context) {
      return
    }

    // Await the previous Interaction callback that was defined within a
    // requestAnimationFrame and cache the adjusted size since the stretch
    // method is replaced by the above logic.
    this.throttle(() => {
      this.assignContextCache({
        context,
        width: context.offsetWidth,
        height: context.offsetHeight,
        x: context.offsetTop,
        y: context.offsetLeft,
        screen: viewport
      })

      this.resize(context, options)
    })
  }

  /**
   * Interaction callback handler that should cleanup the previous Drag
   * interaction state.
   *
   * @param event Optional Event interface that exists while the initial
   * handler was used in the context of a Mouse or Touch Event.
   */
  protected handleDragEnd(event?: MouseEvent | TouchEvent) {
    const job = super.handleDragEnd(event, !this.fixed)

    job.then((result: boolean) => {
      if (!this.currentContext) {
        return
      }

      if (this.currentTarget && this.currentHost && !this.fixed) {
        const [stretchX, stretchY] = this.useStretched(this.currentTarget)

        this.omitGlobalEvent('resize', this.handleRestretch)

        if (stretchX || stretchY) {
          if (this.currentHost) {
            this.assignGlobalEvent('resize', this.handleRestretch, {
              context: window,
              thisArg: this.currentHost
            })
          }
        }
      }

      if (this.currentInteractions <= 1) {
        this.useContextCache(this.currentContext, true)
      }

      this.cleanupCurrentTarget()

      // Resize the Interaction context when the Pointer has reached one of the
      // viewport edges.
      this.handleDragEdge()

      this.updateStretched(this.currentTarget)

      // Remove the initial context height for the next possible interaction.
      this.currentContextHeight = undefined
      this.currentContextWidth = undefined
      this.currentTarget = undefined

      this.omitGlobalEvent('keydown', this.handleDragExit)

      this.hook(Enlightenment.defaults.customEvents.dragEnd, { context: this.currentHost || this })
    })

    return job
  }

  /**
   * Callback handler that should end the current Interaction.
   * @param event
   * @returns
   */
  protected handleDragExit(event: KeyboardEvent) {
    const { keyCode } = event || {}
    if (!Enlightenment.keyCodes.exit.includes(keyCode)) {
      return
    }

    this.handleCurrentElement(event.target)

    return this.handleDragEnd()
  }

  /**
   * Use the rendered Slot Element for the actual Drag Event target value.
   * @param event
   */
  @eventOptions({ passive: true })
  protected handleDragStart(event: MouseEvent | TouchEvent) {
    this.defineTarget()

    // The currentTarget could be undefined when the context element is
    // disabled.
    if (!this.currentTarget) {
      return
    }

    const slot = this.useSlot()

    if (!slot) {
      this.setAttribute(Enlightenment.defaults.attr.pivot, String(this.pivot))
    } else {
      this.removeAttribute(Enlightenment.defaults.attr.pivot)
    }

    this.assignGlobalEvent('keydown', this.handleDragExit, { once: true })

    const host = this.currentHost as Enlightenment

    if (host && typeof host.hook === 'function') {
      host.hook(Enlightenment.defaults.customEvents.dragStart)
    } else {
      this.hook(Enlightenment.defaults.customEvents.dragStart)
    }

    super.handleDragStart(event, slot)
  }

  /**
   * Implements the Drag interaction callbacks.
   *
   * @param event The inherited Mouse or Touch event.
   */
  protected handleDragUpdate(event: MouseEvent | TouchEvent) {
    super.handleDragUpdate(event)

    if (this.currentEdgeX && this.currentHost) {
      this.currentHost.setAttribute(Enlightenment.defaults.attr.edgeX, String(this.currentEdgeX))
    } else if (this.currentHost) {
      this.currentHost.removeAttribute(Enlightenment.defaults.attr.edgeX)
    }

    if (this.currentEdgeY && this.currentHost) {
      this.currentHost.setAttribute(Enlightenment.defaults.attr.edgeY, String(this.currentEdgeY))
    } else if (this.currentHost) {
      this.currentHost.removeAttribute(Enlightenment.defaults.attr.edgeY)
    }

    // Prevent content from being selecting while preforming the drag
    // interaction.
    if (this.currentTarget && !this.currentTarget.style.userSelect) {
      this.currentTarget.style.userSelect = 'none'
    }
  }

  /**
   * Optional resize handler that should be be called for the stretched context
   * elements.
   */
  protected handleRestretch() {
    // Throttle the actual handler without any arguments to ensure it is called
    // only once
    this.throttle(this.handleGlobalResize, Enlightenment.RPS)
  }

  /**
   * Ensures the stretched Context elements are resized according to the new
   * screen Size.
   *
   * @param event Defines the original resize Event Interface.
   */
  protected handleGlobalResize(event: UIEvent) {
    super.handleGlobalResize(event)

    this.defineTarget()

    const host = this.useHost(this.currentTarget)
    if (host) {
      const bounds = this.useBoundingRect()
      const width = host.hasAttribute(Enlightenment.defaults.attr.stretchX)
        ? bounds.width
        : undefined
      const height = host.hasAttribute(Enlightenment.defaults.attr.stretchY)
        ? bounds.height
        : undefined

      const x = height ? 0 : undefined
      const y = width ? 0 : undefined

      this.currentTarget &&
        this.resize(this.currentTarget, {
          width,
          height,
          x,
          y
        })
    }
  }

  /**
   * Updates the edgeX and edgeY HTML Attributes for the defined context host.
   *
   * @param context Find the actual host component from the defined context
   * or use the context itself otherwise.
   */
  protected updateStretched(context?: HTMLElement) {
    if (!context) {
      return
    }

    if (this.fixed) {
      return
    }

    const stretch: boolean[] = this.useStretched(context)
    const host = this.useHost(context) || context

    stretch.forEach((value, index) => {
      const name = index
        ? Enlightenment.defaults.attr.stretchY
        : Enlightenment.defaults.attr.stretchX

      if (value) {
        host.setAttribute(name, '')
      } else {
        host.removeAttribute(name)
      }
    })
  }

  render() {
    return html`<slot
      visually-hidden
      data-pivot="${this.pivot}"
      @touchstart=${this.handleDragStart}
      @mousedown=${this.handleDragStart}
    ></slot>`
  }
}
