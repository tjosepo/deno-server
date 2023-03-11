import type { MethodHook, PathHook, UseHook } from "./types.ts";
import { getDispatcher } from "./dispatcher.ts";

/** Adds a request handler for all methods to the specified pathname. */
export const all: MethodHook = (pathname, handler) => {
  const dispatcher = getDispatcher();
  return dispatcher.get(pathname, handler);
};

/** Adds a `GET` request handler for the specified pathname. */
export const get: MethodHook = (pathname, handler) => {
  const dispatcher = getDispatcher();
  return dispatcher.get(pathname, handler);
};

/** Adds a `POST` request handler for the specified pathname. */
export const post: MethodHook = (pathname, handler) => {
  const dispatcher = getDispatcher();
  return dispatcher.post(pathname, handler);
};

/** Adds a `PUT` request handler for the specified pathname. */
export const put: MethodHook = (pathname, handler) => {
  const dispatcher = getDispatcher();
  return dispatcher.put(pathname, handler);
};

/** Adds a `DELETE` request handler for the specified pathname. */
export const del: MethodHook = (pathname, handler) => {
  const dispatcher = getDispatcher();
  return dispatcher.del(pathname, handler);
};

/** Adds an effect that is executed before and after a request handler. */
export const before: UseHook = (create) => {
  const dispatcher = getDispatcher();
  return dispatcher.use(create);
};

/** Adds a group of endpoints for the specified pathname. */
export const path: PathHook = (pathname, fn) => {
  const dispatcher = getDispatcher();
  return dispatcher.path(pathname, fn);
};
