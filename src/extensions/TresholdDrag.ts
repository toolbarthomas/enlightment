import { createRef, customElement, Enlightenment, html, property, ref } from 'src/Enlightenment'
import { EnlightenmentInputControllerPointerData } from 'src/_types/main'

@customElement('treshold-drag')
export class EnlightenmentTresholdInput extends Enlightenment {
  render() {
    return html`<slot ref="${ref(this.context)}"></slot>`
  }
}
