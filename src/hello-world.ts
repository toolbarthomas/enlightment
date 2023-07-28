import {
  customElement,
  Enlightenment,
  html,
  property,
} from "@toolbarthomas/enlightenment";

import styles from "./hello-world.scss";

@customElement("hello-world")
class HelloWorld extends Enlightenment {
  static styles = [styles];

  @property({ type: String })
  name = "World";

  render() {
    return html`<div>
      <slot>Hello ${this.name || "World"}<span>bbb</span></slot>
    </div>`;
  }
}
