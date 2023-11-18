import { css } from 'lit'

export type Shade = string | [number, number, number]

export type ColorChart = { [key: string]: Shade[] }

export type ColorType = 'hex' | 'hsl' | 'hsla' | 'rgb' | 'rgba'

export type ColorOptions = {
  type?: ColorType
  neutral?: string
  accent?: string
  delta?: number
}

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

  /**
   * Default component styles that is included for each Component.
   */
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

  /**
   * Defines the default document styles for the current application.
   */
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

  /**
   * Fixes value that is used to define the amount of channels.
   */
  static COLORBASE = 100

  /**
   * Semantic color values that is used for a single tint. The defined weights
   * will be used in the generated color chart.
   */
  static colorWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900]

  /**
   * Defines the default Color Chart Object that is used within the color
   * Stylesheet.
   */
  static colorChart = {
    type: 'hsl' as ColorType,
    delta: 5,
    accent: 'blue',
    neutral: 'grey',
    colors: {
      black: [[212, 0, 0]],
      blue: [
        [211, 96, 92],
        [212, 94, 89],
        [212, 94, 85],
        [213, 94, 76],
        [213, 94, 68],
        [213, 94, 56],
        [214, 94, 44],
        [214, 94, 37],
        [215, 92, 2]
      ],
      dawn: [
        [208, 42, 98],
        [209, 40, 96],
        [210, 40, 94],
        [210, 40, 93],
        [210, 40, 90],
        [211, 40, 88],
        [211, 40, 44],
        [212, 24, 27],
        [212, 12, 13]
      ],
      dusk: [
        [211, 29, 93],
        [212, 27, 90],
        [212, 27, 87],
        [213, 27, 84],
        [213, 27, 69],
        [213, 27, 53],
        [214, 27, 38],
        [214, 27, 22],
        [215, 25, 7]
      ],
      grey: [
        [208, 2, 98],
        [209, 1, 96],
        [210, 1, 94],
        [210, 0, 93],
        [210, 0, 90],
        [211, 0, 88],
        [211, 0, 44],
        [212, 0, 27],
        [212, 0, 13]
      ],
      red: [
        [357, 86, 92],
        [357, 84, 81],
        [357, 84, 71],
        [358, 84, 60],
        [358, 84, 49],
        [358, 84, 39],
        [359, 84, 28],
        [359, 84, 18],
        [1, 82, 7]
      ],
      white: [[212, 0, 100]]
    } as ColorChart
  }

  /**
   * Defines the current computed Document styles that have been defined after
   * a Document Stylesheet is assigned.
   */
  computedDocument?: ReturnType<typeof getComputedStyle>

  /**
   * Generates semantic custom properties for the relative space values defined
   * from  the initial document font size. Each sppace value is multiplied by
   * the defined delta and maximum screen size.
   *
   * @param delta Defines the amount of space values to generate: (size / delta).
   * @param unit Use the optional CSS unit instead of the default.
   */
  public assignBoxModelStylesheet(delta = 4, unit = 'rem') {
    const base = Math.round(Math.max(screen.width, screen.height) * devicePixelRatio) * 2
    const size = parseInt(getComputedStyle(document.documentElement).fontSize)

    const sheet: string[] = []

    const spaces = Array.from({ length: base / delta }).forEach((_, index) => {
      sheet.push(`--space-${index * delta}: ${(1 / size) * delta * index}${unit};`)
    })

    // Also include the smaller space values from the defined delta value.
    Array.from({ length: delta * 4 }).forEach((_, index) => {
      const space = `--space-${index + 1}: ${(1 / size) * (index + 1)}${unit};`

      if (sheet.includes(space)) {
        return
      }

      sheet.push(space)
    })

    const boxModelStylesheet = new CSSStyleSheet()
    boxModelStylesheet.replaceSync(`
      :root {
        ${sheet.join('\n')}
      }
    `)

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, boxModelStylesheet]
  }

  /**
   * Generates and assignes the default Color stylesheet that contains the
   * color, accents & neutral custom properties.
   *
   * @param colors Generates the color values from the defined ColorChart
   * @param type Use the defined CSS color function
   * @param delta Applies opacity values from the defined delta value for each
   * color & accent.
   */
  public assignColorStylesheet(colors: ColorChart, options?: ColorOptions) {
    if (!colors) {
      return
    }

    const { accent, delta, neutral, type } = options || {}
    const colorType = type || 'hsl'
    const opacityDelta = delta || 0

    const sheet: string[] = []

    const channels = Array.from({
      length: opacityDelta ? EnlightenmentTheme.COLORBASE / opacityDelta : 0
    })

    const chart = Object.keys(colors).map((color) => {
      const shades = colors[color]

      if (!shades.length) {
        return
      }

      return shades.forEach((shade, index) => {
        let weight = ''

        if (EnlightenmentTheme.colorWeights[index] && shades.length > 1) {
          weight = `-${EnlightenmentTheme.colorWeights[index]}`
        }

        if (typeof shade === 'string' || Object.values(shade).length === 1) {
          sheet.push(`--${color}${weight}: ${shade};`)
          if (accent === color) {
            sheet.push(`--accent${weight}: ${shade};`)
          }

          return
        }

        if (['hsl'].includes(colorType)) {
          const [h, s, l] = shade

          sheet.push(`--${color}${weight}: ${colorType}(${h}, ${s}%, ${l}%);`)

          sheet.push(
            ...channels.map((channel, index) =>
              index
                ? `--${color}${weight}-a${
                    index * opacityDelta
                  }: ${colorType}a(${h}, ${s}%, ${l}%, ${
                    Math.round(
                      (1 / EnlightenmentTheme.COLORBASE) *
                        opacityDelta *
                        index *
                        EnlightenmentTheme.COLORBASE
                    ) / EnlightenmentTheme.COLORBASE
                  });`
                : ''
            )
          )
        } else if (['rgb'].includes(colorType)) {
          const [r, g, b] = shade

          sheet.push(`--${color}${weight}: ${colorType}(${r}, ${g}, ${b});`)

          sheet.push(
            ...channels.map((channel, index) =>
              index
                ? `--${color}${weight}-a${index * opacityDelta}: ${colorType}a(${r}, ${g}, ${b}, ${
                    Math.round(
                      (1 / EnlightenmentTheme.COLORBASE) *
                        opacityDelta *
                        index *
                        EnlightenmentTheme.COLORBASE
                    ) / EnlightenmentTheme.COLORBASE
                  });`
                : ''
            )
          )
        }

        if (accent === color) {
          sheet.push(`--accent${weight}: var(--${color}${weight});`)

          sheet.push(
            ...channels.map((channel, index) =>
              index
                ? `--accent${weight}-a${index * opacityDelta}: var(--${color}${weight}-a${
                    index * opacityDelta
                  });`
                : ''
            )
          )
        } else if (neutral === color) {
          sheet.push(`--neutral${weight}: var(--${color}${weight});`)
        }
      })
    })

    if (!sheet.length) {
      return sheet
    }

    const colorStylesheet = new CSSStyleSheet()
    colorStylesheet.replaceSync(`
      :root {
        ${sheet.join('\n')}
      }
    `)

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, colorStylesheet]

    if (document.documentElement) {
      this.computedDocument = getComputedStyle(document.documentElement)
    }

    return sheet
  }

  /**
   * Assigns the static Document stylesheet to current page.
   */
  public assignDocumentStylesheet() {
    const documentStylesheet = new CSSStyleSheet()

    documentStylesheet.replaceSync(EnlightenmentTheme.document)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, documentStylesheet]

    if (document.documentElement) {
      this.computedDocument = getComputedStyle(document.documentElement)
    }
  }

  /**
   * Creates a new Component stylesheet and assign it to the defined context.
   *
   * @param context Assigns the stylesheet to the defined context Element.
   */
  public assignDefaultStylesheet(context: Element) {
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

  /**
   * Updates the current accent color properties for the defined context.
   *
   * @param context Assigns the new accent properties to the defined component.
   * @param value Use the defined value as accent name.
   * @param delta Updates the opacity channels for the defined accent when
   * defined.
   */
  public useAccent(context: HTMLElement, value?: string, delta?: number) {
    if (!context || !value || !this.useColor(value)) {
      return
    }

    EnlightenmentTheme.colorWeights.forEach((weight) => {
      context.style.setProperty(`--accent-${weight}`, `var(--${value}-${weight})`)

      if (delta) {
        const channels = Array.from({
          length: delta ? EnlightenmentTheme.COLORBASE / delta : 0
        })

        channels.forEach((channel, index) => {
          index &&
            context.style.setProperty(
              `--accent-${weight}-a${delta * index}`,
              `var(--${value}-${weight}-a${delta * index})`
            )
        })
      }
    })
  }

  /**
   * Ensures the defined color exists within the default color Chart.
   *
   * @param color Will use the given color when defined.
   */
  useColor(color: string | null) {
    if (!color || !Object.keys(EnlightenmentTheme.colorChart.colors).includes(color)) {
      return
    }

    return color
  }

  /**
   * Updates the current neutral color properties for the defined context.
   *
   * @param context Assigns the new neutral properties to the defined component.
   * @param value Use the defined value as neutral name.
   */
  useNeutral(context: HTMLElement, value?: string) {
    if (!context || !value || !this.useColor(value)) {
      return
    }

    EnlightenmentTheme.colorWeights.forEach((weight) => {
      context.style.setProperty(`--neutral-${weight}`, `var(--${value}-${weight})`)
    })
  }
}
