import type {
  Context,
  Dispatcher,
  HandlerResponse,
  MethodHook,
  PathHook,
  UseCleanup,
  UseHook,
} from "./types.ts";
import { posix } from "./deps.ts";

let currentDispatcher: Dispatcher | undefined;

export const setDispatcher = (dispatcher: Dispatcher | undefined) => {
  currentDispatcher = dispatcher;
};

export const getDispatcher = (): Dispatcher => {
  if (currentDispatcher === undefined) {
    throw new Error(
      "Invalid hook call. Hooks can only be called inside of the body of the serve function.",
    );
  }
  return currentDispatcher;
};

interface Route {
  method: string;
  pattern: URLPattern;
  handler: (ctx: Context) => HandlerResponse;
  effects: ((request: Request) => UseCleanup | Promise<UseCleanup> | void)[];
}

export class ServeDispatcher implements Dispatcher {
  routes: Route[] = [];
  effects: ((request: Request) => UseCleanup | Promise<UseCleanup> | void)[] =
    [];

  get: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "GET", pattern, handler, effects: [] });
  };

  post: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "POST", pattern, handler, effects: [] });
  };

  put: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "PUT", pattern, handler, effects: [] });
  };

  del: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "DELETE", pattern, handler, effects: [] });
  };

  use: UseHook = (create) => {
    this.effects.push(create);
  };

  path: PathHook = (pathname, fn) => {
    const dispatcher = new ServeDispatcher();

    setDispatcher(dispatcher);
    fn();
    setDispatcher(this);

    const routes = dispatcher.routes.map<Route>((route) => {
      return {
        method: route.method,
        pattern: new URLPattern({
          pathname: posix.join(pathname, route.pattern.pathname),
        }),
        handler: route.handler,
        effects: [...dispatcher.effects, ...route.effects],
      };
    });

    this.routes.push(...routes);
  };
}
