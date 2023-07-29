import {
  customElement,
  Enlightenment,
  html,
  property,
  ref,
} from "@toolbarthomas/enlightenment";

import styles from "./hello-world.scss";

@customElement("hello-world")
class HelloWorld extends Enlightenment {
  static styles = [styles];

  @property({ type: String })
  name = "World";

  render() {
    return html`<div ${ref(this.context)}>
      <h1>Hello ${this.name}</h1>
      <div>
        <slot></slot>
      </div>
    </div>`;
  }
}
