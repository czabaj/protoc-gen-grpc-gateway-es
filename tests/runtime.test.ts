import { expect, test } from "bun:test";

import { replacePathParameters } from "../src/runtime";

test(`should replace path parameters`, () => {
  const path = "/v1/{name=projects/*/documents/*}/{message_id}";
  const parameters = {
    name: "projects/a/documents/b",
    message_id: "XYZ",
  };
  const replaced = replacePathParameters(
    path,
    new Map(Object.entries(parameters))
  );
  expect(replaced).toBe("/v1/projects/a/documents/b/XYZ");
});
