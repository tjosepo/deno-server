import { get, path, serve } from "server";
import { useCors, useLogger } from "server/plugin";

serve(() => {
  useLogger();
  useCors();

  get("/", () => {
    return Response.json({ foo: "bar" });
  });
});
