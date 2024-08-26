import { EnlightenmentDOMResizeOptions, EnlightenmentTarget } from '../_types/main'

import { createRef, property } from './Mixins'
import { EnlightenmentParser } from './Parser'

import { EnlightenmentTheme } from '../providers/Theme'

export class EnlightenmentDOM extends EnlightenmentParser {
  static getElements(context: Element, tags: string[]) {
    if (!context) {
      return []
    }

    const elements: HTMLElement[] = []

    if (context.shadowRoot) {
      Object.values(context.shadowRoot.children).forEach((child) =>
        elements.push(...EnlightenmentDOM.getElements(child, tags))
      )
    }

    if (context.children) {
      Object.values(context.children).forEach((child) =>
        elements.push(...EnlightenmentDOM.getElements(child, tags))
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
      elements.push(...EnlightenmentDOM.getElements(element, tags))
    })

    return [...new Set(elements)]
  }

  /**
   * Returns the related components that matches the given context or use the
   * optional selector to specifically use filter with the defined value.
   *
   * @param context Return the components with matching tagname value.
   * @param selector Only use the matching components with additional selector
   * value like ID or Classname.
   */
  static getRelatedComponents(context: Element, selector?: string) {
    return [
      ...new Set([
        ...Array.from(document.querySelectorAll(selector || context.tagName)),
        ...(context.parentNode
          ? Array.from(context.parentNode.querySelectorAll(selector || context.tagName))
          : [])
      ])
    ].filter((element) => element !== context && element.tagName === context.tagName)
  }

  /**
   * Validates if the given Slot Element has any assigned Nodes/Elements
   *
   * @param slot Validate from the defined Slot Element.
   */
  static isEmptySlot(slot: HTMLSlotElement) {
    if (!slot || !slot.assignedNodes) {
      return
    }

    return slot.assignedNodes({ flatten: true }).length === 0
  }

  /**
   * Validates if the given context exists within the visible viewport.
   *
   * @param context Use getBoundingClientRect() from the defined context.
   */
  static isWithinViewport(context: HTMLElement) {
    if (!context || !context.getBoundingClientRect) {
      return false
    }

    const bounds = context.getBoundingClientRect()
    return (
      bounds.top >= 0 &&
      bounds.left >= 0 &&
      bounds.bottom <=
        (EnlightenmentParser.Global.innerHeight || document.documentElement.clientHeight) &&
      bounds.right <=
        (EnlightenmentParser.Global.innerWidth || document.documentElement.clientWidth)
    )
  }

  /**
   * Generates a new valid element id selector for the current DOM.
   */
  static useElementID() {
    let id = EnlightenmentParser.generateTimestampID()

    while (document.getElementById(id)) {
      id = EnlightenmentParser.generateTimestampID()
    }

    return id
  }

  /**
   * Correctly resolve the context Type alias.
   */
  static useHost(target?: Element) {
    return target
  }

  /**
   * Property reference for the actual ARIA disabled Attribute.
   */
  @property({
    attribute: 'aria-disabled',
    type: String
  })
  ariaDisabled: string | null = null

  /**
   * Property reference for the actual ARIA disabled Attribute.
   */
  @property({
    type: String,
    converter: (value) => EnlightenmentDOM.filterPropertyValue(value, EnlightenmentTheme.DIRECTIONS)
  })
  direction: string = EnlightenmentTheme.DIRECTIONS[0]

  /**
   * Boolean flag that should behave like the existing Input Element disabled
   * Attribute.
   */
  @property({
    converter: EnlightenmentParser.isBoolean,
    type: Boolean
  })
  disabled?: boolean = false

  // Returns the full Component context when FALSE.
  @property({
    converter: EnlightenmentParser.isBoolean,
    type: Boolean
  })
  minimalShadowRoot?: boolean

  /**
   * Defines the root context reference for Enlightenment that should be use
   * once on the main container element.
   */
  context = createRef()

  /**
   * Boolean flag that equals True when the current Event target is within
   * the constructed Component context.
   */
  currentElement: boolean = false

  /**
   * Enables fragment usage within the defined component to repeat any HTML
   * within the names slot.
   */
  enableFragments?: boolean = false

  /**
   * Defines the optional state properties that is used with the actual ARIA
   * HTML Attribute.
   */
  isCollapsed?: boolean = false
  isExpanded?: boolean = false
  isFullScreen?: boolean = false

  /**
   * Reference to the parent Window Object.
   */
  root: typeof EnlightenmentParser.Global = EnlightenmentParser.Global

  /**
   * Contains the defined Shadowroot slot target contexts, that should hold at
   * least a single (unnamed) slot.
   */
  slots: { [key: string]: HTMLSlotElement | undefined } = {}

  /**
   * Optional alias that should match with one of the viewport widths to assign
   * as private Property
   */
  viewport?: string = ''

  /**
   * Attaches the defined component to the currentElement global.
   */
  private attachCurrentElement() {
    this.commit('currentElement', true)

    EnlightenmentDOM.globals.assignCurrentElement(this)
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
  private assignSlottedEvent(event: Event) {
    this.clearSlottedEvents(event.target as HTMLSlotElement)

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

        if (typeof fn === 'function' && this.useHost(element) === this) {
          this.assignGlobalEvent(type, fn, {
            context: element
          })
        }
      })
    })
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

    EnlightenmentDOM.globals.omitCurrentElement(this)

    this.dispatchUpdate('omit')
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
   * Assign a new Global Event for each existing component context that is
   * defined the listen property.
   */
  protected assignListeners() {
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
   * Assigns the defined rendered slot Elements within the current Component
   * instance.
   *
   * @param name Use the defined name instead of the default slot. This is
   * required when multiple slots exists within the Component.
   */
  protected assignSlots(name?: string) {
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
          const name = slot.name || EnlightenmentDOM.defaults.slot

          if (!Object.values(this.slots).includes(slot)) {
            if (!this.slots[name]) {
              this.throttle(this.handleSlotChange, this.delay, { ...event, target: slot })
            }

            this.slots[name] = EnlightenmentDOM.isEmptySlot(slot) ? undefined : slot

            this.assignGlobalEvent('slotchange', this.handleSlotChange, { context: slot })
          }
        }

        if (this.slots && Object.values(this.slots).filter((s) => s).length) {
          this.log([`Found ${this.uuid} ${slots.length} slot(s) from:`, this.slots])
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
  protected clearSlottedEvents(slot?: HTMLSlotElement) {
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

      if (this.useHost(element) !== this) {
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
   * Clones the names Slot element that can be used when the defined component
   * includes multiple slot elements with duplicate name values.
   *
   * @param name Clones all existing names Slot elements from the initial
   * Slot name.
   */
  protected cloneSlot(name?: string) {
    const slot = this.useInitialSlot(name || EnlightenmentDOM.defaults.slot)

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
    const slots: NodeListOf<HTMLSlotElement> = name
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
   * Find the closest Element from the defined selector that should exists
   * within the initial or any parent ShadowDOM.
   *
   * @param selector Requires a valid querySelector value.
   */
  protected findParentElement(selector: string) {
    if (typeof selector !== 'string') {
      return
    }

    let host = this.useHost(this) as EnlightenmentDOM

    if (!host || !host.useContext) {
      return
    }

    let context = host.useContext()

    while (context && context.tagName !== selector.toUpperCase()) {
      host = this.useHost(host) as EnlightenmentDOM

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

    if (!children || !children.length) {
      return
    }

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

    if (device && this.viewport !== device) {
      this.commit('viewport', device)
    }
  }

  /**
   * Defines the global click Event listener for the element context.
   *
   * Marks the constructed Enlightenment element as currentElement when the
   * click Event was triggered inside the element context.
   *
   * @param event The initial Mouse Event interface.
   */
  protected handleGlobalClick(event: Event) {
    if (this.preventEvent || !event) {
      return
    }

    const { target } = event

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
  protected handleGlobalFocus(event: Event) {
    if (this.preventEvent || !event) {
      return
    }

    const { target } = event

    this.handleCurrentElement(target)
  }

  /**
   * Default resize handler while the document is resized.
   */
  protected handleGlobalResize(event?: UIEvent) {
    this.throttle(this.handleCurrentViewport, EnlightenmentDOM.RPS)
  }

  /**
   * Defines the global slotchange Event handler that will trigger a slotchange
   * event on the main element context.
   *
   * @param event The initial common Event interface.
   */
  protected handleSlotChange(event: Event) {
    if (!event) {
      return
    }

    this.isEmptyComponentSlot(event)

    this.assignSlottedEvent(event)

    this.updateFragments()

    this.handleCurrentViewport()

    if (!this.domReady) {
      Object.defineProperty(this, 'domReady', {
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
  protected isEmptyComponentSlot(event: Event) {
    const { parentElement } = (event.target as Element) || {}

    if (parentElement) {
      if (!EnlightenmentDOM.isEmptySlot(event.target as HTMLSlotElement)) {
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
    instance?: EnlightenmentDOM,
    list?: EnlightenmentDOM[]
  ): EnlightenmentDOM[] {
    const parent = instance && instance.parent ? instance.parent(selector) : this.parent(selector)

    if (parent && typeof (parent as EnlightenmentDOM).parent === 'function') {
      const commit = [...(list || []), parent as EnlightenmentDOM]

      return this.parents(selector, parent as EnlightenmentDOM, commit)
    }

    if (list && list.length) {
      return list
    }

    return []
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

    if ((this as any)[name] === undefined) {
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
    if ((this as any)[property] === undefined) {
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

      if (!EnlightenmentDOM.isEmptySlot(slot)) {
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
   * Returns the actual breakpoint Width value from the defined breakpoint name.
   *
   * @param name Returns the breakpoint value from the defined name.
   */
  protected useBreakpoint(name: string) {
    const value = EnlightenmentTheme.breakpoints[name]
    const fallback =
      EnlightenmentTheme.breakpoints[0] >= EnlightenmentParser.Global.innerWidth
        ? EnlightenmentTheme.breakpoints[0]
        : EnlightenmentParser.Global.innerWidth

    return value || fallback
  }

  /**
   * Iterates through the defined Theme Breakpoints.
   *EnlightenmentTheme
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
   * Returns the root node of the defined Enlightenment instance.
   */
  public useContext() {
    return this.context && this.context.value ? this.context.value : this
  }

  /**
   * Returns the first Slotted element from the assignedElements of the default
   * Slot, or get the Element from the existing index.
   *
   * @param index Returns the index of the assigned Slotted Elements.
   */
  protected useInitialElement(index?: number) {
    const slot = this.useSlot()

    if (!slot) {
      return
    }

    const [firstElement] = slot.assignedElements()

    if (index) {
      const selectedElement = slot.assignedElements()[index]

      return selectedElement || firstElement
    }

    return firstElement
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

    const slots = this.shadowRoot.querySelectorAll(
      `slot[name="${name}"]`
    ) as NodeListOf<HTMLSlotElement>

    if (!slots.length) {
      return
    }

    return slots[0]
  }

  /**
   * Returns the existing Component if the defined context exists within the
   * observed Elements from the instance method.
   *
   * @param context Traverse from the actual element to get the host Component
   * that will be checked with `this`.
   */
  protected useObserved(context: HTMLElement) {
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
   * Shorthand to use the existing Lit Element reference.
   *
   * @param ref The initial created Ref Object.
   */
  protected useRef(ref?: ReturnType<typeof createRef>) {
    if (!ref || !ref.value) {
      return
    }

    return ref.value as EnlightenmentTarget
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
      ([n, slot]) => n === EnlightenmentDOM.defaults.slot
    )

    return result && result[1]
  }
}
