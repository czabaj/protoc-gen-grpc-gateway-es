import { unlink } from "node:fs/promises";

import { CodeGeneratorRequest, FileDescriptorSet } from "@bufbuild/protobuf";

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
        `-#format=json`,
        ...filePaths.flatMap((f) => [`--path`, `"${f}"`]),
      ],
      {
        cwd,
      }
    );
    const fileDescriptorJsonString = await new Response(proc.stdout).text();
    const fileDescriptorSet = FileDescriptorSet.fromJsonString(
      fileDescriptorJsonString,
      { ignoreUnknownFields: true }
    );
    return new CodeGeneratorRequest({
      parameter,
      fileToGenerate: protoFiles.map((f) => f.name),
      protoFile: fileDescriptorSet.file,
    });
  } finally {
    await Promise.allSettled(filePaths.map((fp) => unlink(fp)));
  }
}
