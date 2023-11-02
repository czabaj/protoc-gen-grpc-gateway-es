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

// taken from http.proto, only the cusom method is not currently supported
// @see https://github.com/googleapis/googleapis/blob/5ca19108a3251b1cb8dd5b246b37ce2eed2dc92f/google/api/http.proto#L324
export type HttpMethod = `DELETE` | `GET` | `PATCH` | `POST` | `PUT`;

export class RPC<RequestMessage, ResponseMessage> {
  /**
   * HTTP method of the RPC as described by the google.api.http option
   */
  readonly method: HttpMethod;
  /**
   * URL path of the RPC as described by the google.api.http option
   */
  readonly path: string;
  /**
   * Optional: the path to body in RequestMessage, if specified by the google.api.http option
   */
  readonly bodyKey?: string;

  constructor(method: HttpMethod, path: string, bodyKey?: string) {
    this.method = method;
    this.path = path;
    this.bodyKey = bodyKey;
  }

  /**
   * Creates a JavaScript Request object which can be used directly with fetch API. If you are using other HTTP client,
   * you can read the request properties from the Request object.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request
   * @param config the request configuration for the RPC
   * @param params the request message for the RPC as defined in the proto file
   */
  createRequest(config: RequestConfig, params: RequestMessage): Request {
    let paramsClone = params && { ...params };
    const pathWithParams = replacePathParameters(this.path, paramsClone);
    // we must remove leading slash from the path and add trailing slash to the base path, otherwise only the hostname
    // part of the base path will be used :/
    const url = config.basePath
      ? new URL(
          removeLeadingSlash(pathWithParams),
          addTrailingSlash(config.basePath)
        )
      : new URL(pathWithParams, window.location.href);

    let body: string | undefined = undefined;
    if (params && this.method !== `GET`) {
      if (this.bodyKey) {
        body = JSON.stringify(get(params, this.bodyKey));
        unset(paramsClone!, this.bodyKey);
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
      headers.set("Content-Type", "application/json; charset=utf-8");
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
      method: this.method,
      headers,
    });
    return request;
  }

  /**
   * Simple identity function that just types the input as ResponseMessage.
   * Usefull for TypeScript code to assing a type to the response.
   */
  responseTypeId(response: any): ResponseMessage {
    return response as ResponseMessage;
  }
}
