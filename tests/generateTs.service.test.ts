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
  const generatedTypeScript = resp.file[1].content!;
  assertTypeScript(
    generatedTypeScript,
    `
      import { createGetRequest } from "./runtime.js";
    
      export type SimpleMessageRequest {
        foo?: string;
      }
      
      export type SimpleMessageResponse {
        bar?: number;
      }
      
      export const SimpleService_GetSimpleMessage = createGetRequest<SimpleMessageRequest, SimpleMessageResponse>("/v1/simple_message");
      `
  );
});
