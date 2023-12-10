import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

import { EnlightenmentImageOptions } from 'src/_types/main'

import { EnlightenmentContext2D } from 'src/core/Context2D'
import { html, property } from 'src/core/Mixins'

export class EnlightenmentImageHelper extends EnlightenmentContext2D {
  /**
   * Defines the compatible image extensions for the renderImage method.
   */
  static imageExtensions = [
    '.apng',
    '.avif',
    '.bmp',
    '.gif',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.tiff',
    '.webp'
  ]

  /**
   * Enables the usage of an SVG spritesheet with the renderImage helper
   * methods.
   */
  @property({
    attribute: 'svg-sprite-source',
    converter: (value) =>
      EnlightenmentContext2D.resolveURL(EnlightenmentContext2D.strip(String(value)))
  })
  svgSpriteSource = ''

  constructor() {
    super()
  }

  /**
   * Validates if the given image source should be renderd as inline image when
   * TRUE or static image as default.
   *
   * @param source Expected source URL or Symbol reference to test.
   *
   */
  protected testImage(source: string) {
    if (
      !this.svgSpriteSource ||
      !this.testImageSource(this.svgSpriteSource) ||
      this.testImageSource(source)
    ) {
      return false
    }

    if (this.svgSpriteSource && source) {
      if (
        this.testImageSource(this.svgSpriteSource) &&
        this.testImageSource(EnlightenmentImageHelper.strip(source))
      ) {
        return false
      }

      return true
    }

    return false
  }

  /**
   * Validates if the defined source URL is a valid image path.
   *
   * @param source Expected URL source to test.
   */
  protected testImageSource(source: string) {
    if (typeof source !== 'string') {
      return
    }

    let result = false

    EnlightenmentImageHelper.imageExtensions.forEach((extension) => {
      if (EnlightenmentImageHelper.strip(source).endsWith(extension)) {
        result = true
      }
    })

    return result
  }

  /**
   * Renders the defined image source as static image or inline SVG.
   *
   * @param source Renders the image from the defined source.
   * @param options Set the image Attributes from the optional options.
   */
  public renderImage(source: string, options?: EnlightenmentImageOptions) {
    if (!source) {
      return ''
    }

    const classname = EnlightenmentImageHelper.usePropertyValue('classname', options)
    const height = EnlightenmentImageHelper.usePropertyValue('height', options, true)
    const width = EnlightenmentImageHelper.usePropertyValue('width', options, true)

    const use = document.createElement('use')
    use.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      EnlightenmentImageHelper.sanitizeHTML(`${this.svgSpriteSource}#${source}`)
    )

    return this.testImage(source)
      ? html`<svg
          class="${classname}"
          ${height && `height="${height}"`}
          ${width && `width=  "${width}"`}
          height="${height || '100%'}"
          width="${width || '100%'}"
          aria-hidden="true"
          focusable="false"
        >
          ${unsafeSVG(use.outerHTML)}
        </svg>`
      : html`<img
          class="${classname}"
          height="${height || 'auto'}"
          width="${width || 'auto'}"
          aria-hidden="true"
          focusable="false"
          src="${this.testImageSource(source) ? source : this.svgSpriteSource}"
        />`
  }
}
