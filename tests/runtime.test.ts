import { expect, test } from "bun:test";

import { createRPC, replacePathParameters } from "../src/runtime";

test(`should replace path parameters`, () => {
  const path = "/v1/{name=projects/*/documents/*}/{message_id}";
  const parameters = {
    name: "projects/a/documents/b",
    message_id: "XYZ",
  };
  const replaced = replacePathParameters(path, parameters);
  expect(replaced).toBe("/v1/projects/a/documents/b/XYZ");
});

test(`should handle nested path parameters`, () => {
  const path = "/v1/{flip.flap.flop=*}/{message_id}";
  const parameters = {
    flip: { flap: { flop: `flup` } },
    message_id: "XYZ",
  };
  const rpc = createRPC(`POST`, path);
  const request = rpc.createRequest({ basePath: `https://example.test` })(
    parameters
  );
  expect(request.url).toBe(`https://example.test/v1/flup/XYZ`);
});
