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
 * The Web Element is the root for the interface components based of the
 * Lit Element library. It extends from the core concepts and introduces extra
 * features like Focus Trap, root context and DOM methods.
 */
export class WebElement extends LitElement {
  static styles?: _CSSResultGroup | undefined = [styles];

  rootRef: Ref<Element> = createRef();

  classes: string[] = [];

  slots: HTMLSlotElement[] = [];

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

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    console.log("updated");
  }

  protected firstUpdated(): void {
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
