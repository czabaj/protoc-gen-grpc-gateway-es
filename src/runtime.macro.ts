import type { ImportSymbol, Schema } from "@bufbuild/protoplugin/ecmascript";

export type RuntimeFile = {
  BigIntString: ImportSymbol;
  BytesString: ImportSymbol;
  RPC: ImportSymbol;
};

const runtimeFile = Bun.file(new URL("./runtime.ts", import.meta.url).pathname);
const runtimeFileContent = await runtimeFile.text();

export const getRuntimeFileContent = () => runtimeFileContent;
