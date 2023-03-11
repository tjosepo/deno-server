import { contentType as getContentType } from "https://deno.land/std@0.156.0/media_types/mod.ts";
import { extname } from "https://deno.land/std@0.156.0/path/mod.ts";

export default async function FileResponse(path: string | URL) {
  const file = await Deno.open(path, { read: true });
  const stat = await file.stat();
  const ext = extname(path.toString());
  const contentType = getContentType(ext) ?? "application/octet";

  const headers: Record<string, string | undefined> = {
    "content-type": contentType,
    "content-length": stat.size.toString(),
    "last-modified": stat.mtime?.toUTCString(),
  }

  // Remove undefined header fields
  for (const header in headers) {
    if (headers[header] === undefined) {
      delete headers[header];
    }
  }

  return new Response(file.readable, {
    headers: headers as HeadersInit
  });
}