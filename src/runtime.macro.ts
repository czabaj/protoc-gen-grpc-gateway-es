import type { ImportSymbol } from "@bufbuild/protoplugin/ecmascript";

export type RuntimeFile = {
  RPC: ImportSymbol;
};

const runtimeFile = Bun.file(new URL("./runtime.ts", import.meta.url).pathname);
const runtimeFileContent = await runtimeFile.text();

export const getRuntimeFileContent = () => runtimeFileContent;
