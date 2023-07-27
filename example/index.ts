import { Enlightment, html, property } from "@toolbarthomas/enlightment";

@property("foo-bar")
class FooBar extends Enlightment {
  render() {
    html`FooBar`;
  }
}
