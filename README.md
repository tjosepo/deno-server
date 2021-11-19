# deno_server

![Tests](https://github.com/tjosepo/deno-server/actions/workflows/tests.yml/badge.svg)


The ubiquitous hello world example:

```ts
import { get, serve } from "https://deno.land/x/something/mod.ts";

serve(() => {
  get("/", () => "Hello world!");
});
```

## Path hook

The _Path_ hook lets you group endpoints together.

```ts
import {
  del,
  get,
  patch,
  path,
  post,
  serve,
} from "https://deno.land/x/something/mod.ts";

serve(() => {
  get("/hello", () => "Hello world!");

  path("/user", () => {
    get(getAllUsers);
    post(createUser);
    path("/:id", () => {
      get(getOneUser);
      patch(updateUser);
      del(deleteUser);
    });
  });
}, { port: 8080 });
```

The _Path_ hook can also be used to encapsulate side effects from the _Effect_
hook. An effect declared inside a path will only affect endpoints from that path
and it's subpaths.

## Effect Hook

The _Effect_ hook lets you perform side effects in a component. It serves the
same purpose as middlewares and guards from other frameworks. Effects are
performed before every request.

```ts
import { get, serve, useEffect } from "https://deno.land/x/something/mod.ts";

serve(() => {
  // Similar to middlewares and guards:
  useEffect((request) => {
    if (request.method !== "GET") {
      throw new Response("Method Not Allowed", {
        status: 405,
        headers: new Headers({ allow: "GET" }),
      });
    }
  });

  get("/", () => "Hello world!");
});
```

Effects may also return a cleanup function to be performed after the request
(even if an exception occurred). Cleanup functions may return a new response
object.

```ts
import { get, serve, useEffect } from "https://deno.land/x/something/mod.ts";

serve(() => {
  // Implements a logger
  useEffect((request) => {
    const start = Date.now();

    return (response) => {
      const ms = Date.now() - start;
      console.log(
        `[${response.status}] ${request.method} ${request.url} ${ms}ms`,
      );
    };
  });

  get("/", () => "Hello world!");
});
```

Unlike middlewares, **effects cannot modify the request object**. The request
object that a route receives is the request object that was received by the
server. However, effects can interrupt the processing of a request by throwing.

## Testing

You can use the _Mock_ hook to test your components. It returns a special fetch
function that can be used to simulate a request.

```ts
export { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { get, mock } from "https://deno.land/x/something/mod.ts";

async function test() {
  const fetch = mock(() => get("/foo", "Hello world!"));
  const response = await fetch("http://test.com/foo");
  assertEquals(await response.text(), "Hello world!");
}
```
