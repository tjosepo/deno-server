import { bold, cyan, red } from "./deps.ts";
import { use } from "../mod.ts";

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

/** Plugin that logs HTTP request/response details. */
export const useLogger = (config: LoggerConfig = {}) => {
  const {
    format = `[:status] :method ${cyan(":path")} ${bold(":latency ms")} ${
      red(
        ":error",
      )
    }`,
    timeFormat = (time) => new Date(time).toISOString(),
    output = console.log,
  } = config;

  use((request) => {
    const start = Date.now();

    return async ({ response, error }) => {
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
          .replaceAll(/:body/g, await response.text())
          .replaceAll(
            /:error/g,
            error
              ? "\nerror: " +
                (error instanceof Error ? error.stack : String(error))
              : "",
          ),
      );
    };
  });
};
