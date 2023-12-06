import {
  css as _css,
  CSSResultGroup,
  LitElement as _LitElement,
  html as _html,
  nothing as _nothing,
  PropertyValues,
  PropertyValueMap,
  svg
} from 'lit'

import { customElement as _customElement, property as _property, query } from 'lit/decorators.js'
import { createRef as _createRef, ref as _ref, Ref } from 'lit/directives/ref.js'

export const createRef = _createRef
export const css = _css
export const customElement = _customElement
export const LitElement = _LitElement
export const html = _html
export const nothing = _nothing
export const property = _property
export const ref = _ref

export class EnlightenmentMixins extends LitElement {
  /**
   * Compares the defined values by typing and (nested) values.
   *
   * @param commit The first value to compare.
   * @param initial The second value to compare.
   */
  static compareValue(commit: any, initial: any) {
    try {
      if (typeof commit !== typeof initial) {
        return false
      }

      if (commit.length !== initial.length) {
        return false
      }

      if (Array.isArray(commit) && Array.isArray(initial)) {
        return Array.from(commit).every((value, index) =>
          EnlightenmentMixins.compareValue(value, initial[index])
        )
      }

      if (commit instanceof Object && initial instanceof Object) {
        return JSON.stringify(commit) === JSON.stringify(initial)
      }

      if (commit === initial) {
        return true
      }
    } catch (error) {
      if (error) {
        return false
      }
    }

    return false
  }

  /**
   * Converts the given string value as array with potential selectors.
   *
   * @param value Returns an Element Collection from the defined string value.
   */
  static convertToSelector(value: string | undefined) {
    if (typeof value !== 'string') {
      return []
    }

    return String(value)
      .split(',')
      .map((str) => {
        const selector = str.split(' ').join('')

        return document.getElementById(selector) || document.querySelector(selector)
      })
      .filter((e) => e !== null && e !== undefined) as HTMLElement[]
  }

  /**
   * Use the actual value that should include within the defined options
   * collection or return the first option as fallback value.
   *
   * @param value Return the value when defined in the options parameter.
   * @param options The options parameter to filter from.
   */
  static filterPropertyValue(value: string, options: string[]) {
    if (!value || !options || !options.length) {
      return
    }

    const [fallbackOption] = options

    if (typeof value !== 'string') {
      return fallbackOption
    }

    return options.includes(value) ? value : fallbackOption
  }

  /**
   * Returns a timestamp generated ID value in base64 format,
   * without validation.
   */
  static generateTimestampID() {
    return `uuid${btoa(
      (String(Date.now()).match(/.{1,2}/g) || [])
        .sort(() => Math.random() - 0.5)
        .map((c) => String.fromCharCode(parseInt(c)))
        .join('')
    )
      .replaceAll('=', '')
      .replaceAll('/', '')}`
  }

  /**
   * Parse the defined value as Boolean.
   *
   * @param value The value to parse as Boolean.
   */
  static isBoolean(value: any) {
    return value !== undefined && String(value) !== 'false' ? true : false
  }

  /**
   * Check if the defined URL value is an external URL by comparing the actual
   * hostname and Port number.
   *
   * @param value Compare the defined URL value.
   */
  static isExternalURL(value: any) {
    if (!value) {
      return false
    }

    const match = value.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/)

    if (!match) {
      return false
    }

    if (
      typeof match[1] === 'string' &&
      match[1].length > 0 &&
      match[1].toLowerCase() !== location.protocol
    ) {
      return true
    }

    if (
      typeof match[2] === 'string' &&
      match[2].length > 0 &&
      match[2].replace(
        new RegExp(':(' + { 'http:': 80, 'https:': 443 }[location.protocol] + ')?$'),
        ''
      ) !== location.host
    ) {
      return true
    }

    return false
  }

  /**
   * Parse the defined value as non floating Number value.
   * @param value The value to parse as Integer.
   */
  static isInteger(value: any) {
    return value && parseInt(value)
  }

  constructor() {
    super()
  }

  /**
   * Type reference to expose the method for all Class extensions.
   *
   * @param target The actual defined host element to return.
   */
  public useHost(target: any) {
    if (!target) {
      return
    }

    return target as EnlightenmentMixins
  }
}
