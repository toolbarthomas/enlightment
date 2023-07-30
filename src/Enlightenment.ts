import {
  css as _css,
  CSSResultGroup as _CSSResultGroup,
  LitElement,
  html as _html,
  PropertyValueMap,
  svg,
} from "lit";
import {
  customElement as _customElement,
  property as _property,
} from "lit/decorators.js";
import {
  createRef as _createRef,
  ref as _ref,
  Ref,
} from "lit/directives/ref.js";

import { isEmptyComponentSlot } from "src/mixins/dom";

/**
 * Optional configuration options to use within the renderImage method.
 */
export type EnlightenmentImageOptions =
  | {
      classname?: string;
    }
  | string;

/**
 * Optional configuration options to use for the the initial element Class
 * constructor.
 */
export type EnlightenmentOptions = {
  delay: number;
};

/**
 * Defines the Global state typing that is assigned to the Window context.
 */
export type EnlightenmentState = {
  currentElements: Element[];
  verbose?: boolean;
};

/**
 * Definition of a single throttled handler that will not stack if called
 * multiple times within the defined throttle delay.
 */
export type EnlightenmentThrottle = [Function, ReturnType<typeof setTimeout>];

/**
 * Contains the active document Event listeners that are created from the
 * constructed Class context.
 */
export type GlobalEventType = Event["type"];
export type GlobalEventHandler = Function;
export type GlobalEventContext = EventTarget;
export type GlobalEvent = [
  GlobalEventType,
  GlobalEventHandler,
  GlobalEventContext
];

/**
 * Optional options to use for Enlightenment.hook method.
 */
export type hookOptions = {
  context?: Element;
  data: any;
};

/**
 * Re-export the required Lit Element libraries to ensure the imports are
 * comming a single source.
 */
export type CSSResultGroup = _CSSResultGroup;

export const createRef = _createRef;
export const css = _css;
export const customElement = _customElement;
export const html = _html;
export const property = _property;
export const ref = _ref;

// import styles from "src/styles.scss";

/**
 * Enlightenment is a toolset based on the Lit Element Web Component library with
 * extra DOM related features like:
 *  - (inline) SVG & Image insertion (@TODO)
 *  - Image extension validation (@TODO)
 *  - Target validation (@TODO currentElement)
 *  - Focus context (@TODO Focus Trap)
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
    slot: "_content",
  };

  // Expected interval value of 60HZ refresh rate.
  static FPS = 1000 / 60;

  /**
   * Validates if the defined url value is external.
   */
  static isExternal(url) {
    const [path, protocol, origin] = url.match(
      /^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/
    );

    if (
      typeof protocol === "string" &&
      protocol.length > 0 &&
      protocol.toLowerCase() !== location.protocol
    ) {
      return true;
    }

    if (
      typeof origin === "string" &&
      origin.length > 0 &&
      origin.replace(
        new RegExp(
          ":(" + { "http:": 80, "https:": 443 }[location.protocol] + ")?$"
        ),
        ""
      ) !== location.host
    ) {
      return true;
    }

    return false;
  }

  // The keycodes that could be validated within a class method.
  static keyCodes = {
    meta: [9, 16, 17, 18, 20],
    exit: [27],
  };

  /**
   * Ensures any whitespace is removed from the given string.
   */
  static strip(value: string) {
    return typeof value === "string"
      ? value
          .split(" ")
          .join("")
          .replace(/\r?\n|\r/g, "")
      : String(value);
  }

  // Defines the renderable image type for the renderImage method.
  static supportedImageExtensions = [
    ".apng",
    ".avif",
    ".bmp",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".tiff",
    ".webp",
  ];

  /**
   * Helper function to ensure the requested property is returned from a
   * dynamic string or object value.
   */
  static useOption(property: string, value?: any, optional?: string) {
    return (
      (typeof value === "string" && !optional
        ? value
        : (value || {})[property]) || ""
    );
  }

  //@TODO should remove?
  // Defines the default styles to include for the defined Enlightenment instance.
  // static styles?: _CSSResultGroup | undefined = [styles];

  // Default element reference that should be assigned to the root element
  // within the render context.
  context: Ref<Element> = createRef();

  // Alias to the parent Window object that holds the global state of the
  // created instance.
  root: Window = window;

  // Should insert the defined classnames within the root context.
  classes: string[] = [];

  // Pushes the element context to the global state when TRUE.
  // currentElement: boolean = false;

  // Flag that returns the current state of the optional Focus Trap instance.
  hasFocusTrap: boolean = false;

  // Dynamic storage for the running document Event listeners.
  listeners: GlobalEvent[] = [];

  // Value to use for the naming of the Global state.
  namespace: string = "NLGHTNMNT";

  // Blocks the default handle methods when TRUE.
  preventEvent: boolean = false;

  // Contains the Shadow Root slot target contexts in order to validate
  // the actual rendered slots existence.
  slots: { [key: string]: HTMLSlotElement | undefined } = {};

  // // Optional source path that will output inline SVG from the existing sprite.
  // spriteSource?: string = "";

  // Contains the assigned handlers that will be called once.
  throttler: {
    delay: number;
    handlers: EnlightenmentThrottle[];
  };

  // Readable error to display during an exception/error within the defined
  // component context.
  @property({ type: String })
  error = "";

  @property({ attribute: "aria-current", reflect: true })
  ariaCurrent = "false";

  @property({
    attribute: "aria-disabled",
    reflect: true,
  })
  ariaDisabled = "false";

  @property({
    attribute: "svg-sprite-source",
  })
  svgSpriteSource: "";

  constructor(options: EnlightenmentOptions) {
    super();

    const { delay } = options || {};

    // Ensure the Global state is defined for the initial custom elements.
    //@ts-ignore
    if (!this.root[this.namespace]) {
      const state = {
        currentElements: [],
        verbose: false,
      } as EnlightenmentState;

      //@ts-ignore
      this.root[this.namespace] = state;

      this.log([`${this.namespace} global assigned:`, state]);
    }

    const f = () => console.log("Throttle function");

    this.throttle(f, 1000);

    this.throttler = {
      delay: isNaN(parseFloat(String(delay))) ? Enlightenment.FPS : delay,
      handlers: [],
    };

    this.log(
      `${this.namespace} throtler constructed: ${this.throttler.delay}ms`
    );

    this.throttle(f, 1000);
    this.throttle(f, 1000);
  }

  /**
   * Ensures the given string is formatted as correct HTML attribute.
   *
   * This is needed since some frameworks cannot parse camel cased properties.
   * You should use `oncallback` instead of `onCallback` when it is asigned to
   * the element for those frameworks.
   */
  static _attributeNameForProperty(name) {
    return super._attributeNameForProperty(
      name.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase(),
      {}
    );
  }

  /**
   * Marks the defined Enlightenment element context as active global element
   * within the constructed this.root Object.
   */
  protected assignCurrentElement() {
    //@ts-ignore
    const { currentElements } = this.root[this.namespace] || {};

    if (
      currentElements &&
      !(currentElements as EnlightenmentState["currentElements"]).filter(
        (ce) => ce === this
      ).length
    ) {
      (currentElements as EnlightenmentState["currentElements"]).push(this);
    }
  }

  /**
   * Assigns a new global event for the rendered component context.
   * The actual event is stored within the instance to prevent Event stacking.
   */
  protected assignGlobalEvent(
    type: GlobalEventType,
    handler: GlobalEventHandler,
    context?: GlobalEventContext
  ) {
    if (!type) {
      this.log("Unable to assign global event.", "error");

      return;
    }

    if (typeof handler !== "function") {
      this.log(
        `Unable to subscribe existing Document Event for ${type}`,
        "error"
      );

      return;
    }

    const ctx = context || document;

    const fn = handler.bind(this);

    this.listeners.push([type, fn, ctx]);

    ctx && ctx.addEventListener(type, fn);

    this.log(`Global event assigned: ${type}`, "log");
  }

  /**
   * Assigns the rendered slots within the current element instance to
   * instance.slots Object.
   */
  protected assignSlots(name?: string) {
    if (!this.shadowRoot) {
      this.log(`Unable to detect shadowRoot from ${this.namespace}`, "error");
    }

    const slots = this.shadowRoot?.querySelectorAll("slot");

    this.clearGlobalEvent("slotchange", slots);

    this.commit("slots", () => {
      if (!slots || !slots.length) {
        this.slots = {};
      } else {
        for (let i = 0; i < slots.length; i += 1) {
          const name = slots[i].name || Enlightenment.defaults.slot;

          if (!Object.values(this.slots).includes(slots[i])) {
            this.slots[name] = isEmptyComponentSlot(slots[i])
              ? undefined
              : slots[i];

            this.assignGlobalEvent(
              "slotchange",
              this.handleSlotchange,
              slots[i]
            );
          }

          this.handleSlotchange({ target: slots[i] } as any);
        }

        this.log([`Found ${slots.length} slot(s) from:`, this.slots]);
      }
    });
  }

  /**
   * Ensures the a requestUpdate is used when attribtues are added or removed.
   * on the defined element.
   */
  public attsributeChangedCallback(
    name: string,
    _old?: string,
    value?: string
  ) {
    //@TODO Fix stacking calls.
    this.throttle(() => this.requestUpdate());

    super.attributeChangedCallback(name, _old || null, value || null);
  }
  /**
   * Removes the defined assigned global Events from the selected type.
   */
  protected clearGlobalEvent(type: GlobalEventType, context?: any | any[]) {
    const queue = Array.isArray(context) ? context : [context];

    for (let i = 0; i < queue.length; i += 1) {
      const listeners = this.listeners.filter(
        ([t, fn, ctx]) => t === type && (queue[i] || this) === ctx
      );

      if (!listeners || !listeners.length) {
        continue;
      }

      let completed = 0;
      listeners.forEach(([t, fn, ctx]) => {
        ctx.removeEventListener(t, fn as any);

        this.log([`Global ${t} event removed:`, fn], "log");

        completed += 1;
      });

      if (completed === listeners.length) {
        this.listeners = this.listeners.filter(
          (listener) => !listeners.includes(listener)
        );

        this.log(`Global ${type} event cleared`, "log");
      }
    }
  }

  /**
   * Cleanup the defined throttler handlers and stop any defined throttle
   * timeout.
   */
  protected clearThrottler() {
    const { handlers } = this.throttler;

    if (!handlers || !handlers.length) {
      return;
    }

    handlers.forEach(([fn, timeout], index) => {
      if (timeout) {
        clearTimeout(timeout);

        this.log(["Throttle cleared:", fn], "log");
      }
    });

    this.throttler.handlers = [];
  }

  /**
   * Helper function that updates the defined property from the constructed
   * Enlightenment instance.
   */
  protected commit(property: string, handler: any) {
    if (!property) {
      this.log([`Unable to commit undefined property`]);
    }

    if (handler === null) {
      this.log([`Unable to commit ${property}`]);
    }

    try {
      //@ts-ignore
      const value = this[property];

      if (typeof handler === "function") {
        handler();
      }

      if (typeof handler !== "function") {
        //@ts-ignore
        this[property] = handler;

        this.log([`${this.namespace} property updated:`, handler]);
      } else {
        this.log([
          `${this.namespace} properties commited from handler`,
          handler,
        ]);
      }

      // Ensures the property update fires the component callbacks.
      this.requestUpdate(property, value);
    } catch (error) {
      error && this.log(error, "error");
    }
  }

  /**
   * Defines the initial setup for the constructed Enlightenment element.
   */
  public connectedCallback() {
    super.connectedCallback();

    this.assignGlobalEvent("click", this.handleGlobalClick);
    this.assignGlobalEvent("keydown", this.handleGlobalKeydown);
    this.assignGlobalEvent("focus", this.handleGlobalFocus);
    this.assignGlobalEvent("focusin", this.handleGlobalFocus);

    this.hook("connected");
  }

  /**
   * Cleanup the created setup of the removed Enlightenment element.
   */
  public disconnectedCallback() {
    try {
      this.clearThrottler();

      this.omitGlobalEvent("click", this.handleGlobalClick);
      this.omitGlobalEvent("keydown", this.handleGlobalKeydown);
      this.omitGlobalEvent("focus", this.handleGlobalFocus);
      this.omitGlobalEvent("focusin", this.handleGlobalFocus);

      this.clearGlobalEvent(
        "slotchange",
        this.shadowRoot && this.shadowRoot.querySelectorAll("slot")
      );

      this.hook("disconnected");

      super.disconnectedCallback();
    } catch (error) {
      if (error) {
        this.log(error as string, "error");
      }
    }
  }

  /**
   * Validates if the defined Event handler has already been defined as
   * global Event.
   */
  protected filterGlobalEvent(
    type: GlobalEventType,
    handler: GlobalEventHandler
  ) {
    if (!this.listeners.length) {
      return [];
    }

    const entry: GlobalEvent[] = [];
    this.listeners.forEach(([t, fn, ctx]) => {
      if (t === type && fn.name.endsWith(handler.name)) {
        entry.push([t, fn, ctx]);
      }
    });

    return entry.length ? entry[0] : [];
  }

  /**
   * Setup the actual featuers for the constructed Enlightenment component.
   */
  protected firstUpdated(
    properties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ) {
    super.firstUpdated(properties);

    this.hook("updated");
  }

  /**
   * Toggles the currentElement property within the defined element context that
   * is triggerd from the defined global Events when the activeElement exists
   * within the Enlightenment element context.
   */
  protected handleCurrentElement(target: Event["target"]) {
    if (this.preventEvent) {
      return;
    }

    this.commit("ariaCurrent", () => {
      if (this.isComponentContext(target as HTMLElement)) {
        this.ariaCurrent = "true";
      } else {
        this.ariaCurrent = "false";
      }
    });
  }

  /**
   * Defines the global click Event listener for the element context.
   *
   * Marks the constructed Enlightenment element as currentElement when the
   * click Event was triggered inside the element context.
   */
  protected handleGlobalClick(event: MouseEvent) {
    if (this.preventEvent) {
      return;
    }

    const { target } = event || {};

    this.handleCurrentElement(target);
  }

  /**
   * Defines the global focus Event listener for the element context.
   *
   * Marks the constructed Enlightenment element as currentElement when a
   * keyboard Event was triggered inside the element context.
   */
  protected handleGlobalFocus(event: FocusEvent) {
    if (this.preventEvent) {
      return;
    }

    const { target } = event || {};

    this.handleCurrentElement(target);
  }

  /**
   * Defines the global keyboard Event listener for the element context.
   *
   * Unmark the currentElement property from the constructed Enlightenment
   * element during a keyboard event within the element context.
   */
  protected handleGlobalKeydown(event: KeyboardEvent) {
    if (this.preventEvent) {
      return;
    }

    const { keyCode, target } = event || {};

    if (Enlightenment.keyCodes.exit.includes(keyCode)) {
      this.commit("currentElement", false);
      const t = target as HTMLElement;

      if (t && this.isComponentContext(t) && t.blur) {
        t.blur();
      }
    } else if (!Enlightenment.keyCodes.meta.includes(keyCode)) {
      this.commit("currentElement", true);
    }
  }

  /**
   * Defines the global slotchange Event handler that will trigger a slotchange
   * event on the main element context.
   */
  handleSlotchange(event: Event) {
    if (this.preventEvent) {
      return;
    }

    if (!event) {
      return;
    }

    this.isEmptySlot(event);

    this.hook("slotchange");
  }

  /**
   * Event Dispatcher interface to call Event handlers that are defined outside
   * the Enlightenment element context.
   */
  public hook(name: string, options?: hookOptions) {
    const { context, data } = options || {};

    if (!name) {
      this.log("Unable to use undefined hook", "error");

      return;
    }

    const event = new CustomEvent(name, {
      bubbles: true,
      detail: data || {},
    });

    this.log([`Hook assigned as ${name}`, event], "log");

    if (context && context !== this) {
      return context.dispatchEvent(event);
    }

    return this.dispatchEvent(event);
  }

  /**
   * Validates if the defined element exists within the created Enlightenment
   * context.
   */
  protected isComponentContext(element: HTMLElement) {
    const { value } = this.context || {};

    return element === value || element === this || this.contains(element);
  }

  protected isCurrentContext() {
    const context = this.useRef(this.context);

    if (!context) {
      return;
    }

    context.setAttribute("aria-current", this.ariaCurrent);
  }

  /**
   * Mark the wrapping element as hidden for each empty slot.
   * This should trigger during a slotchange event within the created element
   * context.
   */
  protected isEmptySlot(event: Event) {
    const { parentElement } = event.target as Element;

    if (parentElement) {
      if (!isEmptyComponentSlot(event.target as HTMLSlotElement)) {
        parentElement.removeAttribute("aria-hidden");
      } else {
        parentElement.setAttribute("aria-hidden", "true");
      }
    }
  }

  /**
   * Alias for the default console to use during development.
   */
  protected log(message: any | any[], type?: string) {
    //@ts-ignore
    if (typeof console[type || "log"] !== "function") {
      return;
    }

    let output = Array.isArray(message) ? message : [message];

    //@ts-ignore
    const { verbose } = (this.root && this.root[this.namespace]) || {};

    if (verbose) {
      //@ts-ignore
      output.forEach((m) => console[type || "log"](m));
    }
  }

  /**
   * Removes the defined Enlightenment element context from the active global
   * Element collection.
   */
  omitCurrentElement() {
    //@ts-ignore
    const { currentElements } = this.root[this.namespace] || {};

    if (currentElements && currentElements.length) {
      //@ts-ignore
      const commit = (
        currentElements as EnlightenmentState["currentElements"]
      ).filter((ce) => ce !== this);

      //@ts-ignore
      this.root[this.namespace].currentElements = commit;
    }

    this.hook("omit");
  }

  /**
   * Removes the assigned global Event handler.
   */
  omitGlobalEvent(type: GlobalEventType, handler: GlobalEventHandler) {
    if (!type) {
      this.log("Unable to omit undefined global Event", "error");

      return;
    }

    if (typeof handler !== "function") {
      this.log(
        `Unable to omit global ${type} Event, no valid function was defined.`,
        "error"
      );
    }

    const [t, fn, ctx] = this.filterGlobalEvent(type, handler);

    if (!t || !fn || !ctx) {
      this.log(`Unable to omit undefined global ${type} Event`, "error");

      return;
    }

    ctx.removeEventListener(t, fn as any);

    const index: number[] = [];
    this.listeners.forEach(([t2, fn2], i) => {
      if (fn2 === fn) {
        index.push(i);
      }
    });

    //@ts-ignore
    this.listeners = this.listeners
      .map((l, i) => (index.includes(i) ? undefined : l))
      .filter((l) => l);

    this.log(`Global ${type} event removed:`);

    this.hook("omit");
  }

  /**
   * Renders the defined image source as static image or inline SVG.
   */
  public renderImage(source: string, options?: EnlightenmentImageOptions) {
    if (!source) {
      return "";
    }

    const classname = Enlightenment.useOption("classname", options);
    const height = Enlightenment.useOption("height", options, true);
    const width = Enlightenment.useOption("width", options, true);

    return this.testImage(false, source)
      ? html`<svg
          class="${classname}"
          ${height && `height="${height}"`}
          ${width && `width=  "${width}"`}
          height="${height || "100%"}"
          width="${width || "100%"}"
          aria-hidden="true"
          focusable="false"
        >
          ${svg`<use href="${this.svgSpriteSource}#${source}"></use>`}
        </svg>`
      : html`<img
          class="${classname}"
          height="${height || "auto"}"
          width="${width || "auto"}"
          aria-hidden="true"
          focusable="false"
          src="${this.testImageSource(source)
            ? source
            : this.svgSpriteSource || this.placeholder}"
        />`;
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
      return false;
    }

    if (initial && this.svgSpriteSource) {
      if (
        source &&
        this.testImageSource(this.svgSpriteSource) &&
        this.testImageSource(source)
      ) {
        return false;
      }

      return true;
    } else if (initial) {
      return false;
    }

    if (this.svgSpriteSource && source) {
      if (
        this.testImageSource(this.svgSpriteSource) &&
        this.testImageSource(Enlightenment.strip(source))
      ) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Validates if the defined source is a valid image path.
   */
  protected testImageSource(source: string) {
    if (typeof source !== "string") {
      return;
    }

    let result = false;

    Enlightenment.supportedImageExtensions.forEach((extension) => {
      if (Enlightenment.strip(source).endsWith(extension)) {
        result = true;
      }
    });

    return result;
  }

  /**
   * Helper function that ensures the given handler is only called once within
   * the defined delay.
   */
  protected throttle(handler: EnlightenmentThrottle[0], delay?: number) {
    if (!this.throttler || !this.throttler.handlers) {
      this.log(["Unable to throttle:", handler], "error");

      return;
    }

    if (typeof handler !== "function") {
      this.log(
        "Unable to use throttle, the defined handler is not a function",
        "error"
      );
    }

    let index = -1;
    const [exists] = this.throttler.handlers.filter(([h], i) => {
      if (h === handler) {
        if (index < 0) {
          index = i;
        }

        return h === handler;
      }

      return undefined;
    });

    if (exists) {
      this.log(["Stopping previous throttler handler:", handler], "info");

      const previousTimeout = this.throttler.handlers[index];

      previousTimeout && previousTimeout[1] && clearTimeout(previousTimeout[1]);

      delete this.throttler.handlers[index];
    }

    const timeout = setTimeout(
      handler,
      isNaN(parseFloat(String(delay))) ? this.throttler.delay : delay
    );

    this.throttler.handlers.push([handler, timeout]);

    this.log(["Throttle defined:", handler]);
  }

  /**
   * Callback to use after a component update.
   */
  protected updated(
    properties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ) {
    super.updated(properties);

    this.throttle(() => {
      this.assignSlots();

      if (this.ariaCurrent === "true") {
        this.assignCurrentElement();
      } else {
        this.omitCurrentElement();
      }

      this.updatePreventEvent();

      this.isCurrentContext();

      this.hook("updated");
    });
  }

  /**
   * Updates the preventEvent flag that should disable other handlers to be
   * used when TRUE.
   */
  protected updatePreventEvent() {
    if (this.ariaDisabled === "true") {
      this.commit("preventEvent", true);
    } else {
      this.commit("preventEvent", false);
    }
  }

  /**
   * Returns the root node of the defined Enlightenment instance.
   */
  public useContext() {
    return this.context && this.context.value ? this.context.value : this;
  }

  /**
   * Shorthand to use the existing Lit Element reference.
   */
  protected useRef = (ref: Ref): Element | undefined => {
    if (!ref || !ref.value) {
      return;
    }

    return ref.value;
  };
}
