import { EnlightenmentDOM } from './DOM'

export type RAFRequestOptions = {
  time?: number
  frame?: number
  args: any[]
}

export class EnlightenmentAnimation extends EnlightenmentDOM {
  /**
   * Returns the current timestamp integer value.
   *
   * @param date Use the Date constructor for the timestamp.
   */
  useTimestamp(date?: boolean) {
    return date ? Date.now() : window.performance.now()
  }

  /**
   * Removes the currently defined Animation Request.
   * @param id
   */
  clearAnimationFrame(id?: number) {
    id && cancelAnimationFrame(id)
  }

  /**
   * Apply the defined callback handler with a new Animation frame that should
   * limit the defined callback with the defined FPS limit.
   *
   * @param handler The assigned requestAnimationFrame callback handler
   * @param time Inherit the initial timestamp or create one, needs to be
   * assigned if function arguments are
   * @param args Any optional arguments to use within the dynamic callback.
   */
  useAnimationFrame(handler: Function, options?: RAFRequestOptions) {
    const limit = Math.round(EnlightenmentAnimation.FPS / devicePixelRatio)
    const { time, frame, args } = options || {}
    let a = args || []

    let t = time
    let f = frame || -1
    const request = requestAnimationFrame((timestamp) => {
      if (!t) {
        t = timestamp
      }

      const index = Math.floor((timestamp - t) / limit)

      if (index > f) {
        f = index
        handler.call(this, ...a)
      } else {
        this.clearAnimationFrame(request)
        this.useAnimationFrame(handler, { args: a, time: t, frame: f })
      }
    })

    return request
  }
}
