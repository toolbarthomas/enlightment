import {
  css as _css,
  CSSResultGroup,
  LitElement as _LitElement,
  html as _html,
  nothing as _nothing,
  PropertyValues,
  PropertyValueMap,
  svg
} from 'lit'

import { customElement as _customElement, property as _property, query } from 'lit/decorators.js'
import { createRef as _createRef, ref as _ref, Ref } from 'lit/directives/ref.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

import {
  EnlightenmentProcessHandler,
  EnlightenmentImageOptions,
  EnlightenmentJSONResponse,
  EnlightenmentJSONResponseArray,
  EnlightenmentJSONResponseObject,
  EnlightenmentJSONResponseTransformer,
  EnlightenmentJSONResponseValue,
  EnlightenmentThrottle,
  EnligtenmentTarget,
  GlobalEvent,
  GlobalEventHandler,
  GlobalEventOptions,
  GlobalEventType,
  HookOptions,
  EnlightenmentDataEntry
} from './_types/main'

import { isEmptyComponentSlot } from './mixins/dom'
import { EnlightenmentGlobals } from './providers/Globals'
import { EnlightenmentTheme } from './providers/Theme'

export const createRef = _createRef
export const css = _css
export const customElement = _customElement
export const LitElement = _LitElement
export const html = _html
export const nothing = _nothing
export const property = _property
export const ref = _ref
export const NAMESPACE = 'NLGHTNMNT'

// import styles from "src/styles.scss";

import { EnlightenmentKernel } from './core/Kernel'

/**
 * Enlightenment is a toolset based on the Lit Element Web Component library with
 * extra DOM related features like:
 *  - (inline) SVG & Image insertion (@TODO)
 *  - Image extension validation (@TODO)
 *  - Target validation (@TODO currentElement)
 *  - Hooks/Event Dispatcher (@TODO)
 *  - context validation (@TODO isComponentContext)
 *  - optional logging (@TODO)
 *  - Global Event Emitter (@TODO)
 *  - Property Commit (@TODO)
 *  - Function throttler (@TODO),
 *
 * An Enlightenment Element written within the
 * Esbuild workflow includes the component stylesheet within the actual
 * source by using the Esbuild Enlightenment Sass Plugin:
 * - @toolbarthomas/enlightenment/node/esbuild.sass.plugin.mjs
 * The stylesheet is compiled with Sass and included with the css
 * template literal within the actual component (this is an incomplete scope
 * and should only explain the styelsheet result within the component. ):
 *
 * Source:
 * // my-component.ts
 * import "styles.css";
 *
 * Result:
 * // my-component.js
 * import { css } from '@toolbarthomas/enlightenment'
 * css`...`
 *
 * While using Esbuild, it is possible to disable the stylesheet bundle with the
 * default css loader and will prevent the include of the compiled stylesheet
 * of the component. Keep in mind that you are bound to the Web Component
 * restrictions regarding using external styles. You should include the optional
 * external stylesheet according to the Web Component specification.
 *
 * Package authors can include the Esbuild Sass Plugin within their Esbuild
 * configuration, to enable the stylesheet bundle within the component. Keep in
 * mind that the imported stylesheets should resolve from the actual
 * process.cwd, node_modules directory or relative from the context that imports
 * the required stylesheet.
 *
 * Enlightenment provides the required helper, decorator and class exports and
 * the actual workflow expects the actual component result is compiled in the
 * ESM format. It should import the required core class (Enlightenment) as native
 * module script:
 *
 * <script src="my-component.js" type="module"></script>
 */
export class Enlightenment extends LitElement {
  // Defines any fallback to use for optional properties.
  static defaults = {
    slot: '_content',
    attrGrabbed: 'aria-grabbed'
  }

  // Expected interval value of 60HZ refresh rate.
  static FPS = 1000 / 60

  // Excepted timeout value to use for Repaint based updates.
  static RPS = 200

  /**
   * Defines the 8 available corner directions as box number values:
   * North-West, North, North-East, West, East, South-West, South & South-East.
   */
  static pivots = {
    x: [1, 3, 4, 6, 7, 9],
    y: [1, 2, 3, 7, 8, 9]
  }

  // Shared globals for the running component instances.
  static globals = new EnlightenmentGlobals(NAMESPACE)

  // Triggers the cleanup handler when the amount of function calls has reached
  // the defined maximum value.
  static MAX_THREADS = 128

  // Includes the global Stylesheets within the defined Components & Document.
  static theme = new EnlightenmentTheme()

  // Converts the given string value as array with potential selectors.
  static convertToSelectors(value: any) {
    if (typeof value !== 'string') {
      return []
    }

    return String(value)
      .split(',')
      .map((v) => {
        const selector = v.split(' ').join('')

        return document.getElementById(selector) || document.querySelector(selector)
      })
      .filter((e) => e !== null && e !== undefined) as HTMLElement[]
  }

  /**
   * Checks if the defined String value exists within the collection parameter.
   * The first value from the collection will be used as fallback if the initial
   * value does not exist within the defined collection.
   */
  static filterProperty(value: any, collection: string[]) {
    if (!value || !collection || !collection.length) {
      return
    }

    const [fallback] = collection

    if (typeof value !== 'string') {
      return fallback
    }

    return collection.includes(value) ? value : fallback
  }

  /**
   * Generates a new ID value from the current timestamp without any validation.
   */
  static generateTimestampID() {
    return `uuid${btoa(
      (String(Date.now()).match(/.{1,2}/g) || [])
        .sort(() => Math.random() - 0.5)
        .map((c) => String.fromCharCode(parseInt(c)))
        .join('')
    )
      .replaceAll('=', '')
      .replaceAll('/', '')}`
  }

  /**
   * Returns a Nodelist from the defined element tag within given Slot context.
   *
   * @param slot Find any element within the defined Slot context.
   * @param tags Find any valid tag from the given context.
   */
  static getElementsFromSlot(slot: HTMLSlotElement, tags: string[]) {
    if (!slot || !slot.assignedElements || !tags) {
      return []
    }

    const elements: HTMLElement[] = []

    Object.values(slot.assignedElements()).forEach((element) => {
      elements.push(...Enlightenment.getElements(element, tags))
    })

    return [...new Set(elements)]
  }

  /**
   * Returns the element from the given context.
   *
   * @param slot Find any element within the defined context.
   * @param tags Find any valid tag from the given context.
   */
  static getElements(context: Element, tags: string[]) {
    if (!context) {
      return []
    }

    const elements: HTMLElement[] = []

    if (context.shadowRoot) {
      Object.values(context.shadowRoot.children).forEach((child) =>
        elements.push(...Enlightenment.getElements(child, tags))
      )
    }

    if (context.children) {
      Object.values(context.children).forEach((child) =>
        elements.push(...Enlightenment.getElements(child, tags))
      )
    }

    if (
      tags.includes(context.tagName.toLowerCase()) &&
      !elements.includes(context as HTMLElement)
    ) {
      elements.push(context as HTMLElement)
    }

    return [...new Set(elements)]
  }

  /**
   * Get all related components from the given context and Document by default
   * or use the defined element selector.
   */
  static getRelatedComponents(context: Element, selector?: string) {
    return [
      ...new Set([
        ...Array.from(document.querySelectorAll(selector || context.tagName)),
        ...(context.parentNode
          ? Array.from(context.parentNode.querySelectorAll(selector || context.tagName))
          : [])
      ])
    ].filter((element) => element !== context)
  }

  // Defines the attribute state from the given value, non-defined attributes
  // should be undefined while attributes without values should be true.
  static isBoolean(value: any) {
    return value !== undefined && String(value) !== 'false' ? true : false
  }

  // Ensures the given value is parsed as Integer value.
  static isInteger(value: any) {
    return value && parseInt(value)
  }

  // Check if the defined target Element is within the current viewport.
  static isWithinViewport(target: HTMLElement) {
    if (!target) {
      return false
    }

    const bounds = target.getBoundingClientRect()

    return (
      bounds.top >= 0 &&
      bounds.left >= 0 &&
      bounds.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      bounds.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  /**
   * Validates if the defined url value is external.
   */
  static isExternal(url: string) {
    if (!url) {
      return false
    }

    const match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/)

    if (!match) {
      return false
    }

    if (
      typeof match[1] === 'string' &&
      match[1].length > 0 &&
      match[1].toLowerCase() !== location.protocol
    ) {
      return true
    }

    if (
      typeof match[2] === 'string' &&
      match[2].length > 0 &&
      match[2].replace(
        new RegExp(':(' + { 'http:': 80, 'https:': 443 }[location.protocol] + ')?$'),
        ''
      ) !== location.host
    ) {
      return true
    }

    return false
  }

  /**
   * Ensures the given value is a valid mode value.
   *
   * @param value The initial value to validate.
   */
  static isMode(value: any) {
    return Enlightenment.filterProperty(value, EnlightenmentTheme.COLOR_MODES)
  }

  /**
   * Ensures the given value is a valid target attribute value.
   *
   * @param value The initial value to validate.
   */
  static isTarget(value: any) {
    return Enlightenment.filterProperty(value, ['_self', '_blank', '_parent', '_top'])
  }

  /**
   * Parses the defined string value as JSON and return the output within an
   * Array regardless of the result.
   *
   * @param value The string value to parse.
   * @param transform Optional handler to transform the initial values of the
   * parsed JSON. This can be used to mutate the initial Array entry or include
   * additional properties within the initial JSON Object.
   */
  static parseJSON(value: any, transform?: EnlightenmentJSONResponseTransformer) {
    let json: any
    let isValid = false

    if (!value || !value.length) {
      return []
    }

    try {
      const escaped = value.replaceAll(`'`, `"`)
      json = JSON.parse(escaped)
      isValid = true
    } catch (exception) {
      if (exception) {
        return []

        //@TODO use existing Console instead?
        console.error(exception)
      }
    }

    if (typeof transform === 'function') {
      const response: EnlightenmentDataEntry[] = []

      try {
        Object.entries(json).forEach(
          ([key, value]: [string, EnlightenmentJSONResponseValue], index) => {
            const payload: EnlightenmentJSONResponseObject = {}
            payload[key] = value

            const body = (typeof value === 'string' ? value : payload) as EnlightenmentDataEntry

            const result = transform(value)

            if (result && result instanceof Object) {
              Object.freeze(result)
            } else if (body instanceof Object) {
              Object.freeze(body)
            }

            response.push(result !== undefined ? result : body)
          }
        )

        isValid = Object.values(response).filter((r) => r !== undefined && r).length ? true : false
      } catch (exception) {
        if (exception) {
          isValid = false

          //@TODO use existing Console instead?
          console.error(exception)
        }
      }

      if (isValid) {
        return (Array.isArray(response) ? response : [response]) as EnlightenmentJSONResponse
      }
    }

    if (Array.isArray(json)) {
      return json as EnlightenmentJSONResponseArray
    }

    return [json] as EnlightenmentJSONResponseObject
  }

  /**
   * Parse the defined Matrix value as array with string or number values.
   *
   * @param value The Matrix value to parse.
   */
  static parseMatrix(value: string) {
    if (!value) {
      return []
    }

    const matrix = value
      .split(/\w*(...)[(]/gim)
      .filter((e) => e.includes(')'))
      .map((e) => e.split(')')[0].split(',').map(Enlightenment.strip).map(parseFloat))
      .flat()

    return matrix
  }

  // The keycodes that could be validated within a class method.
  static keyCodes = {
    confirm: [13, 32],
    exit: [27],
    meta: [9, 16, 17, 18, 20]
  }

  /**
   * Simple helper function to ensure the given value does not contain any
   * XML/HTML based syntax.
   *
   * @param value The initial value to sanitize.
   */
  static sanitizeHTML(value: string) {
    const raw = document.createElement('div')
    raw.innerHTML = value

    return raw.textContent || ''
  }

  /**
   * Ensures any whitespace is removed from the given string.
   *
   * @param value The initial value to strip.
   */
  static strip(value: string) {
    return typeof value === 'string'
      ? value
          .split(' ')
          .join('')
          .replace(/\r?\n|\r/g, '')
      : String(value)
  }

  // Defines the renderable image type for the renderImage method.
  static supportedImageExtensions = [
    '.apng',
    '.avif',
    '.bmp',
    '.gif',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.tiff',
    '.webp'
  ]

  // Defines the usable extensions for webfont sources.
  static supportedWebfontExtensions = ['.woff', '.woff2']

  /**
   * Generates a new valid element id selector for the current DOM.
   */
  static useElementID() {
    let id = Enlightenment.generateTimestampID()

    while (document.getElementById(id)) {
      id = Enlightenment.generateTimestampID()
    }

    return id
  }

  /**
   * Traverse from the defined context and return the host Component
   *
   * @param context The existing context Element to traverse from.
   */
  static useHost(context: any) {
    if (!context) {
      return
    }

    let target: Element | undefined = undefined

    if (!target) {
      let current: any = context

      while (current.parentNode && !target) {
        if (context.parentNode instanceof Enlightenment) {
          target = context.parentNode
        }

        if (context.host && context.host instanceof Enlightenment) {
          target = context.host
        }

        if (current && current.host && !Object.values(current).length) {
          target = current.host || current
        }

        if (!target && current && current.host !== context) {
          target = current.host
        }

        if (target) {
          break
        }

        current = current.parentNode as Element
      }

      if (!target && current && current.host !== context) {
        target = current.host
      }
    }

    return target
  }

  /**
   * Helper function to ensure the requested property is returned from a
   * dynamic string or object value.
   *
   * @param property The existing property name that exists within the
   * constructed instance.
   * @param value Assigns the defined value.
   * @param optional Return an empty value when TRUE the initial property is
   * undefined.
   */
  static useOption(property: string, value?: any, optional?: boolean) {
    return Enlightenment.sanitizeHTML(
      String((typeof value === 'string' && !optional ? value : (value || {})[property]) || '')
    )
  }

  /**
   * Verifies the defined URL and resolve any external url to prevent insecure
   * requests.
   *
   * @param url Resolve the initial url value.
   */
  static resolveURL(url: string) {
    if (typeof url !== 'string') {
      return ''
    }

    // Use the AnchorElement interface to verify the initial url.
    const anchor = document.createElement('a')
    anchor.href = url

    const port = parseInt(window.location.port || anchor.port) || 80
    const [protocol, relativeURL] = anchor.href.split(anchor.host)
    const absoluteURL =
      protocol +
      ([80, 443].includes(port) ? window.location.hostname : window.location.host) +
      relativeURL

    return absoluteURL
  }

  constructor() {
    super()

    this.uuid = this.constructor.name

    // Setup the throttler for the new Component.
    this.throttler = {
      delay: parseInt(String(this.delay)) || Enlightenment.FPS,
      handlers: []
    }

    if (this.enableFragments) {
      this.log(`Fragments enabled for ${this.uuid}`, 'log')
    }
  }

  // Interal timeout ID that should be redefined during any cleanup calls.
  cid?: number

  // Default element reference that should be assigned to the root element
  // within the render context.
  context = createRef()

  // Should insert the defined classnames within the root context.
  classes: string[] = []

  // Should hold the current edge value while isGrabbed equals TRUE.
  currentEdgeX?: 'left' | 'right'
  currentEdgeY?: 'top' | 'bottom'

  // Optional flag that can be used within the Document Event handlers to check
  // if the current scope is within the defined Component.
  currentElement?: boolean = false

  // Keep track of the interaction amount within the selected duration.
  currentInteractions = 0
  currentInteractionRequest?: number
  currentInteractionResponse?: number
  currentInteractionVelocityX?: number
  currentInteractionVelocityY?: number

  // Should hold the current integer X & Y values of the defined Pointer.
  currentPointerX?: number
  currentPointerY?: number

  // Defines the current selected pivot from 1 to 9 that should use the defined
  // Drag action.
  currentPivot?: number

  // Should hold the current integer value of the X & Y positions for the
  // defined context element.
  currentContextX?: number
  currentContextY?: number

  // Contains the references of the created custom CSSStyleSheet to enable
  // StyleSheet updates for the rendered Components.
  customStyleSheet?: CSSStyleSheet

  // Keep track of the updated custom stylesheets to preventStyleSheet
  // updates without any change.
  customStyleSheetCache?: string

  // Enables the default document Events that is called within: handleGlobal...
  // methods when TRUE.
  enableDocumentEvents?: boolean = false

  // Enables fragment usage within the defined component to repeat any HTML
  // within the named Slot.
  enableFragments?: boolean = false

  // Will be TRUE if the optional Focus Trap Element exists within the Component
  // and is currently active.
  hasActiveFocusTrap?: boolean

  // Defines the optional state properties to use in combination with the
  // actual aria attribute.
  isCollapsed?: boolean = false
  isExpanded?: boolean = false
  isFullscreen?: boolean = false
  isGrabbed?: boolean = false

  // Dynamic storage for the running document Event listeners.
  listeners: GlobalEvent[] = []

  // Value to use for the naming of the Global state.
  namespace: string = NAMESPACE

  // Blocks the default handle methods when TRUE.
  preventEvent?: boolean = false

  // Should hold the previous defined currentPointerX & currentPointerY
  // position values.
  previousPointerX?: number
  previousPointerY?: number

  pid?: number

  // Reference to the parent Window object that holds the global state of the
  // created instance.
  root: Window = window

  // Contains the Shadow Root slot target contexts in order to validate
  // the actual rendered slots existence.
  slots: { [key: string]: HTMLSlotElement | undefined } = {}

  // Boolean flag that should mutate only once when the actual slot elements
  // are initiated.
  slotReady: boolean = false

  // Contains the assigned handlers that will be called once.
  throttler: {
    delay: number
    handlers: EnlightenmentThrottle[]
  }

  // Alias to the constructor name.
  uuid: string

  /**
   * Defines the smallest compatible device width for the current Component.
   */
  viewport?: string

  // Generates the optional accent color for the defined component.
  @property({
    converter: (value) => Enlightenment.theme.useColor(value),
    type: String
  })
  accent?: string

  @property({
    attribute: 'aria-disabled',
    type: String
  })
  ariaDisabled: string | null = null

  // Optional throttle delay to use instead of the default Enlightenment.FPS
  // value
  @property({
    type: Number,
    converter: (value) => parseInt(String(value)) || Enlightenment.FPS
  })
  delay = Enlightenment.FPS

  // Boolean flag that should behave like the existing Input Element disabled
  // attribute.
  @property({
    converter: (value) => Enlightenment.isBoolean(value),
    type: Boolean
  })
  disabled?: boolean

  // Readable error to display during an exception/error within the defined
  // component context.
  @property()
  error = ''

  // Expose the handle attribute that could be used for every Element.
  @property({ type: String })
  handle?: string

  // Defines the Color Mode to use: Dark/Light
  @property({
    converter: (value) => Enlightenment.isMode(value),
    type: String
  })
  mode?: string

  // Returns the full Component context when FALSE.
  @property({
    converter: (value) => Enlightenment.isBoolean(value),
    type: Boolean
  })
  minimalShadowRoot?: boolean

  @property({
    converter: (value) => Enlightenment.theme.useColor(value),
    type: String
  })
  neutral?: string

  // Will call the process method if the defined selector names exists within
  // the current DOM.
  @property({
    converter: (value) => Enlightenment.convertToSelectors(value),
    type: Array
  })
  observe?: NodeList

  // Optional Flag that will prevent the usage of requestUpdate during an
  // attribute change.
  @property({ converter: (value) => Enlightenment.isBoolean(value), type: Boolean })
  once?: boolean

  // Optional Flag that should render the component indicator during a loading
  // state of the defined component.
  @property({
    converter: (value) => Enlightenment.isBoolean(value),
    type: Boolean
  })
  pending?: boolean

  // Enables the usage of an SVG spritesheet with the renderImage helper
  // methods.
  @property({
    attribute: 'svg-sprite-source',
    converter: (value) => Enlightenment.resolveURL(Enlightenment.strip(String(value)))
  })
  svgSpriteSource = ''

  /**
   * Optional callback to use when existing Elements are attached from the
   * listen property: listen=".foo,#bar,custom-component".
   *
   * @param event The actual Event Object that was created from an existing
   * listen element.
   */
  private _process(event: Event) {
    if (!this.observe) {
      this.log(`Unable to process from undefined listeners...`, 'warning')

      return
    }

    if (!event) {
      this.log(`Unable to run process with undefined Event...`, 'warning')

      return
    }

    const { target } = event || {}
    // @ts-ignore
    const process: undefined | EnlightenmentProcessHandler = this.process

    try {
      process &&
        this.throttle(process, this.slotReady ? this.delay : Enlightenment.MAX_THREADS, {
          target
        })
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  /**
   * Expose the constructed Component stylesheet in order to update it within
   * a lifecycle Event.
   *
   * @param sheet The stylesheet that was defined for the defined component.
   */
  private assignCustomCSSStyleSheet(sheet?: CSSStyleSheet) {
    if (!sheet) {
      return
    }

    if (sheet instanceof CSSStyleSheet === false) {
      this.log(
        `Unable to assign custom stylesheet '${name}' without a valid CSSStyleSheet`,
        'warning'
      )

      return
    }

    this.customStyleSheet = sheet

    this.log(['Custom stylesheet assigned:', sheet.title], 'log')
  }

  /**
   * Attaches the defined component to the currentElement global.
   */
  private attachCurrentElement() {
    this.commit('currentElement', true)

    Enlightenment.globals.assignCurrentElement(this)
  }

  /**
   * Assign a new Global Event for each existing component context that is
   * defined the listen property.
   */
  private assignListeners() {
    if (!this.observe || !this.observe.length) {
      return
    }

    // Don't assign the actual Event Listener to the initial Component to
    // prevent an update loop.
    const queue = Array.from(this.observe).filter((l) => l !== this && document.contains(l))

    if (!queue.length) {
      return
    }

    for (let i = queue.length; i--; ) {
      this.assignGlobalEvent('updated', this._process, { context: queue[i] })
    }
  }

  /**
   * Assigns the rendered slots within the current element instance to
   * instance.slots Object.
   *
   * @param name Use the defined name instead of the default slot. This is
   * required when multiple slots exists within the Component.
   */
  private assignSlots(name?: string) {
    if (!this.shadowRoot) {
      this.log(`Unable to detect shadowRoot from ${this.namespace}`, 'error')

      return
    }

    const slots = this.shadowRoot.querySelectorAll('slot')

    if (slots && !slots.length && !Object.keys(this.slots).length) {
      return
    } else if (!slots && !Object.keys(this.slots).length) {
      return
    }

    this.clearGlobalEvent('slotchange', slots)

    this.commit('slots', () => {
      if (!slots || !slots.length) {
        this.slots = {}
      } else {
        for (let i = 0; i < slots.length; i += 1) {
          const slot = slots[i]
          const name = slot.name || Enlightenment.defaults.slot

          this.clearSlottedEvents(slot)

          if (!Object.values(this.slots).includes(slot)) {
            if (!this.slots[name]) {
              this.throttle(this.handleSlotChange, this.delay, { ...event, target: slot })
            }

            this.slots[name] = isEmptyComponentSlot(slot) ? undefined : slot

            this.assignGlobalEvent('slotchange', this.handleSlotChange, { context: slot })
          }
        }

        if (this.slots && Object.values(this.slots).filter((s) => s).length) {
          this.log([`Found ${this.constructor.name} ${slots.length} slot(s) from:`, this.slots])
        }
      }
    })
  }

  /**
   * Removes the additional Event listeners from the direct child elements
   * that have the [handle] attribute defined. This should be called after a
   * slot is changed or removed to cleanup obsolete Event handlers.
   *
   * @param slot Look for additional [handler] elements within the selected slot
   * and remove the assigned Global Events.
   */
  private clearSlottedEvents(slot?: HTMLSlotElement) {
    const actions: HTMLElement[] = []

    actions.push(...(Object.values(this.querySelectorAll(`[handle]`)) as HTMLElement[]))

    if (slot) {
      actions.push(...(Object.values(slot.querySelectorAll('[handle]')) as HTMLElement[]))
    }

    actions.forEach((element) => {
      const value = element.getAttribute('handle')

      if (!value) {
        return
      }

      let [type, name] = value.split(':')

      if (Enlightenment.useHost(element) !== this) {
        return
      }

      if (!name) {
        name = type
        type = 'click'
      }

      this.clearGlobalEvent(type, element)
    })
  }

  /**
   * Cleanup the defined throttler handlers and stop any defined throttle
   * timeout.
   */
  private clearThrottler() {
    const { handlers } = this.throttler

    if (!handlers || !handlers.length) {
      return
    }

    handlers.forEach(([fn, timeout], index) => {
      if (timeout) {
        clearTimeout(timeout)

        this.log(['Throttle cleared:', fn])
      }
    })

    this.throttler.handlers = []
  }

  /**
   * Removes the defined Enlightenment element from the currentElements global
   * and notify any related Enlightenment components.
   */
  private detachCurrentElement() {
    this.commit('currentElement', () => {
      this.updateAttributeAlias('currentElement', 'aria-current')
      return false
    })

    Enlightenment.globals.omitCurrentElement(this)

    this.dispatchUpdate('omit')
  }

  /**
   * Default hook that should be called during a component render update.
   *
   * @param name Dispatch the optional Event type instead.
   */
  private dispatchUpdate(name?: string) {
    return this.throttle(this.hook, this.delay, typeof name === 'string' ? name : 'update')
  }

  /**
   * Validates if the defined Event handler has already been defined as
   * global Event.
   *
   * @param type Filters within the matching Event types.
   * @param handler Compares the defined handler name with the existing Global
   * Event handler.
   */
  private filterGlobalEvent(type: GlobalEventType, handler: GlobalEventHandler) {
    if (!this.listeners.length) {
      return []
    }

    const entry: GlobalEvent[] = []
    this.listeners.forEach(([t, fn, ctx, h]) => {
      if (t === type && fn.name.endsWith(handler.name)) {
        entry.push([t, fn, ctx, h])
      }
    })

    return entry.length ? entry[0] : []
  }

  /**
   * Removes the assigned global Event handler.
   *
   * @param type Omit from the matching Event type.
   * @param handler Omit the defined handler that was assigned as Global Event
   * handler.
   */
  private omitGlobalEvent(type: GlobalEventType, handler: GlobalEventHandler) {
    console.log('remove', type)
    if (!type) {
      this.log('Unable to omit undefined global Event', 'warning')

      return
    }

    if (typeof handler !== 'function') {
      this.log(`Unable to omit global ${type} Event, no valid function was defined.`, 'warning')
    }

    const [t, fn, ctx] = this.filterGlobalEvent(type, handler)

    if (!t || !fn || !ctx) {
      this.log(`Unable to omit undefined global ${type} Event`, 'warning')

      return
    }

    ctx.removeEventListener(t, fn as any)

    const index: number[] = []
    this.listeners.forEach(([t2, fn2], i) => {
      if (fn2 === fn) {
        index.push(i)
      }
    })

    //@ts-ignore
    this.listeners = this.listeners
      .map((l, i) => (index.includes(i) ? undefined : l))
      .filter((l) => l)

    this.log(`Global ${type} event removed:`)

    this.dispatchUpdate('omit')
  }

  /**
   * Calls the defined function handler for the existing Observer HTMl elements
   * that wass defined from observe attribute.
   *
   * @param handler The function handler to call for the observed elements
   */
  private processObserved(handler?: EnlightenmentProcessHandler) {
    if (!this.observe || typeof handler !== 'function') {
      return
    }

    try {
      for (let i = Object.keys(this.observe).length; i--; ) {
        // this.throttle(handler, Enlightenment.FPS, )
        handler(this.observe[i] as HTMLElement)
      }
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  /**
   * Call the requestUpdate handler for the direct child components within the
   * direct body.
   *
   * @param exclude Ignores the update request within the initial Component
   * context.
   */
  private requestGlobalUpdate(exclude: boolean) {
    const { body } = document || this
    const elements = Array.from(body.children || []).filter(
      (f: any) =>
        f.requestUpdate &&
        f instanceof Enlightenment &&
        f.namespace === this.namespace &&
        // Excludes the context that calls this method.
        (exclude ? f != this : true)
    )

    for (let i = 0; i < elements.length; i += 1) {
      const component = elements[i] as Enlightenment
      if (component.throttle && component.requestUpdate) {
        component.throttle(component.requestUpdate.bind(component))
      }
    }
  }

  /**
   * Update callback for the defined custom StyleSheet of the rendered Element
   * that will update the currently defined Custom Stylesheet that has been
   * assigned after the initial Component styles.
   */
  private updateCustomStylesSheets() {
    const accents = Enlightenment.theme.useAccent(
      this,
      this.accent,
      EnlightenmentTheme.colorChart.delta
    )

    const neutrals = Enlightenment.theme.useNeutral(this, this.neutral)

    // Only update if there are any accents or neutral values to use.
    if (accents && neutrals && !accents.length && !neutrals.length) {
      return
    }

    const sheet = this.customStyleSheet

    if (!sheet || sheet instanceof CSSStyleSheet === false) {
      return
    }

    const style = `
      ${EnlightenmentTheme.component}

      :host {
        ${accents && accents.join('\n')}
        ${neutrals && neutrals.join('\n')}
      }
    `

    if (this.customStyleSheetCache && this.customStyleSheetCache === style) {
      return
    }

    this.customStyleSheetCache = style

    sheet.replaceSync(style)
  }

  /**
   * Defines the mode attribute for the defined element that inherits the
   * specified mode value from the global state as default value otherwise.
   */
  private useMode(context?: Element) {
    const { mode } = Enlightenment.globals
    const target = (context || this) as Enlightenment
    const host = Enlightenment.useHost(target) as Enlightenment

    // Ensure a valid mode is always active since it can be mutated outside
    // the component context.
    if (!this.mode) {
      this.mode = Enlightenment.globals.mode

      this.log(`Use fallback mode: ${this.mode}`, 'log')
    }

    if (!this.hasAttribute('mode') && host) {
      const inheritMode = Enlightenment.isMode(host.getAttribute('mode'))

      if (!inheritMode) {
        // Ensure the unconstructed parent element is ready before we traverse
        // upwards.
        this.throttle(() => {
          host.useMode && host.useMode(this)
        })

        return
      }

      if (inheritMode && this.mode !== inheritMode) {
        target.mode = inheritMode

        // Update the inherited mode value as actual HTML attribute in order to
        // apply the actual CSS styles.
        target.mode && target.setAttribute('mode', target.mode)
      } else if (this.mode === undefined) {
        this.mode = mode || Enlightenment.globals.mode
      }
    } else if (!this.mode && mode && this.mode !== mode) {
      this.mode = mode
    } else if (
      context &&
      context !== this &&
      this.hasAttribute('mode') &&
      !context.hasAttribute('mode')
    ) {
      target.mode = this.mode
      this.mode && target.setAttribute('mode', this.mode)
    }
  }

  protected usePointerPosition(event: MouseEvent | TouchEvent) {
    if (!event || !this.isGrabbed) {
      return []
    }

    let clientX = 0
    let clientY = 0

    if (event instanceof MouseEvent) {
      clientX = event.clientX
      clientY = event.clientY
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    }

    return [clientX, clientY]
  }

  /**
   * Returns the existing Component if the defined context exists within the
   * observed Elements from the instance method.
   *
   * @param context Traverse from the actual element to get the host Component
   * that will be checked with `this`.
   */
  private useObserved(context: HTMLElement) {
    if (!context) {
      return
    }

    if (!this.observe) {
      return
    }

    // let { observe } = context as Enlightenment
    let target: HTMLElement | undefined = undefined

    if (!target && !this.isComponentContext(context)) {
      let current = context

      while (current.parentNode && !target) {
        if (Object.values(this.observe).includes(current) && current !== this) {
          target = current
          break
        } else if (current.tagName === this.tagName) {
          break
        }

        current = current.parentNode as HTMLElement
      }
    }

    return target
  }

  /**
   * Assigns a new global event for the rendered component context.
   * The actual event is stored within the instance to prevent Event stacking.
   *
   * @param type The Event type to assign.
   * @param handler The Event handler to assign.
   * @param options The optional Event options to assign.
   */
  protected assignGlobalEvent(
    type: GlobalEventType,
    handler: GlobalEventHandler,
    options?: GlobalEventOptions
  ) {
    if (!type) {
      this.log('Unable to assign global event.', 'error')

      return
    }

    if (typeof handler !== 'function') {
      this.log(`Unable to subscribe existing Document Event for ${type}`, 'error')

      return
    }

    const { context, once } = options || {}

    const ctx = context || document

    const exists = this.listeners.filter(([t, _, c, h]) => t === type && h === handler && c === ctx)

    if (exists.length) {
      this.log(`Unable to overwrite existing global event for ${ctx}`, 'warning')

      return
    }

    const fn = handler.bind(this)

    this.listeners.push([type, fn, ctx, handler])

    ctx && ctx.addEventListener(type, fn, { once })

    this.log([`Global event assigned: ${ctx.constructor.name}@${type}`, ctx])
  }

  /**
   * Find the closest Element from the defined selector that should exists
   * within the initial or any parent ShadowDOM.
   *
   * @param selector Requires a valid querySelector value.
   */
  protected findParentElement(selector: string) {
    if (typeof selector !== 'string') {
      return
    }

    let host = Enlightenment.useHost(this) as Enlightenment

    if (!host) {
      return
    }

    let context = host.useContext()

    while (context && context.tagName !== selector.toUpperCase()) {
      host = Enlightenment.useHost(host) as Enlightenment

      if (!host) {
        break
      }

      const target = host.shadowRoot && host.shadowRoot.querySelector(selector.toLowerCase())

      if (target) {
        context = target

        break
      }

      context = host.useContext()
    }

    if (!context || context.tagName !== selector.toUpperCase()) {
      return
    }

    return context
  }

  /**
   * Setup the actual featuers for the constructed Enlightenment component.
   *
   * @param properties Defines the previous state of the updated properties.
   */
  protected firstUpdated(properties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    super.firstUpdated(properties)

    this.throttle(this.useMode)

    // this.assignGlobalEvent('ready', this.useMode, { context: this })

    // // this.addEventListener('ready', this.useMode, {})

    // // console.log('in', this.slots, this.useInitialSlot())

    this.dispatchUpdate('updated')
  }

  /**
   * Toggles the currentElement property within the defined element context.
   *
   * The expected attributes are updated directly without triggering a
   * requestUpdate within the Document handler. The actual update should be
   * called from the Component context that interacts with the property state.
   *
   * @param target Validates from the defined context element.
   */
  protected handleCurrentElement(target: Event['target']) {
    if (this.preventEvent) {
      return
    }

    if (this.isComponentContext(target as HTMLElement)) {
      this.attachCurrentElement()
    } else {
      this.detachCurrentElement()
    }
  }

  /**
   * Defines the viewport Attribute from the rendered shadowRoot width to
   * enable container like queries instead of Media queries.
   */
  protected handleCurrentViewport() {
    if (!this.shadowRoot) {
      return
    }

    if (!this.enableDocumentEvents) {
      return
    }

    let selectedWidth = 0
    let device = ''

    const children = this.shadowRoot.children as unknown as HTMLElement[]
    const widths: number[] = []

    const each = (elements: HTMLElement[]) => {
      const children: HTMLElement[] = []

      Object.values(elements).forEach((element) => {
        if (element instanceof HTMLElement === false) {
          return
        }

        children.push(...(Array.from(element.children) as HTMLElement[]))

        if (element.offsetWidth || element.scrollWidth) {
          widths.push(element.offsetWidth || element.scrollWidth)
        }
      })

      if (!widths.length && children.length) {
        each(children)

        return
      }
    }

    each(children)

    const width = Math.max(...widths)

    this.useBreakpoints((name, breakpoint, delta) => {
      const [minWidth, maxWidth] = delta

      if (width <= maxWidth && (!selectedWidth || breakpoint <= selectedWidth)) {
        device = name
        selectedWidth = breakpoint
      }
    })

    if (this.viewport !== device) {
      this.commit('viewport', device)
    }
  }

  /**
   * Updates the required Drag position values while isGrabbed equals TRUE.
   *
   * @param event Expected Mouse or Touch event.
   */
  protected handleDragUpdate(event: MouseEvent | TouchEvent) {
    const [clientX, clientY] = this.usePointerPosition(event)

    if (this.preventEvent) {
      this.handleDragEnd(event)
      return
    }

    // Only accept movement changes
    if (this.previousPointerX === clientX && this.previousPointerY === clientY) {
      return
    }

    this.currentInteractionVelocityX = clientX > (this.previousPointerX || 0) ? 1 : -1
    this.currentInteractionVelocityY = clientY > (this.previousPointerY || 0) ? 1 : -1

    if (this.previousPointerX === clientX) {
      this.currentInteractionVelocityX = 0
    }

    if (this.previousPointerY === clientY) {
      this.currentInteractionVelocityY = 0
    }

    // if (this.inter)
    if (!this.currentPivot || this.currentPivot === 5) {
      !this.hasAttribute(Enlightenment.defaults.attrGrabbed) &&
        this.setAttribute(Enlightenment.defaults.attrGrabbed, 'true')
    }

    if (clientX !== undefined) {
      this.previousPointerX = clientX
    }

    if (clientY !== undefined) {
      this.previousPointerY = clientY
    }

    // @TODO Should use dynamic viewport context.
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const top = 0
    const bottom = viewportHeight
    const left = 0
    const right = viewportWidth

    // Increase the drag precision instead of the a single pixel.
    const treshhold = Math.ceil(devicePixelRatio * 2)

    // Limit the Pointer boundary within the viewport only
    if (clientY <= top + treshhold) {
      this.currentEdgeY = 'top'
    } else if (clientY >= bottom - treshhold) {
      this.currentEdgeY = 'bottom'
    } else {
      this.currentEdgeY = undefined
    }

    if (clientX <= left + treshhold) {
      this.currentEdgeX = 'left'
    } else if (clientX >= bottom - treshhold) {
      this.currentEdgeX = 'right'
    } else {
      this.currentEdgeX = undefined
    }

    // Failsafe that should exit the current Drag interaction while the current
    // pointer position is outisde the area for a certain duration.
    if (!this.currentPivot || this.currentPivot === 5) {
      if (clientX < 0 || clientX > viewportWidth || clientY < 0 || clientY > viewportHeight) {
        if (this.currentInteractionResponse === undefined) {
          this.currentInteractionResponse && clearTimeout(this.currentInteractionResponse)
          this.currentInteractionResponse = setTimeout(() => this.handleDragEnd(event), 1000)
        }
      }
    }
  }

  /**
   * Defines the default Event handler to initiate the Drag interaction for
   * Mouse & Touch devices.
   *
   * @param event The expected Mouse or Touch Event.
   */
  protected handleDragStart(event: MouseEvent | TouchEvent) {
    if (!event || this.isGrabbed || this.preventEvent) {
      return
    }

    event.preventDefault()

    // Only listen for the main Mouse button.
    if (event instanceof MouseEvent) {
      if (event.button !== 0) {
        return
      }
    }

    const target = event.target as HTMLElement

    if (target && target.hasAttribute('data-pivot')) {
      this.currentPivot = Enlightenment.isInteger(target.getAttribute('data-pivot'))
    }

    // Apply the Drag behavior on the main Component context, since it should
    // contain all visible elements.
    const context = this.useContext() as HTMLElement

    if (!context) {
      return
    }

    this.currentInteractions += 1

    // Enable single & double click interactions
    if (this.currentInteractions === 1) {
      this.throttle(() => {
        this.currentInteractions = 0
      }, this.delay * 12)
    }

    if (this.currentInteractions > 1) {
      console.log('DOUBLE')
      return
    }

    this.isGrabbed = true

    this.currentContextX = context.offsetLeft
    this.currentContextY = context.offsetTop

    const [clientX, clientY] = this.usePointerPosition(event)

    this.currentPointerX = Math.round(clientX)
    this.currentPointerY = Math.round(clientY)

    this.handleCurrentElement(this)

    console.log('DRAG START')

    this.assignGlobalEvent('mousemove', this.handleDragUpdate, {
      context: document.documentElement
    })

    this.assignGlobalEvent('touchmove', this.handleDragUpdate, {
      context: document.documentElement
    })

    this.assignGlobalEvent('touchend', this.handleDragEnd, {
      once: true
    })

    this.assignGlobalEvent('mouseup', this.handleDragEnd, { once: true })
  }

  /**
   * Defines the global click Event listener for the element context.
   *
   * Marks the constructed Enlightenment element as currentElement when the
   * click Event was triggered inside the element context.
   *
   * @param event The initial Mouse Event interface.
   */
  protected handleGlobalClick(event: MouseEvent) {
    if (this.preventEvent) {
      return
    }

    const { target } = event || {}

    this.handleCurrentElement(target)
  }

  /**
   * Defines the global focus Event listener for the element context.
   *
   * Marks the constructed Enlightenment element as currentElement when a
   * keyboard Event was triggered inside the element context.
   *
   * @param event THe initial Focus Event interface.
   */
  protected handleGlobalFocus(event: FocusEvent) {
    if (this.preventEvent) {
      return
    }

    const { target } = event || {}

    this.handleCurrentElement(target)
  }

  /**
   * Defines the global keyboard Event listener for the element context.
   *
   * Unmark the currentElement property from the constructed Enlightenment
   * element during a keyboard event within the element context.
   *
   * @param event The initial Keyboard Event interface.
   */
  protected handleGlobalKeydown(event: KeyboardEvent) {
    if (this.preventEvent) {
      return
    }

    const { keyCode, target } = event || {}

    if (Enlightenment.keyCodes.exit.includes(keyCode)) {
      this.handleCurrentElement(null)

      // this.commit('currentElement', false)
      const t = target as HTMLElement

      if (t && this.isComponentContext(t) && t.blur) {
        t.blur()
      }
    } else if (!Enlightenment.keyCodes.meta.includes(keyCode)) {
      this.handleCurrentElement(event.target)
    } else {
      this.throttle(() => {
        this.handleCurrentElement(document.activeElement)
      })
    }
  }

  /**
   * Callback handler that should be called only after the Component has been
   * rendered everything.
   *
   * @param event Event context of the dispatched ready hook.
   */
  protected handleReady(event: Event) {
    if (this.slotReady) {
      this.throttle(() => {
        this.updateAttributeAlias('slotReady', 'ready', true)

        this.throttle(this.useMode)

        this.clearGlobalEvent('ready', this)
      })
    }
  }

  /**
   * Default resize handler while the document is resized.
   */
  protected handleGlobalResize(event: Event) {
    this.throttle(this.handleCurrentViewport, Enlightenment.RPS)
  }

  /**
   * Defines the global slotchange Event handler that will trigger a slotchange
   * event on the main element context.
   *
   * @param event The initial common Event interface.
   */
  protected handleSlotChange(event: Event) {
    if (this.preventEvent) {
      return
    }

    if (!event) {
      return
    }

    this.isEmptySlot(event)

    this.assignSlottedEvent(event)

    this.updateFragments()

    this.handleCurrentViewport()

    if (!this.slotReady) {
      Object.defineProperty(this, 'slotReady', {
        configurable: false,
        writable: false,
        value: true
      })

      this.throttle(() => {
        this.requestUpdate()
        this.dispatchUpdate('ready')
      })
    }
  }

  /**
   * Ensures the given Attribute is updated according to the current property
   * value. This should be used if the the reflected property does not trigger
   * a render.
   *
   * @param name Updates the defined Attribute to it's current property value.
   */
  protected updateAttribute(name: string, v?: any, strict?: boolean) {
    if (!name) {
      return
    }

    if (!Object.keys(this).includes(name)) {
      return
    }

    const value: any = (this as any)[name]

    if (strict && !this.hasAttribute(name)) {
      return
    }

    const commit = v !== undefined ? v : value !== undefined ? v : ''

    if (String(commit) === this.getAttribute(name)) {
      return
    }

    if (commit !== undefined) {
      this.commit(name, () => {
        if (commit) {
          this.setAttribute(name, String(commit))
        } else {
          this.removeAttribute(name)
        }

        return commit
      })
    }

    return commit
  }

  /**
   * Updates the Component boolean Attribute from the defined context property.
   * The attribute can also be toggled as Boolean attribute with the defined
   * flag parameter, but should be reflected for 2 unique properties.
   *
   * Calling this method with duplicate property names will result in 2 calls.
   *
   * @param property The property name that should exists within the component.
   * @param name The optional Attribute name to use instead of the property.
   * @param flag Assign the actual property as boolean Attribute.
   */
  protected updateAttributeAlias(property: string, name?: string, flag?: boolean) {
    if (!Object.keys(this).includes(property)) {
      return
    }

    const value = (this as any)[property]

    if (value === undefined) {
      return
    }

    if (
      String(value) === this.getAttribute(name || property) ||
      (value === true && this.getAttribute(name || property) === '')
    ) {
      return
    }

    if (value) {
      if (flag && !value && this.hasAttribute(name || property)) {
        this.removeAttribute(name || property)
      } else {
        this.setAttribute(name || property, flag ? '' : String(value))
      }
    } else if (this.hasAttribute(name || property)) {
      this.removeAttribute(name || property)
    } else if (flag) {
      if (name && Object.keys(this).includes(name) && (this as any)[name] !== value) {
        this.commit(name, value)
      }
    }
  }

  /**
   * Callback handler to use after component.updated() is triggered.
   *
   * @param name Dispatch the optional hook
   */
  protected handleUpdate(name?: string) {
    // Defines the current Color mode from the Component context or it's host.
    this.useMode()

    // Reflect the updated properties or attributes vice versa only once.
    this.updateAttribute('accent', this.accent)
    this.updateAttribute('mode', this.mode, true)
    this.updateAttribute('neutral', this.neutral)
    this.updateAttribute('viewport', this.viewport)
    this.updateAttributeAlias('currentElement', 'aria-current')
    this.updateAttributeAlias('isCollapsed', 'aria-collapsed')
    this.updateAttributeAlias('isExpanded', 'aria-expanded')
    this.updateAttributeAlias('pending', 'aria-busy')

    !this.currentElement && this.handleDragEnd()

    this.updateCustomStylesSheets()
    this.updatePreventEvent()

    this.updateAttributeAlias('preventEvent', 'disabled', true)

    this.assignSlots()
    this.dispatchUpdate(name)
  }

  /**
   * Returns the matching parent element by default or use the optional
   * selector value otherwise.
   *
   * @param selector Find the parent context from the defined selector value.
   */
  protected parent(selector?: string) {
    if (!selector) {
      return
    }

    const parent = this.parentElement && this.parentElement.closest(this.tagName)

    return parent || undefined
  }

  /**
   * Returns all matching parent elements from the defined Component.
   *
   * @param selector Find the defined parent elements with the optional selector
   * instead.
   * @param instance Context reference to defined the current parent.
   * @param list Contains the parent element that exists from the initial
   * instance context.
   */
  protected parents(
    selector: string,
    instance?: Enlightenment,
    list?: Enlightenment[]
  ): Enlightenment[] {
    const parent = instance && instance.parent ? instance.parent(selector) : this.parent(selector)

    if (parent && typeof (parent as Enlightenment).parent === 'function') {
      const commit = [...(list || []), parent as Enlightenment]

      return this.parents(selector, parent as Enlightenment, commit)
    }

    if (list && list.length) {
      return list
    }

    return []
  }

  /**
   * Validates if the defined element exists within the created Enlightenment
   * context.
   *
   * @param element Compares the defined context with the initial Component.
   */
  protected isComponentContext(element: HTMLElement | SVGElement) {
    const { value } = this.context || {}
    const context = this.useRef(this.context)

    return (
      element === value ||
      element === this ||
      this.contains(element) ||
      (context && context.contains(element))
    )
  }

  /**
   * Mark the wrapping element as hidden for each empty slot.
   * This should trigger during a slotchange event within the created element
   * context.
   *
   * @param event Use the defined target value from the initial Event interface.
   */
  protected isEmptySlot(event: Event) {
    const { parentElement } = (event.target as Element) || {}

    if (parentElement) {
      if (!isEmptyComponentSlot(event.target as HTMLSlotElement)) {
        parentElement.removeAttribute('aria-hidden')
      } else {
        parentElement.setAttribute('aria-hidden', 'true')
      }
    }
  }

  /**
   * Returns the parent element if the defined context type matches with the
   * parent.
   */
  protected isNested() {
    return this.parent(this.tagName)
  }

  /**
   * Alias for the default console to use during development.
   *
   * @param message The actual message values.
   * @param type Use the defined Console method instead of the default log.
   */
  protected log(message: any | any[], type?: string) {
    //@ts-ignore
    if (typeof console[type || 'log'] !== 'function') {
      return
    }

    let output = Array.isArray(message) ? message : [message]

    const { verbose } = Enlightenment.globals

    if (verbose || type === 'error') {
      let t = type === 'warning' ? 'warn' : type

      //@ts-ignore
      output.forEach((m) => console[t || 'log'](m))
    }
  }

  /**
   * Assign additional global Event listeners for the direct child elements with
   * the [handle] attribute from the defined Component. The [handle] attribute
   * requires an existing method name of the component:
   *
   * Component.start(...) => handle="start()"
   *
   * A click Event will be created by default but you can define different Event
   * types by including it within the attribute value; this will be called
   * during a focus Event instead:
   *
   *  Component.start(...) => handle="focus:start()"
   *
   * @param Event Use the Event target as actual context.
   */
  protected assignSlottedEvent(event: Event) {
    const actions: HTMLElement[] = []

    actions.push(...(Object.values(this.querySelectorAll('[handle]')) as HTMLElement[]))

    const target = event.target as HTMLElement

    if (target) {
      actions.push(...(Object.values(target.querySelectorAll('[handle]')) as HTMLElement[]))
    }

    if (!actions.length) {
      return
    }

    actions.forEach((element) => {
      const value = element.getAttribute('handle')

      if (!value) {
        return
      }

      const events = value.split(',').forEach((str) => {
        let [type, name] = str.split(':')

        if (!name) {
          name = type
          type = 'click'
        }

        //@ts-ignore
        const fn: Function = this[name.split('(')[0]]

        if (typeof fn === 'function' && Enlightenment.useHost(element) === this) {
          this.assignGlobalEvent(
            type,
            () => {
              try {
                this.throttle(fn)
              } catch (exception) {
                if (exception) {
                  this.log(exception, 'error')
                }
              }
            },
            {
              context: element
            }
          )
        }
      })
    })
  }

  /**
   * Optimize the defined Component by removing the obsolete property values.
   * This method can only be called once since it is invoked within an unique
   * Timeout handler that will reset when calling this method.
   */
  protected cleanup() {
    if (this.cid != null) {
      clearTimeout(this.cid)
    }

    if (this.throttler.handlers.length <= Enlightenment.MAX_THREADS) {
      return
    }

    this.cid = setTimeout(
      () => {
        this.throttler.handlers = this.throttler.handlers.filter((h) => h != null)
      },
      this.throttler.handlers.length + this.delay * Enlightenment.MAX_THREADS
    )
  }

  /**
   * Removes the assigned global Events from the selected context or this
   * Component.
   *
   * @param type Remove the Event handler from the defined Event type.
   * @param context Removes the actual Event handler from the defined context
   * instead of the global context.
   */
  protected clearGlobalEvent(type: GlobalEventType, context?: any | any[]) {
    const queue = Array.isArray(context) ? context : [context]

    for (let i = 0; i < queue.length; i += 1) {
      const listeners = this.listeners.filter(
        ([t, fn, ctx]) => t === type && (queue[i] || this) === ctx
      )

      if (!listeners || !listeners.length) {
        continue
      }

      let completed = 0
      listeners.forEach(([t, fn, ctx]) => {
        ctx.removeEventListener(t, fn as any)

        this.log([`Global ${t} event removed:`, fn])

        completed += 1
      })

      if (completed === listeners.length) {
        this.listeners = this.listeners.filter((listener) => !listeners.includes(listener))

        this.log(`Global ${type} event cleared`)
      }
    }
  }

  /**
   * Removes the optional process callback from the Component context, this will
   * disabl the optional process usage when sibling Components dispatch the
   * 'updated' event.
   */
  protected clearListeners() {
    if (!this.observe || !this.observe.length) {
      return
    }

    const queue = Array.from(this.observe).filter((l) => l !== this)

    if (!queue.length) {
      return
    }

    for (let i = queue.length; i--; ) {
      this.clearGlobalEvent('updated', queue[i])
    }
  }

  /**
   * Clones the names Slot element that can be used when the defined component
   * includes multiple slot elements with duplicate name values.
   *
   * @param name Clones all existing names Slot elements from the initial
   * Slot name.
   */
  protected cloneSlot(name?: string) {
    const slot = this.useInitialSlot(name || Enlightenment.defaults.slot)

    if (!slot || !slot.assignedElements) {
      return
    }

    if (!this.shadowRoot) {
      return
    }

    this.throttle(this.cloneSlotCallback, this.delay, slot)
  }

  /**
   * Actual callback handler to use from the cloneSlot() instance method.
   *
   * @param slot The expected slot Element to clone.
   * @param name Clones the selected slots with the matchin name value.
   */
  protected cloneSlotCallback(slot: HTMLSlotElement, name?: string) {
    if (!slot) {
      return
    }

    const nodes = slot.assignedElements()
    const context = this.shadowRoot || this
    const slots = name
      ? context.querySelectorAll(`slot[name="${name || ''}"]`)
      : context.querySelectorAll('slot')
    const html = [...slot.assignedElements().map((element) => element.outerHTML)].join('')

    if (!html || !slots.length) {
      return
    }

    for (let index = 0; index < slots.length; index++) {
      if (slots[index] === slot) {
        continue
      }

      slots[index].innerHTML = html
    }

    return html
  }

  /**
   * Validates if the given image source should be renderd as inline image when
   * TRUE or static image as default.
   *
   * @param source Expected source URL or Symbol reference to test.
   *
   */
  protected testImage(source: string) {
    if (
      !this.svgSpriteSource ||
      !this.testImageSource(this.svgSpriteSource) ||
      this.testImageSource(source)
    ) {
      return false
    }

    if (this.svgSpriteSource && source) {
      if (
        this.testImageSource(this.svgSpriteSource) &&
        this.testImageSource(Enlightenment.strip(source))
      ) {
        return false
      }

      return true
    }

    return false
  }

  /**
   * Validates if the defined source URL is a valid image path.
   *
   * @param source Expected URL source to test.
   */
  protected testImageSource(source: string) {
    if (typeof source !== 'string') {
      return
    }

    let result = false

    Enlightenment.supportedImageExtensions.forEach((extension) => {
      if (Enlightenment.strip(source).endsWith(extension)) {
        result = true
      }
    })

    return result
  }

  /**
   * Helper function that ensures the given handler is only called once within
   * the defined delay and Component context.
   *
   * @param handler The actual handler to throttle.
   * @param delay Use the defined delay value in MS or the time of a single
   * frame (1000 / 60).
   * @param args Optional arguments to use within the defined handler.
   */
  protected throttle(handler: EnlightenmentThrottle[0], delay?: number, ...args: any[]) {
    if (!this.throttler || !this.throttler.handlers) {
      this.log(['Unable to throttle:', handler], 'error')

      return
    }

    if (typeof handler !== 'function') {
      this.log('Unable to use throttle, the defined handler is not a function', 'error')
    }

    let index = -1
    const [exists] = this.throttler.handlers.filter(([h, _, ah], i) => {
      if (h === handler && this.compareValue(args, ah)) {
        if (index < 0) {
          index = i
        }

        return h === handler
      }

      return undefined
    })

    if (exists) {
      this.log([`Abort previous throttle:`, this], 'info')

      const previousTimeout = this.throttler.handlers[index]

      previousTimeout && previousTimeout[1] && clearTimeout(previousTimeout[1])

      delete this.throttler.handlers[index]
    }

    const ms = parseInt(String(delay)) || this.throttler.delay

    const timeout = setTimeout(() => {
      // try {
      handler.call(this, ...args)

      // } catch (exception) {
      // exception && this.log(exception, 'error')
      // }
    }, ms)

    this.log([`${this.constructor.name} throttle defined:`, this], 'info')

    this.throttler.handlers.push([handler, timeout, args])

    setTimeout(() => {
      this.throttler.handlers.forEach(([h], i) => {
        if (h === handler) {
          delete this.throttler.handlers[i]
        }
      })

      this.cleanup()
    }, ms + 1)
  }

  /**
   * Callback to use after a component update.
   *
   * @param properties Defines the previous state of the updated properties.
   */
  protected updated(properties: PropertyValues) {
    super.updated(properties)

    this.throttle(this.handleUpdate, this.delay, 'updated')
  }

  /**
   * Updats the pending Attribute that should indicate the components
   * loading state.
   */
  protected updatePending() {
    if (this.pending) {
      this.setAttribute('aria-busy', 'true')
    } else {
      this.removeAttribute('aria-busy')
    }
  }

  /**
   * Updates the preventEvent flag that should disable other handlers to be
   * used when TRUE.
   */
  protected updatePreventEvent() {
    let preventEvent = false

    if (this.ariaDisabled === 'true' || this.hasAttribute('disabled') || this.pending) {
      preventEvent = true
    }

    if (this.preventEvent && !this.hasAttribute('disabled')) {
      preventEvent = false
      this.ariaDisabled = String(preventEvent)
    }

    if (this.preventEvent !== preventEvent) {
      this.preventEvent = preventEvent
    }
  }

  /**
   * Returns the initial created slot Element.
   *
   * @param name Returns the initial Slot with the defined name Attribute.
   */
  protected useInitialSlot(name: string) {
    if (!this.shadowRoot) {
      return
    }

    const slots = this.shadowRoot.querySelectorAll(`slot[name="${name}"]`)

    if (!slots.length) {
      return
    }

    return slots[0] as HTMLSlotElement
  }

  /**
   * Returns the actual breakpoint Width value from the defined breakpoint name.
   *
   * @param name Returns the breakpoint value from the defined name.
   */
  protected useBreakpoint(name: string) {
    const value = EnlightenmentTheme.breakpoints[name]
    const fallback =
      EnlightenmentTheme.breakpoints[0] >= window.innerWidth
        ? EnlightenmentTheme.breakpoints[0]
        : window.innerWidth

    return value || fallback
  }

  /**
   * Iterates through the defined Theme Breakpoints.
   *
   * @param handler The handler to use for each Theme breakpoint.
   */
  protected useBreakpoints(handler?: (name: string, value: number, delta: number[]) => void) {
    const breakpoints = EnlightenmentTheme.breakpoints

    if (typeof handler !== 'function') {
      return breakpoints
    }

    const devices = Object.keys(EnlightenmentTheme.breakpoints)

    if (!devices.length) {
      return breakpoints
    }

    const values = Object.values(EnlightenmentTheme.breakpoints)

    devices.forEach((name, index) => {
      const minWidth = values[index - 1] + 1
      const maxWidth = values[index + 1] - 1

      handler(name, breakpoints[name] as typeof minWidth, [
        minWidth || 0,
        maxWidth || screen.availWidth || screen.width
      ])
    })

    return breakpoints
  }

  /**
   * Shorthand to use the existing Lit Element reference.
   *
   * @param ref The initial created Ref Object.
   */
  protected useRef = (ref?: Ref): EnligtenmentTarget => {
    if (!ref || !ref.value) {
      return
    }

    return ref.value
  }

  /**
   * Use the full or direct shadowRoot context based from the defined
   * minimalShadowRoot property.
   */
  protected useShadowRoot() {
    return this.minimalShadowRoot
      ? true
      : (node: HTMLElement | SVGElement) =>
          this.isComponentContext(node) ? node.shadowRoot || undefined : false
  }

  /**
   * Returns the slot from the defined name or return the default slot
   * otherwise.
   *
   * @param name Returns the existing Slot element from the defined name.
   * @param strict Only returns the selected slot if it has any assigned
   * elements.
   */
  protected useSlot(name?: string, strict?: boolean) {
    if (!this.slots || !Object.keys(this.slots).length) {
      return
    }

    const slot = this.slots[name || '']

    if (slot) {
      if (strict && !slot.assignedElements().length) {
        return
      }

      return slot
    } else if (name && !Object.keys(this.slots).includes(name)) {
      return
    }

    const [result] = Object.entries(this.slots).filter(
      ([n, slot]) => n === Enlightenment.defaults.slot
    )

    return result && result[1]
  }

  /**
   * Use the assigned Slot elements from initial slot and clone the content
   * within the defined component fragment elements.
   *
   * @param name Use the slot element with matching name attribute value.
   * @param tag Use the defined tagname as alternative instead of the default
   * [fragment] element.
   */
  protected assignFragments(name?: string, tag?: string) {
    if (!this.enableFragments) {
      return
    }

    const attr = `${name ? `[name="${name}"]` : ''}`
    const slot: HTMLSlotElement | null = this.shadowRoot
      ? this.shadowRoot.querySelector(`slot${attr}`)
      : this.querySelector(`slot${attr}`)

    if (!slot) {
      return
    }

    const fragments = Array.from(
      this.shadowRoot
        ? this.shadowRoot.querySelectorAll(`${tag || 'div'}[fragment="${name || ''}"]`)
        : this.querySelectorAll(`${tag || 'div'}[fragment="${name || ''}"]`)
    )

    const elements = slot.assignedElements()

    if (!slot || !fragments.length || !elements.length) {
      return
    }

    const html = elements.map((element) => element.outerHTML).join('\n')

    if (!html) {
      return
    }

    fragments.forEach((fragment) => {
      if (fragment.innerHTML === html) {
        return
      }

      fragment.innerHTML = html
    })

    slot.style.display = 'none'
  }

  /**
   * Clears the named fragment Elements from the defined Component and remove
   * any fragment related properties to the connected slot.
   *
   * @param name Clears the fragments from the defined name value.
   */
  protected omitFragments(name: string | null) {
    if (!this.enableFragments) {
      return
    }

    if (!name) {
      return
    }

    const slot = this.useSlot(name)

    if (!slot || slot.style.display !== 'none') {
      return
    }

    const selector = `div[fragment="${name}"]:not(:empty)`
    const fragments = this.shadowRoot
      ? this.shadowRoot.querySelectorAll(selector)
      : this.querySelectorAll(selector)

    if (!fragments.length) {
      return
    }

    fragments.forEach((fragment) => {
      fragment.innerHTML = ''
    })

    slot.style.display = ''

    this.throttle(this.requestUpdate)
  }

  /**
   * Callback handler that checks the changed slot Elements and clears the
   * filled fragments.
   */
  protected updateFragments() {
    if (!this.enableFragments) {
      return
    }

    Object.values(this.slots).forEach((slot) => {
      if (!slot) {
        return
      }

      if (!isEmptyComponentSlot(slot)) {
        return
      }

      if (slot.style.display !== 'none') {
        return
      }

      const name = slot.getAttribute('name')
      this.omitFragments(name)
    })
  }

  /**
   * Ensures the a requestUpdate is used when attribtues are added or removed.
   * on the defined element.
   */
  //@ts-ignore
  public attributeChangedCallback(name: string, _old?: string, value?: string) {
    if (this.once) {
      super.attributeChangedCallback(name, _old || null, value || null)
    } else {
      super.attributeChangedCallback(name, _old || null, value || null)
      this.requestUpdate()
    }
  }

  /**
   * Helper function that updates the defined property from the constructed
   * Enlightenment instance.
   *
   * @param propety The existing property name to update.
   * @param handler Defines or returns the mutated value.
   */
  public commit(property: string, handler: any) {
    if (!property) {
      this.log([`Unable to commit undefined property`])

      return
    }

    if (handler === null) {
      this.log([`Unable to commit ${property}`])

      return
    }

    let update = false

    try {
      //@ts-ignore
      const value = this[property]

      if (typeof handler === 'function') {
        const result = handler()

        //@ts-ignore
        if (result !== undefined && typeof result === typeof this[property]) {
          //@ts-ignore
          this[property] = result
        }

        update = true
      } else {
        if (Object.keys(this).includes(property)) {
          //@ts-ignore
          this[property] = handler

          if (handler !== value) {
            update = true
          }

          const data: { [key: string]: any } = {}
          data[property] = handler

          // Use this.hook directly since a throttle will be called by the
          // component.requestUpdate method.
          this.hook('commit', { data })

          this.log([`${this.namespace} property updated for:`, [property, handler]])
        } else {
          this.log(['Illegal property commit detected.', [property, handler]], 'error')
        }

        // Prevent the component update if the proposed value is an identical
        // Array.
        if (Array.isArray(value) && Array.isArray(handler)) {
          update = !this.compareValue(value, handler)
        }
      }

      //@ts-ignore
      update &&
        this.log([
          `${this.namespace} commit accepted from: ${this.constructor.name}['${property}']`
        ])

      // Ensures the property update fires the component callbacks.
      update && this.requestUpdate(property, value)
    } catch (error) {
      if (error) {
        this.log(error, 'error')

        update = false
      }
    }
  }

  /**
   * Compares the defined values by typing and (nested) values.
   *
   * @param commit The first value to compare.
   * @param initial The second value to compare.
   */
  public compareValue(commit: any, initial: any): boolean | undefined {
    try {
      if (typeof commit !== typeof initial) {
        return false
      }

      if (commit.length !== initial.length) {
        return false
      }

      if (Array.isArray(commit) && Array.isArray(initial)) {
        return Array.from(commit).every((value, index) => this.compareValue(value, initial[index]))
      }

      if (commit instanceof Object && initial instanceof Object) {
        return JSON.stringify(commit) === JSON.stringify(initial)
      }

      if (commit === initial) {
        return true
      }
    } catch (error) {
      if (error) {
        this.log(error, 'error')
      }
    }

    return false
  }

  /**
   * Defines the initial setup for the constructed Enlightenment element.
   */
  public connectedCallback() {
    super.connectedCallback()

    // Includes the required viewport meta tags to ensure the responsive
    // layout behaves correctly.
    Enlightenment.theme.assignViewport()

    // Invoke the defined Enlightenment providers once and include them
    // to the constructed Enlightenment Globals.
    if (!Enlightenment.globals.hasProvider(Enlightenment.theme)) {
      // Define the required styles in order to use the additional Enlightenment
      // features.
      Enlightenment.theme.assignDefaultStyleSheets()

      // Expose default space properties.
      Enlightenment.theme.assignSpaceProperties()

      Enlightenment.theme.assignElevationProperties(EnlightenmentTheme.stackingContext)

      // Expose default Device breakpoints.
      Enlightenment.theme.assignDocumentProperties(
        Object.entries(EnlightenmentTheme.breakpoints).map(
          ([name, breakpoint]) => `--breakpoint-${name}: ${breakpoint}px;`
        )
      )

      // Define the global Color Chart custom properties.
      Enlightenment.theme.assignColorStylesheet(EnlightenmentTheme.colorChart.colors, {
        accent: EnlightenmentTheme.colorChart.accent,
        neutral: EnlightenmentTheme.colorChart.neutral,
        delta: EnlightenmentTheme.colorChart.delta,
        type: EnlightenmentTheme.colorChart.type
      })

      // Ensure the assigned StyleSheets are only assigned once. We don't
      // need to worry about removing them since they are bound to the
      // Custom Element.
      Enlightenment.globals.assignProvider(Enlightenment.theme)
    }

    // Create reference of the custom StyleSheets that will update from their
    // component property values.
    const customStylesheet = Enlightenment.theme.assignComponentStyleSheet(this)
    this.assignCustomCSSStyleSheet(customStylesheet)

    if (this.enableDocumentEvents) {
      this.assignGlobalEvent('click', this.handleGlobalClick)
      this.assignGlobalEvent('keydown', this.handleGlobalKeydown)
      this.assignGlobalEvent('focus', this.handleGlobalFocus)
      this.assignGlobalEvent('focusin', this.handleGlobalFocus)
      this.assignGlobalEvent('resize', this.handleGlobalResize, { context: window })
    }

    this.throttle(this.assignListeners)
    this.dispatchUpdate('connected')

    // Fallback to ensure the parent component is updated when the initial
    // component is connected.
    const host = Enlightenment.useHost(this) as Enlightenment
    if (host && typeof host.dispatchUpdate === 'function' && host !== this) {
      host.dispatchUpdate()
    }

    // Final callback to indicate the component is ready and rendered.
    this.assignGlobalEvent('ready', this.handleReady, { context: this })
  }

  /**
   * Cleanup the c6reated setup of the removed Enlightenment element.
   */
  public disconnectedCallback() {
    try {
      this.clearThrottler()

      this.omitGlobalEvent('click', this.handleGlobalClick)
      this.omitGlobalEvent('focus', this.handleGlobalFocus)
      this.omitGlobalEvent('focusin', this.handleGlobalFocus)
      this.omitGlobalEvent('keydown', this.handleGlobalKeydown)
      this.omitGlobalEvent('updated', this._process)
      this.omitGlobalEvent('resize', this.handleGlobalResize)
      this.clearGlobalEvent('ready', this)

      this.clearListeners()

      const slots = this.shadowRoot && this.shadowRoot.querySelectorAll('slot')

      if (slots && slots.length) {
        // Clear the assigned Slotchange event manually since the slotchange
        // Event can be ignored at this point.
        this.clearGlobalEvent('slotchange', slots)

        // Ensure the Slotted Events are removed.
        Object.values(slots).forEach((slot) => this.clearSlottedEvents(slot))
      }

      // Use this.hook directly since the context would not exist anymore after
      // the throttled handler is called.
      this.hook('disconnected')

      super.disconnectedCallback()
    } catch (error) {
      if (error) {
        this.log(error as string, 'error')
      }
    }
  }

  /**
   * Event Dispatcher interface to call Event handlers that are defined outside
   * the Enlightenment element context.
   */
  public hook(name: string, options?: HookOptions) {
    const { context, data } = options || {}

    if (!name) {
      this.log('Unable to use undefined hook', 'error')

      return
    }

    let bubbles = true
    if (['resize', 'scroll', 'update', 'updated', 'slotchange'].includes(name)) {
      bubbles = false
    }

    const event = new CustomEvent(name, {
      bubbles,
      detail: data || {}
    })

    this.log([`Dispatch hook: ${this.constructor.name}@${name}`, this])

    if (context && context !== this) {
      return context.dispatchEvent(event)
    }

    return this.dispatchEvent(event)
  }

  /**
   * Renders the defined image source as static image or inline SVG.
   *
   * @param source Renders the image from the defined source.
   * @param options Set the image Attributes from the optional options.
   */
  public renderImage(source: string, options?: EnlightenmentImageOptions) {
    if (!source) {
      return ''
    }

    const classname = Enlightenment.useOption('classname', options)
    const height = Enlightenment.useOption('height', options, true)
    const width = Enlightenment.useOption('width', options, true)

    const use = document.createElement('use')
    use.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      Enlightenment.sanitizeHTML(`${this.svgSpriteSource}#${source}`)
    )

    return this.testImage(source)
      ? html`<svg
          class="${classname}"
          ${height && `height="${height}"`}
          ${width && `width=  "${width}"`}
          height="${height || '100%'}"
          width="${width || '100%'}"
          aria-hidden="true"
          focusable="false"
        >
          ${unsafeSVG(use.outerHTML)}
        </svg>`
      : html`<img
          class="${classname}"
          height="${height || 'auto'}"
          width="${width || 'auto'}"
          aria-hidden="true"
          focusable="false"
          src="${this.testImageSource(source) ? source : this.svgSpriteSource}"
        />`
  }
}
