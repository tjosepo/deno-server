import type {
  Dispatcher,
  HandlerResponse,
  MethodHook,
  PathHook,
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
  handler: (request: Request) => HandlerResponse;
}

export class ServeDispatcher implements Dispatcher {
  routes: Route[] = [];

  get: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "GET", pattern, handler });
  };

  post: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "POST", pattern, handler });
  };

  patch: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "PATCH", pattern, handler });
  }

  del: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "DELETE", pattern, handler});
  };

  put: MethodHook = (pathname, handler) => {
    const pattern = new URLPattern({ pathname: posix.normalize(pathname) });
    this.routes.push({ method: "PUT", pattern, handler });
  };

  path: PathHook = (pathname, fn) => {
    const dispatcher = new ServeDispatcher();

    setDispatcher(dispatcher);
    fn();
    setDispatcher(this);

    const routes = dispatcher.routes.map<Route>((route) => {
      const pattern = new URLPattern({ pathname: posix.join(pathname, route.pattern.pathname) });
      return { method: route.method, pattern, handler: route.handler };
    });

    this.routes.push(...routes);
  };
}
