import { test } from "bun:test";

import {
  assertTypeScript,
  createPlugin,
  getCodeGeneratorRequest,
} from "./helpers";

test(`should generate simple message`, async () => {
  const plugin = createPlugin();
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
  const resp = plugin.run(req);
  const generatedTypeScript = resp.file[0].content!;
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
  const plugin = createPlugin();
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
};`,
    },
  ]);
  const resp = plugin.run(req);
  const generatedTypeScript = resp.file[0].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export type OptionMessage {
  foo: string;
}`
  );
});
