import {
  customElement,
  Enlightenment,
  html,
  property,
} from "@toolbarthomas/enlightenment";

import styles from "./hello-world.scss";

@customElement("hello-world")
class HelloWorl extends Enlightenment {
  static styles = [styles];

  @property({ type: String })
  name = "World";

  render() {
    return html`<h1>Hello ${this.name || "World"}</h1>`;
  }
}
