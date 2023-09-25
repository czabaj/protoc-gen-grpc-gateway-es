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
};
    `,
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
