import { EnlightenmentGlobals } from 'src/providers/Globals'
import { EnlightenmentTheme } from 'src/providers/Theme'

/**
 * Defines a single entry of the parsed json data form the
 * Enlightenment.parseJSON() method.
 */
export type EnlightenmentDataEntry =
  | string
  | {
      checked?: boolean
      disabled?: boolean
      id?: string
      label?: string
      name?: string
      title?: string
      value?: string
    }

/**
 * Defines the Type definitions for the Extension import requests that are
 * defined from the extensions Component's constructor property.
 *
 * The actual Extensions are loaded in non-blocking order and will dispatch
 * callback hooks (updated & preload) when completed.
 */
export type EnlightmentExtensionImport = Promise<boolean>
export type EnlightenmentExtensionImports = { [key: string]: EnlightmentExtensionImport }

/**
 * Definition for the callback function used within Enlightenment.process
 */
export type EnlightenmentProcessHandler = (context: HTMLElement) => void

/**
 * Optional configuration options to use within the renderImage method.
 */
export type EnlightenmentImageOptions =
  | { classname?: string; width?: string; height?: string }
  | string

/**
 * Expected response to use for stringified JSON values.
 */
export type EnlightenmentJSONResponseValue = any
export type EnlightenmentJSONResponseArray = EnlightenmentJSONResponseValue[]
export type EnlightenmentJSONResponseObject = { [key: string]: EnlightenmentJSONResponseValue }
export type EnlightenmentJSONResponseTransformer = (
  value: EnlightenmentJSONResponseValue
) => EnlightenmentJSONResponseValue

export type EnlightenmentJSONResponse =
  | EnlightenmentJSONResponseArray
  | EnlightenmentJSONResponseObject[]

/**
 * Type reference for all the existing Enlightenment Providers.
 */
export type EnlightenmentProvider = EnlightenmentGlobals | EnlightenmentTheme
export type EnlightenmentProviders = EnlightenmentProvider[]

export type EnlightenmentInputControllerPointerData = {
  clientX: number
  clientY: number
  pivot?: number
  x: number
  y: number
}

export type EnlightenmentInteractionData = {
  context?: HTMLElement
  count?: number
  edgeX?: number
  edgeY?: number
  event?: MouseEvent | TouchEvent
  height?: number
  host?: HTMLElement
  left?: number
  origin?: HTMLElement
  pivot?: number
  pointerX?: number
  pointerY?: number
  previousPointerX?: number
  previousPointerY?: number
  request?: number
  response?: number
  top?: number
  updates?: number
  velocityX?: number
  velocityY?: number
  width?: number
  x?: number
  y?: number
}

export type EnlightenmentInteractionEndCallback = (value: boolean | PromiseLike<boolean>) => void

export type EnlightenmentInputControllerCallbackOptions = {
  useTranslate?: boolean
  useViewport?: boolean
}

export type EnlightenmentContext2DBounds = {
  top?: boolean
  left?: boolean
  bottom?: boolean
  right?: boolean
}

/**
 * Defines the Object Interface for a Context2D viewport reference: Window or
 * HTMLElement.
 */
export type EnlightenmentContext2DRect = {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Defines the Object definition of the last defined Transformation values
 * of the defined HTMLElement.
 */
export type EnlightenmentContext2DCacheEntry =
  | {
      context: HTMLElement
      height?: number
      pivot?: number
      width?: number
      x?: number
      y?: number
      screen?: EnlightenmentContext2DRect
    }
  | undefined

/**
 * Defines the options Interface for the resize() Dom method.
 * @see resize()
 */
export type EnlightenmentDOMResizeOptions = {
  height?: number
  position?: string
  fit?: boolean
  viewport?: HTMLElement | typeof globalThis
  width?: number
  x?: number
  y?: number
}

/**
 * Defines the expected Element types to use during any DOM logic.
 */
export type EnlightenmentTarget = Element | HTMLElement | Node | SVGElement | undefined

/**
 * Definition of a single throttled handler that will not stack if called
 * multiple times within the defined throttle delay.
 */
export type EnlightenmentThrottle = [Function, ReturnType<typeof setTimeout>, any[] | undefined]

/**
 * Type reference for the possible Context2D viewport Element.
 */
export type EnlightenmentViewport = HTMLElement | typeof globalThis

/**
 * Contains the active document Event listeners that are created from the
 * constructed Class context.
 */
export type GlobalEventType = Event['type']
export type GlobalEventHandler = Function
export type GlobalEventContext = EventTarget
export type GlobalEventOptions = {
  context?: GlobalEventContext
  once?: boolean
  passive?: boolean
  thisArg?: Element
}

export type GlobalEvent = [
  GlobalEventType,
  GlobalEventHandler,
  GlobalEventContext,
  GlobalEventHandler
]

/**
 * Optional options to use for Enlightenment.hook method.
 */
export type HookOptions = {
  context?: Element
  data?: any
}

export type ColorMode = 'light' | 'dark'
