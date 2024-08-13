# Enlightenment

**Note:** Project is not yet stable, the documentation can mismatch with the current sourcecode.

Enlightenment is a toolset based on the [Lit Element 3.0](https://github.com/lit/lit/) Web Component library and includes extra features to speed up your Web Component journey.

Enlightenment does not expect any build tools to be installed in order to use within your project. This means you can directly include the compiled Enlightenment library within the browser and create ESM formatted components without any bundling. But of course it is also possible to include it within [compilation environments](#advanced-setup) like Typescript or Esbuild.

## Installation

You can install Enlightenment via [NPM](https://npmjs.com) ([Node.js]([http:](https://nodejs.org/)) is required to continue.)

```
$ npm install @toolbarthomas/enlightenment
```


<a id="browser-setup"></a>
## Browser Setup

After the installation you can directly use the compiled Enlightenment browser library from the installation directory:

```
node_modules/@toolbarthomas/enlightenment/dist/Enlightenment.js
```

You should include the actual module as Ecmascript module script within your template:

**Note:** No build tools are required for compiling `my-component.js`.<br/>See the [Advanced Setup](#advanced-setup) for using Enlightenment within your development toolset.


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

**Note:** It is encouraged to setup the actual sources within the ESM format and include the core `Enlightenment` library as a single source. Bundling is possible by using the package name within your include: `@toolbarthomas/enlightenment`. See [Advanced Setup](#advanced-setup) for more information regarding this workflow.

Your module should import from the actual library destination (we assume it is absolute to your public directory in this example...):

```js
/**
 * We asume the import has been resolved before hand from the compiled library:
 * @toolbarthomas/enlightenment/dist/Enlightenment.js
 */
import { customElement, Enlightenment, html } from '/Enlightenment.js'

/**
 * Decorators are also supported within the browser module.
 * See: https://lit.dev/docs/components/decorators/
 */
@customElement('my-component')
class MyComponent extends Enlightenment {
  constructor() {
    super()
  }

  // The inherited LitElement.render method
  render() html`<h1>My Component</h1>...`
};

```
This will load the Enlightenment library as external source and prevents the issue where multiple Enlightenment libraries are included when including multiple Enlightenment elements.

**Pro tip:** No build tools are required for this method but you should resolve the actual library to a logical destination since exposing the `node_modules` directory can introduce security issues for your project.

<a id="advanced-setup"></a>
## Advanced Setup

Enlightenment is also supported within Node & Typescript environments with additional build tooling. You should resolve to the correct entry within the `@toolbarthomas/Enlightenment` package according to your environment (cjs or mjs).

#### CommonJS

```cjs
//@toolbarthomas/enlightenment/index.cjs => @toolbarthomas/enlightenment/dist/Enlightenment.cjs
const { Enlightenment } = require("@toolbarthomas/enlightenment");

class MyComponent extends Enlightenment {...}

```
This will actually resolve to `@toolbarthomas/enlightenment/index.cjs`, since the
default Node CJS format is expected within this example.

#### Ecmascript

```mjs
// @toolbarthomas/enlightenment/index.mjs => @toolbarthomas/enlightenment/dist/Enlightenment.js
import { Enlightenment } from "@toolbarthomas/enlightenment";

class MyComponent extends Enlightenment {...}

```

The ESM format is also supported but resolves to `@toolbarthomas/Enlightenment/index.mjs` or `@toolbarthomas/Enlightenment/index.ts` (when using [Typescript](https://www.typescriptlang.org/)) instead:

#### Typescript

```ts
// @toolbarthomas/enlightenment/index.ts
import { Enlightenment } from "@toolbarthomas/enlightenment";

class MyComponent extends Enlightenment {...}

```

**Pro Tip:** While using [Esbuild](https://esbuild.github.io/) you can compile your component scripts as actual ESM module and prevent the multiple bundle issue when using multiple components. See [Esbuild Tooling](#esbuild-tooling) for more info.

<a id="esbuild-tooling"></a>
## Esbuild Tooling

Enlightenment provides multiple Esbuild plugins to setup modular Web Components with Sass compiled stylesheets. It is adviced to include these plugins within your ESbuild environment to correctly setup the actual components as bundle or modular ESM structure.

**Note:** A bundle and modular ESM example have been defined within the example directory. Use the example configuration according to the desired format within your current Esbuild environment.

### Resolve Plugin

The resolve plugin is used in order to resolve the actual package path `@toolbarthomas/enlightenment` within your component source to a static path.
It will resolve to `/Enlightenment.js` by default but a custom destination can be defined. The resolve Plugin will also create a copy of the initial Enlightenment package script to the Esbuild entry destination.

```mjs
import esbuild from "esbuild"

import { resolvePlugin } from "@toolbarthomas/enlightenment/resolvePlugin"

esbuild.build({
  ...
  plugins: [
    resolvePlugin({...}),
    ...
  ],
  ...
})
```

**Note**
An [example](https://github.com/toolbarthomas/enlightenment/tree/develop/example) is defined within `example/esbuild.mjs` that will transform the defined `example/index.ts` as module within the ESM format and write to `example/dist` directory with the Enlightenment library as `example/dist/framework.js`.

| Name        | Type   | Description                                                   |
| ----------- | ------ | ------------------------------------------------------------- |
| destination | string | Source to the Enlightenment browser compatible library.       |
| namespace   | string | Optional Plugin namespace to use within the Esbuild instance. |

### Style Plugin (Sass)

A standard Web Component will use an internal Stylesheet for the rendered result.
Enlightenment provides an Esbuild Sass Plugin that enables the import of external `.scss` filetypes within your component while using Esbuild within your environment.

You need to include the actual plugin from the Enlightenment package: `@toolbarthomas/enlightenment/node/esbuild.sass.plugin.mjs` within your [Esbuild](https://esbuild.github.io/api/) setup, in order to resolve the imported Sass stylesheets as component stylesheet.

The actual requested stylesheet will be transformed with the Sass package during the compilation of the initial entry file. The styling will be inlined within the exported `css` template literal and should be included as `static styles` property from the actual Enlightenment element:

```mjs
import esbuild from "esbuild"

import { stylePlugin } from "@toolbarthomas/enlightenment/stylePlugin"

esbuild.build({
  ...
  plugins: [
    stylePlugin,
    ...
  ],
  ...
})
```
**Note:** The Sass plugin can resolve from the current working directory, the base directory, the initial entry point or the local node_modules* directory:

**\*** You resolve from the packge name directly, the actual node_modules directory is not used for the import:

```scss
// Should resolve from the node_modules modules if the actual directory is not
// present within the relative context.
@import "@package/scss/library.scss"; // Expected: node_modules/@package/scss/library.scss

.my-component {
  display: flex;
  ...
}

```

```ts
import { Enlightenment } from "@toolbarthomas/enlightenment";

// The actual styles are transformed by the Esbuild stylePlugin and wrapped in
// the css template literal and returs as default export.
import styles from 'my-component.scss'

class MyComponent extends Enlightenment {
  static styles = [styles]

  ...
}

```

**Note:** Optional Sass configuration can be defined within near future but is not relevant in the current state of the Enlightenment Node package.

## Enlightenment API

Under the hood, Enlightenment uses the [Lit Element Library](https://lit.dev/docs/) and inherits the actual interface of [LitElement](https://lit.dev/docs/components/defining/).

It introduces extra methods to use within the Web Component context that improves the overall user experience and development of the initial component, [get more information about the API](./API.md).
