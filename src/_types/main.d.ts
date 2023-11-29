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

/**
 * Defines the expected Element types to use during any DOM logic.
 */
export type EnligtenmentTarget = Element | HTMLElement | Node | SVGElement | undefined

/**
 * Definition of a single throttled handler that will not stack if called
 * multiple times within the defined throttle delay.
 */
export type EnlightenmentThrottle = [Function, ReturnType<typeof setTimeout>, any[] | undefined]

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
