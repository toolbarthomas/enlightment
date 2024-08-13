import { Enlightenment, html, property } from '@toolbarthomas/enlightenment'

@property('foo-bar')
class FooBar extends enlightenment {
  render() {
    html`FooBar`
  }
}
