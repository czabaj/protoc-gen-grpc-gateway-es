import { expect, test } from "bun:test";

import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";
import ts from "typescript";

import { getCodeGeneratorRequest } from "./helpers";
import { generateTs } from "../src/generateTs";

const toTypeScriptAST = (typeScriptSource: string): ts.SourceFile =>
  ts.createSourceFile(`void.ts`, typeScriptSource, ts.ScriptTarget.Latest);

// removes comments and formats the code
const cleanTypeScript = (typeScriptSource: string): string => {
  const ast = toTypeScriptAST(typeScriptSource);
  return ts.createPrinter({ removeComments: true }).printFile(ast);
};

const createPlugin = () => {
  return createEcmaScriptPlugin({
    name: "test-plugin",
    version: "v0.1.0",
    generateTs,
  });
};

test("should print runtime imports", async () => {
  const plugin = createPlugin();
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
  const resp = plugin.run(req);
  const cleaned = cleanTypeScript(resp.file[0].content!);
  expect(cleaned).toBe(
    cleanTypeScript(`export enum FooEnum {
  FOO = 'FOO',
  BAR = 'BAR',
  BAZ = 'BAZ',
  }`)
  );
});
