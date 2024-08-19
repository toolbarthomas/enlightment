import {
  createRef,
  css,
  customElement,
  Enlightenment,
  html,
  property,
  ref
} from '@toolbarthomas/enlightenment'

import cssStyle from './hello-world.css'
import scssStyle from './hello-world.scss'

@customElement('hello-world')
class HelloWorld extends Enlightenment {
  static styles = [cssStyle, scssStyle]

  enableDocumentEvents = true
  enableFragments = true
  extensions = ['Draggable', 'TresholdDrag']

  // @property({
  //   attribute: '@callback',
  //   converter: (value) => {
  //     let [type, name]: [string, string | undefined] = value.split(':')

  //     if (!name) {
  //       name = type
  //       type = 'click'
  //     }

  //     return [type, name.split('(')[0]]
  //   },
  //   type: Array
  // })
  // callback?: [string, string]

  @property({ type: String })
  name = 'World'

  @property({ type: String })
  helloWorld = 'new'

  foo = false

  @property({
    converter: (value: string) =>
      Enlightenment.parseJSON(value, (r: any) => {
        console.log('Hello World JSON', r)

        if (r.entries) {
          return {
            nested: true,
            data: {
              raw: '<!--'
            }
          }
        }

        return r
      }),
    type: Array
  })
  data?: string[]

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
   * Toggles the optional defined Focus Trap instance.
   */
  public handleFocusTrap(event: Event) {
    // event.preventDefault && event.preventDefault()

    this.commit('hasActiveFocusTrap', !this.hasActiveFocusTrap)

    // if (this.hasFocusTrap) {
    //   this.releaseFocusTrap()
    // } else {
    //   this.lockFocusTrap()
    // }
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
    console.log('Process hello world', this)

    // if (target.preventEvent) {
    //   this.commit('name', `Updated ${this.name}`)
    // }
    // this.commit('name', `Updated ${this.name}`)
  }

  handleSlotChange(event: Event) {
    super.handleSlotChange(event)

    if (!this.callback || !this.callback.length) {
      return
    }

    // const [type, name] = this.callback
    // const host = Enlightenment.useHost(this)

    // console.log('HOST', typeof host[name], host.start)

    // this.clearGlobalEvent(type, this)
    // if (host && typeof host[name] === 'function') {
    //   this.assignGlobalEvent(type, host[name].bind(host), this)
    // }

    // console.log('Firstupdated', this.callback)
  }

  firstUpdated() {
    super.firstUpdated()

    this.assignFragments('optional')

    // setTimeout(() => {
    //   this.omitFragments('optional')
    //   console.log('bar')
    // }, 5000)
  }

  render() {
    return html`
      <focus-trap ?active=${this.hasActiveFocusTrap}>
        <div class="container" ref="${ref(this.context)}">
          <h1>Hello ${this.name}</h1>
          <button @click=${this.start}>Start</button>

          <draggable-element static>
            <button>Drag</button>
          </draggable-element>

          <draggable-element type="fixed">
            <button>X</button>
          </draggable-element>

          <button
            data-axis="y"
            @mousedown=${this.handleDragStart}
            @touchstart=${this.handleDragStart}
          >
            Y
          </button>

          ${Array.from({ length: 9 }).map((_, index) => {
            return html`
              <draggable-element pivot="${index + 1}" type="fixed">
                <button>${index + 1}</button>
              </draggable-element>
            `
          })}

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
          Result:
          <div fragment="optional" @click="${() => console.log('Click fragment')}">
            Default fragment text
          </div>
          <div fragment="optional"></div>
        </div>
        <slot name="optional"></slot>
      </focus-trap>
    `
  }

  renderColors() {
    const colors = Enlightenment.theme.useColorChart((color: string, value: any[]) => {
      return html`<div
        class="color"
        style="background-color: hsl(${value[0]}, ${value[1]}%, ${value[2]}%);"
      ></div>`
    })

    return html`<div class="colors">${colors}</div>`
  }

  start() {
    // console.log('Start', this)
    // Enlightenment.parseMatrix(
    //   'transform(10px, 20px) scale(1deg) linear-gradient(1deg, red, green) bar(11px)'
    // )
    // console.log(
    //   'The color',
    //   Enlightenment.theme.useColorFrom(171, 44, 37)
    //   // Enlightenment.theme.useColorFrom(180, 56)
    // )
    // this.useBreakpoints((name: string, value: number, delta?: number[]) => {
    //   console.log('Breakpoint', name, value, delta)
    // })
    // this.commit('foo', !this.foo)
    console.log('Start')
  }

  hello() {
    console.log('HELLO', this)
  }
}
