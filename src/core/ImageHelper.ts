import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

import { html, property } from './Mixins'

import { EnlightenmentParser } from './Parser'

export class EnlightenmentImageHelper extends EnlightenmentParser {
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
    converter: (value) => EnlightenmentParser.resolveURL(EnlightenmentParser.strip(String(value)))
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
        this.testImageSource(EnlightenmentParser.strip(source))
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
      if (EnlightenmentParser.strip(source).endsWith(extension)) {
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

    const classname = EnlightenmentParser.usePropertyValue('classname', options)
    const height = EnlightenmentParser.usePropertyValue('height', options, true)
    const width = EnlightenmentParser.usePropertyValue('width', options, true)

    const use = document.createElement('use')
    use.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      EnlightenmentParser.sanitizeHTML(`${this.svgSpriteSource}#${source}`)
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
