import {
  EnlightenmentContext2DViewport,
  EnlightenmentContext2DCacheEntry,
  EnlightenmentDOMResizeOptions
} from 'src/_types/main'
import { EnlightenmentAnimation } from 'src/core/Animation'

export class EnlightenmentContext2D extends EnlightenmentAnimation {
  /**
   * Defines the 9 possible pivots to use within the 2D Axis:
   *
   *    [1][2][3]
   *    [4][5][6]
   *    [7][8][9]
   */
  static pivots = {
    x: [1, 3, 4, 6, 7, 9],
    y: [1, 2, 3, 7, 8, 9]
  }

  /**
   * Optional Cache reference that should contain the mutated HTMLElement
   * Transformation properties.
   */
  contextCache: EnlightenmentContext2DCacheEntry[] = []

  /**
   * Defines the current selected pivot from 1 to 9 that should use the defined
   * Drag interaction.
   */
  currentPivot?: number

  constructor() {
    super()
  }

  /**
   * Assign or update the defined Context Cache Object.
   *
   * @param commit The defined Context Cache to update or create.
   */
  protected assignContextCache(commit: EnlightenmentContext2DCacheEntry) {
    if (!commit || !commit.context) {
      this.log(`Unable to assign Transformation Cache from undefined Element reference`, 'warning')

      return false
    }

    const length = this.contextCache.length

    let validate = false
    let updated = false

    if (!length) {
      this.contextCache.push(commit)

      updated = true
    } else {
      for (let index = 0; index < length; index += 1) {
        if (updated) {
          break
        }

        const cache = this.contextCache[index]

        if (cache && cache.context && commit.context === cache.context) {
          const update = {
            ...cache,
            ...commit
          }

          // Remove any invalid Caching data.
          const { width, height, x, y, context } = update

          if (width === undefined && height === undefined && x === undefined && y === undefined) {
            this.log(`Invalid Cache entry detected ${cache.context}`, 'warning')

            this.contextCache[index] = undefined

            break
          }

          this.contextCache[index] = { context, width, height, x, y }

          this.log(`Context Cache updated ${commit.context}`, 'info')

          updated = true

          break
        } else {
          continue
        }
      }
    }

    if (!updated) {
      this.contextCache.push(commit)
    }

    this.log(`Context Cache assigned: ${commit.context}`, 'log')

    return updated
  }

  /**
   * Validates if the defined pivot or the currentPivot is the center pivot
   * value.
   *
   * @param value Validate the optional value instead.
   */
  protected isCenterPivot(value?: number) {
    const pivot = value || this.currentPivot

    return (
      !pivot ||
      (!EnlightenmentContext2D.pivots.x.includes(pivot) &&
        !EnlightenmentContext2D.pivots.y.includes(pivot))
    )
  }

  /**
   * Validates if the defined X & Y position values exists within the defined
   * viewport context.
   * @param x Validates the current X value.
   * @param y  Validates the current Y value.
   * @param viewport Validate from the optionally defined viewport context.
   */
  protected isWithinViewport(x: number, y: number, viewport?: HTMLElement) {
    const context = this.useViewport(viewport)

    return x >= context.left && x <= context.width && y >= context.top && y <= context.width
  }

  /**
   * Resize the defined context element and apply the optional position values.
   *
   * @param context Resize the defined context Element.
   * @param options Apply the defined resize options.
   */
  protected resize(context: HTMLElement, options: EnlightenmentDOMResizeOptions) {
    if (!context || !context.style) {
      return
    }

    const [translateX, translateY] = EnlightenmentContext2D.parseMatrixValue(
      context.style.transform
    )

    let { width, height, position, viewport, x, y } = options || {}
    const viewportProperties = this.useViewport(viewport)
    x = Math.round((x || 0) + (translateX || 0))
    y = Math.round((y || 0) + (translateY || 0))

    if (width !== undefined) {
      // Limit the resize to the visible viewport
      if (viewport && viewportProperties.width <= width + (x || 0)) {
        width = Math.round(viewportProperties.width - x)
      }

      context.style.width = `${width}px`
    }

    if (height !== undefined) {
      // Limit the resize to the visible viewport
      if (viewport && viewportProperties.height <= height + (y || 0)) {
        height = Math.round(viewportProperties.height - y)
      }

      context.style.height = `${height}px`
    }

    if (x !== undefined) {
      if (viewport && x < viewportProperties.left) {
        x = viewportProperties.left
      }

      context.style.left = `${x}px`
    }

    if (y !== undefined) {
      if (viewport && y < viewportProperties.top) {
        y = viewportProperties.top
      }

      context.style.top = `${y}px`
    }

    // Ensure the required position value is assigned when a valid X and/or Y
    // position is defined.
    if (x !== undefined && y !== undefined) {
      context.style.position =
        EnlightenmentContext2D.filterPropertyValue(position || 'absolute', ['absolute', 'fixed']) ||
        ''
    }

    // Remove any translate related values.
    context.style.transform = ''
  }

  /**
   * Stretch the defined context Element from the defined Width and/or Height
   * within the current visible Viewport.
   *
   * @param pivot Apply the stretch transformation from the defined pivot value.
   */
  protected strech(context: HTMLElement, pivot?: number) {
    if (!context) {
      return
    }

    if (
      pivot &&
      !this.isCenterPivot(pivot) &&
      !EnlightenmentContext2D.pivots.x.includes(pivot) &&
      !EnlightenmentContext2D.pivots.y.includes(pivot)
    ) {
      return
    }

    // Override the initial defined values from the given currentPivot value.
    const initial = {
      height: context.offsetHeight,
      pivot,
      width: context.offsetWidth,
      x: context.offsetLeft,
      y: context.offsetTop
    }
    let commit = { ...initial }

    switch (pivot) {
      case 1:
        commit.width = context.offsetLeft + context.offsetWidth
        commit.height = context.offsetTop + context.offsetHeight
        commit.x = 0
        commit.y = 0
        break

      case 2:
        commit.width = context.offsetWidth
        commit.height = context.offsetTop + context.offsetHeight
        commit.x = context.offsetLeft
        commit.y = 0
        break

      case 3:
        commit.width = window.innerWidth - context.offsetLeft
        commit.height = context.offsetTop + context.offsetHeight
        commit.x = context.offsetLeft
        commit.y = 0
        break

      case 4:
        commit.width = context.offsetLeft + context.offsetWidth
        commit.height = context.offsetHeight
        commit.x = 0
        break

      case 6:
        commit.width = window.innerWidth - context.offsetLeft
        commit.height = context.offsetHeight
        commit.x = context.offsetLeft
        break

      case 7:
        commit.width = context.offsetLeft + context.offsetWidth
        commit.height = window.innerHeight - context.offsetTop
        commit.x = 0

        break

      case 8:
        commit.width = context.offsetWidth
        commit.height = window.innerHeight - context.offsetTop
        commit.x = context.offsetLeft
        commit.y = context.offsetTop
        break

      case 9:
        commit.width = window.innerWidth - context.offsetLeft
        commit.height = window.innerHeight - context.offsetTop
        commit.x = context.offsetLeft
        commit.y = context.offsetTop
        break

      default:
        commit.width = window.innerWidth
        commit.height = window.innerHeight
        commit.x = 0
        commit.y = 0

        break
    }

    // Toggle between the previous state while the current pivot value matches
    // with the previous pivot value.
    if (EnlightenmentContext2D.compareValue(initial, commit)) {
      const cache = this.useContextCache(context)

      if (cache) {
        this.resize(context, { ...cache, viewport: window })
      }
    } else {
      this.assignContextCache({ ...initial, context })

      this.resize(context, { ...commit, viewport: window })
    }
  }

  /**
   * Transforms the defined context element with CSS TranslateX & TranslateY
   * values.
   *
   * @param context Transforms the defined Elemenet.
   * @param x The actual translateX value to use.
   * @param x The actual translateY value to use.
   * @param fit Ensure the current Transformation fits within the visible
   * viewport.
   */
  protected transform(
    context: HTMLElement,
    offsetX: number,
    offsetY: number,
    viewport?: HTMLElement | typeof globalThis
  ) {
    if (!context || !context.style) {
      return
    }

    let translateX = offsetX || 0
    let translateY = offsetY || 0

    const viewportProperties = this.useViewport(viewport)
    const bounds = this.useBounds(context, translateX, translateY)

    // Limit
    if (viewport) {
      if (translateX + context.offsetLeft + context.offsetWidth > viewportProperties.width) {
        const leftover =
          context.offsetLeft + translateX + context.offsetWidth - viewportProperties.width

        translateX = translateX - leftover
      } else if (bounds.left) {
        const leftover = context.offsetLeft + translateX

        console.log('EDGE', offsetX)

        translateX = translateX - leftover
      } else if (translateX - context.offsetLeft <= viewportProperties.left) {
        // if (bounds.left || !offsetX) {
        //   console.log('BOO', translateX, offsetX)
        //   translateX = -context.offsetLeft
        // }
      }

      if (translateY + context.offsetTop + context.offsetHeight > viewportProperties.height) {
        const leftover =
          context.offsetTop + translateY + context.offsetHeight - viewportProperties.height

        translateY = translateY - leftover
      } else if (bounds.top) {
        const leftover = context.offsetTop + translateY

        translateY = translateY - leftover
      } else if (translateX - context.offsetTop <= viewportProperties.top) {
        // if (bounds.top || !offsetY) {
        //   translateY = -context.offsetTop
        // }
      }
    }

    context.style.transform = `translate(${translateX}px, ${translateY}px)`
  }

  /**
   * Validates if the defined context Element has reached the defined Viewport
   * bounds.
   *
   * @param context Use the defined Context element position, width & height.
   */
  protected useBounds(context: HTMLElement, translateX?: number, translateY?: number) {
    const viewport = this.useViewport()

    const top = (translateY || 0) + context.offsetTop < viewport.top
    const left = (translateX || 0) + context.offsetLeft < viewport.left
    const bottom = (translateY || 0) + context.offsetTop + context.offsetHeight > viewport.height
    const right = (translateX || 0) + context.offsetLeft + context.offsetWidth > viewport.width

    return { top, left, right, bottom }
  }

  /**
   * Get the existing Context Cache from the defined Element context.
   *
   * @param context Get the Context Cache from the defined Element.
   */
  protected useContextCache(context: HTMLElement) {
    if (!this.contextCache.length) {
      return
    }

    const [cache] = this.contextCache.filter(
      (contextCache) => contextCache && contextCache.context === context
    )
    if (!cache) {
      return
    }

    const { width, height, x, y } = cache

    if (width === undefined || height === undefined) {
      return
    }

    return { width, height, x, y }
  }

  /**
   * Return the currently defined Box model from the existing viewport reference
   * or the defined Window.
   *
   * @param viewport Returns the Box model properties from the defined viewport
   * as alternative.
   */
  protected useViewport(
    viewport?: HTMLElement | typeof globalThis
  ): EnlightenmentContext2DViewport {
    const defaultViewport = {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight
    }

    if (!viewport || viewport === globalThis) {
      return defaultViewport
    }

    const element = viewport as HTMLElement

    return element
      ? {
          top: element.offsetTop,
          left: element.offsetLeft,
          width: element.offsetWidth,
          height: element.offsetHeight
        }
      : defaultViewport
  }
}
