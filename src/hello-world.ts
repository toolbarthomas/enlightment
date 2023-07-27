import {
  customElement,
  Enlightment,
  html,
  property,
} from "@toolbarthomas/enlightment";

import styles from "./hello-world.scss";

@customElement("hello-world")
class HelloWorl extends Enlightment {
  static styles = [styles];

  @property({ type: String })
  name = "World";

  render() {
    return html`<h1>Hello ${this.name}</h1>`;
  }
}
