import { beforeAll } from "bun:test";
import { readdir, unlink } from "node:fs/promises";

/**
 * To generate the .proto sources in the tests, we need to write the file content to the disk. There is no other way
 * than file-system for passing the files in the protoc. There is a `/tests/proto/` directory where these files are
 * temporary written. The files are removed once converted to the `CodeGenerationRequest`. If the test fails
 * exceptionally, e.g. when it is terminated, the temporary file might not be removed. If the test framework detects
 * that the temporary file to be written already exists, it throws an error to prevent conflict in the tests files - you
 * must use unique file names in the tests, otherwise one test could rewrite the source for the second test which would
 * lead to confusing test fails. This safety-check would block you in case there are leftovers in the `/tests/proto/`
 * after unexpected termination, therefor the `/tests/proto/` is cleared once before all tests.
 */
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
