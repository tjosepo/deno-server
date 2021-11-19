import {
  Status,
  STATUS_TEXT,
} from "https://deno.land/std@0.115.1/http/http_status.ts";

interface ResponseInitHeadersOnly {
  headers?: HeadersInit;
}

type GenericResponse = (
  body?: BodyInit | null,
  init?: ResponseInitHeadersOnly,
) => Response;

type MethodNotAllowedResponse = (
  allow: string,
  body?: BodyInit | null,
  init?: ResponseInitHeadersOnly,
) => Response;

type RedirectResponse = (
  location: string,
  init?: ResponseInitHeadersOnly,
) => Response;

export const NoContent = (init: ResponseInitHeadersOnly = {}) => {
  const status = Status.NoContent;
  const statusText = STATUS_TEXT.get(status);
  return new Response(undefined, { status, statusText, headers: init.headers });
};

export const Found: RedirectResponse = (location, init = {}) => {
  const status = Status.Found;
  const statusText = STATUS_TEXT.get(status);
  const headers = new Headers(init.headers);
  headers.set("Location", location);
  return new Response(undefined, { status, statusText, headers: headers });
};

/** 400 */
export const BadRequest: GenericResponse = (body, init = {}) => {
  const status = Status.BadRequest;
  const statusText = STATUS_TEXT.get(status);
  body = body ?? `${status} ${statusText}`;
  return new Response(body, { status, statusText, headers: init.headers });
};

export const Unauthorized: GenericResponse = (body, init = {}) => {
  const status = Status.Unauthorized;
  const statusText = STATUS_TEXT.get(status);
  body = body ?? `${status} ${statusText}`;
  return new Response(body, { status, statusText, headers: init.headers });
};

export const PaymentRequired: GenericResponse = (body, init = {}) => {
  const status = Status.PaymentRequired;
  const statusText = STATUS_TEXT.get(status);
  body = body ?? `${status} ${statusText}`;
  return new Response(body, { status, statusText, headers: init.headers });
};

export const Forbidden: GenericResponse = (body, init = {}) => {
  const status = Status.Forbidden;
  const statusText = STATUS_TEXT.get(status);
  body = body ?? `${status} ${statusText}`;
  return new Response(body, { status, statusText, headers: init.headers });
};

/** 404 */
export const NotFound: GenericResponse = (body, init = {}) => {
  const status = Status.NotFound;
  const statusText = STATUS_TEXT.get(status);
  body = body ?? `${status} ${statusText}`;
  return new Response(body, { status, statusText, headers: init.headers });
};

export const MethodNotAllowed: MethodNotAllowedResponse = (
  allow,
  body,
  init = {},
) => {
  const status = Status.MethodNotAllowed;
  const statusText = STATUS_TEXT.get(status);
  body = body ?? `${status} ${statusText}`;
  const headers = new Headers(init.headers);
  headers.set("Allow", allow);
  return new Response(body, { status, statusText, headers });
};
