import { expect } from "bun:test";
import { unlink } from "node:fs/promises";

import {
  CodeGeneratorRequest,
  CodeGeneratorResponse,
  FileDescriptorSet,
} from "@bufbuild/protobuf";
import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";
import ts from "typescript";

import { generateTs } from "../src/generateTs";

type NonEmptyString = Exclude<string, "">;
type ProtoFile = {
  name: NonEmptyString;
  content: `syntax = "${`proto2` | `proto3`}";${string}`;
};

export async function getCodeGeneratorRequest(
  parameter = "",
  protoFiles: ProtoFile[]
) {
  const filePaths: string[] = [];
  try {
    const cwd = new URL(`./proto/`, import.meta.url).pathname;
    await Promise.all(
      protoFiles.map((protoFile) => {
        const filePath = `${cwd}${protoFile.name}`;
        const file = Bun.file(filePath);
        const fileExists = file.size > 0;
        if (fileExists) {
          throw new Error(
            `File ${protoFile.name} already exists. Please use distinct file names in the tests.`
          );
        }
        filePaths.push(filePath);
        return Bun.write(file, protoFile.content);
      })
    );
    const proc = Bun.spawn(
      [
        `buf`,
        `build`,
        `--output`,
        `-#format=bin`,
        ...filePaths.flatMap((f) => [`--path`, `"${f}"`]),
      ],
      {
        cwd,
      }
    );
    const fileDescriptorBuffer = await new Response(proc.stdout).arrayBuffer();
    const fileDescriptorBin = new Uint8Array(fileDescriptorBuffer);
    // Only binary format currently preserves extensions
    // @see https://github.com/bufbuild/protobuf-es/issues/564
    const fileDescriptorSet = FileDescriptorSet.fromBinary(fileDescriptorBin);
    return new CodeGeneratorRequest({
      parameter,
      fileToGenerate: protoFiles.map((f) => f.name),
      protoFile: fileDescriptorSet.file,
    });
  } finally {
    await Promise.allSettled(filePaths.map((fp) => unlink(fp)));
  }
}

const toTypeScriptAST = (typeScriptSource: string): ts.SourceFile =>
  ts.createSourceFile(`virtual.ts`, typeScriptSource, ts.ScriptTarget.Latest);

// removes comments and formats the code
const cleanTypeScript = (typeScriptSource: string): string => {
  const ast = toTypeScriptAST(typeScriptSource);
  return ts.createPrinter({ removeComments: true }).printFile(ast);
};

export const assertTypeScript = (
  typeScriptActual: string,
  typeScriptExpectec
): void => {
  expect(cleanTypeScript(typeScriptActual)).toBe(
    cleanTypeScript(typeScriptExpectec)
  );
};

const createPlugin = () => {
  return createEcmaScriptPlugin({
    name: "test-plugin",
    version: "v0.1.0",
    generateTs,
  });
};

export const getResponse = (
  req: CodeGeneratorRequest
): CodeGeneratorResponse => {
  const plugin = createPlugin();
  return plugin.run(req);
};

export const findResponseForInputFile = (
  resp: CodeGeneratorResponse,
  fileName: string
) => {
  const outputFileName = fileName.replace(/\.proto$/, "_pb.ts");
  const file = resp.file.find((f) => f.name === outputFileName);
  if (!file) {
    throw new Error(`No output file found for ${fileName}`);
  }
  return file;
};
