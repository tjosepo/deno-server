import { handleRequest, ServeDispatcher } from "./serve.ts";
import { setDispatcher } from "./hooks.ts";
import { match } from "./deps.ts";

export async function mock(fn: () => Promise<void> | void) {
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

  return (
    input: Request | URL | string,
    init: RequestInit = {},
  ): Promise<Response> => {
    if (input instanceof URL) input = String(input);
    const { method = "GET" } = init;
    const request = new Request(input, { ...init, method });
    return handleRequest(request, dispatcher);
  };
}
