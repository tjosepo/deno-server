import { contentType, posix } from "./deps.ts";
import { get } from "../mod.ts";

export interface StaticFilesOptions {
  /**
   * Index file for serving a directory.
   *
   * Default: `index.html`
   */
  index?: string;
  /**
   * Enable directory browsing.
   *
   * Default: `false`
   */
  browse?: boolean;
}

/** Plugins to enable serving files from a directory. */
export function useStatic(root: string, options: StaticFilesOptions = {}) {
  const { index = "index.html", browse = false } = options;
  const folder = posix.normalize(root);

  get(":filepath(.*)", async ({ request, params }) => {
    const { filepath } = params;

    let file: Deno.FsFile | undefined;
    let type = "application/octet-stream";

    // Try file
    try {
      const filename = posix.join(folder, filepath);
      file = await Deno.open(filename, { read: true });
      type = contentType(filename) ?? type;
    } catch {
      // Index file doesn't exist
    }

    // Try index file
    if (!file) {
      try {
        const filename = posix.join(folder, filepath, index);
        file = await Deno.open(filename, { read: true });
        type = contentType(filename) ?? type;
      } catch {
        // Index file doesn't exist
      }
    }

    // Try dir
    if (!file && browse) {
      try {
        const dir = posix.join(folder, filepath);
        const title = "Index of " + new URL(request.url).pathname;
        let html = `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
</head>
<body>
<h1>${title}</h1>
<ul>
`;
        for await (const entry of Deno.readDir(dir)) {
          html += `<li><a href="${
            posix.join(
              new URL(request.url).pathname,
              entry.name,
            )
          }">
          ${(entry.isDirectory ? "/" : "") + entry.name}
          </a></li>`;
        }
        html += `
</ul>
</body>
</html>`;

        return new Response(html, {
          headers: { "content-type": "text/html" },
        });
      } catch {
        //doesn't exist
      }
    }

    if (!file) return;

    const stat = await file.stat();
    const stream = file.readable;
    const contentLength = stat.size;

    return new Response(stream, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(contentLength),
      },
    });
  });
}
