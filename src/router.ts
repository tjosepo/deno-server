import {ServeDispatcher, setDispatcher } from "./dispatcher.ts";

const NotFoundResponse = () => new Response("404 Not Found", { status: 404, statusText: "Not Found"});
const NotMethodAllowedResponse = () => new Response("405 Method Not Allowed", { status: 405, statusText: "Method Not Allowed"});

export function router(fn: () => void): Deno.ServeHandler {
  const dispatcher = new ServeDispatcher();

  setDispatcher(dispatcher);
  fn();
  setDispatcher(undefined);

  return async (request) => {
    let response = NotFoundResponse();
    
    for (const route of dispatcher.routes) {
      if (!route.pattern.test(request.url)) {
        continue;
      }

      if (request.method === "HEAD" && route.method === "GET") {
        const body = await route.handler(request);
        const response = body instanceof Response ? body : new Response(body);
        return response;
      }

      if (route.method !== request.method && route.method !== "*") {
        response = NotMethodAllowedResponse();
        continue;
      }

      const body = await route.handler(request);
      response = body instanceof Response ? body : new Response(body);
      break;
    }

    return response;
  };
}
