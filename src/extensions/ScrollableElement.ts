import SimpleBar from 'simplebar'

import { customElement, Enlightenment, html, property, ref } from 'src/Enlightenment'

import styles from './ScrollableElement.scss'

@customElement('scrollable-element')
export class EnlightenmentScrollableElement extends Enlightenment {
  static styles = [styles]

  /**
   * Defines the available shape types for the [shape] property.
   */
  static shapes = ['round', 'square']

  /**
   * Defines the corner radius for the custom Scrollbar handle.
   */
  @property({
    converter: (value) =>
      Enlightenment.filterPropertyValue(value, EnlightenmentScrollableElement.shapes),
    type: String
  })
  shape: string = EnlightenmentScrollableElement.shapes[0]

  /**
   * Contains the constructed Simplebar instance that implement the custom
   * scrollbar feature.
   *
   * @see https://github.com/Grsmto/simplebar
   */
  simpleBar?: SimpleBar

  /**
   * Updates the SimpleBar instance and recalculate the initial context
   * Element.
   * @param event
   */
  protected handleSlotChange(event: Event): void {
    this.throttle(this.updateScrollbar, Enlightenment.RPS)

    super.handleSlotChange(event)
  }

  /**
   * Updates the current SimpleBar instance.
   */
  protected updateScrollbar() {
    if (this.simpleBar && this.simpleBar.recalculate) {
      return this.simpleBar.recalculate()
    }
  }

  /**
   * Unmount the created Simplebar instance.
   */
  public destroy() {
    if (!this.simpleBar) {
      return
    }

    try {
      this.simpleBar.unMount()
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  /**
   * Cleanup the custom scrollbar instance.
   */
  public disconnectedCallback(): void {
    this.destroy()

    super.disconnectedCallback()
  }

  /**
   * Setup the initial Simplebar instance that should mimic a custom scrollbar.
   *
   * @param properties Defines the changes properties within the firstUpdate.
   */
  public firstUpdated(properties: any): void {
    const context = (this.useRef(this.context) as HTMLElement) || this

    if (context && !this.simpleBar) {
      this.simpleBar = new SimpleBar(context, {
        classNames: {
          contentEl: 'scrollable-element__content',
          contentWrapper: 'scrollable-element__content-wrapper',
          offset: 'scrollable-element__offset',
          mask: 'scrollable-element__mask',
          wrapper: 'scrollable-element__wrapper',
          placeholder: 'scrollable-element__placeholder',
          scrollbar: 'scrollable-element__scrollbar',
          track: 'scrollable-element__track',
          heightAutoObserverWrapperEl: 'scrollable-element__push-wrapper',
          heightAutoObserverEl: 'scrollable-element__push',
          visible: 'scrollable-element__scrollbar--is-visible',
          horizontal: 'scrollable-element__track--is-horizontal',
          vertical: 'scrollable-element__track--is-vertical',
          dragging: 'scrollable-element--is-grabbed',
          hover: 'scrollable-element--has-hover'
        },
        autoHide: false,
        forceVisible: true
      })

      this.log(`Custom scrollbar defined from: ${context}`, 'info')
    }

    super.firstUpdated(properties)
  }

  /**
   * Render the initial context element that will be used as Element reference
   *  by the Simplebar instance and wraps custom HTML around the defined Slot
   * Element in order to display the custom scrollbar.
   */
  public render() {
    const classes = ['scrollable-element']

    if (this.shape) {
      classes.push(`scrollable-element--is-${this.shape}`)
    }

    if (this.direction) {
      classes.push(`scrollable-element--is-${this.direction}`)
    }

    return html`<div
      class="${classes.join(' ')}"
      data-simplebar-direction="${this.direction}"
      ref="${ref(this.context)}"
    >
      <slot></slot>
    </div>`
  }
}
