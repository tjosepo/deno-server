import { assert, assertEquals } from "./deps_test.ts";
import { get, mock, path, post, useEffect } from "./mod.ts";

Deno.test("[serve] GET request", async () => {
  const fetch = await mock(() => get("/", () => "foo"));
  const response = await fetch("http://www.example.com");
  const body = await response.text();

  assertEquals(body, "foo");
});

Deno.test("[serve] POST request", async () => {
  const fetch = await mock(() => post(() => "foo"));
  const response = await fetch("http://www.example.com", { method: "POST" });
  const body = await response.text();

  assertEquals(body, "foo");
});

Deno.test("[serve] HEAD request", async () => {
  const fetch = await mock(() =>
    get(() => new Response("Hello", { headers: { foo: "bar" } }))
  );
  const response = await fetch("http://www.example.com", { method: "HEAD" });
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
  const response = await fetch("http://www.example.com/foo");
  const body = await response.text();
  assertEquals(body, "foo");
});

Deno.test("[serve] Path - Nested paths", async () => {
  const fetch = await mock(() => {
    path("/foo", () => {
      get(() => "foo");
      path("/bar", () => {
        get(() => "bar");
      });
    });
  });

  let response = await fetch("http://www.example.com/foo");
  let body = await response.text();
  assertEquals(body, "foo");

  response = await fetch("http://www.example.com/foo/bar");
  body = await response.text();
  assertEquals(body, "bar");
});

Deno.test("[serve] Path - Encapsulated effects", async () => {
  const fetch = await mock(() => {
    useEffect(() =>
      (res) => {
        res.headers.set("1", "true");
        return res;
      }
    );
    get(() => null);

    path("/foo", () => {
      useEffect(() =>
        (res) => {
          res.headers.set("2", "true");
          return res;
        }
      );
      get(() => null);
    });

    path("/bar", () => {
      useEffect(() =>
        (res) => {
          res.headers.set("3", "true");
          return res;
        }
      );
      get(() => null);

      path("/baz", () => {
        useEffect(() =>
          (res) => {
            res.headers.set("4", "true");
            return res;
          }
        );
        get(() => null);
      });
    });
  });

  let response = await fetch("http://www.example.com/");
  let headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), false);
  assertEquals(headers.has("3"), false);
  assertEquals(headers.has("4"), false);

  response = await fetch("http://www.example.com/foo");
  headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), true);
  assertEquals(headers.has("3"), false);
  assertEquals(headers.has("4"), false);

  response = await fetch("http://www.example.com/bar");
  headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), false);
  assertEquals(headers.has("3"), true);
  assertEquals(headers.has("4"), false);

  response = await fetch("http://www.example.com/bar/baz");
  headers = response.headers;
  assertEquals(headers.has("1"), true);
  assertEquals(headers.has("2"), false);
  assertEquals(headers.has("3"), true);
  assertEquals(headers.has("4"), true);
});

Deno.test("[serve] useEffect - Act as guard", async () => {
  let reached = false;
  const fetch = await mock(() => {
    useEffect(() => {
      throw new Response("guarded");
    });
    get("/", () => {
      reached = true;
      return "foo";
    });
  });
  const response = await fetch("http://www.example.com");
  const body = await response.text();

  assertEquals(body, "guarded");
  assertEquals(reached, false);
});

Deno.test("[serve] useEffect - Cleanup response", async () => {
  const fetch = await mock(() => {
    useEffect(() =>
      async (res) => {
        const body = await res.text();
        return new Response(body.toUpperCase());
      }
    );
    get("/", () => "foo");
  });
  const response = await fetch("http://www.example.com");
  const body = await response.text();

  assertEquals(body, "FOO");
});

Deno.test("[serve] useEffect - Run in order", async () => {
  let order = "";

  const fetch = await mock(() => {
    useEffect(() => {
      order += "1";
      return () => {
        order += "5";
      };
    });

    useEffect(() => {
      order += "2";
      return () => {
        order += "4";
      };
    });

    get("/", () => {
      order += "3";
    });
  });

  await fetch("http://www.example.com");
  assertEquals(order, "12345");
});

Deno.test("[serve] useEffect - Run in order inside paths", async () => {
  let order = "";

  const fetch = await mock(() => {
    useEffect(() => {
      order += "1";
      return () => {
        order += "7";
      };
    });

    path(() => {
      useEffect(() => {
        order += "3";
        return () => {
          order += "5";
        };
      });

      get(() => {
        order += "4";
      });
    });

    useEffect(() => {
      order += "2";
      return () => {
        order += "6";
      };
    });
  });

  await fetch("http://www.example.com");
  assertEquals(order, "1234567");
});
