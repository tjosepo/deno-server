import { Forbidden, NoContent, useEffect } from "../mod.ts";

interface CorsInit {
  allowCredentials?: boolean;
  allowHeaders?: string;
  allowMethods?: string;
  allowOrigins?: string;
  exposeHeaders?: string;
  maxAge?: number;
}

export const useCors = (init: CorsInit = {}) => {
  const {
    allowCredentials = false,
    allowHeaders = "",
    allowMethods = "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowOrigins = "*",
    exposeHeaders = "",
    maxAge = 5,
  } = init;

  useEffect((request: Request) => {
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
            else throw Forbidden();
          });
      }
    }

    return (response: Response) => {
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
        response = NoContent({ headers });
      }

      return response;
    };
  });
};
