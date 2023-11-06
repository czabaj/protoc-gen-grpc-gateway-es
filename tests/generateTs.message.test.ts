import { test } from "bun:test";

import {
  assertTypeScript,
  findResponseForInputFile,
  getCodeGeneratorRequest,
  getResponse,
} from "./helpers";

test(`should generate simple message`, async () => {
  const inputFileName = `simple_message.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";
message SimpleMessage {
  string foo = 1;
  int32 bar = 2;
  bool baz = 3;
};`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export type SimpleMessage = {
  foo?: string;
  bar?: number;
  baz?: boolean;
}`
  );
});

test(`should understand the openapiv2_schema option for required`, async () => {
  const inputFileName = `message_required_via_openapi_option.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";

import "protoc-gen-openapiv2/options/annotations.proto";

message OptionMessage {
  option (grpc.gateway.protoc_gen_openapiv2.options.openapiv2_schema) = {
    json_schema: {
      required: [
        "foo"
      ]
    }
  };
  string foo = 1;
  int32 bar = 2;
};`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export type OptionMessage = {
  foo: string;
  bar?: number;
}`
  );
});

test(`should properly reference messages`, async () => {
  const inputFileName = `message_references.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";

message MessageA {
  string foo = 1;
  MessageB bar = 2;
};

message MessageB {
  string bar = 1;
}`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export type MessageA = {
  foo?: string;
  bar?: MessageB;
}

export type MessageB = {
  bar?: string;
}`
  );
});

test(`should handle well-known types`, async () => {
  const inputFileName = `well_known_types.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";

import "google/protobuf/duration.proto";
import "google/protobuf/timestamp.proto";
import "google/api/field_behavior.proto";

message MessageWKT {
  string foo = 1;
  google.protobuf.Duration duration = 2;
  google.protobuf.Timestamp timestamp = 3 [(google.api.field_behavior) = OUTPUT_ONLY];
};`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export type MessageWKT = {
  foo?: string;
  duration?: string | null;
  timestamp?: string;
}`
  );
});

test(`should handle oneof`, async () => {
  const inputFileName = `one_of_test.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";
      
message OneOfTest {
  string flip = 1;
  int32 flap = 2;
  oneof toss {
    string heads = 3;
    int32 tails = 4;
  }
  oneof hand {
    bool left = 5;
    bool right = 6;
  }
}`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export type OneOfTest = 
{
  flip?: string;
  flap?: number;
}
& ({ heads?: string } | { tails?: number })
& ({ left?: boolean } | { right?: boolean });`
  );
});

test(`should handle repeated well-known type`, async () => {
  const inputFileName = `repeated_well_known.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";

import "google/protobuf/timestamp.proto";
import "google/api/field_behavior.proto";

message MessageRepeatedWKT {
  string flip = 1;
  repeated google.protobuf.Timestamp timestamp = 2 [(google.api.field_behavior) = OUTPUT_ONLY];
};`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export type MessageRepeatedWKT = {
  flip?: string;
  timestamp?: string[];
}`
  );
});

test(`should convert int64 to BigIntString type`, async () => {
  const inputFileName = `int64_message.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";
message BigIntMessage {
  int64 size_in_storage = 1;
};`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
import type { BigIntString } from "./runtime.js";

export type BigIntMessage = {
  sizeInStorage?: BigIntString;
}`
  );
});

test(`should convert bytes to BytesString type`, async () => {
  const inputFileName = `bytes_message.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
      content: `syntax = "proto3";
message BytesMessage {
  bytes content = 1;
};`,
    },
  ]);
  const resp = getResponse(req);
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
import type { BytesString } from "./runtime.js";

export type BytesMessage = {
  content?: BytesString;
}`
  );
});
