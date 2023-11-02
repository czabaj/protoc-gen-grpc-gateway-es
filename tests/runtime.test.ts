import { expect, test } from "bun:test";

import { RPC, replacePathParameters } from "../src/runtime";

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
  const path = "/v1/{flip.flap.flop}/{message_id}";
  const parameters = {
    flip: { flap: { flop: `flup` } },
    message_id: "XYZ",
  };
  const rpc = new RPC(`POST`, path);
  const config = {
    basePath: `https://example.test`,
  };
  const request = rpc.createRequest(config, parameters);
  expect(request.url).toBe(`https://example.test/v1/flup/XYZ`);
});

test(`should properly distribute path parameters`, async () => {
  const path = `/v1/{flip.name}`;
  const parameters = {
    flip: { name: `flap`, flop: `flup` },
    updateMask: `flop.flup`,
  };
  const rpc = new RPC(`PATCH`, path, "flip");
  const config = { basePath: `https://example.test` };
  const request = rpc.createRequest(config, parameters);
  // the `flip.name` should be in the path, the `updateMask` should be in the queryString
  expect(request.url).toBe(`https://example.test/v1/flap?updateMask=flop.flup`);
  const bodyContent = await new Response(request.body).text();
  // the body should contain the `flip` object, b/c/ the `bodyPath` was set to `flip`
  expect(bodyContent).toBe(JSON.stringify(parameters.flip));
});

test(`should set Bearer token if provided as a string in config`, () => {
  const path = `/v1/flip`;
  const rpc = new RPC(`GET`, path);
  const config = {
    basePath: `https://example.test`,
    bearerToken: `secret`,
  };
  const request = rpc.createRequest(config, undefined);
  expect(request.headers.get("Authorization")).toBe(`Bearer secret`);
});

test(`should set Bearer token if provided as a function`, () => {
  const path = `/v1/flip`;
  const rpc = new RPC(`GET`, path);
  const config = {
    basePath: `https://example.test`,
    bearerToken: () => `psst!`,
  };
  const request = rpc.createRequest(config, undefined);
  expect(request.headers.get("Authorization")).toBe(`Bearer psst!`);
});

test(`should prepend full URL basePath`, () => {
  const path = `/v1/flip`;
  const rpc = new RPC(`GET`, path);
  const config = {
    basePath: `https://example.test/api`,
  };
  const request = rpc.createRequest(config, undefined);
  expect(request.url).toBe(`https://example.test/api/v1/flip`);
});
