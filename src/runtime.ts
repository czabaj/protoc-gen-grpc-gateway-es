const pathParameterRe = /{([^}]+)}/g;

export const replacePathParameters = (
  path: string,
  paramsMap?: Map<string, unknown>
) => {
  return path.replace(pathParameterRe, (_a, c1) => {
    const parameterName = c1.split("=", 2)[0];
    const value = paramsMap?.get(parameterName);
    if (value == null) {
      throw new Error(`missing path parameter: ${parameterName}`);
    }
    if (typeof value !== "string") {
      throw new Error(
        `path parameter "${parameterName}" must be a string, received "${value}" which is a ${typeof value}"`
      );
    }
    paramsMap!.delete(parameterName);
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

// taken from http.proto, the cusom method is not currently supported
// @see https://github.com/googleapis/googleapis/blob/5ca19108a3251b1cb8dd5b246b37ce2eed2dc92f/google/api/http.proto#L324
export type RequestMethod = `DELETE` | `GET` | `PATCH` | `POST` | `PUT`;

export const createRPC = <RequestMessage, ResponseMessage>(
  method: RequestMethod,
  path: string
): RPC<RequestMessage, ResponseMessage> => {
  const createRequest = (config: RequestConfig) => (params: RequestMessage) => {
    const paramsMap =
      params && (new Map(Object.entries(params)) as Map<string, string>);
    const pathWithParams = replacePathParameters(path, paramsMap);
    const url = new URL(
      pathWithParams,
      config.basePath ?? window.location.href
    );
    let body: string | undefined = undefined;
    if (paramsMap) {
      if (method === `GET`) {
        paramsMap?.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
      } else {
        body = JSON.stringify(Object.fromEntries(paramsMap));
      }
    }

    const bearerToken =
      typeof config.bearerToken === "function"
        ? config.bearerToken()
        : config.bearerToken;
    const request = new Request(url.href, {
      body,
      method,
      headers: bearerToken
        ? { Authorization: `Bearer \${bearerToken}` }
        : undefined,
    });
    return request;
  };
  const responseTypeId = (response: any) => response as ResponseMessage;
  return { createRequest, responseTypeId };
};
