import { use } from "../mod.ts";
import * as Http from "../responses.ts";

interface CorsInit {
  /**
   * Indicates whether or not the response to the request
   * can be exposed when the credentials flag is true. When used as part of
   * a response to a preflight request, this indicates whether or not the
   * actual request can be made using credentials.
   *
   * Default: `false`
   */
  allowCredentials?: boolean;
  /**
   * Defines a list of request headers that can be used when making the actual
   * request. This is in response to a preflight request.
   *
   * Default: `""`
   */
  allowHeaders?: string;
  /**
   * Defines a list methods allowed when accessing the resource.
   * This is used in response to a preflight request.
   *
   * Default: `"GET,HEAD,PUT,PATCH,POST,DELETE"`
   */
  allowMethods?: string;
  /**
   * Defines a list of origins that may access the resource.
   *
   * Default: `"*"`
   */
  allowOrigins?: string;
  /**
   * Defines a whitelist headers that clients are allowed to
   * access.
   *
   * Default: `""` */
  exposeHeaders?: string;
  /**
   * MaxAge indicates how long (in seconds) the results of a preflight request
   * can be cached.
   *
   * Default: `5`
   */
  maxAge?: number;
}

/** Plugin to enable Cross-Origin Resource Sharing with various options. */
export const useCors = (init: CorsInit = {}) => {
  const {
    allowCredentials = false,
    allowHeaders = "",
    allowMethods = "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowOrigins = "*",
    exposeHeaders = "",
    maxAge = 5,
  } = init;

  use((request) => {
    if (request.method === "OPTIONS") {
      const { headers } = request;

      if (headers.has("Access-Control-Request-Headers")) {
        const allowedHeaders = allowHeaders
          .toLowerCase()
          .split(",")
          .map((header) => header.trim());

        headers
          .get("Access-Control-Request-Headers")!
          .toLowerCase()
          .split(",")
          .map((header) => header.trim())
          .forEach((header) => {
            if (allowedHeaders.includes(header)) return;
            else throw Http.Forbidden();
          });
      }
    }

    return ({ response }) => {
      const { headers } = response;

      if (!headers.has("Access-Control-Allow-Credentials")) {
        headers.set(
          "Access-Control-Allow-Credentials",
          String(allowCredentials),
        );
      }

      if (!headers.has("Access-Control-Allow-Headers")) {
        headers.set("Access-Control-Allow-Headers", allowHeaders);
      }

      if (!headers.has("Access-Control-Allow-Methods")) {
        headers.set("Access-Control-Allow-Methods", allowMethods);
      }

      if (!headers.has("Access-Control-Allow-Origin")) {
        headers.set("Access-Control-Allow-Origin", allowOrigins);
      }

      if (!headers.has("Access-Control-Expose-Headers")) {
        headers.set("Access-Control-Expose-Headers", exposeHeaders);
      }

      if (!headers.has("Access-Control-Max-Age")) {
        headers.set("Access-Control-Max-Age", String(maxAge));
      }

      if (request.method === "OPTIONS" && response.status !== 204) {
        response = Http.NoContent({ headers });
      }

      return response;
    };
  });
};
