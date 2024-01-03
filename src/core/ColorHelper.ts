import { EnlightenmentImageHelper } from './ImageHelper'
import { property } from './Mixins'

import { EnlightenmentTheme } from '../providers/Theme'

export class EnlightenmentColorHelper extends EnlightenmentImageHelper {
  /**
   * Ensures the given value is a valid mode value.
   *
   * @param value The initial value to validate.
   */
  static isMode(value: any) {
    return EnlightenmentColorHelper.filterPropertyValue(value, EnlightenmentTheme.COLOR_MODES)
  }

  /**
   * Enables the global & component constructed Stylesheets from the actual
   * constructed Enlightenment instance.
   */
  static theme = new EnlightenmentTheme()

  /**
   * Generates the optional [accent] color for the defined Component.
   */
  @property({
    converter: (value) => EnlightenmentColorHelper.theme.useColor(value),
    type: String
  })
  accent?: string

  /**
   * Defines the lightning mode (DARK/LIGHT) for the initial Component.
   */
  @property({
    converter: (value) => EnlightenmentColorHelper.isMode(value),
    type: String
  })
  mode?: string

  /**
   * Generates the optional [neutral] color for the defined Component.
   */
  @property({
    converter: (value) => EnlightenmentColorHelper.theme.useColor(value),
    type: String
  })
  neutral?: string

  /**
   * Contains the references of the created custom CSSStyleSheet of the defined
   * Component instance.
   */
  customStyleSheet?: CSSStyleSheet

  /**
   * Keep track of the updated custom Stylesheet to prevent StyleSheet unchanged
   * updates.
   */
  customStyleSheetCache?: string

  /**
   * Expose the constructed Component stylesheet in order to update it within
   * a lifecycle Event.
   *
   * @param sheet The stylesheet that was defined for the defined component.
   */
  protected assignCustomStyleSheet(sheet: CSSStyleSheet) {
    if (!sheet) {
      return
    }

    if (sheet instanceof CSSStyleSheet === false) {
      this.log(
        `Unable to assign custom stylesheet '${this.uuid}' without a valid CSSStyleSheet`,
        'warning'
      )

      return
    }

    this.customStyleSheet = sheet

    this.log(['Custom stylesheet assigned:', this.uuid], 'log')
  }

  /**
   * Ensures the Component Theme can be updated from Host components.
   *
   * @param properties
   */
  protected firstUpdated(properties: any): void {
    super.firstUpdated(properties)

    this.throttle(this.useMode)
  }

  /**
   * Update callback for the defined custom StyleSheet of the rendered Element
   * that will update the currently defined Custom Stylesheet that has been
   * assigned after the initial Component styles.
   */
  protected updateCustomStyleSheet() {
    const accents = EnlightenmentColorHelper.theme.useAccent(
      this,
      this.accent,
      EnlightenmentTheme.colorChart.delta
    )

    const neutrals = EnlightenmentColorHelper.theme.useNeutral(this, this.neutral)

    // Only update if there are any accents or neutral values to use.
    if (accents && neutrals && !accents.length && !neutrals.length) {
      return
    }

    const sheet = this.customStyleSheet

    if (!sheet || sheet instanceof CSSStyleSheet === false) {
      return
    }

    const style = `
      ${EnlightenmentTheme.component}

      :host {
        ${accents && accents.join('\n')}
        ${neutrals && neutrals.join('\n')}
      }
    `

    if (this.customStyleSheetCache && this.customStyleSheetCache === style) {
      return
    }

    this.customStyleSheetCache = style

    sheet.replaceSync(style)
  }

  /**
   * Defines the mode attribute for the defined element that inherits the
   * specified mode value from the global state as default value otherwise.
   *
   * @param context Traverse from the optional context Element.
   *
   */
  protected useMode(context?: Element, instance?: any) {
    const { mode } = EnlightenmentColorHelper.globals
    const target = (context || this) as any
    const host = this.useHost(target) as EnlightenmentColorHelper

    if (!this.mode) {
      this.mode = EnlightenmentColorHelper.globals.mode

      this.log(`Use fallback mode: ${this.mode}`, 'log')
    }

    if (!this.hasAttribute('mode') && host) {
      const inheritMode = EnlightenmentColorHelper.isMode(host.getAttribute('mode'))

      if (!inheritMode) {
        // Ensure the unconstructed parent element is ready before we traverse
        // upwards.
        this.throttle(() => {
          host.useMode && host.useMode(this, instance)
        })

        return
      }

      if (inheritMode && this.mode !== inheritMode) {
        target.mode = inheritMode

        // Update the inherited mode value as actual HTML attribute in order to
        // apply the actual CSS styles.
        target.mode && target.setAttribute('mode', target.mode)
      } else if (this.mode === undefined) {
        this.mode = mode || EnlightenmentColorHelper.globals.mode
      }
    } else if (!this.mode && mode && this.mode !== mode) {
      this.mode = mode
    } else if (
      context &&
      context !== this &&
      this.hasAttribute('mode') &&
      !context.hasAttribute('mode')
    ) {
      target.mode = this.mode
      this.mode && target.setAttribute('mode', this.mode)
    }
  }
}
