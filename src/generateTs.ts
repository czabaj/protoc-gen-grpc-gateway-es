import {
  DescEnum,
  DescField,
  DescMessage,
  DescOneof,
  DescService,
} from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import {
  type GeneratedFile,
  type Printable,
  getFieldTyping,
  localName,
  makeJsDoc,
} from "@bufbuild/protoplugin/ecmascript";

import { FieldBehavior as GoogleapisFieldBehavior } from "../options/gen/google/api/field_behavior_pb";
import {
  getGoogleapisFieldBehaviorOption,
  getGoogleapisHttpMethodOption,
  getOpenapiMessageOption,
  isImportSymbol,
  pathParametersToLocal,
} from "./helpers";
import { type RuntimeFile, getRuntimeFileContent } from "./runtime.macro" with { type: "macro" };

/**
 * Prints the runtime file and provides the reference to it's symbols.
 */
export const getRuntimeFile = (schema: Schema): RuntimeFile => {
  const file = schema.generateFile(`runtime.ts`);
  file.print(getRuntimeFileContent());
  const createRPC = file.export(`createRPC`);
  return { createRPC };
};

/**
 * Prints an Enum.
 */
function generateEnum(schema: Schema, f: GeneratedFile, enumeration: DescEnum) {
  f.print(makeJsDoc(enumeration));
  f.print`export enum ${enumeration} {`;
  for (const value of enumeration.values) {
    if (enumeration.values.indexOf(value) > 0) f.print();
    f.print(makeJsDoc(value));
    f.print`${localName(value)} = "${value.name}",`;
  }
  f.print`}`;
}

/**
 * The @bufbuild/protobuf library has it's own WKT types which we don't want to use, this function converts them to
 * appropriate scalar types.
 */
function generateType(
  typing: Printable,
  required: boolean,
  fieldBehavior: GoogleapisFieldBehavior | undefined
): { type: Printable; nullable?: boolean } {
  const type: Exclude<Printable, Printable[]> = !Array.isArray(typing)
    ? typing
    : typing.length === 1
    ? (typing[0] as any)
    : undefined;
  if (type && isImportSymbol(type) && type.from === `@bufbuild/protobuf`) {
    switch (type.name) {
      default:
        return { type: `string` };
      case `Duration`:
      case `Timestamp`:
        // the Duration and Timestamp are serialized to string in gRPC-gateway, but we also need them to be nullable
        // otherwiser it is impossible to unset them.
        return {
          type: `string`,
          nullable:
            !required && fieldBehavior !== GoogleapisFieldBehavior.OUTPUT_ONLY,
        };
    }
  }
  return { type: typing };
}

function generateField(
  schema: Schema,
  f: GeneratedFile,
  field: DescField,
  openApiV2Required?: string[]
) {
  f.print(makeJsDoc(field));
  const { typing } = getFieldTyping(field, f);
  const googleapisFieldBehaviorOption = getGoogleapisFieldBehaviorOption(field);
  const required =
    openApiV2Required?.includes(field.name) ||
    googleapisFieldBehaviorOption === GoogleapisFieldBehavior.REQUIRED;
  const { type, nullable } = generateType(
    typing,
    required,
    googleapisFieldBehaviorOption
  );
  f.print`${localName(field)}${required ? "" : "?"}: ${type}${
    !nullable ? "" : " | null"
  };`;
}

function generateMessage(
  schema: Schema,
  f: GeneratedFile,
  message: DescMessage
) {
  const oneOfs: DescOneof[] = [];
  const openApiV2Schema = getOpenapiMessageOption(message);
  f.print(makeJsDoc(message));
  f.print`export type ${message} = {`;
  for (const member of message.members) {
    switch (member.kind) {
      case "oneof":
        oneOfs.push(member);
        break;
      default:
        generateField(schema, f, member, openApiV2Schema?.jsonSchema?.required);
        break;
    }
  }
  f.print`}`;
  if (oneOfs.length > 0) {
    for (const oneOf of oneOfs) {
      f.print` & (`;
      for (let i = 0, l = oneOf.fields.length; i < l; i++) {
        let field = oneOf.fields[i];
        if (i > 0) f.print` | `;
        f.print`{ `;
        generateField(schema, f, field);
        f.print` }`;
      }
      f.print`)`
    }
  }
  f.print`;`;
  for (const nestedEnum of message.nestedEnums) {
    generateEnum(schema, f, nestedEnum);
  }
  for (const nestedMessage of message.nestedMessages) {
    generateMessage(schema, f, nestedMessage);
  }
}

function generateService(
  schema: Schema,
  f: GeneratedFile,
  service: DescService,
  runtimeFile: RuntimeFile
) {
  for (const method of service.methods) {
    const googleapisHttpMethodOption = getGoogleapisHttpMethodOption(method);
    if (!googleapisHttpMethodOption) {
      throw new Error(
        `Missing "option (google.api.http)" for service "${service.name}" and method "${method.name}"`
      );
    }
    if (!googleapisHttpMethodOption.pattern.value) {
      throw new Error(
        `Missing URL in "option (google.api.http)" for service "${service.name}" and method "${method.name}"`
      );
    }
    const httpMethod = googleapisHttpMethodOption.pattern.case.toUpperCase();
    const path = pathParametersToLocal(
      googleapisHttpMethodOption.pattern.value as string
    );
    const bodyPath =
      googleapisHttpMethodOption.body && googleapisHttpMethodOption.body !== "*"
        ? googleapisHttpMethodOption.body
        : undefined;
    f.print(makeJsDoc(method));
    f.print`export const ${service.name}_${method.name} = ${
      runtimeFile.createRPC
    }<${method.input.name}, ${method.output.name}>("${httpMethod}", "${path}"${
      bodyPath ? `, "${bodyPath}"` : ""
    });`;
  }
}

export function generateTs(schema: Schema) {
  const runtimeFile = getRuntimeFile(schema);
  for (const file of schema.files) {
    const f = schema.generateFile(file.name + "_pb.ts");
    f.preamble(file);
    for (const enumeration of file.enums) {
      generateEnum(schema, f, enumeration);
    }
    for (const message of file.messages) {
      generateMessage(schema, f, message);
    }
    for (const service of file.services) {
      generateService(schema, f, service, runtimeFile);
    }
  }
}
