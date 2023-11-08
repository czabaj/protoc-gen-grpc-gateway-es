#!/usr/bin/env node

import { createEcmaScriptPlugin, runNodeJs } from "@bufbuild/protoplugin";

import { generateTs } from "./generateTs.js";
import pkg from "../package.json" assert { type: "json" };

export const protocGenGrpcGatewayTsClient = createEcmaScriptPlugin({
  name: pkg.name,
  version: `v${pkg.version}`,
  generateTs,
});

runNodeJs(protocGenGrpcGatewayTsClient);
