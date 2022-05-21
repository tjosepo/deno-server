export type Context = {
  request: Request;
  params: Record<string, string>;
};

export type HandlerResponse =
  | Promise<Response | BodyInit | null | undefined | void>
  | Response
  | BodyInit
  | null
  | undefined
  | void;

export type MethodHook = (
  pathname: string,
  handler: (ctx: Context) => HandlerResponse,
) => void;

export type UseHook = (
  create: (request: Request) => UseCleanup | Promise<UseCleanup> | void,
) => void;

export type CleanupContext = {
  response: Response;
  error: unknown;
};

export type UseCleanup = (ctx: CleanupContext) => HandlerResponse;

export type PathHook = (pathname: string, fn: () => void) => void;

export interface Dispatcher {
  get: MethodHook;
  post: MethodHook;
  put: MethodHook;
  del: MethodHook;
  use: UseHook;
  path: PathHook;
}
