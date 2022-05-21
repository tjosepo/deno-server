import { handleRequest } from "./serve.ts";
import { ServeDispatcher, setDispatcher } from "./dispatcher.ts";

export async function mock(fn: () => Promise<void> | void) {
  const dispatcher = new ServeDispatcher();

  setDispatcher(dispatcher);
  await fn();
  setDispatcher(undefined);

  return (
    input: Request | URL | string,
    init: RequestInit = {},
  ): Promise<Response> => {
    if (input instanceof URL) input = String(input);
    if (typeof input === "string" && input.startsWith("/")) {
      input = "https://localhost:8000" + input;
    }
    const { method = "GET" } = init;
    const request = new Request(input, { ...init, method });
    return handleRequest(request, dispatcher);
  };
}
