import { get, post } from "./mod.ts";
import { router } from "./src/router.ts";
import { serve } from "https://deno.land/std@0.154.0/http/server.ts";
import FileResponse from "./utils/fileToRequest.ts";

serve(router(() => {
  get("/", () => FileResponse("./README.md"));

}));