import {
  createRef,
  customElement,
  Enlightenment,
  eventOptions,
  html,
  property,
  ref
} from '../Enlightenment'

import {
  DraggablePositionType,
  EnlightenmentDOMResizeOptions,
  EnlightenmentDraggableDefaults,
  EnlightenmentInputControllerPointerData,
  EnlightenmentInteractionData
} from '../_types/main'

import styles from './Draggable.scss'

/**
 * The Draggable Element interface enables the Drag interaction on the defined
 * target selector, host Component or initial slotted Element.
 *
 * It enables position and resize transformation on the the actual context
 * according to the defined pivot property.
 *
 * Created Element instances without any pivot will act as an overlay within the
 * rendered context and should trigger the Element dragging for Touch & Mouse
 * input. The actual parent element should defined it's actual position and
 * size.
 *
 * The optional [pivot] property accepts the value 1 to 9 that should defined
 * actual direction from North-west to Sout-east:
 *
 * [1][2][3]
 * [4][5][6]
 * [7][8][9]
 *
 * Any of these values will be positioned according to it's location and are
 * used as resize handle. The center pivot (5) ignores the resize interaction
 * and will use the drag behaviour.
 *
 * There are 4 position variants that will define the overall drag behavior:
 * - Inline: Respects the initial inline position and use the transform properties
 * only. The initial Web Component will be used as draggable context.
 * - Static: Use the static element within the component instead for the initial
 * drag operation. Resize is disabled for this method.
 * current viewport bounds.
 * - Absolute: Apply a absolute position for the draggable context within the
 * - Fixed: Apply a fixed position for the draggable context and ignore any
 * viewport bounds while the drag operation is active.
 *
 * @TODO
 *  - Implement Axis resize with optional key/method to resize in both directions
 */
@customElement('draggable-element')
export class EnlightenmentDraggable extends Enlightenment {
  static styles = [styles]

  static defaults: EnlightenmentDraggableDefaults = {
    ...Enlightenment.defaults,
    Draggable: {
      position: ['inline', 'static', 'absolute', 'fixed']
    }
  }

  /**
   * Converts the defined value to a valid X and optional Y threshold.
   * @param value
   */
  static isThreshold(value: string | null) {
    if (!value) {
      return []
    }

    const [x, y] = Enlightenment.parseJSON(value)

    return [Math.abs(x), Math.abs(y)].filter((v) => !isNaN(v))
  }

  /**
   * Limit the interaction context to the defined X or Y axis.
   */
  @property({
    converter: (value) => Enlightenment.filterProperty(value, ['x', 'y']),
    type: String
  })
  axis?: number

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
   * Will dispatch additional Events to the host component when the defined
   * X and/or Y delta values exceeds the optional threshold values that is
   * assigned as comma separated value:
   *  - 100 = x 100 & y 100
   *  - 100,200 = x 100 & y 200
   */
  @property({
    converter: (value) => EnlightenmentDraggable.isThreshold(value),
    type: Array
  })
  threshold: number[] = []

  /**
   * Apply the requested interaction on the actual component while TRUE.
   */
  @property({
    converter: (value) =>
      Enlightenment.filterProperty(value, EnlightenmentDraggable.defaults.Draggable.position),
    type: String
  })
  position: DraggablePositionType = 'absolute'

  /**
   * Apply the requested interaction on the defined target selector.
   */
  @property({
    type: String
  })
  target?: string

  /**
   * Ignore the initial Context reference and us the custom target reference
   * instead. This should apply any DOM mutation on the selected target instead
   * within the Component context.
   */
  public useContext() {
    const context = super.useContext()

    if (!this.interactionTarget) {
      return context
    }

    if (context !== this.interactionTarget) {
      this.log('Using defined [target] instead of initial context...', 'log')
    }

    return this.interactionTarget
  }

  /**
   * Ensure the Interaction target is defined within the current DOM.
   */
  protected handleUpdate(name?: string) {
    super.handleUpdate(name)

    this.defineTarget()
  }

  /**
   * Removes the required interaction styles on the current target.
   */
  protected cleanupinteractionTarget() {
    if (this.interactionTarget) {
      this.interactionTarget.style.userSelect = ''
      this.interactionTarget.style.overflow = ''
      this.interactionTarget.style.backfaceVisibility = ''
    }
  }

  protected defineTarget() {
    const target = super.defineTarget(this.target)

    this.applyinteractionTargetStyles()

    // Use the initial slotted element when the current Component is defined
    // with the [static] Attribute.
    if (this.static && !this.target) {
      this.interactionTarget = this.useInitialElement() as HTMLElement
    }

    return target
  }

  /**
   * Validates the updated interaction after the last requested Animation Frame
   * that was defined in the InputController. This callback defines the
   * requested interaction from  the given target pivot.
   *
   * @param context Validate from the defined context.
   * @param properties Defines the required Pointer data to use.
   */
  protected handleDragUpdateCallback(deltaX: number, deltaY: number) {
    if (this.currentInteraction.context) {
      if (this.isCenterPivot(this.currentInteraction.pivot)) {
        this.handleDragUpdateMove(this.currentInteraction.context, deltaX, deltaY)
      } else if (['absolute', 'fixed'].includes(this.position)) {
        this.handleDragUpdateResize(
          this.currentInteraction.context,
          deltaX,
          deltaY,
          this.currentInteraction.pivot || this.pivot
        )
      }
    }

    return super.handleDragUpdateCallback(deltaX, deltaY)
  }

  /**
   * Assign the required position styles for the actual target context to ensure
   * the interaction is displayed correctly.
   */
  protected applyinteractionTargetStyles() {
    if (this.interactionTarget) {
      const { position, top, left, width, height } = this.interactionTarget.style

      if (!top && this.position !== 'inline') {
        this.interactionTarget.style.top = `${this.interactionTarget.offsetTop}px`
      }

      if (!left && this.position !== 'inline') {
        this.interactionTarget.style.left = `${this.interactionTarget.offsetLeft}px`
      }

      if (!position && this.position !== 'inline') {
        this.interactionTarget.style.position = this.position === 'fixed' ? 'fixed' : 'absolute'
      }

      const viewport = this.useBoundingRect()

      if (!this.interactionTarget.clientWidth && !width) {
        const minWidth = this.interactionTarget.scrollWidth
        const maxWidth = minWidth > viewport.width ? viewport.width : minWidth

        this.interactionTarget.style.width = `${maxWidth}px`
      } else if (!width) {
        this.interactionTarget.style.width = `${this.interactionTarget.offsetWidth}px`
      }

      if (!this.interactionTarget.clientHeight && !height) {
        const minHeight = this.interactionTarget.scrollHeight
        const maxHeight = minHeight > viewport.height ? viewport.height : minHeight

        this.interactionTarget.style.height = `${maxHeight}px`
      } else if (!height) {
        this.interactionTarget.style.height = `${this.interactionTarget.offsetHeight}px`
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
  protected handleDragUpdateMove(context: HTMLElement, deltaX: number, deltaY: number) {
    let { x, y } = this.currentInteraction || {}
    const { edgeX, edgeY, pointerX, pointerY, previousPointerX, previousPointerY, velocityY } =
      this.currentInteraction || {}

    const axis = String(this.axis).toLowerCase()

    if (axis === 'x') {
      x = (x || 0) + deltaX
      y = 0
    } else if (axis === 'y') {
      x = 0
      y = (y || 0) + deltaY
    } else {
      x = (x || 0) + deltaX
      y = (y || 0) + deltaY
    }

    const host = this.useHost(this)
    const stage = host && host.useContext && (host.useContext() as HTMLElement)
    const offsetX = this.static && stage ? stage.offsetLeft : 0
    const offsetY = this.static && stage ? stage.offsetTop : 0

    const bounds =
      this.isOutsideViewport(context, this.static ? stage : undefined, offsetX, offsetY) || {}
    const viewport = this.useBoundingRect(this.static ? stage : undefined)

    if (this.static) {
      viewport.top = 0
      viewport.left = 0
    }

    if (this.position !== 'fixed') {
      // Limit the context transformation within the visible viewport.
      if (bounds.left) {
        if (x + context.offsetLeft < viewport.left) {
          x = undefined
        }
      } else if (bounds.right) {
        if (x + context.offsetLeft + context.offsetWidth > viewport.width) {
          x = undefined
        }
      }

      if (bounds.top) {
        if (y + context.offsetTop < viewport.top) {
          y = undefined
        }
      } else if (bounds.bottom) {
        if (y + context.offsetTop + context.offsetHeight > viewport.height) {
          y = undefined
        }
      }
    }

    const [stretchX, stretchY] = this.useStretched(context)
    const cache = this.useContextCache(context)

    if (cache && (stretchX || stretchY)) {
      // Calculate the relative offset values from the initial Pointer position
      // to ensure the Interaction context element is reset within the Pointer
      // area.
      const deltaX = ((pointerX || 0) - context.offsetLeft) / context.offsetWidth
      const deltaY = ((pointerY || 0) - context.offsetTop) / context.offsetHeight
      const offsetX = cache.width * deltaX
      const offsetY = cache.height * deltaY

      // @TODO SHOULD CHECK X & Y SINCE TITLE BAR PLACEMENT IS NOT CENTER
      this.resize(context, {
        width: cache.width,
        height: cache.height,
        x: (previousPointerX || 0) - Math.round(offsetX),
        y: (previousPointerY || 0) - Math.round(offsetY)
      })
    } else {
      this.transform(context, x, y)
    }
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
  protected handleDragUpdateResize(context: HTMLElement, x: number, y: number, pivot?: number) {
    if (!context || !pivot) {
      return
    }

    const { previousPointerX, previousPointerY, velocityX, velocityY } = this.currentInteraction

    // Check the movement for both X & Y axis.
    const resizeX = Enlightenment.pivots.x.includes(pivot)
    const resizeY = Enlightenment.pivots.y.includes(pivot)

    // Use the left and top values for the optional transform position during
    // the resize interaction.
    const left = x - (this.currentInteraction.pointerX || 0)
    const top = y - (this.currentInteraction.pointerY || 0)

    // Validate the Resize interaction within the defined viewport.
    const viewport = this.useBoundingRect()

    let height: number | undefined = 0
    let width: number | undefined = 0

    const [initialTranslateX, initialTranslateY] = Enlightenment.parseMatrixValue(
      context.style.transform
    )

    let translateX: number | undefined = initialTranslateX || 0
    let translateY: number | undefined = initialTranslateY || 0

    const bounds = this.useScreenBounds(context, initialTranslateX, initialTranslateY)

    // console.log('BOUNDS', bounds)

    if (bounds.top || bounds.right || bounds.bottom || bounds.left) {
      this.assignCurrentDragTimeout()
    } else if (this.isWithinViewport(x, y)) {
      this.clearCurrentDragTimeout()
    }

    const flipX = resizeX && velocityX && [1, 4, 7].includes(pivot)
    const flipY = resizeY && velocityY && [1, 2, 3].includes(pivot)

    if (flipX) {
      width = (this.currentInteraction.width || context.offsetWidth) - (resizeX ? x : 0)
    } else {
      width = (this.currentInteraction.width || context.offsetWidth) + (resizeX ? x : 0)
    }

    if (flipY) {
      height = (this.currentInteraction.height || context.offsetHeight) - (resizeY ? y : 0)
    } else {
      height = (this.currentInteraction.height || context.offsetHeight) + (resizeY ? y : 0)
    }

    if (flipX) {
      translateX = x
    }

    if (flipY) {
      translateY = y
    }

    // Prevent the width and/or height update when the Pointer has not moved
    // between the current and previous frame.
    if (!velocityX) {
      width = undefined
      translateX = undefined
    }

    if (!velocityY) {
      height = undefined
      translateY = undefined
    }

    if (width === 0) {
      translateX = undefined
    }

    if (height === 0) {
      translateY = undefined
    }

    const tX = translateX || 0
    const tY = translateY || 0

    // Don't update the next X/Y interaction if the Transformation exceeds the
    // base X & Y position.
    const resetX =
      (velocityX && !flipX && (previousPointerX || 0) <= context.offsetLeft + tX) ||
      (velocityX &&
        flipX &&
        (previousPointerX || 0) >= context.offsetLeft + tX + context.offsetWidth)

    const resetY =
      (velocityY && !flipY && (previousPointerY || 0) <= context.offsetTop + tY) ||
      (velocityY &&
        flipY &&
        (previousPointerY || 0) >= context.offsetTop + tY + context.offsetHeight)

    let reset = false

    const activeX =
      (this.currentInteraction.velocityX !== 1 &&
        [1, 4, 7].includes(this.currentInteraction.pivot || 0)) ||
      (this.currentInteraction.velocityX !== -1 &&
        [3, 6, 9].includes(this.currentInteraction.pivot || 0))

    const activeY =
      (this.currentInteraction.velocityY !== 1 &&
        [1, 2, 3].includes(this.currentInteraction.pivot || 0)) ||
      (this.currentInteraction.velocityY !== -1 &&
        [7, 8, 9].includes(this.currentInteraction.pivot || 0))

    if (resetX && activeX) {
      width = this.currentInteraction.width
      reset = true
    }

    if (resetY && activeY) {
      height = this.currentInteraction.height
      reset = true
    }

    if (activeX && width === context.offsetWidth) {
      width = undefined
      translateX = undefined
    }

    if (activeY && height === context.offsetHeight) {
      height = undefined
      translateY = undefined
    }

    this.resize(context, { width, height })

    if (flipX || flipY) {
      this.transform(context, translateX, translateY)
    }

    if (velocityX && !activeX && width && width !== context.offsetWidth) {
      reset = true
      // console.log('aa', width, context.offsetWidth)
    }

    if (velocityY && !activeY && height && height !== context.offsetHeight) {
      // this.handleDragEnd()
      reset = true
    }

    // Release the current Interaction while the reset flag is TRUE.
    reset && this.handleDragEnd()
  }

  /**
   * Reize the current Context element while the Pointer is at one of the 4
   * screen edges.
   */
  protected handleDragEdge(interaction: EnlightenmentInteractionData) {
    if (!interaction || !interaction.context) {
      return
    }

    if (this.position === 'static') {
      return
    }

    let { x, y } = this.restorePosition(interaction.context)
    let width = 0
    let height = 0

    const [stretchX, stretchY] = this.useStretched(interaction.context)
    const viewport = this.useBoundingRect()

    let save = false

    if (interaction.edgeY) {
      x = 0
      y = interaction.edgeY === -1 ? 0 : Math.floor(viewport.height / 2)
      height = interaction.edgeY === -1 ? viewport.height : Math.ceil(viewport.height / 2)
      width = viewport.width

      save = true
    } else if (interaction.edgeX) {
      x = interaction.edgeX === -1 ? 0 : Math.floor(viewport.width / 2)
      y = 0
      width = Math.ceil(viewport.width / 2)
      height = viewport.height

      save = true
    }

    if (save) {
      this.assignContextCache({
        context: interaction.context,
        height: interaction.context.offsetHeight,
        pivot: interaction.pivot,
        width: interaction.context.offsetWidth,
        x: interaction.context.offsetLeft,
        y: interaction.context.offsetTop
      })
    }

    // Maintain the final position for a fixed Drag interaction that has not
    // reached any viewport corner.
    if (this.position === 'fixed' && !interaction.edgeX && !interaction.edgeY) {
      const [translateX, translateY] = EnlightenmentDraggable.parseMatrix(
        interaction.context.style.transform
      )

      x = interaction.context.offsetLeft + (translateX || 0)
      y = interaction.context.offsetTop + (translateY || 0)
    }

    this.resize(interaction.context, {
      x,
      y,
      width: width ? width : undefined,
      height: height ? height : undefined
    })

    this.transform(interaction.context, 0, 0)

    return true
  }

  /**
   * Interaction callback handler that should cleanup the previous Drag
   * interaction state.
   *
   * @param event Optional Event interface that exists while the initial
   * handler was used in the context of a Mouse or Touch Event.
   */
  protected handleDragEnd(event?: MouseEvent | TouchEvent) {
    const job = super.handleDragEnd(event)
    const interactionCache = this.currentInteraction

    job.then((result) => {
      this.omitGlobalEvent('keydown', this.handleDragExit)

      if (!interactionCache.context) {
        return
      }

      const [translateX, translateY] = Enlightenment.parseMatrixValue(
        interactionCache.context.style.transform
      )

      // Convert the Transform position values to the initial absolute or
      // fixed values.
      if (this.isCenterPivot(interactionCache.pivot)) {
        if (this.position !== 'inline') {
          //@TODO HANDLEDRAGEDGE
          this.handleDragEdge(interactionCache)
        } else if (['absolute', 'fixed'].includes(this.position)) {
          // Ensure the final position is within the visible viewport
          // regardless of the position type.
          const { x, y } = this.restorePosition(interactionCache.context)

          this.transform(interactionCache.context, x, y)
        }
      } else {
        const x = interactionCache.context.offsetLeft + (translateX || 0)
        const y = interactionCache.context.offsetTop + (translateY || 0)

        this.resize(interactionCache.context, {
          x,
          y
        })

        if (
          interactionCache &&
          interactionCache.context &&
          !this.isCenterPivot(interactionCache.pivot)
        ) {
          const host = this.useHost(this)
          const stage = host && host.useContext && (host.useContext() as HTMLElement)
          const bounds =
            this.isOutsideViewport(interactionCache.context, this.static ? stage : undefined) || {}
          const viewport = this.useBoundingRect(this.static ? stage : undefined)

          // Ensure the context element cannot exceed outside the visible
          // viewport after a resize operation has been triggered.
          if ([1, 4, 7].includes(this.pivot || 0) && bounds.left) {
            const maxWidth =
              (interactionCache.width || interactionCache.context.offsetLeft) +
              (interactionCache.left || 0)

            this.resize(interactionCache.context, { x: 0, width: maxWidth })
          } else if ([3, 6, 9].includes(this.pivot || 0) && bounds.right) {
            const maxWidth = viewport.width - (interactionCache.left || 0)

            this.resize(interactionCache.context, { width: maxWidth })
          }

          if ([1, 2, 3].includes(this.pivot || 0) && bounds.top) {
            const maxHeight =
              (interactionCache.height || interactionCache.context.offsetHeight) +
              (interactionCache.top || 0)

            this.resize(interactionCache.context, { y: 0, height: maxHeight })
          } else if ([7, 8, 9].includes(this.pivot || 0) && bounds.bottom) {
            const maxHeight = viewport.height - (interactionCache.top || 0)

            this.resize(interactionCache.context, { height: maxHeight })
          }
        }

        if (this.position === 'inline') {
          interactionCache.context.style.top = ''
          interactionCache.context.style.left = ''
        } else {
          interactionCache.context.style.transform = ''
        }
      }

      // Ensure the currentElement property is removed for this component
      // instance.
      this.handleCurrentElement(null)

      this.hook(Enlightenment.defaults.customEvents.dragEnd, {
        context: this.interactionHost || this
      })

      this.clearCurrentInteraction()
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
  protected handleDragStart(event: MouseEvent | TouchEvent) {
    this.defineTarget()

    // The interactionTarget could be undefined when the context element is
    // disabled.
    if (!this.interactionTarget) {
      return
    }

    const slot = this.useSlot()

    if (!slot) {
      this.setAttribute(Enlightenment.defaults.attr.pivot, String(this.pivot))
    } else {
      this.removeAttribute(Enlightenment.defaults.attr.pivot)
    }

    this.assignGlobalEvent('keydown', this.handleDragExit, { once: true })

    this.hook(Enlightenment.defaults.customEvents.dragStart, {
      context: this.interactionHost || this
    })

    super.handleDragStart(event, slot)
  }

  /**
   * Implements the Drag interaction callbacks.
   *
   * @param event The inherited Mouse or Touch event.
   */
  protected handleDragUpdate(event: MouseEvent | TouchEvent) {
    const update = super.handleDragUpdate(event)

    if (!update) {
      return
    }

    const { context, edgeX, edgeY, host } = this.currentInteraction || {}

    if (host && edgeX) {
      host.setAttribute(Enlightenment.defaults.attr.edgeX, String(edgeX))
    } else if (host) {
      host.removeAttribute(Enlightenment.defaults.attr.edgeX)
    }

    if (edgeY && host) {
      host.setAttribute(Enlightenment.defaults.attr.edgeY, String(edgeY))
    } else if (host) {
      host.removeAttribute(Enlightenment.defaults.attr.edgeY)
    }

    // Prevent content from being selecting while preforming the drag
    // interaction.
    if (this.interactionTarget && !this.interactionTarget.style.userSelect) {
      this.interactionTarget.style.userSelect = 'none'
      this.interactionTarget.style.overflow = 'hidden'
      this.interactionTarget.style.backfaceVisibility = 'hidden'
    }

    return update
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

    const host = this.useHost(this.interactionTarget)
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

      this.interactionTarget &&
        this.resize(this.interactionTarget, {
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

  /**
   * Render the initial HTML that will apply the interaction no the existing
   * host component or defined target selector (closest or childElement).
   *
   * Or render the intial Slot element that is the default context Element with
   * a Draggable interaction if the [static] property is defined for the
   * initial Component:
   * <... static></...> Apply Drag interaction on the first slotted Element.
   * <... static pivot=""></...> Apply pivot interaction on the first slotted
   * Element.
   */
  render() {
    const useContent =
      this.position !== 'static' && this.interactionTarget && this.pivot
        ? false
        : this.static || this.position === 'static'

    return html`<slot
      ?visually-hidden="${!useContent}"
      data-pivot="${this.pivot}"
      @touchstart=${this.handleDragStart}
      @mousedown=${this.handleDragStart}
    ></slot>`
  }
}
