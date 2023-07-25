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

import styles from "src/styles.scss";

/**
 * Enlightment is a toolset based on the Lit Element Web Component library with
 * extra DOM related features like:
 *  - (inline) SVG & Image insertion (@TODO)
 *  - Image extension validation (@TODO)
 *  - Target validation (@TODO currentElement)
 *  - Focus context (@TODO Focus Trap)
 *  - Hooks/Event Dispatcher (@TODO)
 *  - context validation (@TODO isComponentContext)
 *  - optional loggin (@TODO)
 *  - Global Event Emitter (@TODO)
 *  - Property Commit (@TODO)
 *  - Function throttler (@TODO),
 *
 * An Enlightment Element written within the
 * Esbuild workflow includes the component stylesheet within the actual
 * source by using the Esbuild Enlightment Sass Plugin:
 * - @toolbarthomas/enlightment/node/esbuild.sass.plugin.mjs
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
 * import { css } from '@toolbarthomas/enlightment'
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
 * Enlightment provides the required helper, decorator and class exports and
 * the actual workflow expects the actual component result is compiled in the
 * ESM format. It should import the required core class (Enlightment) as native
 * module script:
 *
 * <script src="my-component.js" type="module"></script>
 */
export class Enlightment extends LitElement {
  // Defines the default styles to include for the defined Enlightment instance.
  static styles?: _CSSResultGroup | undefined = [styles];

  // Should define the ref value of the root context.
  rootRef: Ref<Element> = createRef();

  // Should insert the defined classnames within the root context.
  classes: string[] = [];

  // Contains the Shadow Root slot target contexts in order to validate
  // the actual rendered slots existence.
  slots: HTMLSlotElement[] = [];

  // Readable error to display during an exception/error within the defined
  // component context.
  @property({ type: String })
  error = "";

  /**
   * Mark the parentElement as hidden if the defined slot is empty.
   */
  isEmptySlot = (event: Event) => {
    const { parentElement } = event.target as Element;

    if (parentElement) {
      if (isEmptyComponentSlot(event.target as HTMLSlotElement)) {
        return parentElement.removeAttribute("aria-hidden");
      }

      return parentElement.setAttribute("aria-hidden", "true");
    }
  };

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
    console.log("updated");
  }

  /**
   * Setup the actual featuers for the constructed Enlightment component.
   */
  protected firstUpdated(): void {
    // Marks the current rendered slots as hidden if the actual contents is
    // undefined. This is helpfull while styling the component with an empty
    // slot.
    this.shadowRoot &&
      this.shadowRoot.querySelectorAll("slot").forEach((node) => {
        if (!this.slots.includes(node)) {
          this.slots.push(node);

          node.addEventListener("slotchange", this.isEmptySlot);
        }

        this.isEmptySlot({ target: node } as any);
      });
  }
}
