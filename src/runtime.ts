export type Config = {
  basePath?: string;
  bearerToken?: string | (() => string);
};

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

export const createGetRequest =
  <Input, Output>(path: string) =>
  (config: Config) =>
  (params: Input) => {
    const paramsMap =
      params && (new Map(Object.entries(params)) as Map<string, string>);
    const pathWithParams = replacePathParameters(path, paramsMap);
    const url = new URL(
      pathWithParams,
      config.basePath ?? window.location.href
    );
    paramsMap?.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    const bearerToken =
      typeof config.bearerToken === "function"
        ? config.bearerToken()
        : config.bearerToken;
    const request = new Request(url.href, {
      method: "GET",
      headers: bearerToken
        ? { Authorization: `Bearer \${bearerToken}` }
        : undefined,
    });

    const typeId = (response: any) => response as Output;
    return { request, typeId };
  };
