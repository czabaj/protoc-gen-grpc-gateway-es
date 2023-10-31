import { expect, test } from "bun:test";

import { pathParametersToLocal } from "../src/helpers";

test(`the parameter with dot-notation should be properly camel-cased`, () => {
  expect(pathParametersToLocal("v1/{flip_flap.flop=*}")).toBe(
    "v1/{flipFlap.flop=*}"
  );
});
