import { lookup } from "./deps.ts";
import { get } from "../mod.ts";

export interface ServeFilesOptions {
  src: string;
  defaultFile?: string;
}

const normalize = (dir: string) => dir.replace(/\/+$/, "");

export function serveFiles(init: ServeFilesOptions) {
  const { defaultFile = "index.html" } = init;
  const src = normalize(init.src);

  get("/:slugs*", async (_, params) => {
    const filepath = params.slugs?.join("/") ?? "";

    let data: Uint8Array | undefined = undefined;
    let contentType = "";

    // Try URL
    try {
      const url = new URL(src + "/" + filepath);
      const { body, headers, status, statusText } = await fetch(url);
      return new Response(body, { headers, status, statusText });
    } catch {
      // Try file
      try {
        data = await Deno.readFile(src + "/" + filepath);
        contentType = lookup(filepath) ?? "";
      } catch {
        // Try default file
        try {
          data = await Deno.readFile(src + "/" + filepath + "/" + defaultFile);
          contentType = lookup(defaultFile) ?? "";
        } catch {
          // Couldn't find a file
          return;
        }
      }
    }

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.length),
      },
    });
  });
}
