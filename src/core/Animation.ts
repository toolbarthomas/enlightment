import { EnlightenmentDOM } from './DOM'

export class EnlightenmentAnimation extends EnlightenmentDOM {
  // Defines the initial start time in order to limit the callback with the
  // defined FPS.
  initialAnimationTimestamp?: number

  // Should contain the current timestamp of the running callback.
  currentAnimationTimestamp?: number

  // Holds the current Request Animation Frame ID.
  currentAnimationFrame?: number

  // Keep track of the elapsed time since the instance was constructed.
  currentAnimationDuration?: number

  /**
   * Returns the current timestamp integer value.
   *
   * @param date Use the Date constructor for the timestamp.
   */
  useTimestamp(date?: boolean) {
    return date ? Date.now() : window.performance.now()
  }

  /**
   * Defines the required timestamp values that are used to limit the RAF
   * calback amount.
   */
  assignAnimationTimestamp() {
    this.initialAnimationTimestamp = this.useTimestamp()
    this.currentAnimationTimestamp = this.initialAnimationTimestamp
  }

  clearAnimationFrame(id?: number) {
    if (id && id !== this.currentAnimationFrame) {
      cancelAnimationFrame(id)
    } else {
      this.currentAnimationFrame && cancelAnimationFrame(this.currentAnimationFrame)
    }
  }

  /**
   * Apply the defined callback handler with a new Animation frame that should
   * limit the defined callback with the defined FPS limit.
   *
   * @param handler The assigned requestAnimationFrame callback handler
   * @param args Any optional arguments to use within the dynamic callback.
   */
  useAnimationFrame(handler: Function, ...args: any) {
    if (!this.initialAnimationTimestamp) {
      this.assignAnimationTimestamp()
    }

    this.clearAnimationFrame()
    this.currentAnimationFrame = requestAnimationFrame(() => {
      const limit = Math.round(EnlightenmentAnimation.FPS / devicePixelRatio)
      this.currentAnimationTimestamp = this.useTimestamp()
      this.currentAnimationDuration =
        this.currentAnimationTimestamp - (this.initialAnimationTimestamp || this.useTimestamp())

      if (this.currentAnimationDuration < limit) {
        this.clearAnimationFrame()
        return this.useAnimationFrame(handler, ...args)
      }

      this.initialAnimationTimestamp =
        this.currentAnimationTimestamp - (this.currentAnimationDuration % limit)

      handler.call(this, ...args)
    })

    return this.currentAnimationFrame
  }
}
