# Enlightment

Enlightment is a toolset based on the [Lit Element 2.0](https://github.com/lit/lit/) Web Component library and includes extra features to speed up your Web Component journey.


## Installation

You can install Enlightment via [NPM](https://npmjs.com) ([Node.js]([http:](https://nodejs.org/)) is required to continue.)

```
$ npm install @toolbarthomas/enlightment
```
## No Build tools required
Enlightment does not expect any build tools in order to be included within your project; since we want to keep the basic setup really simple as the actual Web Component specification.
This means you can directly include the compiled Enlightment library within your browser and create Enlightment components within the ESM format without any bundling.

It is encouraged to setup the actual sources within the ESM format and include the core `Enlightment` library as a single source. Bundling is possible by using the package name within your include: `@toolbarthomas/enlightment`. See [Advanced Setup](#advanced-setup) for more information regarding this workflow.

<a id="browser-setup"></a>
## Browser Setup

After the installation you can directly use the compiled Enlightment browser library from the installation directory:

```
node_modules/@toolbarthomas/enlightment/dist/Enlightment.js
```

You should include the actual module as `ESM` source within your template:

**Note:** We expect that no build tool is required for compiling `my-component.js`.<br/>See the [Advanced Setup](#advanced-setup) for using Enlightment within your development toolset.


```html
...
<head>
  <script type="module" src="my-component.js">...</script>
</head>
<body>
  <my-component></my-component> <!-- Expected result: <h1>My Component<h1> -->
  ...
</body>
```

Your module should import from the actual library destination (we assume it is absolute to your public directory in this example...):

```js
/**
 * Actual import has been resolved from the compiled library:
 * @toolbarthomas/enlightment/dist/Enlightment.js
 */
import { Enlightment, html } from '/Enlightment.js'

/**
 * Setup the custom component: custom-component with the default
 * lit-element methods since we don't use any build tool:
 */
class MyComponent extends Enlightment {
  constructor() {
    super()
  }

  // The inherited LitElement.render method
  render() html`<h1>My Component</h1>...`
};

// Register the actual custom element with the created Enlightment instance.
window.customElements.define('my-component', MyComponent)

```
This will load the Enlightment library as external source and prevents the issue where multiple Enlightment libraries are included when including multiple Enlightment elements.

**Pro tip:** No build tools are required for this method but you should resolve the actual library to a logical destination since exposing the `node_modules` directory can introduce security issues for your project.

<a id="advanced-setup"></a>
## Advanced Setup

Enlightment is also supported within Node & Typescript environments with additional build tooling. You should resolve to the default package `@toolbarthomas/enlightment` while using import or require. This enables the option to use Decorators and Class functions within your component script compared to the [Browser Setup](#browser-setup)

```js
//my-component.cjs

const { customElement, Enlightment, html} = require('@toolbarthomas/enlightment')

@customElement('my-component')
class MyComponent extends Enlightment {
  render() {
    return `<h1>My Component</h1>`
  }
}

```

This will actually resolve to `@toolbarthomas/enlightment/index.cjs`, since the
default Node CJS format is expected within this example.

The ESM format is also supported but resolves to `@toolbarthomas/enlightment/index.mjs` or `@toolbarthomas/enlightment/index.ts` (when using [Typescript](https://www.typescriptlang.org/)) instead.

**Pro Tip:** While using [Esbuild](https://esbuild.github.io/) you can compile your component scripts as actual ESM module and prevent the multiple bundle issue when using multiple components. See [Esbuild Tooling](#esbuild-tooling) for more info.

## Esbuild Tooling

A standard Web Component will use an internal Stylesheet for the rendered result.
Enlightment provides the Esbuild Sass Plugin that enables the import of external `.scss` filetypes within your component.
You need to include the actual Sass Plugin from the Enlightment package: `@toolbarthomas/enlightment/node/esbuild.sass.plugin.mjs` within your Esbuild setup:

```mjs
// esbuild.mjs

const { sassPlugin } = require('@toolbarthomas/')



```
