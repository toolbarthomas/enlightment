import {
  createRef,
  css,
  customElement,
  Enlightenment,
  html,
  property,
  ref
} from '@toolbarthomas/enlightenment'
import { EnlightenmentInputControllerPointerData } from 'src/_types/main'

@customElement('draggable-element')
class EnlightenmentDraggable extends Enlightenment {
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

    const host = this.useHost(this)
    const target = this.closest(this.target) as HTMLElement

    if (this.static && !target) {
      this.currentTarget = this
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
      this.currentTarget = this
    }

    console.log('Target', this.currentTarget, host, this.static)

    this.log(['Draggable target defined:', this.currentTarget], 'log')

    this.applyCurrentTargetStyles()
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

  protected handleDragEnd(event?: MouseEvent | TouchEvent) {
    super.handleDragEnd(event)

    this.cleanupCurrentTarget()
  }

  /**
   * Use the rendered Slot Element for the actual Drag Event target value.
   * @param event
   */
  protected handleDragStart(event: MouseEvent | TouchEvent) {
    this.defineTarget()

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
