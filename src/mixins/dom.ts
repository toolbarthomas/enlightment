/**
 * Returns the first form element from the selected element that should exist
 * as parent container. The document Body element will be used if no valid form
 * element is present.
 */
export const getFormRoot = (element: Element) => {
  if (!element.parentElement) {
    return document.body;
  } else if (
    element.parentElement &&
    element.parentElement === element.closest("body")
  ) {
    return element.closest("body");
  } else if (element.parentElement) {
    let n = element.parentElement;

    while (
      n &&
      n.shadowRoot &&
      !Array.from(n.shadowRoot.children).filter(
        (n: Element) => n.tagName === "FORM"
      ).length
    ) {
      if (n.parentElement) {
        n = n.parentElement;
      }
    }

    return n || document.body;
  }

  return;
};

/**
 * Validator to check if the defined Slot has any existing DOM elements.
 *
 * @param slot The selected Slot element to test.
 */
export const isEmptyComponentSlot = (slot: HTMLSlotElement) => {
  if (!slot || !slot.assignedNodes) {
    return;
  }

  return slot.assignedNodes().length > 0;
};
