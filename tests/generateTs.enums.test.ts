import { test } from "bun:test";

import {
  assertTypeScript,
  getCodeGeneratorRequest,
  getResponse,
} from "./helpers";

test(`should generate simple enums`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "simple_enum.proto",
      content: `syntax = "proto3";
enum FooEnum {
  FOO = 0;
  BAR = 1;
  BAZ = 2;
};
    `,
    },
  ]);
  const resp = getResponse(req);
  const generatedTypeScript = resp.file[0].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export enum FooEnum {
  FOO = 'FOO',
  BAR = 'BAR',
  BAZ = 'BAZ',
}`
  );
});

test(`subtracts common prefix from the enum`, async () => {
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: "state_enum.proto",
      content: `syntax = "proto3";
enum State {
  STATE_FOO = 0;
  STATE_BAR = 1;
  STATE_BAZ = 2;
};
    `,
    },
  ]);
  const resp = getResponse(req);
  const generatedTypeScript = resp.file[0].content!;
  assertTypeScript(
    generatedTypeScript,
    `
export enum State {
  FOO = 'STATE_FOO',
  BAR = 'STATE_BAR',
  BAZ = 'STATE_BAZ',
}`
  );
});
