import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";

import { generateTs } from "./generateTs.js";
import pkg from "../package.json";

export const protocGenGrpcGatewayTsClient = createEcmaScriptPlugin({
  name: pkg.name,
  version: `v${pkg.version}`,
  generateTs,
});
