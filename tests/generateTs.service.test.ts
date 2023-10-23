import { test } from "bun:test";

import {
  assertTypeScript,
  findResponseForInputFile,
  getCodeGeneratorRequest,
  getResponse,
} from "./helpers";

test(`should generate simple simple service`, async () => {
  const inputFileName = `simple_service.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
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
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
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

test(`should handle path with path parameter`, async () => {
  const inputFileName = `service_with_path_parameter.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";

      import "google/api/annotations.proto";
      
      service WithPathParameterService {
        rpc GetWithPathParameter(WithPathParameterRequest) returns (WithPathParameterResponse) {
          option (google.api.http) = {get: "/v1/{name_test=projects/*/documents/*}:customMethod"};
        }; 
      };
      
      message WithPathParameterRequest {
        string name_test = 1;
      };

      message WithPathParameterResponse {
        int32 bar = 1;
      };
      `,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
      import { createGetRequest } from "./runtime.js";
    
      export type WithPathParameterRequest {
        nameTest?: string;
      }
      
      export type WithPathParameterResponse {
        bar?: number;
      }
      
      export const WithPathParameterService_GetWithPathParameter = createGetRequest<WithPathParameterRequest, WithPathParameterResponse>("/v1/{nameTest=projects/*/documents/*}:customMethod");
      `
  );
});
