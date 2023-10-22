import { test } from "bun:test";

import {
  assertTypeScript,
  getCodeGeneratorRequest,
  getResponse,
} from "./helpers";

test(`should generate simple message`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "simple_message.proto",
      content: `syntax = "proto3";
message SimpleMessage {
  string foo = 1;
  int32 bar = 2;
  bool baz = 3;
};`,
    },
  ]);
  const resp = getResponse(req);
  const generatedTypeScript = resp.file[1].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export type SimpleMessage {
  foo?: string;
  bar?: number;
  baz?: boolean;
}`
  );
});

test(`should understand the openapiv2_schema option for required`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "message_required_via_openapi_option.proto",
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
  const generatedTypeScript = resp.file[1].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export type OptionMessage {
  foo: string;
  bar?: number;
}`
  );
});

test(`should properly reference messages`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "nested_message.proto",
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
  const generatedTypeScript = resp.file[1].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export type MessageA {
  foo?: string;
  bar?: MessageB;
}

export type MessageB {
  bar?: string;
}`
  );
});

test(`should handle well-known types`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "well_known_types.proto",
      content: `syntax = "proto3";

import "google/protobuf/duration.proto";
import "google/protobuf/timestamp.proto";

message MessageWKT {
  string foo = 1;
  google.protobuf.Duration duration = 2;
  google.protobuf.Timestamp timestamp = 3;
};`,
    },
  ]);
  const resp = getResponse(req);
  const generatedTypeScript = resp.file[1].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export type MessageWKT {
  foo?: string;
  duration?: string;
  timestamp?: string;
}`
  );
});
