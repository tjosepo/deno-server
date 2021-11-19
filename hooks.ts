export type HandlerResponse =
  | Promise<Response | BodyInit | null | undefined | void>
  | Response
  | BodyInit
  | null
  | undefined
  | void;

export type EffectCleanup = (response: Response) => HandlerResponse;

export type MethodHook = (
  path: string,
  handler: (
    request: Request,
    params: Record<string, string>,
  ) => HandlerResponse,
) => void;
type MethodHookOverload =
  & MethodHook
  & ((
    handler: (
      request: Request,
      params: Record<string, string>,
    ) => HandlerResponse,
  ) => void);

type Handler = (
  request: Request,
  params: Record<string, string>,
) => HandlerResponse;

export type EffectHook = (
  create: (request: Request) => EffectCleanup | Promise<EffectCleanup> | void,
) => void;

export type PathHook = (path: string, fn: () => void) => void;
type PathHookOverload = PathHook & ((fn: () => void) => void);

export interface Dispatcher {
  get: MethodHook;
  head: MethodHook;
  post: MethodHook;
  put: MethodHook;
  del: MethodHook;
  useEffect: EffectHook;
  path: PathHook;
}

let currentDispatcher: Dispatcher | undefined;

export const setDispatcher = (dispatcher: Dispatcher | undefined) => {
  currentDispatcher = dispatcher;
};

const getDispatcher = (): Dispatcher => {
  if (currentDispatcher === undefined) {
    throw new Error(
      "Invalid hook call. Hooks can only be called inside of the body of a server component.",
    );
  }
  return currentDispatcher;
};

/**
 * Figures out which value is `path` and which is `fn`.
 *
 * Used when the `path` param of a function is optional.
 */
// deno-lint-ignore ban-types
const unmix = <T extends Function>(path: string | T, fn?: T): [string, T] => {
  if (typeof path === "function") {
    return ["", path as T];
  } else if (typeof path === "string" && typeof fn === "function") {
    return [path, fn];
  } else throw new Error("Invalid parameters.");
};

/** Adds a `GET` request handler for the specified path. */
export const get: MethodHookOverload = (path, handler?: Handler) => {
  const dispatcher = getDispatcher();
  [path, handler] = unmix(path, handler);
  return dispatcher.get(path, handler);
};

/** Adds a `HEAD` request handler for the specified path. */
export const head: MethodHookOverload = (path, handler?: Handler) => {
  const dispatcher = getDispatcher();
  [path, handler] = unmix(path, handler);
  return dispatcher.head(path, handler);
};

/** Adds a `POST` request handler for the specified path. */
export const post: MethodHookOverload = (path, handler?: Handler) => {
  const dispatcher = getDispatcher();
  [path, handler] = unmix(path, handler);
  return dispatcher.post(path, handler);
};

/** Adds a `PUT` request handler for the specified path. */
export const put: MethodHookOverload = (path, handler?: Handler) => {
  const dispatcher = getDispatcher();
  [path, handler] = unmix(path, handler);
  return dispatcher.put(path, handler);
};

/** Adds a `DELETE` request handler for the specified path. */
export const del: MethodHookOverload = (path, handler?: Handler) => {
  const dispatcher = getDispatcher();
  [path, handler] = unmix(path, handler);
  return dispatcher.del(path, handler);
};

/** Adds an effect that is executed before and after a request handler. */
export const useEffect: EffectHook = (create) => {
  const dispatcher = getDispatcher();
  return dispatcher.useEffect(create);
};

/** Adds a group of endpoints for the specified path. */
export const path: PathHookOverload = (path, fn?: () => void) => {
  const dispatcher = getDispatcher();
  [path, fn] = unmix(path, fn);
  return dispatcher.path(path, fn);
};
