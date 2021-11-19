import { match } from "./deps.ts";
import type { MatchFunction } from "./deps.ts";
import { setDispatcher } from "./hooks.ts";
import type {
  Dispatcher,
  EffectCleanup,
  EffectHook,
  HandlerResponse,
  MethodHook,
  PathHook,
} from "./hooks.ts";
import { Found, NotFound } from "./responses.ts";

interface Route {
  method: string;
  path: string;
  match?: MatchFunction<Record<string, string>>;
  handler: (
    request: Request,
    params: Record<string, string>,
  ) => HandlerResponse;
  effects: ((
    request: Request,
  ) => EffectCleanup | Promise<EffectCleanup> | void)[];
}

/**
 * From "/hello%20world///" to "/hello world"
 * @param path
 * @returns
 */
const normalize = (path: string): string =>
  decodeURI(path)
    .replace(/\/+$/, "")
    .replace("", "/")
    .replace(/\/+/g, "/")
    .normalize();

export class ServeDispatcher implements Dispatcher {
  routes: Route[] = [];
  effects: ((
    request: Request,
  ) => EffectCleanup | Promise<EffectCleanup> | void)[] = [];

  get: MethodHook = (path, handler) => {
    path = normalize(path);
    this.routes.push({ method: "GET", path, handler, effects: [] });
    this.routes.push({ method: "HEAD", path, handler, effects: [] });
  };

  head: MethodHook = (path, handler) => {
    path = normalize(path);
    // this.routes.push({ method: "HEAD", path, handler, effects: [] });
  };

  post: MethodHook = (path, handler) => {
    path = normalize(path);
    this.routes.push({ method: "POST", path, handler, effects: [] });
  };

  put: MethodHook = (path, handler) => {
    path = normalize(path);
    this.routes.push({ method: "PUT", path, handler, effects: [] });
  };

  del: MethodHook = (path, handler) => {
    path = normalize(path);
    this.routes.push({ method: "DELETE", path, handler, effects: [] });
  };

  useEffect: EffectHook = (create) => {
    this.effects.push(create);
  };

  path: PathHook = (path, fn) => {
    const dispatcher = new ServeDispatcher();

    setDispatcher(dispatcher);
    fn();
    setDispatcher(this);

    const routes = dispatcher.routes.map<Route>((route) => {
      return {
        method: route.method,
        path: normalize(path + "/" + route.path),
        handler: route.handler,
        effects: [...dispatcher.effects, ...route.effects],
      };
    });

    this.routes.push(...routes);
  };
}

export interface ServeInit {
  port?: number;
}

export async function serve(
  fn: () => Promise<void> | void,
  init: ServeInit = {},
) {
  const { port = 8000 } = init;

  const dispatcher = new ServeDispatcher();
  setDispatcher(dispatcher);
  await fn();
  setDispatcher(undefined);

  // Compile paths to regexp functions
  dispatcher.routes = dispatcher.routes.map(({ path, ...route }) => {
    return {
      ...route,
      path,
      match: match(path),
    };
  });

  const server = Deno.listen({ port });
  console.log(`Server running on http://localhost:${port}/`);

  for await (const conn of server) {
    (async () => {
      try {
        const httpConn = Deno.serveHttp(conn);
        for await (const { request, respondWith } of httpConn) {
          const response = await handleRequest(request, dispatcher);
          respondWith(response);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }
}

export async function handleRequest(
  request: Request,
  dispatcher: ServeDispatcher,
): Promise<Response> {
  const { routes, effects } = dispatcher;
  const cleanups: EffectCleanup[] = [];

  let response = NotFound();

  try {
    // Redirect on anormal paths
    const requestPath = decodeURI(new URL(request.url).pathname);
    const preferredPath = normalize(requestPath);
    if (requestPath !== preferredPath) {
      throw Found(encodeURI(preferredPath));
    }

    // Apply global effects
    for (const effect of effects) {
      const cleanup = await effect(request.clone());
      if (cleanup && typeof cleanup === "function") {
        cleanups.unshift(cleanup);
      }
    }

    for (const { match, method, handler, effects } of routes) {
      if (request.method !== method) continue;
      if (!match) continue;
      const isMatch = match(requestPath) || match(requestPath + "/"); // Helps with globs
      if (!isMatch) continue;

      // Apply route specific effects
      for (const effect of effects) {
        const cleanup = await effect(request.clone());
        if (cleanup && typeof cleanup === "function") {
          cleanups.unshift(cleanup);
        }
      }

      // Get route path params
      const { params } = isMatch;

      const body = await handler(request.clone(), params);
      if (body !== undefined && body !== null) {
        response = body instanceof Response ? body : new Response(body);
      }
    }
  } catch (e) {
    if (e instanceof Response) {
      response = e;
    } else {
      response = new Response();
      console.error(e);
    }
  }

  for (const cleanup of cleanups) {
    try {
      const body = await cleanup(response.clone());
      if (body === undefined || body === null) continue;
      else {
        response = body instanceof Response ? body : new Response(body);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (request.method === "HEAD") {
    const { status, statusText, headers } = response;
    response = new Response(undefined, { status, statusText, headers });
  }

  return response;
}
