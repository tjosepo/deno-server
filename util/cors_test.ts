import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.115.1/testing/asserts.ts";

import { useCors } from "./cors.ts";
import { mock } from "../mod.ts";

Deno.test("[useCors] Headers are present", async () => {
  const fetch = await mock(() => useCors());
  const { headers } = await fetch("http://www.example.com/");

  assert(headers.has("Access-Control-Allow-Credentials"));
  assert(headers.has("Access-Control-Allow-Headers"));
  assert(headers.has("Access-Control-Allow-Methods"));
  assert(headers.has("Access-Control-Allow-Origin"));
  assert(headers.has("Access-Control-Expose-Headers"));
  assert(headers.has("Access-Control-Max-Age"));
});

Deno.test("[useCors] Block unusual header", async () => {
  const fetch = await mock(() => useCors());
  const { status } = await fetch("http://www.example.com/", {
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Headers": "foo,bar",
    },
  });
  assert(status === 403);
});

Deno.test("[useCors] Allow unusual header", async () => {
  const fetch = await mock(() => useCors({ allowHeaders: "Foo, Bar" }));
  const { status } = await fetch("http://www.example.com/", {
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Headers": "foo,bar",
    },
  });
  assert(status === 204);
});

Deno.test("[useCors] Allow origin", async () => {
  const fetch = await mock(() => useCors());
  const { status } = await fetch("http://www.example.com/", {
    method: "OPTIONS",
  });
  assert(status === 204);
});

Deno.test("[useCors] OPTION returns a 204 response", async () => {
  const fetch = await mock(() => useCors());
  const { status } = await fetch("http://www.example.com/", {
    method: "OPTIONS",
  });
  assert(status === 204);
});
