# Enlightment

Enlightment is a toolset based on the [Lit Element 2.0](https://github.com/lit/lit/) Web Component library and includes extra features to speed up your Web Component journey.

Enlightment does not expect any build tools to be installed in order to use within your project. This means you can directly include the compiled Enlightment library within the browser and create ESM formatted components without any bundling. But of course it is also possible to include it within [compilation environments](#advanced-setup) like Typescript or Esbuild.

## Installation

You can install Enlightment via [NPM](https://npmjs.com) ([Node.js]([http:](https://nodejs.org/)) is required to continue.)

```
$ npm install @toolbarthomas/enlightment
```


<a id="browser-setup"></a>
## Browser Setup

After the installation you can directly use the compiled Enlightment browser library from the installation directory:

```
node_modules/@toolbarthomas/enlightment/dist/Enlightment.js
```

You should include the actual module as Ecmascript module script within your template:

**Note:** No build tools are required for compiling `my-component.js`.<br/>See the [Advanced Setup](#advanced-setup) for using Enlightment within your development toolset.


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

**Note:** It is encouraged to setup the actual sources within the ESM format and include the core `Enlightment` library as a single source. Bundling is possible by using the package name within your include: `@toolbarthomas/enlightment`. See [Advanced Setup](#advanced-setup) for more information regarding this workflow.

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

Enlightment is also supported within Node & Typescript environments with additional build tooling. You should resolve to the correct entry within the `@toolbarthomas/enlightment` package according to your environment (cjs or mjs).

#### CommonJS

```cjs
const { Enlightment } = require("@toolbarthomas/enlightment/index.cjs");

class MyComponent extends Enlightment {...}

```
This will actually resolve to `@toolbarthomas/enlightment/index.cjs`, since the
default Node CJS format is expected within this example.

#### Ecmascript

```mjs
import { Enlightment } from "@toolbarthomas/enlightment/index.mjs";

class MyComponent extends Enlightment {...}

```

The ESM format is also supported but resolves to `@toolbarthomas/enlightment/index.mjs` or `@toolbarthomas/enlightment/index.ts` (when using [Typescript](https://www.typescriptlang.org/)) instead:

#### Typescript

```ts
import { Enlightment } from "@toolbarthomas/enlightment";

class MyComponent extends Enlightment {...}

```

**Pro Tip:** While using [Esbuild](https://esbuild.github.io/) you can compile your component scripts as actual ESM module and prevent the multiple bundle issue when using multiple components. See [Esbuild Tooling](#esbuild-tooling) for more info.

<a id="esbuild-tooling"></a>
## Esbuild Tooling

Enlightment provides multiple Esbuild plugins to setup modular Web Components with Sass compiled stylesheets. It is adviced to include these plugins within your ESbuild environment to correctly setup the actual components as bundle or modular ESM structure.

**Note:** A bundle and modular ESM example have been defined within the example directory. Use the example configuration according to the desired format within your current Esbuild environment.

### Resolve Plugin

The resolve plugin is used in order to resolve the actual package path `@toolbarthomas/enlightment` within your component source to a static path.
It will resolve to `/Enlightment.js` by default but a custom destination can be defined. The resolve Plugin will also create a copy of the initial Enlightment package script to the Esbuild entry destination.
An example is defined within `example/esbuild.mjs` that will transform the defined `example/index.ts` as module within the ESM format and write to `example/dist` directory with the Enlightment library as `example/dist/framework.js`.

| Name        | Type   | Description                                                   |
| ----------- | ------ | ------------------------------------------------------------- |
| destination | string | Source to the Enlightment browser compatible library.         |
| namespace   | string | Optional Plugin namespace to use within the Esbuild instance. |

### Sass Plugin

A standard Web Component will use an internal Stylesheet for the rendered result.
Enlightment provides an Esbuild Sass Plugin that enables the import of external `.scss` filetypes within your component while using Esbuild within your environment.

You need to include the actual plugin from the Enlightment package: `@toolbarthomas/enlightment/node/esbuild.sass.plugin.mjs` within your [Esbuild](https://esbuild.github.io/api/) setup, in order to resolve the imported Sass stylesheets as component stylesheet.

The actual requested stylesheet will be transformed with the Sass package during the compilation of the initial entry file. The styling will be inlined within the exported `css` template literal and should be included as `static styles` property from the actual Enlightment element:

```mjs
// ./esbuild.mjs
import esbuild from "esbuild"
import { sassPlugin } from "@toolbarthomas/enlightment/node/esbuild.sass.plugin.mjs"

esbuild.build({
  ...
  plugins: [sassPlugin, ...],
  ...
})

```
**Note:** The Sass plugin can resolve from the current working directory, the base directory, the initial entry point or the local node_modules directory:

```ts
import { Enlightment } from "@toolbarthomas/enlightment";

import styles from 'my-component.scss'

class MyComponent extends Enlightment {
  static styles = [styles]

  ...
}

```

**Note:** There are currently no customization options for the included sassPlugin since it is bound to the Esbuild context.