import {
  EnlightenmentProcessHandler,
  EnlightenmentThrottle,
  GlobalEvent,
  GlobalEventHandler,
  GlobalEventOptions,
  GlobalEventType,
  HookOptions
} from 'src/_types/main'

import { EnlightenmentMixins, property } from 'src/core/Mixins'

import { EnlightenmentGlobals } from 'src/providers/Globals'
import { EnlightenmentTheme } from 'src/providers/Theme'

/**
 * Defines the actual Enlightenment Class entry point with the required
 * constants and helper functions.
 */
export class EnlightenmentKernel extends EnlightenmentMixins {
  static defaults = {
    slot: '_content',
    attrAxis: 'data-axis',
    attrGrabbed: 'aria-grabbed',
    attrPivot: 'data-pivot',
    passiveEventTypes: ['mousemove', 'resize', 'scroll', 'touchmove', 'wheel', 'wheel']
  }

  static MAX_THREADS = 128

  static NAMESPACE = 'NLGHTNMNT'

  // Defines the default interval for a single frame render.
  static FPS = 1000 / 60

  // Defines the default interval for a frame refresh
  static RPS = 1000 / 5

  static webfontExtensions = ['.woff', '.woff2']

  /**
   * Defines the Global variables within the constructed Enlightenment
   * instances.
   */
  static globals = new EnlightenmentGlobals(EnlightenmentKernel.NAMESPACE)

  /**
   * Optional timeout value for the defined throttle handler.
   * @see throttle()
   */
  @property({ converter: EnlightenmentMixins.isInteger, type: Number })
  delay = EnlightenmentKernel.FPS

  /**
   * Readable error to display during an exception/error within the defined
   * component context.
   */
  @property({ type: String })
  error = ''

  /**
   * Enable the usage for the [handle] Attribute for the defined Element.
   */
  @property({ type: String })
  handle?: string

  /**
   * Will call the defined process method from the constructed instance if the
   * defined value exists within the current DOM.
   */
  @property({ converter: (value) => EnlightenmentMixins.convertToSelector, type: Array })
  observe?: NodeList

  /**
   * Optional Flag that will prevent the usage of requestUpdate during an
   * Attribute change.
   */
  @property({ converter: EnlightenmentMixins.isBoolean, type: Boolean })
  once?: boolean

  /**
   * Optional Flag that should render the component indicator during a loading
   * state of the defined component.
   */
  @property({ converter: EnlightenmentMixins.isBoolean, type: Boolean })
  pending?: boolean

  /**
   * Holds the current cleanup timeout ID that will cleanup the obsolete
   * throttlers and temporary values.
   */
  cid?: number

  /**
   * Boolean flag that should mutate only once to indicate the Component has
   * been rendered with the optional (sub) slots.
   */
  domReady: boolean = false

  /**
   * Enables the default document Events that are assigned from the
   * assignGlobalEvent handler.
   */
  enableDocumentEvents?: boolean = false

  /**
   * Dynamic storage for the assigned global Events.
   * @see assignGlobalEvent
   */
  listeners: GlobalEvent[] = []

  /**
   * Global namespace to use for Enlightenment Components.
   */
  namespace = EnlightenmentKernel.NAMESPACE

  /**
   * Flag that should black any interaction while TRUE.
   */
  preventEvent?: boolean = false

  /**
   * Holds the current timeout ID that should initiate the _process & process
   * handlers only once
   */
  pid?: number

  /**
   * Contains the assigned throttle() handlers that will be called after the
   * defined delay.
   * @see throttle()
   */
  throttler: { delay: number; handlers: EnlightenmentThrottle[] }

  /**
   * Alias for the instance name.
   */
  uuid: string

  constructor() {
    super()

    this.uuid = this.constructor.name

    this.throttler = {
      delay: parseInt(String(this.delay)) || EnlightenmentKernel.FPS,
      handlers: []
    }
  }

  private cleanup() {
    this.cid != null && clearTimeout(this.cid)

    if (this.throttler.handlers.length <= EnlightenmentKernel.MAX_THREADS) {
      return
    }

    this.cid = setTimeout(
      () => {
        this.throttler.handlers = this.throttler.handlers.filter((h) => h != null)
      },
      this.throttler.handlers.length + this.delay * EnlightenmentKernel.MAX_THREADS
    )
  }

  /**
   * Optional callback to use when existing Elements are attached from the
   * listen property: listen=".foo,#bar,custom-component".
   *
   * @param event The actual Event Object that was created from an existing
   * [listen] Element.
   */
  protected _process(event: Event) {
    if (!this.observe) {
      this.log(`Unable to process from undefined listeners...`, 'warning')

      return
    }

    if (!event) {
      this.log(`Unable to run process with undefined Event...`, 'warning')

      return
    }
    const { target } = event || {}
    const process: any = (this as any).process

    try {
      process &&
        this.throttle(process, this.domReady ? this.delay : EnlightenmentKernel.RPS, {
          target
        })
    } catch (exception) {
      exception && this.log(exception, 'error')
    }
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

    const { context, once, passive } = options || {}

    const ctx = context || document

    const exists = this.listeners.filter(([t, _, c, h]) => t === type && h === handler && c === ctx)

    if (exists.length) {
      this.log(`Unable to overwrite existing global event for ${ctx}`, 'warning')

      return
    }

    const fn = handler.bind(this)

    this.listeners.push([type, fn, ctx, handler])

    // Ensure the assigned Event is marked as passive for the event type
    let pv = passive
    if (EnlightenmentKernel.defaults.passiveEventTypes.includes(type)) {
      pv = true
    }

    ctx && ctx.addEventListener(type, fn, { once, passive: pv })

    this.log([`Global event assigned: ${ctx.constructor.name}@${type}`, ctx])
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
   * Cleanup the defined throttler handlers and stop any defined throttle
   * timeout.
   */
  protected clearThrottler() {
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
   * Default hook that should be called to enforce a Component (re)render.
   *
   * @param name Dispatch the optional Event type instead.
   */
  protected dispatchUpdate(name?: string) {
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
  protected filterGlobalEvent(type: GlobalEventType, handler: GlobalEventHandler) {
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

    const { verbose } = EnlightenmentKernel.globals

    if (verbose || type === 'error') {
      let t = type === 'warning' ? 'warn' : type

      //@ts-ignore
      output.forEach((m) => console[t || 'log'](m))
    }
  }

  /**
   * Removes the assigned global Event handler.
   *
   * @param type Omit from the matching Event type.
   * @param handler Omit the defined handler that was assigned as Global Event
   * handler.
   */
  protected omitGlobalEvent(type: GlobalEventType, handler: GlobalEventHandler) {
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
  protected requestGlobalUpdate(exclude: boolean) {
    const { body } = document || this
    const elements = Array.from(body.children || []).filter(
      (f: any) =>
        f.requestUpdate &&
        f.namespace === this.namespace &&
        // Excludes the context that calls this method.
        (exclude ? f != this : true)
    )

    for (let i = 0; i < elements.length; i += 1) {
      const component = elements[i] as EnlightenmentKernel
      if (component.throttle && component.requestUpdate) {
        component.throttle(component.requestUpdate.bind(component))
      }
    }
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
      if (h === handler && EnlightenmentMixins.compareValue(args, ah)) {
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
   * Ensures the a requestUpdate is used when attribtues are added or removed.
   * on the defined element.
   */
  public attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
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
          update = !EnlightenmentMixins.compareValue(value, handler)
        }
      }

      update &&
        this.log([
          `${this.namespace} commit accepted from: ${this.constructor.name}['${property}']`
        ])

      // Ensures the property update fires the component callbacks.
      update && this.requestUpdate(property, value)
    } catch (exception) {
      if (exception) {
        this.log(exception, 'error')

        update = false
      }
    }
  }

  /**
   * Event Dispatcher Interface to call Event handlers, defined outside the
   * current instance context.
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
}
