import {
  DescField,
  DescMessage,
  DescMethod,
  ScalarType,
} from "@bufbuild/protobuf";
import {
  type ImportSymbol,
  type Printable,
  findCustomMessageOption,
  findCustomScalarOption,
} from "@bufbuild/protoplugin/ecmascript";

import { Schema as OpenApiV2Schema } from "../options/gen/protoc-gen-openapiv2/options/openapiv2_pb";
import { HttpRule as GoogleapisHttpRule } from "../options/gen/google/api/http_pb";
import { FieldBehavior as GoogleapisFieldBehavior } from "../options/gen/google/api/field_behavior_pb";

/**
 * Protobuf-es converts the WKT to JavaScript classes, the gRPC-gateway does not do that, it mostly serializes to string
 * in specified format. This function detects the WKT and returns it's TypeScript type according to gRPC-gateway.
 */
export const asWKT = (typing: Printable) => {
  if (!Array.isArray(typing)) return typing;
  const type = typing[0] as Exclude<Printable, Printable[]>;
  if (isImportSymbol(type)) {
    switch (type.name) {
      case `Duration`:
      case `Timestamp`:
        return [`string`];
    }
  }
  return undefined;
};

export const getOpenapiMessageOption = (message: DescMessage) => {
  const option = findCustomMessageOption(message, 1042, OpenApiV2Schema);
  return option;
};

export const getGoogleapisHttpMethodOption = (method: DescMethod) => {
  const option = findCustomMessageOption(method, 72295728, GoogleapisHttpRule);
  return option;
};

export const getGoogleapisFieldBehaviorOption = (field: DescField) => {
  const option = findCustomScalarOption(field, 1052, ScalarType.BYTES);
  if (!option) return undefined;
  const value = option[0];
  return value ? (value as GoogleapisFieldBehavior) : undefined;
};

export const isImportSymbol = (
  printable: Exclude<Printable, Printable[]>
): printable is ImportSymbol => {
  return (printable as any)?.kind === `es_symbol`;
};

// copied from https://github.com/bufbuild/protobuf-es/blob/12974f616a3efeb249c21752f2a7a7b9d99b53f6/packages/protobuf/src/private/names.ts#L142C42-L142C42
function protoCamelCase(snakeCase: string): string {
  let capNext = false;
  const b: string[] = [];
  for (let i = 0; i < snakeCase.length; i++) {
    let c = snakeCase.charAt(i);
    switch (c) {
      case "_":
        capNext = true;
        break;
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        b.push(c);
        capNext = false;
        break;
      default:
        if (capNext) {
          capNext = false;
          c = c.toUpperCase();
        }
        b.push(c);
        break;
    }
  }
  return b.join("");
}

const pathParameterNameRe = /{([^}=]+)/g;
/**
 * The path parameters are replaced in runtime with values passed to the request. The fields in the request are by
 * defult camelCased, so we need to convert the path parameters to camelCase as well.
 */
export const pathParametersToLocal = (path: string) => {
  return path.replace(pathParameterNameRe, (_a, c1) => {
    return `{${protoCamelCase(c1)}`;
  });
};
