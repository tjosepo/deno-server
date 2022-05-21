import { ServeDispatcher, setDispatcher } from "./dispatcher.ts";
import type { Context, UseCleanup } from "./types.ts";
import { InternalServerError, NotFound } from "../responses.ts";
import { yellow } from "./deps.ts";

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

  const server = Deno.listen({ port });

  console.log(yellow("Listening on: ") + "http://localhost:" + port);

  for await (const conn of server) {
    (async () => {
      try {
        const httpConn = Deno.serveHttp(conn);
        for await (const { request, respondWith } of httpConn) {
          const response = await handleRequest(request, dispatcher);
          await respondWith(response);
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
  const cleanups: UseCleanup[] = [];
  let error: unknown;

  let response = NotFound();

  try {
    // Apply global effects
    for (const effect of effects) {
      const cleanup = await effect(request.clone());
      if (cleanup && typeof cleanup === "function") {
        cleanups.unshift(cleanup);
      }
    }

    const url = decodeURI(request.url);
    for (const { pattern, method, handler, effects } of routes) {
      if (
        request.method !== method && // Methods are different
        !(request.method === "HEAD" && method === "GET") // It's not HEAD
      ) {
        continue;
      }
      const match = pattern.exec(url);
      if (!match) continue;

      // Apply route specific effects
      for (const effect of effects) {
        const cleanup = await effect(request.clone());
        if (cleanup && typeof cleanup === "function") {
          cleanups.unshift(cleanup);
        }
      }

      const ctx: Context = {
        request: request.clone(),
        params: match.pathname.groups,
      };

      const body = await handler(ctx);
      if (body !== undefined && body !== null) {
        response = body instanceof Response ? body : new Response(body);
      }
    }
  } catch (e) {
    if (e instanceof Response) {
      response = e;
    } else {
      response = InternalServerError();
      error = e;
    }
  }

  for (const cleanup of cleanups) {
    try {
      const body = await cleanup({
        response: response.clone(),
        error,
      });
      if (body) response = body instanceof Response ? body : new Response(body);
    } catch (e) {
      error = e;
    }
  }

  if (request.method === "HEAD") {
    const { status, statusText, headers } = response;
    response = new Response(undefined, { status, statusText, headers });
  }

  return response;
}
