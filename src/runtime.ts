export type Config = {
  basePath?: string;
  bearerToken?: string | (() => string);
};

export const createGetRequest =
  <Input, Output>(path: string) =>
  (config: Config) =>
  (params: Input) => {
    const url = new URL(path, config.basePath ?? window.location.href);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v as any);
      }
    }
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
