# Enlightenment API

### Callbacks:

#### `[Function]` handleReady(): void







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
