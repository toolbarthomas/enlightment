import { customElement, Enlightenment, html, property, ref } from '@toolbarthomas/enlightenment'

import cssStyle from './hello-world.css'
import scssStyle from './hello-world.scss'

@customElement('hello-world')
class HelloWorld extends Enlightenment {
  static styles = [cssStyle, scssStyle]

  withFocusTrap: boolean = true

  @property({ type: String })
  name = 'World'

  @property({ type: String })
  helloWorld = 'new'

  @property({
    converter: Enlightenment.isBoolean,
    reflect: true,
    type: Boolean
  })
  capitilized?: boolean

  constructor() {
    super()
  }

  /**
   * Optional callback that is used within Enlightenment._process().
   * The callback will be triggered during a Enlightenment Component update
   * (excluding this). You should define any logic within this optional method
   * to update the current state of the Component:
   *
   * ```html
   *  <foo-component listen="bar-component">...</foo-component>
   *  <bar-component>...</bar-component> <!--  --->
   * ```
   *
   * The above example should update <foo-component> if the <bar-component> has
   * called the internal update handlers. Keep in mind that this will only
   * trigger if both components exists within current DOM.
   *
   * @param target The expected html target
   */
  process(target: any) {
    if (target.preventEvent) {
      this.commit('name', `Updated ${this.name}`)
    }
    // this.commit('name', `Updated ${this.name}`)
  }

  render() {
    return html`<div>
      <h1>Hello ${this.name}</h1>
      <div>
        <slot></slot>
      </div>
      <div>
        ${this.renderImage('icon-home', { width: '100px' })}
        ${this.renderImage('https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/410.svg', {
          width: '100px',
          height: '100px'
        })}
        ${this.renderImage('https://img.icons8.com/ios-glyphs/2x/search.png', {
          classname: 'Boo',
          width: '100px',
          height: '100px'
        })}
      </div>
      <div><input type="text" /></div>
      <button @click=${this.handleFocusTrap}>
        ${this.hasFocusTrap ? 'disable' : 'enable'} Focus Trap
      </button>
    </div>`
  }
}
