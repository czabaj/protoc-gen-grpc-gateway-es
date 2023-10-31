/**
 * Retrieves property from an object with path specified by dot notation.
 */
export const get = (obj: Record<string, any>, keys: string) => {
  const segments = keys.split(".");
  let value = obj;
  do {
    value = value[segments.shift()!];
  } while (typeof value === `object` && value && segments.length);
  return value;
};

/**
 * Deletes property from an object with path specified by dot notation.
 */
export const unset = (obj: Record<string, any>, keys: string) => {
  const segments = keys.split(".");
  let parent = obj;
  while (typeof parent === `object` && parent && segments.length > 1) {
    parent = parent[segments.shift()!];
  }
  if (typeof parent === `object` && parent && segments.length === 1) {
    delete parent[segments[0]];
  }
};

const leadingSlashRe = /^\/+/;
export const removeLeadingSlash = (path: string) => {
  return path.replace(leadingSlashRe, ``);
};

export const addTrailingSlash = (path: string) => {
  return path.endsWith(`/`) ? path : `${path}/`;
};

export const isScalarType = (
  value: any
): value is boolean | number | string => {
  switch (typeof value) {
    case `object`:
    case `undefined`:
      return false;
    default:
      return true;
  }
};

const pathParameterRe = /{([^}]+)}/g;
/**
 * Replaces path parameters in the path with values from the request message. It also removes the consumed parameters
 * from the request message, so the object passed in is mutated and contains only the remaining fields.
 */
export const replacePathParameters = <RequestMessage>(
  path: string,
  requestMessage?: RequestMessage
) => {
  return path.replace(pathParameterRe, (_a, c1) => {
    const parameterPath = c1.split("=", 2)[0] as string;
    // the path might contain dot notaion to nested fields
    const value = requestMessage && get(requestMessage, parameterPath);
    if (value == null) {
      throw new Error(`missing path parameter: ${parameterPath}`);
    }
    if (typeof value !== "string") {
      throw new Error(
        `path parameter "${parameterPath}" must be a string, received "${value}" which is "${typeof value}"`
      );
    }
    // TODO: we can validate the value against the pattern specified in the path
    unset(requestMessage!, parameterPath);
    return value;
  });
};

export type RequestConfig = {
  basePath?: string;
  bearerToken?: string | (() => string);
};

export type RPC<RequestMessage, ResponseMessage> = {
  createRequest: (
    config: RequestConfig
  ) => (variables: RequestMessage) => Request;
  responseTypeId: (response: any) => ResponseMessage;
};

// taken from http.proto, only the cusom method is not currently supported
// @see https://github.com/googleapis/googleapis/blob/5ca19108a3251b1cb8dd5b246b37ce2eed2dc92f/google/api/http.proto#L324
export type HttpMethod = `DELETE` | `GET` | `PATCH` | `POST` | `PUT`;

/**
 * Provides two basic functions
 * - `createRequest` which accepts a request message and returns a `Request` object, and
 * - `responseTypeId` which is just identity function that types the argument as appropriate `ResponseMessage`
 * @param httpMethod - the HTTP method of the RPC, read from the `google.api.http` option.
 * @param path - the URL of the RPC, read from the `google.api.http` option, may include path parameters.
 * @param bodyKey - an optional key to nested property of the request message that should be used as the request body.
 */
export const createRPC = <RequestMessage, ResponseMessage>(
  httpMethod: HttpMethod,
  path: string,
  bodyKey?: string
): RPC<RequestMessage, ResponseMessage> => {
  const createRequest = (config: RequestConfig) => (params: RequestMessage) => {
    let paramsClone = params && { ...params };
    const pathWithParams = replacePathParameters(path, paramsClone);
    // we must remove leading slash from the path and add trailing slash to the base path, otherwise only the hostname
    // part of the base path will be used :/
    const url = config.basePath
      ? new URL(
          removeLeadingSlash(pathWithParams),
          addTrailingSlash(config.basePath)
        )
      : new URL(pathWithParams, window.location.href);

    let body: string | undefined = undefined;
    if (params && httpMethod !== `GET`) {
      if (bodyKey) {
        body = JSON.stringify(get(params, bodyKey));
        unset(paramsClone!, bodyKey);
      } else {
        body = JSON.stringify(params);
        paramsClone = undefined as any;
      }
    }

    if (paramsClone) {
      for (const [k, v] of Object.entries(paramsClone)) {
        if (isScalarType(v)) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const headers = new Headers();
    if (body) {
      headers.set("Content-Type", "application/json");
    }
    const bearerToken =
      typeof config.bearerToken === "function"
        ? config.bearerToken()
        : config.bearerToken;
    if (bearerToken) {
      headers.set("Authorization", `Bearer ${bearerToken}`);
    }

    const request = new Request(url.href, {
      body,
      method: httpMethod,
      headers,
    });
    return request;
  };
  const responseTypeId = (response: any) => response as ResponseMessage;
  return { createRequest, responseTypeId };
};
