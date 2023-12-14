import SimpleBar from 'simplebar'

import { customElement, Enlightenment, html, property, ref } from 'src/Enlightenment'

import styles from './ScrollableElement.scss'

@customElement('scrollable-element')
export class EnlightenmentScrollableElement extends Enlightenment {
  static styles = [styles]
  static shapes = ['round', 'square']
  static direction = ['rtl', 'ltr']

  @property({
    converter: (value) =>
      Enlightenment.filterPropertyValue(value, EnlightenmentScrollableElement.shapes),
    type: String
  })
  shape: string = EnlightenmentScrollableElement.shapes[0]

  simpleBar?: SimpleBar

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
          dragging: 'scrollable-element--is-grabbed'
        },
        autoHide: false,
        forceVisible: true
      })

      this.log(`Custom scrollbar defined from: ${context}`, 'info')
    }

    super.firstUpdated(properties)
  }

  protected handleUpdate(name?: string | undefined): void {
    super.handleUpdate(name)

    if (this.simpleBar && this.simpleBar.recalculate) {
      this.throttle(this.updateScrollbar, Enlightenment.RPS)
    }
  }

  public connectedCallback(): void {
    super.connectedCallback()
  }

  protected updateScrollbar() {
    if (this.simpleBar && this.simpleBar.recalculate) {
      return this.simpleBar.recalculate()
    }
  }

  render() {
    const classes = ['scrollable-element']

    if (this.shape) {
      classes.push(`scrollable-element--is-${this.shape}`)
    }

    if (this.direction) {
      classes.push(`scrollable-element--is-${this.direction}`)
    }

    return html`<div
      class="${classes.join(' ')}"
      data-simplebar-direction="${Enlightenment.filterPropertyValue(this.direction, [
        'rtl',
        'ltr'
      ])}"
      ref="${ref(this.context)}"
    >
      <slot></slot>
    </div>`
  }
}
