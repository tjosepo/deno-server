import { get, path, serve } from "./mod.ts";
import { serveFiles, useCors, useLogger } from "./util/mod.ts";

serve(() => {
  useLogger();
  useCors({ allowHeaders: "Content-Type" });

  path(() => {
    serveFiles({ dir: "./build" });
  });

  // path("foo", () => {
  //   get(() => "foo");
  //   path("bar", () => {
  //     get(() => "bar");
  //   });
  // });

  get("/", () => {
    return "Hello world!";
  });
});