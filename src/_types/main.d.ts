/**
 * Exposed properties that is assigned within the AnimationHandler context.
 */
export type AnimationHandlerProps = {
  // TRUE when the first handler is called.
  first: boolean;

  // TRUE when the last handler is called.
  last: boolean;

  // The dynamic timestamp of the previous tick based of the running FPS.
  previousTimestamp: number;

  // Resolver to use within the handler to cancel the next animationFrame.
  resolve: any;

  // The current frame iteration within the defined loop/cycle.
  tick: number;

  // The current animation frame timestamp.
  timestamp: number;

  // Rounded value of the relative FPS value
  tock: number;
};

/**
 * Expected Promise result for the created animationHandler.
 */
export type AnimationHandlerResponse = {
  first: AnimationHandlerProps["first"];
  last: AnimationHandlerProps["last"];
  previousTimestamp: AnimationHandlerProps["previousTimestamp"];
  tick: AnimationHandlerProps["tick"];
  timestamp: AnimationHandlerProps["timestamp"];
  tock: AnimationHandlerProps["tock"];
};

/**
 * Defines the dynamic endpoint list that will be shared within the instance
 * global.
 */
export type EnlightenmentEndpoint = { [key: string]: string };

/**
 * Optional configuration options to use within the renderImage method.
 */
export type EnlightenmentImageOptions =
  | {
      classname?: string;
    }
  | string;
/**
 * Defines the Global state typing that is assigned to the Window context.
 */
export type EnlightenmentState = {
  currentElements: Element[];
  mode?: string;
  endpoints: EnlightenmentEndpoint;
  verbose?: boolean;
};

/**
 * Definition of a single throttled handler that will not stack if called
 * multiple times within the defined throttle delay.
 */
export type EnlightenmentThrottle = [Function, ReturnType<typeof setTimeout>];

/**
 * Contains the active document Event listeners that are created from the
 * constructed Class context.
 */
export type GlobalEventType = Event["type"];
export type GlobalEventHandler = Function;
export type GlobalEventContext = EventTarget;
export type GlobalEvent = [
  GlobalEventType,
  GlobalEventHandler,
  GlobalEventContext
];

/**
 * Optional options to use for Enlightenment.hook method.
 */
export type HookOptions = {
  context?: Element;
  data: any;
};
