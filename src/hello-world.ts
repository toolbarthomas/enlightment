import {
  customElement,
  Enlightenment,
  html,
  property,
  ref,
} from "@toolbarthomas/enlightenment";

import cssStyle from "./hello-world.css";
import scssStyle from "./hello-world.scss";

@customElement("hello-world")
class HelloWorld extends Enlightenment {
  static styles = [cssStyle, scssStyle];

  @property({ type: String })
  name = "World";

  @property({ type: String })
  helloWorld = "new";

  @property({
    converter: Enlightenment.isBoolean,
    reflect: true,
    type: Boolean,
  })
  capitilized?: boolean;

  constructor() {
    super();
  }

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
      <button @click=${this.handleFocusTrap}>
        ${this.hasFocusTrap ? "disable" : "enable"} Focus Trap
      </button>
    </div>`;
  }
}
