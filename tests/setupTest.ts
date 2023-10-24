import { beforeAll } from "bun:test";
import { readdir, unlink } from "node:fs/promises";

const clearAllTemporaryProtoFiles = async () => {
  const protoDir = new URL(`./proto/`, import.meta.url).pathname;
  const files = await readdir(protoDir);
  const deleteFilePromises = files
    .filter((f) => f.endsWith(`.proto`))
    .map((file) => unlink(`${protoDir}${file}`));
  return await Promise.all(deleteFilePromises);
};

beforeAll(async () => {
  await clearAllTemporaryProtoFiles();
});
