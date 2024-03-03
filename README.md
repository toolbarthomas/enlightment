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
const { Enlightenment } = require("@toolbarthomas/Enlightenment/index.cjs");

class MyComponent extends Enlightenment {...}

```
This will actually resolve to `@toolbarthomas/enlightenment/index.cjs`, since the
default Node CJS format is expected within this example.

#### Ecmascript

```mjs
import { Enlightenment } from "@toolbarthomas/Enlightenment/index.mjs";

class MyComponent extends Enlightenment {...}

```

The ESM format is also supported but resolves to `@toolbarthomas/Enlightenment/index.mjs` or `@toolbarthomas/Enlightenment/index.ts` (when using [Typescript](https://www.typescriptlang.org/)) instead:

#### Typescript

```ts
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

**Note**
An [example](https://github.com/toolbarthomas/enlightenment/tree/develop/example) is defined within `example/esbuild.mjs` that will transform the defined `example/index.ts` as module within the ESM format and write to `example/dist` directory with the Enlightenment library as `example/dist/framework.js`.

| Name        | Type   | Description                                                   |
| ----------- | ------ | ------------------------------------------------------------- |
| destination | string | Source to the Enlightenment browser compatible library.       |
| namespace   | string | Optional Plugin namespace to use within the Esbuild instance. |

### Sass Plugin

A standard Web Component will use an internal Stylesheet for the rendered result.
Enlightenment provides an Esbuild Sass Plugin that enables the import of external `.scss` filetypes within your component while using Esbuild within your environment.

You need to include the actual plugin from the Enlightenment package: `@toolbarthomas/enlightenment/node/esbuild.sass.plugin.mjs` within your [Esbuild](https://esbuild.github.io/api/) setup, in order to resolve the imported Sass stylesheets as component stylesheet.

The actual requested stylesheet will be transformed with the Sass package during the compilation of the initial entry file. The styling will be inlined within the exported `css` template literal and should be included as `static styles` property from the actual Enlightenment element:

```mjs
// ./esbuild.mjs
import esbuild from "esbuild"
import { stylePlugin } from "@toolbarthomas/enlightenment/node/esbuild.style.plugin.mjs"

esbuild.build({
  ...
  plugins: [stylePlugin, ...],
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

## Enlightenment Interface @WIP

Under the hood, Enlightenment uses the [Lit Element Library](https://lit.dev/docs/) and inherits the actual interface of [LitElement](https://lit.dev/docs/components/defining/).
It introduces extra methods to use within the Web Component context that improves the overall user experience and development of the initial component:

## Statics & Helpers


#### `[Function]` convertToSelectors()

Returns an Array of existing Elements from the valid query string value.

```js
Enlightenment.convertToSelector('#foo,.bar,h1')
```

#### `[Object]` defaults

The default configuration schema for the core Enlightenment Class.

#### `[Function]` filterProperty()

Helper function to ensure the defined value is accepted to as result.

```js
// Will use the defined 100px as String value.
Enlightenment.filterProperty('width', { width: '100px' }, true)
```

```js
// Will return an empty String instead since no width has been defined.
Enlightenment.filterProperty('width', {} , true)
```




| Name                     | Type     | Description                                                                                                                  |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| convertToSelectors       | Function |                                                                                                                              |
| defaults                 | Object   |                                                                                                                              |
| filterProperty           | Function |                                                                                                                              |
| FPS                      | Number   | The default interval value that is used for the throttler in ms.                                                             |
| isBoolean                | Function | Ensures the given HTML Attribute is converted as boolean, this enables the usage of using HTML attributes without any value. |
| isExternal               | Function | Returns TRUE if the defined URL value is an external url.                                                                    |
| isMode                   | Function | Use the defined color mode when available or use the default mode as fallback.                                               |
| isTarget                 | Function | Use the defined target Attribute value or use the default target as fallback.                                                |
| isWithinViewPort         | Function | Returns TRUE if the defined element exists within the visible viewport.                                                      |
| keyCodes                 | Object   | Reference Object for the default Keyboard Event Key Listeners.                                                               |
| resolveURL               | Function | Resolves the defined relative URL value with the actual hostname.                                                            |
| sanitizeHTML             | Function | Strips any HTML content from the defined by using the Element.textContent instead.                                           |
| strip                    | Function | Removes any whitespace from the defined String.                                                                              |
| supportedImageExtensions | Array    | List of all accepted file extensions for Image files/elements.                                                               |
| useHost                  | Function | Returns the parent Web Component from the selected Element.                                                                  |
| useOption                | Function | Ensures the given property is returned as valid Attribute value from the given Object value.                                 |


#### Enlightenment.isBoolean()


| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| [aria-disabled]     | String  |             |
| [delay]             | Boolean |             |
| [error]             | String  |             |
| [mode]              | String  |             |
| [minimalShadowRoot] | Boolean |             |
| [svg-sprite-source] | String  |             |


## Common Attributes

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| [aria-disabled]     | String  |             |
| [delay]             | Boolean |             |
| [error]             | String  |             |
| [mode]              | String  |             |
| [minimalShadowRoot] | Boolean |             |
| [svg-sprite-source] | String  |             |




## ARIA Helpers @WIP

| Type         | Description                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| aria-current | Will update the defined **context** and custom element during a **currentElement** mutation.                                           |
| aria-hidden  | Will update the parent container ARIA attribute during the *slotchange* Event target. This enables the styling of empty slot elements. |
