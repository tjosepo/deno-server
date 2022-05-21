import { assertEquals } from "./deps_test.ts";
import { get, mock, path, post, use } from "../mod.ts";

Deno.test("[serve] GET request", async () => {
  const fetch = await mock(() => get("/", () => "foo"));
  const response = await fetch("/");
  const body = await response.text();

  assertEquals(body, "foo");
});

Deno.test("[serve] POST request", async () => {
  const fetch = await mock(() => post("/", () => "foo"));
  const response = await fetch("/", { method: "POST" });
  const body = await response.text();

  assertEquals(body, "foo");
});

Deno.test("[serve] HEAD request", async () => {
  const fetch = await mock(() =>
    get("/", () => new Response("Hello", { headers: { foo: "bar" } }))
  );
  const response = await fetch("/", { method: "HEAD" });
  assertEquals(response.headers.get("foo"), "bar");

  const body = await response.text();
  assertEquals(body, "");
});

Deno.test("[serve] Path - Simple request", async () => {
  const fetch = await mock(() => {
    path("/foo", () => {
      get("/", () => "foo");
    });
  });
  const response = await fetch("/foo/");
  const body = await response.text();
  assertEquals(body, "foo");
});

Deno.test("[serve] Path - Nested paths", async () => {
  const fetch = await mock(() => {
    path("/foo", () => {
      get("/", () => "foo");
      path("/bar", () => {
        get("/", () => "bar");
      });
    });
  });

  let response = await fetch("/foo/");
  let body = await response.text();
  assertEquals(body, "foo");

  response = await fetch("/foo/bar/");
  body = await response.text();
  assertEquals(body, "bar");
});

Deno.test("[serve] Path - Encapsulated effects", async () => {
  const fetch = await mock(() => {
    use(() =>
      ({ response }) => {
        response.headers.set("1", "true");
        return response;
      }
    );
    get("/", () => null);

    path("/foo", () => {
      use(() =>
        ({ response }) => {
          response.headers.set("2", "true");
          return response;
        }
      );
      get("/", () => null);
    });

    path("/bar", () => {
      use(() =>
        ({ response }) => {
          response.headers.set("3", "true");
          return response;
        }
      );
      get("/", () => null);

      path("/baz", () => {
        use(() =>
          ({ response }) => {
            response.headers.set("4", "true");
            return response;
          }
        );
        get("/", () => null);
      });
    });
  });

  let response = await fetch("/");
  let headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), false);
  assertEquals(headers.has("3"), false);
  assertEquals(headers.has("4"), false);

  response = await fetch("/foo/");
  headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), true);
  assertEquals(headers.has("3"), false);
  assertEquals(headers.has("4"), false);

  response = await fetch("/bar/");
  headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), false);
  assertEquals(headers.has("3"), true);
  assertEquals(headers.has("4"), false);

  response = await fetch("/bar/baz/");
  headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), false);
  assertEquals(headers.has("3"), true);
  assertEquals(headers.has("4"), true);
});

Deno.test("[serve] use - Act as guard", async () => {
  let reached = false;
  const fetch = await mock(() => {
    use(() => {
      throw new Response("guarded");
    });
    get("/", () => {
      reached = true;
      return "foo";
    });
  });
  const response = await fetch("/");
  const body = await response.text();

  assertEquals(body, "guarded");
  assertEquals(reached, false);
});

Deno.test("[serve] use - Cleanup response", async () => {
  const fetch = await mock(() => {
    use(() =>
      async ({ response }) => {
        const body = await response.text();
        return new Response(body.toUpperCase());
      }
    );
    get("/", () => "foo");
  });
  const response = await fetch("/");
  const body = await response.text();

  assertEquals(body, "FOO");
});

Deno.test("[serve] use - Run in order", async () => {
  let order = "";

  const fetch = await mock(() => {
    use(() => {
      order += "1";
      return () => {
        order += "5";
      };
    });

    use(() => {
      order += "2";
      return () => {
        order += "4";
      };
    });

    get("/", () => {
      order += "3";
    });
  });

  await fetch("/");
  assertEquals(order, "12345");
});

Deno.test("[serve] use - Run in order inside paths", async () => {
  let order = "";

  const fetch = await mock(() => {
    use(() => {
      order += "1";
      return () => {
        order += "7";
      };
    });

    path("/", () => {
      use(() => {
        order += "3";
        return () => {
          order += "5";
        };
      });

      get("", () => {
        order += "4";
      });
    });

    use(() => {
      order += "2";
      return () => {
        order += "6";
      };
    });
  });

  await fetch("/");
  assertEquals(order, "1234567");
});
