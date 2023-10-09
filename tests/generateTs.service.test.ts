import { test } from "bun:test";

import {
  assertTypeScript,
  getCodeGeneratorRequest,
  getResponse,
} from "./helpers";

test(`should generate simple simple service`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "simple_service.proto",
      content: `syntax = "proto3";

      import "google/api/annotations.proto";
      
      service SimpleService {
        rpc GetSimpleMessage(SimpleMessageRequest) returns (SimpleMessageResponse) {
          option (google.api.http) = {get: "/v1/simple_message"};
        }; 
      };
      
      message SimpleMessageRequest {
        string foo = 1;
      };
      
      message SimpleMessageResponse {
        int32 bar = 1;
      };`,
    },
  ]);
  const resp = getResponse(req);
  const generatedTypeScript = resp.file[0].content!;
  assertTypeScript(
    generatedTypeScript,
    `
      export type SimpleMessageRequest {
        foo?: string;
      }
      
      export type SimpleMessageResponse {
        bar?: number;
      }
      
      export const SimpleService_GetSimpleMessage = (config: any) => (params: SimpleMessageRequest) => {
        const url = new URL("/v1/simple_message", config.basePath ?? window.location.href);
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
          }
        }
        const bearerToken = typeof config.bearerToken === "function" ? config.bearerToken() : config.bearerToken;
        const request = new Request(url.href, {
          method: "GET",
          headers bearerToken ? {Authorization: \`Bearer \${bearerToken}\`} : undefined,
        })
        const typeId = (response: any) => response as SimpleMessageResponse;
        return { request, typeId }
      };`
  );
});
