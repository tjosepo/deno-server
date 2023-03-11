export type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export type Context = {
  request: Request;
  params: Record<string, string>;
};

export type HandlerResponse =
  | Response
  | BodyInit
  | null
  | undefined
  | Promise<Response | BodyInit | null | undefined>;

export type MethodHook = (
  pathname: string,
  handler: (req: Request) => HandlerResponse
) => void;

export type UseHook = (
  create: (request: Request) => UseCleanup | Promise<UseCleanup> | void
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
  patch: MethodHook;
  del: MethodHook;
  put: MethodHook;
  path: PathHook;
}
