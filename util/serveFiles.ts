import { lookup } from "./deps.ts";
import { get } from "../mod.ts";

export interface ServeFilesOptions {
  dir: string;
  defaultFile?: string;
}

export function serveFiles(init: ServeFilesOptions) {
  const { dir, defaultFile = "index.html" } = init;

  get("(.*)", async (_, params) => {
    // Get the key which corresponds to the group "/(.*)"
    const key = Math.max(
      ...Object.keys(params).map(parseInt).filter(Number.isInteger),
    );
    const filepath = params[key];

    let data: Uint8Array | undefined = undefined;
    let contentType = "";

    // Try file
    try {
      data = await Deno.readFile(dir + "/" + filepath);
      contentType = lookup(filepath) ?? "";
    } catch {
      // Try default file
      try {
        data = await Deno.readFile(dir + "/" + filepath + "/" + defaultFile);
        contentType = lookup(defaultFile) ?? "";
      } catch {
        // Couldn't find a file
        return;
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
