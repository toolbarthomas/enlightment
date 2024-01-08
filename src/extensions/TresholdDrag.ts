import { createRef, customElement, Enlightenment, html, property, ref } from '../Enlightenment'
import { EnlightenmentInputControllerPointerData } from '../_types/main'

@customElement('treshold-drag')
export class EnlightenmentTresholdInput extends Enlightenment {
  render() {
    return html`<slot ref="${ref(this.context)}"></slot>`
  }
}
