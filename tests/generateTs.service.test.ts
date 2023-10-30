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
      import { createGetRPC } from "./runtime.js";
    
      export type SimpleMessageRequest {
        foo?: string;
      }
      
      export type SimpleMessageResponse {
        bar?: number;
      }
      
      export const SimpleService_GetSimpleMessage = createGetRPC<SimpleMessageRequest, SimpleMessageResponse>("/v1/simple_message");
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
      import { createGetRPC } from "./runtime.js";
    
      export type WithPathParameterRequest {
        nameTest?: string;
      }
      
      export type WithPathParameterResponse {
        bar?: number;
      }
      
      export const WithPathParameterService_GetWithPathParameter = createGetRPC<WithPathParameterRequest, WithPathParameterResponse>("/v1/{nameTest=projects/*/documents/*}:customMethod");
      `
  );
});

test(`should do proper linking when service reference other file`, async () => {
  const inputFileNameResource = `linking_resource.proto`;
  const inputFileNameService = `linking_service.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileNameResource,
      content: `syntax = "proto3";

      enum FlipEnum {
        FLIP = 0;
        FLAP = 1;
        FLOP = 2;
      };
      
      message FlipMessage {
        FlipEnum flip = 1;
      };
      `,
    },
    {
      name: inputFileNameService,
      content: `syntax = "proto3";

      import "google/api/annotations.proto";
      import "linking_resource.proto";
      
      service LinkingService {
        rpc GetLinkedResource(GetLinkiedRequest) returns (GetLinkedResponse) {
          option (google.api.http) = {get: "/v1/{name_test=projects/*/documents/*}:customMethod"};
        }; 
      };
      
      message GetLinkiedRequest {
        string name_test = 1;
      };

      message GetLinkedResponse {
        FlipMessage flip = 1;
      };
      `,
    },
  ]);
  const resp = getResponse(req);
  const outputFileResource = findResponseForInputFile(
    resp,
    inputFileNameResource
  );
  const outputFileService = findResponseForInputFile(
    resp,
    inputFileNameService
  );
  assertTypeScript(
    outputFileResource.content!,
    `
      export enum FlipEnum {
        FLIP = 'FLIP',
        FLAP = 'FLAP',
        FLOP = 'FLOP',
      }
      
      export type FlipMessage {
        flip?: FlipEnum;
      }
      `
  );
  assertTypeScript(
    outputFileService.content!,
    `
    import type { FlipMessage } from "./linking_resource_pb.js";
    import { createGetRPC } from "./runtime.js";
      
    export type GetLinkiedRequest {
      nameTest?: string;
    }
    
    export type GetLinkedResponse {
      flip?: FlipMessage;
    }
    
    export const LinkingService_GetLinkedResource = createGetRPC<GetLinkiedRequest, GetLinkedResponse>("/v1/{nameTest=projects/*/documents/*}:customMethod");
      `
  );
});
