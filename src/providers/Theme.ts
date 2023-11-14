import { css } from 'lit'

/**
 * Exposes the default Component & Document styles for each Enlightenment
 * Component without assigning it to the Component styles static.
 */
export class EnlightenmentTheme {
  static component = css`
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    [fragment]:empty {
      display: none;
    }

    [fragment] {
      display: block;
    }
  ` as unknown as string

  static document = css`
    html,
    body {
      height: 100%;
    }

    body {
      margin: 0;
      padding: 0;
    }
  ` as unknown as string

  assignDocumentStylesheet() {
    const documentStylesheet = new CSSStyleSheet()

    documentStylesheet.replaceSync(EnlightenmentTheme.document)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, documentStylesheet]
  }

  /**
   * Creates a new Component stylesheet and assign it to the defined context.
   *
   * @param context Assigns the stylesheet to the defined context Element.
   */
  assignDefaultStylesheet(context: Element) {
    if (!context || !context.shadowRoot) {
      return
    }

    const defaultStylesheet = new CSSStyleSheet()
    defaultStylesheet.replaceSync(EnlightenmentTheme.component)

    context.shadowRoot.adoptedStyleSheets = [
      ...context.shadowRoot.adoptedStyleSheets,
      defaultStylesheet
    ]
  }
}
