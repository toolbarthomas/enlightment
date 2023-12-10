import {
  createRef,
  customElement,
  Enlightenment,
  eventOptions,
  html,
  property,
  ref
} from '@toolbarthomas/enlightenment'
import { EnlightenmentInputControllerPointerData } from 'src/_types/main'

import styles from './Draggable.scss'

@customElement('draggable-element')
class EnlightenmentDraggable extends Enlightenment {
  static styles = [styles]

  @property({
    type: Number
  })
  pivot?: number

  @property({
    converter: Enlightenment.isBoolean,
    type: Boolean
  })
  static?: number

  @property({
    type: String
  })
  target?: string

  currentTarget?: HTMLElement

  constructor() {
    super()
  }

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

  protected defineTarget() {
    if (this.currentTarget) {
      return this.currentTarget
    }

    const host = this.useHost(this) as any
    const target = this.closest(this.target) as HTMLElement

    if (this.preventEvent || host.preventEvent) {
      this.handleDragEnd()

      return false
    }

    if (this.static && !target) {
      this.currentTarget = this as any
    }

    if (!this.currentTarget && !target && host !== this) {
      const context = host.useContext && host.useContext()

      if (context && context !== this) {
        this.currentTarget = context

        this.log(['Draggable target defined from host context:', context], 'log')
      } else {
        this.currentTarget = host

        this.log(['Draggable target defined from host:', context], 'log')
      }
    }

    if (!this.currentTarget && target) {
      this.currentTarget = target
    } else if (!this.currentTarget) {
      this.currentTarget = this as any
    }

    this.log(['Draggable target defined:', this.currentTarget], 'log')

    this.currentTarget && this.applyCurrentTargetStyles()

    return this.currentTarget ? true : false
  }

  handleUpdate() {
    super.handleUpdate()

    this.defineTarget()
  }

  protected cleanupCurrentTarget() {
    if (this.currentTarget) {
      this.currentTarget.style.userSelect = ''
    }
  }

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
  }

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
        target.getAttribute(Enlightenment.defaults.attrAxis),
        ['x', 'y']
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
    this.transform(context, left, top, window)
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

    const bounds = this.useBounds(context, initialTranslateX, initialTranslateY)

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
        console.log('fallback', height)
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

  protected handleDragEnd(event?: MouseEvent | TouchEvent) {
    super.handleDragEnd(event)

    this.cleanupCurrentTarget()
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
      this.setAttribute(Enlightenment.defaults.attrPivot, String(this.pivot))
    } else {
      this.removeAttribute(Enlightenment.defaults.attrPivot)
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

    // Prevent content from being selecting while preforming the drag
    // interaction.
    if (this.currentTarget && !this.currentTarget.style.userSelect) {
      this.currentTarget.style.userSelect = 'none'
    }
  }

  render() {
    return html`<slot
      data-pivot="${this.pivot}"
      @touchstart=${this.handleDragStart}
      @mousedown=${this.handleDragStart}
    ></slot>`
  }
}
