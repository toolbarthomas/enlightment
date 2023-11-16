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
  HookOptions
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
    slot: '_content'
  }

  // Expected interval value of 60HZ refresh rate.
  static FPS = 1000 / 60

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
   */
  static isMode(value: any) {
    return Enlightenment.filterProperty(value, ['light', 'dark'])
  }

  /**
   * Ensures the given value is a valid target attribute value.
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
      const response: EnlightenmentJSONResponseValue[] = []

      try {
        Object.entries(json).forEach(
          ([key, value]: [string, EnlightenmentJSONResponseValue], index) => {
            const payload: EnlightenmentJSONResponseObject = {}
            payload[key] = value

            const body: EnlightenmentJSONResponseValue = typeof value === 'string' ? value : payload

            const result = transform(value)

            if (result instanceof Object) {
              Object.freeze(result)
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

  // The keycodes that could be validated within a class method.
  static keyCodes = {
    confirm: [13, 32],
    exit: [27],
    meta: [9, 16, 17, 18, 20]
  }

  /**
   * Simple helper function to ensure the given value does not contain any
   * XML/HTML based syntax.
   */
  static sanitizeHTML(value: string) {
    const raw = document.createElement('div')
    raw.innerHTML = value

    return raw.textContent || ''
  }

  /**
   * Ensures any whitespace is removed from the given string.
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

  // Traverse from the defined context and return the host Component
  static useHost(context: HTMLElement) {
    if (!context) {
      return
    }

    let target: HTMLElement | undefined = undefined

    if (!target) {
      let current: any = context

      while (current.parentNode && !target) {
        if (current.host || current instanceof Enlightenment) {
          if (current !== context) {
            target = current.host || current
            break
          }
        } else if (target) {
          break
        }

        current = current.parentNode as HTMLElement
      }

      if (!target && current.host !== context) {
        target = current.host
      }
    }

    return target
  }

  /**
   * Helper function to ensure the requested property is returned from a
   * dynamic string or object value.
   */
  static useOption(property: string, value?: any, optional?: boolean) {
    return Enlightenment.sanitizeHTML(
      String((typeof value === 'string' && !optional ? value : (value || {})[property]) || '')
    )
  }

  /**
   * Verifies the defined URL and resolve any external url to prevent insecure
   * requests.
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

    this.useMode()

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

  // Optional flag that can be used within the Document Event handlers to check
  // if the current scope is within the defined Component.
  currentElement?: boolean

  // Boolean flag that should behave like the existing Input Element disabled
  // attribute.
  disabled?: boolean

  // Enables the default document Events that is called within: handleGlobal...
  // methods when TRUE.
  enableDocumentEvents: boolean = false

  // Enables fragment usage within the defined component to repeat any HTML
  // within the named Slot.
  enableFragments: boolean = false

  // Will be TRUE if the optional Focus Trap Element exists within the Component
  // and is currently active.
  hasActiveFocusTrap?: boolean

  // Dynamic storage for the running document Event listeners.
  listeners: GlobalEvent[] = []

  // Value to use for the naming of the Global state.
  namespace: string = NAMESPACE

  // Blocks the default handle methods when TRUE.
  preventEvent: boolean = false

  // Reference to the parent Window object that holds the global state of the
  // created instance.
  root: Window = window

  // Contains the Shadow Root slot target contexts in order to validate
  // the actual rendered slots existence.
  slots: { [key: string]: HTMLSlotElement | undefined } = {}

  // Boolean flag that should mutate only once when the actual slot elements
  // are initiated.
  slotReady?: boolean

  // Contains the assigned handlers that will be called once.
  throttler: {
    delay: number
    handlers: EnlightenmentThrottle[]
  }

  // Alias to the constructor name.
  uuid: string

  @property({
    attribute: 'aria-disabled',
    reflect: true,
    type: String
  })
  ariaDisabled: string | null = null

  @property({
    type: Number,
    converter: (value) => parseInt(String(value)) || Enlightenment.FPS
  })
  delay = Enlightenment.FPS

  // Readable error to display during an exception/error within the defined
  // component context.
  @property()
  error = ''

  // Defines the Color Mode to use: Dark/Light
  @property({
    converter: (value) => Enlightenment.isMode(value),
    type: String
  })
  mode?: string

  @property({
    converter: (value) => Enlightenment.isBoolean(value),
    type: Boolean
  })
  minimalShadowRoot?: boolean

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
   */
  protected firstUpdated(properties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    super.firstUpdated(properties)

    // this.useDefaultStyleSheet()

    Enlightenment.theme.assignDefaultStylesheet(this)

    this.useMode()

    this.dispatchUpdate('ready')
  }

  /**
   * Toggles the currentElement property within the defined element context.
   *
   * The expected attributes are updated directly without triggering a
   * requestUpdate within the Document handler. The actual update should be
   * called from the Component context that interacts with the property state.
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
   * Defines the global click Event listener for the element context.
   *
   * Marks the constructed Enlightenment element as currentElement when the
   * click Event was triggered inside the element context.
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
   * Defines the global slotchange Event handler that will trigger a slotchange
   * event on the main element context.
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

    this.dispatchUpdate('updated')

    if (!this.slotReady) {
      Object.defineProperty(this, 'slotReady', {
        configurable: false,
        writable: false,
        value: true
      })

      this.throttle(this.requestUpdate)
    }
  }

  /**
   * Callback handler to use after component.updated() is triggered.
   *
   * @param name Dispatch the optional hook
   */
  protected handleUpdate(name?: string) {
    this.updatePreventEvent()
    this.assignSlots()
    this.dispatchUpdate(name)
  }

  /**
   * Returns the matching parent element by default or use the optional
   * selector value otherwise.
   */
  protected parent(selector?: string) {
    if (!selector) {
      return
    }

    const parent = this.parentElement && this.parentElement.closest(this.tagName)

    return parent || undefined
  }

  /**
   * Returns all matching parent elements by default or use the optional
   * selector value otherwise.
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
   */
  protected isEmptySlot(event: Event) {
    const { parentElement } = event.target as Element

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
   * Optional callback to use when existing Elements are attached from the
   * listen property: listen=".foo,#bar,custom-component"
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
      if (process !== undefined && document.contains(target as Node)) {
        process.call(this, target as HTMLElement)

        this.throttle(this.requestUpdate)
      }
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
  }

  /**
   * Attaches the defined component to the currentElement global.
   */
  private attachCurrentElement() {
    this.currentElement = true

    Enlightenment.globals.assignCurrentElement(this)
  }

  /**
   * Assigns a new global event for the rendered component context.
   * The actual event is stored within the instance to prevent Event stacking.
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
              this.throttle(this.handleSlotChange, Enlightenment.FPS, { ...event, target: slot })
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

      let [type, name] = value.split(':')

      if (!name) {
        name = type
        type = 'click'
      }

      //@ts-ignore
      const fn: Function = this[name.split('(')[0]]

      if (typeof fn === 'function' && Enlightenment.useHost(element) === this) {
        this.assignGlobalEvent(type, fn.bind(this), { context: element })
      }
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

    this.cid = setTimeout(
      () => {
        if (this.throttler.handlers.length > Enlightenment.MAX_THREADS) {
          this.throttler.handlers = this.throttler.handlers.filter((h) => h != null)
        }
      },
      this.throttler.handlers.length + Enlightenment.FPS * Enlightenment.MAX_THREADS
    )
  }

  /**
   * Removes the assigned global Events from the selected context or this
   * Component.
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

    this.throttle(this.cloneSlotCallback, Enlightenment.FPS, slot)
  }

  /**
   * Actual callback handler to use from the cloneSlot() instance method.
   *
   * @param slot The expected slot Element to clone.
   * @param name Clones the selected slots with the matchin name value.
   */
  cloneSlotCallback(slot: HTMLSlotElement, name?: string) {
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
   */
  protected testImage(initial: boolean, source: string) {
    if (
      !this.svgSpriteSource ||
      !this.testImageSource(this.svgSpriteSource) ||
      this.testImageSource(source)
    ) {
      return false
    }

    if (initial && this.svgSpriteSource) {
      if (source && this.testImageSource(this.svgSpriteSource) && this.testImageSource(source)) {
        return false
      }

      return true
    } else if (initial) {
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
   * Validates if the defined source is a valid image path.
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
   * the defined delay.
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
    const [exists] = this.throttler.handlers.filter(([h], i) => {
      if (h === handler) {
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

    const timeout = setTimeout(
      () => {
        // try {
        handler.call(this, ...args)

        // } catch (exception) {
        // exception && this.log(exception, 'error')
        // }
      },
      parseInt(String(delay)) || this.throttler.delay
    )

    this.log([`${this.constructor.name} throttle defined:`, this], 'info')

    this.throttler.handlers.push([handler, timeout])

    setTimeout(() => {
      this.throttler.handlers.forEach(([h], i) => {
        if (h === handler) {
          delete this.throttler.handlers[i]
        }
      })

      this.cleanup()
    }, timeout + 1)
  }

  /**
   * Callback to use after a component update.
   */
  protected updated(properties: PropertyValues) {
    super.updated(properties)

    this.throttle(this.handleUpdate, Enlightenment.FPS, 'updated')
  }

  /**
   * Updates the preventEvent flag that should disable other handlers to be
   * used when TRUE.
   */
  protected updatePreventEvent() {
    if (this.ariaDisabled === 'true' || this.hasAttribute('disabled')) {
      this.commit('preventEvent', true)
    } else {
      this.commit('preventEvent', false)
    }
  }

  /**
   * Returns the root node of the defined Enlightenment instance.
   */
  public useContext() {
    return this.context && this.context.value ? this.context.value : this
  }

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
   * Shorthand to use the existing Lit Element reference.
   */
  protected useRef = (ref?: Ref): EnligtenmentTarget => {
    if (!ref || !ref.value) {
      return
    }

    return ref.value
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
   * Default hook that should be called during a component render update.
   */
  private dispatchUpdate(name?: string) {
    return this.throttle(this.hook, Enlightenment.FPS, typeof name === 'string' ? name : 'update')
  }

  /**
   * Validates if the defined Event handler has already been defined as
   * global Event.
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
   * Removes the defined Enlightenment element from the currentElements global
   * and notify any related Enlightenment components.
   */
  private detachCurrentElement() {
    this.currentElement = false
    Enlightenment.globals.omitCurrentElement(this)
    this.dispatchUpdate('omit')
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
   * Removes the assigned global Event handler.
   */
  private omitGlobalEvent(type: GlobalEventType, handler: GlobalEventHandler) {
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
   * Defines the mode attribute for the defined element that inherits the
   * specified mode value from the global state as default value otherwise.
   */
  private useMode() {
    const { mode } = Enlightenment.globals
    const host = Enlightenment.useHost(this)

    if (!this.hasAttribute('mode') && host) {
      const inheritMode = Enlightenment.isMode(host.getAttribute('mode'))

      if (inheritMode && this.mode !== inheritMode) {
        this.mode = inheritMode

        // Update the inherited mode value as actual HTML attribute in order to
        // apply the actual CSS styles.
        this.mode && this.setAttribute('mode', this.mode)
      } else if (this.mode === undefined) {
        this.mode = mode
      }
    } else if (!this.mode && mode && this.mode !== mode) {
      this.mode = mode
    }
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
   * Ensures the a requestUpdate is used when attribtues are added or removed.
   * on the defined element.
   */
  //@ts-ignore
  public attributeChangedCallback(name: string, _old?: string, value?: string) {
    if (this.once) {
      super.attributeChangedCallback(name, _old || null, value || null)
    } else {
      super.attributeChangedCallback(name, _old || null, value || null)
      this.throttle(this.requestUpdate)
    }
  }

  /**
   * Helper function that updates the defined property from the constructed
   * Enlightenment instance.
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
      const value = this[property as any]

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

    // Invoke the defined Enlightenment providers once and include them
    // to the constructed Enlightenment Globals.
    if (!Enlightenment.globals.hasProvider(Enlightenment.theme)) {
      Enlightenment.theme.assignDocumentStylesheet()
      Enlightenment.globals.assignProvider(Enlightenment.theme)
    }

    if (this.enableDocumentEvents) {
      this.assignGlobalEvent('click', this.handleGlobalClick)
      this.assignGlobalEvent('keydown', this.handleGlobalKeydown)
      this.assignGlobalEvent('focus', this.handleGlobalFocus)
      this.assignGlobalEvent('focusin', this.handleGlobalFocus)
    }

    this.throttle(this.assignListeners)
    this.dispatchUpdate('connected')
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
    if (['resize', 'scroll', 'updated', 'slotchange'].includes(name)) {
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

    return this.testImage(false, source)
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
