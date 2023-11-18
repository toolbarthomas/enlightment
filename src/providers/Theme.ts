import { css } from 'lit'

/**
 * Exposes the default Component & Document styles for each Enlightenment
 * Component without assigning it to the Component styles static.
 */
export class EnlightenmentTheme {
  // Global Keyframe definition that could be used within the component context.
  static keyframes = css`
    @keyframes rotate {
      to {
        transform: rotate(1turn);
      }
    }

    @keyframes rotateFromCenter {
      to {
        transform: translate(-50%, -50%) rotate(1turn);
      }
    }

    @keyframes rippleSmall {
      to {
        transform: scale(1.6);
        opacity: 0;
      }
    }

    @keyframes rippleMedium {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes fadeInFromTop {
      from {
        opacity: 0;
        transform: translateY(-50%);
      }

      to {
        opacity: 1;
        transform: none;
      }
    }
  ` as unknown as string

  // Default component styles that is included for each Component.
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

  // Defines the default document styles for the current application.
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
    const keyframeStylesheet = new CSSStyleSheet()
    defaultStylesheet.replaceSync(EnlightenmentTheme.component)
    keyframeStylesheet.replaceSync(EnlightenmentTheme.keyframes)

    context.shadowRoot.adoptedStyleSheets = [
      ...context.shadowRoot.adoptedStyleSheets,
      defaultStylesheet,
      keyframeStylesheet
    ]
  }
}
