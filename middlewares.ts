export type Middleware = (
  request: Request,
  next: Deno.ServeHandler
) => Response | Promise<Response>;

function use(...handlers: Middleware[]): Deno.ServeHandler {
  return (request) => {
    let currentIndex = 0;

    const dispatch = (index: number): Deno.ServeHandler => {
      return (request: Request) => {
        if (index < currentIndex) {
          throw new Error("next() called twice");
        }

        if (currentIndex >= handlers.length - 1) {
          currentIndex += 1;
          return new Response("404 Not");
        }

        currentIndex += 1;
        return handlers[currentIndex](request, dispatch(currentIndex));
      };
    };

    return handlers[currentIndex](request, dispatch(currentIndex));
  };
}

Deno.serve(
  use(logger(), () => {
    return new Response("The sun is shining!");
  })
);

import { bold, cyan, red } from "./src/deps.ts";

export interface LoggerConfig {
  /**
   * Defines the logging tags.
   *
   * Default: `[:status] :method :path :latency ms :error`
   */
  format?: string;
  /**
   * Function to format the text displayed by the `:time` tag.
   *
   * Default: `(time) => new Date(time).toISOString()`
   *
   * @param time UNIX timestamp.
   */
  timeFormat?(time: number): string;
  /**
   * Defines where to output the log.
   *
   * Default: `console.log`
   */
  output?(out: string): void;
}

function logger(config: LoggerConfig = {}): Middleware {
  const {
    format = `[:status] :method ${cyan(":path")} ${bold(":latency ms")} ${red(
      ":error"
    )}`,
    timeFormat = (time) => new Date(time).toISOString(),
    output = console.log,
  } = config;

  return async (request, next) => {
    const start = Date.now();
    try {
      const response = await next(request);
      const end = Date.now();
      const ms = end - start;
      output(
        format
          .replaceAll(/:method/g, request.method)
          .replaceAll(/:time/g, timeFormat(end))
          .replaceAll(/:url/g, request.url)
          .replaceAll(/:path/g, new URL(request.url).pathname)
          .replaceAll(/:status/g, response.status.toString())
          .replaceAll(/:latency/g, ms.toString())
          .replaceAll(/:error/g, "")
      );
      return response;
    } catch (error) {
      const end = Date.now();
      const ms = end - start;
      output(
        format
          .replaceAll(/:method/g, request.method)
          .replaceAll(/:time/g, timeFormat(end))
          .replaceAll(/:url/g, request.url)
          .replaceAll(/:path/g, new URL(request.url).pathname)
          .replaceAll(/:status/g, "500")
          .replaceAll(/:latency/g, ms.toString())
          .replaceAll(
            /:error/g,
            output !== console.log
              ? error instanceof Error
                ? String(error.stack)
                : "Error: " + String(error)
              : ""
          )
      );
      throw error;
    }
  };
}
