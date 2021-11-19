import { cyan, green, red, white, yellow } from "./deps.ts";
import { useEffect } from "../mod.ts";

export default function logger(request: Request) {
  const { method, url } = request;
  const start = Date.now();
  return (response: Response) => {
    const ms = Date.now() - start;
    const { status } = response;
    const statusText = setStatus(status);

    console.log(`${statusText} ${method} ${url} ${ms}ms`);
  };
}

export const useLogger = () => useEffect(logger);

function setStatus(status: number) {
  let color: (str: string) => string = white;

  if (status >= 100 && status < 200) {
    color = cyan;
  }

  if (status >= 200 && status < 300) {
    color = green;
  }

  if (status >= 300 && status < 400) {
    color = yellow;
  }

  if (status >= 400 && status < 600) {
    color = red;
  }

  return color(`[${status}]`);
}
