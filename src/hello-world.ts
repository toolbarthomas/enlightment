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
    return html`<div>
      <h1>Hello ${this.name}</h1>
      <div>
        <slot></slot>
      </div>
      <div>
        ${this.renderImage("icon-home", { width: "100px" })}
        ${this.renderImage(
          "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/410.svg",
          {
            width: "100px",
            height: "100px",
          }
        )}
        ${this.renderImage("https://img.icons8.com/ios-glyphs/2x/search.png", {
          classname: "Boo",
          width: "100px",
          height: "100px",
        })}
      </div>
      <div><input type="text" /></div>
    </div>`;
  }
}
