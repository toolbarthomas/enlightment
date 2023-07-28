import {
  css as _css,
  CSSResultGroup as _CSSResultGroup,
  LitElement,
  html as _html,
  PropertyValueMap,
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
export type GlobalEvent = [Event["type"], Function, any];

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

  // Flag that returns the current state of the optional Focus Trap instance.
  hasFocusTrap: boolean = false;

  // Dynamic storage for the running document Event listeners.
  listeners: GlobalEvent[] = [];

  // Value to use for the naming of the Global state.
  namespace: string = "Enlightenment";

  // Block incomming Event handlers when TRUE.
  preventEvent: boolean = false;

  // Contains the Shadow Root slot target contexts in order to validate
  // the actual rendered slots existence.
  slots: { [key: string]: HTMLSlotElement | undefined } = {};

  // Optional source path that will output inline SVG from the existing sprite.
  spriteSource?: string = "";

  // Contains the assigned handlers that will be called once.
  throttler: {
    delay: number;
    handlers: EnlightenmentThrottle[];
  };

  // Defines any fallback to use for optional properties.
  static defaults = {
    slot: "_content",
  };

  // Expected interval value of 60HZ refresh rate.
  static FPS = 1000 / 60;

  // The keycodes that could be validated within a class method.
  static keyCodes = {
    meta: [9, 16, 17, 18, 20],
    exit: [27],
  };

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

  // Readable error to display during an exception/error within the defined
  // component context.
  @property({ type: String })
  error = "";

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
   * Assigns the rendered slots within the current element instance to
   * instance.slots Object.
   */
  protected assignSlots(name?: string) {
    if (!this.shadowRoot) {
      this.log(`Unable to detect shadowRoot from ${this.namespace}`, "error");
    }

    const slots = this.shadowRoot?.querySelectorAll("slot");

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

            slots[i].removeEventListener("slotchange", this.isEmptySlot);
            slots[i].addEventListener("slotchange", this.isEmptySlot);
          }

          this.isEmptySlot({ target: slots[i] } as any);
        }

        this.log([`Found ${slots.length} slot(s) from:`, this.slots]);
      }
    });
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
   * Mark the wrapping element as hidden for each empty slot.
   * This should trigger during a slotchange event within the created element
   * context.
   */
  protected isEmptySlot = (event: Event) => {
    console.log("isEmpty");
    const { parentElement } = event.target as Element;

    if (parentElement) {
      if (!isEmptyComponentSlot(event.target as HTMLSlotElement)) {
        return parentElement.removeAttribute("aria-hidden");
      }

      return parentElement.setAttribute("aria-hidden", "true");
    }
  };

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
   * Shorthand to use the existing Lit Element reference.
   */
  useRef = (ref: Ref): Element | undefined => {
    if (!ref || !ref.value) {
      return;
    }

    return ref.value;
  };

  /**
   * Callback to use after a component update.
   */
  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    console.log("Protected update", this.slots);
  }

  /**
   * Setup the actual featuers for the constructed Enlightenment component.
   */
  protected firstUpdated(): void {
    // Assign the rendered slots within the element context and mark any empty
    // slot as hidden within the initial render.
    this.assignSlots();
  }
}
