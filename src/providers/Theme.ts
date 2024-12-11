import { css } from 'lit'

/**
 * Type definition for the Breakpoint schematic.
 */
export type ThemeBreakpoints = { [key: string]: number }

/**
 * Type definition that defines a color value without any units.
 */
export type ThemeColorTint = string | [number, number, number]

/**
 * Type definition for the Breakpoint schematic.
 */
export type ThemeEasingBezier = [number, number, number, number]
export type ThemeEasingChart = {
  linear: ThemeEasingBezier
  ease: ThemeEasingBezier
  easeIn: ThemeEasingBezier
  easeOut: ThemeEasingBezier
  easeInOut: ThemeEasingBezier
  easeInQuad: ThemeEasingBezier
  easeInCubic: ThemeEasingBezier
  easeInQuart: ThemeEasingBezier
  easeInQuint: ThemeEasingBezier
  easeInSine: ThemeEasingBezier
  easeInExpo: ThemeEasingBezier
  easeInCirc: ThemeEasingBezier
  easeInBack: ThemeEasingBezier
  easeOutQuad: ThemeEasingBezier
  easeOutCubic: ThemeEasingBezier
  easeOutQuart: ThemeEasingBezier
  easeOutQuint: ThemeEasingBezier
  easeOutSine: ThemeEasingBezier
  easeOutExpo: ThemeEasingBezier
  easeOutCirc: ThemeEasingBezier
  easeOutBack: ThemeEasingBezier
  easeInOutQuad: ThemeEasingBezier
  easeInOutCubic: ThemeEasingBezier
  easeInOutQuart: ThemeEasingBezier
  easeInOutQuint: ThemeEasingBezier
  easeInOutSine: ThemeEasingBezier
  easeInOutExpo: ThemeEasingBezier
  easeInOutCirc: ThemeEasingBezier
  easeInOutBack: ThemeEasingBezier
}

export type ThemeTimingChart = {
  default: number
  fast: number
  faster: number
  instant: number
  slow: number
  slower: number
}

/**
 * Contains the configuration to generate the actual color chart with the
 * required colors, shades and optional opacity variants.
 */
export type ThemeColorChart = { [key: string]: ThemeColorTint[] }

/**
 * Expected Interface of an existing Color Chart value that is compared
 * from a hue, saturation and lightness values.
 */
export type ThemeColorMatch = {
  color: string
  hueDelta: number
  lightnessDelta: number
  weight: number
  saturationDelta: number
  value: ThemeColorTint
}

/**
 * Use the correct css value from the defined type value within the generated
 * Color Chart.
 */
export type ThemeColorType = 'hex' | 'hsl' | 'rgb'

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
 * Expected structure of a stacking context subscription that used for
 * generating the stacking context custom properties like z-index & shadow
 * distances.
 */
export type ThemeStackingContext = {
  depth: string | number
  shadow: number
}

/**
 * Contains the subscriptions of all Stacking Context entries.
 */
export type ThemStackingContexts = { [key: string]: ThemeStackingContext }

/**
 * Exposes the default Component & Document styles for each Enlightenment
 * Component without assigning it to the Component styles static.
 */
export class EnlightenmentTheme {
  /**
   * Default component utility styles that is included for each Component.
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

    [visually-hidden],
    [visually-hidden]::slotted(:first-child) {
      visibility: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }
  ` as unknown as string

  /**
   * Defines the default document styles.
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

    *[accent]:not([ready]),
    *[neutral]:not([ready]) {
      visibility: hidden;
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
   * Defines the available color mode for the Component.
   */
  static COLOR_MODES = ['light', 'dark']

  /**
   * Display the Compponent in left-to-right or right-to-left direction.
   */
  static DIRECTIONS = ['ltr', 'rtl']

  /**
   * Defines the expected usable webfont style should load the correct font-face
   * declarations.
   */
  static FONT_FORMATS = ['monospace', 'sans', 'serif']

  /**
   * Defines the default Device widths in pixels that are used within the
   * optional CSS Media query. Pixel value is expected to ensure full browser
   * support.
   */
  static breakpoints: ThemeBreakpoints = {
    handheld: 320,
    smartphone: 480,
    tablet: 640,
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
        [346, 82, 55],
        [340, 82, 39],
        [337, 90.34, 32],
        [331, 82, 27]
      ],
      red: [
        [6, 78.66, 88],
        [7, 78.66, 72],
        [8, 82, 66],
        [8, 82, 59],
        [8, 82, 54],
        [10, 83, 49],
        [14, 83, 43],
        [18, 83, 39],
        [11, 90, 30]
      ],
      orange: [
        [37, 82, 90],
        [30, 82, 84],
        [30, 82, 76],
        [30, 82, 68],
        [31, 82, 60],
        [32, 82, 56],
        [32, 80, 50],
        [30, 78, 44],
        [24, 82, 36]
      ],
      yellow: [
        [60, 98, 92],
        [49, 95, 86],
        [50, 95, 78],
        [50, 95, 71],
        [51, 99, 68],
        [52, 95, 56],
        [47, 91, 52],
        [40, 90, 48],
        [35, 85, 42]
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
        [140, 72.66, 94],
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
        [172, 68.66, 90],
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

  static easingChart: ThemeEasingChart = {
    linear: [0.25, 0.25, 0.75, 0.75],
    ease: [0.25, 0.1, 0.25, 1.0],
    easeIn: [0.42, 0.0, 1.0, 1.0],
    easeOut: [0.0, 0.0, 0.58, 1.0],
    easeInOut: [0.42, 0.0, 0.58, 1.0],
    easeInQuad: [0.55, 0.085, 0.68, 0.53],
    easeInCubic: [0.55, 0.055, 0.675, 0.19],
    easeInQuart: [0.895, 0.03, 0.685, 0.22],
    easeInQuint: [0.755, 0.05, 0.855, 0.06],
    easeInSine: [0.47, 0.0, 0.745, 0.715],
    easeInExpo: [0.95, 0.05, 0.795, 0.035],
    easeInCirc: [0.6, 0.04, 0.98, 0.335],
    easeInBack: [0.6, -0.28, 0.735, 0.045],
    easeOutQuad: [0.25, 0.46, 0.45, 0.94],
    easeOutCubic: [0.215, 0.61, 0.355, 1.0],
    easeOutQuart: [0.165, 0.84, 0.44, 1.0],
    easeOutQuint: [0.23, 1.0, 0.32, 1.0],
    easeOutSine: [0.39, 0.575, 0.565, 1.0],
    easeOutExpo: [0.19, 1.0, 0.22, 1.0],
    easeOutCirc: [0.075, 0.82, 0.165, 1.0],
    easeOutBack: [0.175, 0.885, 0.32, 1.275],
    easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
    easeInOutCubic: [0.645, 0.045, 0.355, 1.0],
    easeInOutQuart: [0.77, 0.0, 0.175, 1.0],
    easeInOutQuint: [0.86, 0.0, 0.07, 1.0],
    easeInOutSine: [0.445, 0.05, 0.55, 0.95],
    easeInOutExpo: [1.0, 0.0, 0.0, 1.0],
    easeInOutCirc: [0.785, 0.135, 0.15, 0.86],
    easeInOutBack: [0.68, -0.55, 0.265, 1.55]
  }

  static timingChart: ThemeTimingChart = {
    instant: 0,
    default: 144,
    fast: 60,
    faster: Math.round(1000 / 0.6) / 100,
    slow: 250,
    slower: 625
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

  public assignEasingProperties() {
    const rules: string[] = []

    Object.entries(EnlightenmentTheme.easingChart).forEach(([key, bezier]) => {
      const name = key
        .split(/(?<![A-Z])(?=[A-Z])/)
        .join('-')
        .toLowerCase()

      if (name && name.length) {
        name && rules.push(`--${name}: cubic-bezier(${bezier.join(', ')});`)
      }
    })

    if (!rules.length) {
      return
    }

    this.assignDocumentProperties(rules)
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

    if (!rules.length) {
      return
    }

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

    if (!rules.length) {
      return
    }

    this.assignDocumentProperties(rules)
  }

  public assignTimingProperties() {
    const rules: string[] = []

    Object.entries(EnlightenmentTheme.timingChart).forEach(([name, value]) => {
      rules.push(`--timing-${name}: ${value}ms;`)
    })

    if (!rules.length) {
      return
    }

    this.assignDocumentProperties(rules)
  }

  /**
   * Assigns the static Document stylesheet to current page.
   */
  public assignDefaultStyleSheets() {
    const raw = [EnlightenmentTheme.document]

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
   * Creates a new Component stylesheet with the required CSS styles that are
   * not available from the Shadow DOM context.
   *
   * @param context Assigns the stylesheet to the defined context Element.
   */
  public assignComponentStyleSheet(context: HTMLElement) {
    if (!context || !context.shadowRoot) {
      return
    }

    const componentStylesheet = new CSSStyleSheet()
    componentStylesheet.replaceSync([EnlightenmentTheme.component].join('\n'))

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
    if (!document.querySelector('meta[name=viewport]')) {
      const viewport = this.useMeta({
        content: 'width=device-width, initial-scale=1.0',
        name: 'viewport'
      })

      viewport && document.head.insertAdjacentElement('afterbegin', viewport)
    }

    if (!document.querySelector('meta[charset]')) {
      const charset = this.useMeta({
        charset: 'utf-8'
      })

      charset && document.head.insertAdjacentElement('afterbegin', charset)
    }
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

    const hsl = color.split(',')
    const colors = Object.keys(EnlightenmentTheme.colorChart.colors)

    // Accepts HSL compatible color values.
    if (hsl.length > 1 || parseInt(color)) {
      const h = parseInt(hsl[0])
      const s = parseFloat(hsl[1]) || undefined
      const l = parseFloat(hsl[2]) || undefined

      const theme = (this.useColorFrom(h, s, l, true) || {}) as ThemeColorMatch

      if (theme.color && colors.includes(theme.color)) {
        return theme.color
      }
    }

    if (!colors.includes(color)) {
      return
    }

    return color
  }

  /**
   * Iterator to process through the defined Colors.
   *
   * @param handler The handler to use within the iterator.
   */
  useColorChart(handler?: (color: string, value: ThemeColorTint, index: number) => any) {
    if (typeof handler !== 'function') {
      return
    }

    return Object.keys(EnlightenmentTheme.colorChart.colors).map((color) => {
      return EnlightenmentTheme.colorChart.colors[color].map((value, index) =>
        handler(color, value, index)
      )
    })

    return EnlightenmentTheme.colorChart.colors || []
  }

  /**
   * Returns the closest matching color Chart value from the defined hue,
   * saturation or lightness values.
   *
   * The function returns the nearest values by default or the actual selection
   * with the mentioned values, color name and weight.
   *
   * @param hue Compares the defined hue value from the current color Chart.
   * @param saturation Sort the nearest values by saturation defined.
   * @param lightness Sort the nearest values by lightness when defined.
   * @param useSelection Returns the color name, weight and actual value when
   * TRUE
   */
  useColorFrom(hue: number, saturation?: number, lightness?: number, useSelection?: boolean) {
    // Only accept colors that are within the color radius threshold.
    const threshold =
      Math.round((360 / Object.keys(EnlightenmentTheme.colorChart.colors).length) * 100) / 100

    // Should contain any color within the defined threshold.
    const colors: ThemeColorMatch[] = []

    // Should contain any color within the double defined threshold value.
    const fallback: ThemeColorMatch[] = []

    this.useColorChart((color, value, index) => {
      if (typeof value === 'string') {
        return
      }

      const [h, s, l] = value

      if (h === undefined || s === undefined || l === undefined) {
        return
      }

      const hueDelta = Math.abs(hue - h)
      const saturationDelta = Math.abs((saturation || 0) - s) || 0
      const lightnessDelta = Math.abs((lightness || 0) - l) || 0

      if (saturation) {
        if (saturationDelta >= 50) {
          return
        }
      }

      const candidate: ThemeColorMatch = {
        color,
        hueDelta,
        lightnessDelta,
        value,
        saturationDelta,
        weight: index * 100 + 100
      }

      if (hueDelta <= threshold) {
        colors.push(candidate)
      } else if (hueDelta <= threshold * 2) {
        fallback.push(candidate)
      }
    })

    if (!colors.length) {
      colors.push(...fallback)

      if (!colors.length) {
        return
      }
    }

    let entry = colors.sort((a, b) => (a.hueDelta >= b.hueDelta ? 1 : -1))

    if (lightness !== undefined) {
      entry = entry.sort((a, b) => (a.lightnessDelta >= b.lightnessDelta ? 1 : -1))
    } else if (saturation !== undefined) {
      entry = entry.sort((a, b) => (a.saturationDelta >= b.saturationDelta ? 1 : -1))
    }

    if (useSelection || !entry[0].value.length) {
      return entry[0]
    }

    return [entry[0].value[0], entry[0].value[1], entry[0].value[2]]
  }

  /**
   * Compares the defined HSL color value and returns the Theme color property
   * name.
   *
   * @param hue Compares the defined hue value from the current color Chart.
   * @param saturation Sort the nearest values by saturation defined.
   * @param lightness Sort the nearest values by lightness when defined.
   */
  useColorPropertyFrom(hue: number, saturation?: number, lightness?: number) {
    const color = this.useColorFrom(hue, saturation, lightness, true) as ThemeColorMatch

    if (!color) {
      return
    }

    return `--${color.color}-${color.weight}`
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
