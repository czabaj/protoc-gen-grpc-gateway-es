import { test } from "bun:test";

import {
  assertTypeScript,
  findResponseForInputFile,
  getCodeGeneratorRequest,
  getResponse,
} from "./helpers";

test(`should generate simple enums`, async () => {
  const inputFileName = `simple_enum.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
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
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export enum FooEnum {
  FOO = 'FOO',
  BAR = 'BAR',
  BAZ = 'BAZ',
}`
  );
});

test(`subtracts common prefix from the enum`, async () => {
  const inputFileName = `state_enum.proto`;
  const req = await getCodeGeneratorRequest(`target=ts`, [
    {
      name: inputFileName,
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
  const outputFile = findResponseForInputFile(resp, inputFileName);
  assertTypeScript(
    outputFile.content!,
    `
export enum State {
  FOO = 'STATE_FOO',
  BAR = 'STATE_BAR',
  BAZ = 'STATE_BAZ',
}`
  );
});
