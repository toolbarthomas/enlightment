import { css } from 'lit'

// Type definition that defines a color value without any units.
export type ThemeColorTint = string | [number, number, number]

// Contains the configuration to generate the actual color chart with the
// required colors, shades and optional opacity variants.
export type ThemeColorChart = { [key: string]: ThemeColorTint[] }

// Use the correct css value from the defined type value within the generated
// Color Chart.
export type ThemeColorType = 'hex' | 'hsl' | 'rgb'

export type ThemeStackingContext = {
  depth: string | number
  shadow: number
}

export type ThemStackingContexts = { [key: string]: ThemeStackingContext }

/**
 * The actual configuration used while generatenig a new Color Chart.
 */
export type ThemeColorOptions = {
  // Use the defined CSS value type instead of the default.
  type?: ThemeColorType

  // Create the neutral tints without opacity variants.
  neutral?: string

  // Create the accent tins with opacity variants if ThemeColorOptions['delta']
  // is defined.
  accent?: string

  // Generates the optional opacity values for the default and accent colors.
  delta?: number
}

/**
 * Exposes the default Component & Document styles for each Enlightenment
 * Component without assigning it to the Component styles static.
 */
export class EnlightenmentTheme {
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
   * Global Keyframe definition that could be used within the component context.
   */
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
   * The delta between each increase of custom properties with matchin names.
   */
  static BASE_DELTA = 4

  /**
   * Fixes value that is used to define the amount of channels.
   */
  static BASE_PERCENTAGE = 100

  /**
   * Defines the default CSS unit to use.
   */
  static BASE_UNIT = 'rem'

  /**
   * Semantic color values that is used for a single tint. The defined weights
   * will be used in the generated color chart.
   */
  static COLOR_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

  /**
   * Defines the default Device widths in pixels that are used within the
   * optional CSS Media query. Pixel value is expected to ensure full browser
   * support.
   */
  static breakpoints = {
    handheld: 320,
    smartphone: 480,
    tablet: 768,
    desktop: 1024,
    widescreen: 1280,
    ultrawide: 1600
  }

  /**
   * Defines the default Color Chart Object that is used within the color
   * Stylesheet.
   */
  static colorChart = {
    type: 'hsl' as ThemeColorType,
    delta: 5,
    accent: 'blue',
    neutral: 'grey',
    colors: {
      magenta: [
        [354, 88, 94],
        [354, 82, 86],
        [354, 82, 78],
        [354, 82, 70],
        [355, 82, 63],
        [356, 82, 55],
        [356, 82, 39],
        [356, 82, 29],
        [356, 94.34, 17]
      ],
      red: [
        [12, 70.66, 88],
        [13, 74, 73],
        [13, 74, 66],
        [13, 74, 61],
        [13, 79, 56],
        [13, 79, 51],
        [13, 79, 44],
        [14, 79, 36],
        [15, 80, 28]
      ],
      orange: [
        [42, 98, 90],
        [35, 98, 84],
        [35, 98, 76],
        [35, 98, 68],
        [36, 98, 60],
        [37, 98, 52],
        [37, 94, 44],
        [35, 92, 36],
        [34, 91, 28]
      ],
      yellow: [
        [60, 98, 92],
        [49, 95, 86],
        [50, 95, 78],
        [50, 95, 71],
        [51, 95, 63],
        [52, 95, 56],
        [52, 95, 46],
        [53, 95, 38],
        [51, 92, 34]
      ],
      lime: [
        [78, 86.66, 93],
        [79, 84, 88],
        [80, 84, 83],
        [80, 84, 77],
        [81, 84, 72],
        [82, 82, 67],
        [82, 82, 58],
        [83, 80, 42],
        [83, 79, 33]
      ],
      green: [
        [138, 72.66, 89],
        [139, 70, 83],
        [140, 70, 74],
        [140, 70, 64],
        [141, 70, 55],
        [142, 70, 45],
        [142, 70, 32],
        [143, 70, 20],
        [144, 69, 14]
      ],
      teal: [
        [168, 68.66, 93],
        [169, 66, 84],
        [170, 66, 76],
        [170, 66, 67],
        [171, 66, 59],
        [172, 66, 50],
        [172, 66, 36],
        [173, 66, 21],
        [173, 62, 14]
      ],
      cyan: [
        [184, 88.66, 93],
        [185, 86, 85],
        [186, 86, 77],
        [186, 86, 69],
        [187, 86, 61],
        [187, 86, 53],
        [188, 82, 48],
        [188, 82, 42],
        [190, 82, 34]
      ],
      blue: [
        [211, 100, 96],
        [212, 100, 90],
        [212, 100, 80],
        [212, 94, 71],
        [212, 94, 63],
        [213, 94, 56],
        [213, 94, 40],
        [216, 80, 30],
        [219, 70, 21]
      ],
      indigo: [
        [217, 81, 93],
        [217, 84, 88],
        [218, 84, 83],
        [218, 84, 77],
        [219, 84, 72],
        [219, 86, 67],
        [219, 88, 61],
        [222, 62, 48],
        [220, 78, 30]
      ],
      violet: [
        [235, 86.66, 93],
        [236, 84, 88],
        [237, 84, 83],
        [237, 84, 77],
        [238, 84, 72],
        [239, 84, 67],
        [241, 66, 58],
        [250, 72, 44],
        [255, 80, 28]
      ],
      purple: [
        [267, 83.66, 93],
        [268, 81, 86],
        [269, 81, 78],
        [269, 81, 71],
        [270, 81, 63],
        [271, 81, 56],
        [271, 81, 40],
        [272, 81, 23],
        [272, 78.34, 14]
      ],
      pink: [
        [325, 88.66, 93],
        [326, 86, 88],
        [327, 86, 84],
        [327, 86, 79],
        [328, 86, 75],
        [329, 86, 70],
        [329, 86, 49],
        [330, 86, 34],
        [331, 83.34, 28]
      ],
      dawn: [
        [208, 22, 98],
        [209, 20, 96],
        [210, 20, 94],
        [210, 20, 93],
        [210, 20, 90],
        [211, 20, 88],
        [227, 20, 78],
        [224, 12, 68],
        [222, 2, 49]
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
      brown: [
        [29, 29.66, 93],
        [30, 27, 84],
        [31, 27, 76],
        [31, 27, 67],
        [32, 27, 59],
        [33, 27, 50],
        [33, 27, 36],
        [34, 27, 21],
        [34, 24.34, 14]
      ],
      black: [[212, 0, 0]],
      white: [[212, 0, 100]]
    } as ThemeColorChart
  }

  /**
   * Defines the current computed Document styles that have been defined after
   * a Document Stylesheet is assigned.
   */
  computedDocument?: ReturnType<typeof getComputedStyle>

  /**
   * Defines the depth related properties like z-index, shadows & lightning.
   * These will be defined as custom properties within the Component context.
   */
  static stackingContext: ThemStackingContexts = {
    surface: {
      depth: 'auto',
      shadow: 0.25
    },
    foreground: {
      depth: 100,
      shadow: 0.625
    },
    overlay: {
      depth: 300,
      shadow: 1.375
    },
    fixed: {
      depth: 700,
      shadow: 0.875
    }
  }

  /**
   * Generates and assignes the default Color stylesheet that contains the
   * color, accents & neutral custom properties.
   *
   * @param colors Generates the color values from the defined ThemeColorChart
   * @param type Use the defined CSS color function
   * @param delta Applies opacity values from the defined delta value for each
   * color & accent.
   */
  public assignColorStylesheet(colors: ThemeColorChart, options?: ThemeColorOptions) {
    if (!colors) {
      return
    }

    const { accent, delta, neutral, type } = options || {}
    const colorType = type || 'hsl'
    const opacityDelta = delta || 0

    const sheet: string[] = []

    const channels = Array.from({
      length: opacityDelta ? EnlightenmentTheme.BASE_PERCENTAGE / opacityDelta : 0
    })

    const chart = Object.keys(colors).map((color) => {
      const shades = colors[color]

      if (!shades.length) {
        return
      }

      return shades.forEach((shade, index) => {
        let weight = ''

        if (EnlightenmentTheme.COLOR_WEIGHTS[index] && shades.length > 1) {
          weight = `-${EnlightenmentTheme.COLOR_WEIGHTS[index]}`
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
                      (1 / EnlightenmentTheme.BASE_PERCENTAGE) *
                        opacityDelta *
                        index *
                        EnlightenmentTheme.BASE_PERCENTAGE
                    ) / EnlightenmentTheme.BASE_PERCENTAGE
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
                      (1 / EnlightenmentTheme.BASE_PERCENTAGE) *
                        opacityDelta *
                        index *
                        EnlightenmentTheme.BASE_PERCENTAGE
                    ) / EnlightenmentTheme.BASE_PERCENTAGE
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

    return this.assignDocumentProperties(sheet)
  }

  public assignDocumentProperties(rules?: string | string[]) {
    const data = Array.isArray(rules) ? rules : [rules]

    const stylesheet = new CSSStyleSheet()
    stylesheet.replaceSync(`:root {
      ${[...new Set(rules)].join('\n')}
    }`)

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet]

    return stylesheet
  }

  public assignElevationProperties(context: ThemStackingContexts) {
    const rules: string[] = []

    Object.entries(context).forEach(([name, entry]) => {
      const { depth, shadow } = entry

      if (depth !== undefined) {
        rules.push(`--depth-${name}: ${depth};`)
      }

      if (shadow !== undefined) {
        rules.push(`--shadow-${name}: 0 ${shadow}rem ${shadow * 2}rem;`)
        rules.push(`--edge-${name}: 0 ${shadow}rem ${shadow / 2}rem -${shadow / 2}rem;`)
      }
    })

    this.assignDocumentProperties(rules)
  }

  public assignSpaceProperties(
    delta = EnlightenmentTheme.BASE_DELTA,
    unit = EnlightenmentTheme.BASE_UNIT
  ) {
    if (!this.computedDocument) {
      this.computedDocument = getComputedStyle(document.documentElement)
    }

    const rules: string[] = []
    const size = Math.round(Math.max(screen.width, screen.height) * devicePixelRatio)
    const length = size / delta + 1
    const fontSize = parseInt(this.computedDocument && this.computedDocument.fontSize)

    Array.from({ length: 16 }).forEach((_, index) => {
      rules.push(`--space-${index + 1}: ${(1 / fontSize) * (index + 1)}${unit};`)
    })

    Array.from({
      length
    }).forEach((_, index) => {
      rules.push(`--space-${index * delta}: ${(1 / fontSize) * delta * index}${unit};`)
    })

    this.assignDocumentProperties(rules)
  }

  /**
   * Assigns the static Document stylesheet to current page.
   */
  public assignDefaultStyleSheets() {
    const raw = [EnlightenmentTheme.document, EnlightenmentTheme.keyframes]

    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      ...raw.map((value: string) => {
        const sheet = new CSSStyleSheet()

        sheet.replaceSync(value)

        return sheet
      })
    ]
  }

  /**
   * Creates a new Component stylesheet and assign it to the defined context.
   *
   * @param context Assigns the stylesheet to the defined context Element.
   */
  public assignComponentStylesheets(context: HTMLElement) {
    if (!context || !context.shadowRoot) {
      return
    }

    const componentStylesheet = new CSSStyleSheet()
    componentStylesheet.replaceSync(EnlightenmentTheme.component)

    context.shadowRoot.adoptedStyleSheets = [
      ...context.shadowRoot.adoptedStyleSheets,
      componentStylesheet
    ]

    return componentStylesheet
  }

  /**
   * Assigns the required meta tags to ensure the components are displayed
   * correctly.
   */
  public assignViewport() {
    const viewport = this.useMeta({
      content: 'width=device-width, initial-scale=1.0',
      name: 'viewport'
    })

    viewport && document.head.insertAdjacentElement('afterbegin', viewport)

    const charset = this.useMeta({
      charset: 'utf-8'
    })
    charset && document.head.insertAdjacentElement('afterbegin', charset)
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

    const sheet: string[] = []

    EnlightenmentTheme.COLOR_WEIGHTS.forEach((weight) => {
      // context.style.setProperty()e
      sheet.push(`--accent-${weight}: var(--${value}-${weight});`)

      if (delta) {
        const channels = Array.from({
          length: delta ? EnlightenmentTheme.BASE_PERCENTAGE / delta : 0
        })

        channels.forEach((channel, index) => {
          index &&
            sheet.push(
              `--accent-${weight}-a${delta * index}: var(--${value}-${weight}-a${delta * index});`
            )
        })
      }
    })

    return sheet
  }

  /**
   * Ensures the defined color exists within the default color Chart.
   *
   * @param color Will use the given color when defined.
   */
  useColor(color: string | null) {
    if (!color) {
      return
    }

    if (!Object.keys(EnlightenmentTheme.colorChart.colors).includes(color)) {
      return
    }

    return color
  }

  useColorChart(handler?: (color: string, value: ThemeColorTint) => any) {
    if (typeof handler !== 'function') {
      return
    }

    return Object.keys(EnlightenmentTheme.colorChart.colors).map((color) => {
      return EnlightenmentTheme.colorChart.colors[color].map((value) => handler(color, value))
    })

    return EnlightenmentTheme.colorChart.colors || []
  }

  /**
   * Creates a new meta element if the initial element does not exists and
   * assign any optional property to it.
   *
   * @param props Assignes any string value property to the initial meta
   * element.
   */
  public useMeta(props: { [key: string]: string }) {
    const { name } = props || {}

    let meta: null | HTMLMetaElement = document.querySelector(`meta[name="${name}"]`)

    if (meta) {
      return
    }

    meta = document.createElement('meta')

    Object.keys(props || {})
      .reverse()
      .forEach((key) => {
        meta && meta.setAttribute(key, props[key])
      })

    return meta
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

    const sheet: string[] = []

    EnlightenmentTheme.COLOR_WEIGHTS.forEach((weight) => {
      sheet.push(`--neutral-${weight}: var(--${value}-${weight});`)
    })

    return sheet
  }
}
