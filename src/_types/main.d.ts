import { EnlightenmentGlobals } from 'src/providers/Globals'
import { EnlightenmentTheme } from 'src/providers/Theme'

export type EnlightenmentHandler = (context: HTMLElement) => void

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
export type EnlightenmentThrottle = [Function, ReturnType<typeof setTimeout>]

/**
 * Type reference for the expected process method that assigned within an
 * Enlightenment Component.
 */
export type EnlightenmentProcess = (target?: HTMLElement) => void

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
