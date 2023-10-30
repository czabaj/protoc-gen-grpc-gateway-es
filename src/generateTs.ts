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
  getFieldTyping,
  localName,
  makeJsDoc,
  ImportSymbol,
} from "@bufbuild/protoplugin/ecmascript";

import { FieldBehavior as GoogleapisFieldBehavior } from "../options/gen/google/api/field_behavior_pb";
import {
  asWKT,
  getGoogleapisFieldBehaviorOption,
  getGoogleapisHttpMethodOption,
  getOpenapiMessageOption,
  pathParametersToLocal,
} from "./helpers";

const runtimeFile = Bun.file(new URL("./runtime.ts", import.meta.url).pathname);
const runtimeFileContent = await runtimeFile.text();
type RuntimeFile = {
  createRPC: ImportSymbol;
};
export const getRuntimeFile = (schema: Schema): RuntimeFile => {
  const file = schema.generateFile(`runtime.ts`);
  file.print(runtimeFileContent);
  const createRPC = file.export(`createRPC`);
  return { createRPC };
};

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

function generateField(
  schema: Schema,
  f: GeneratedFile,
  field: DescField,
  openApiV2Required?: string[]
) {
  f.print(makeJsDoc(field));
  const { typing } = getFieldTyping(field, f);
  const wktTyping = asWKT(typing);
  const googleapisFieldBehaviorOption = getGoogleapisFieldBehaviorOption(field);
  const required =
    openApiV2Required?.includes(field.name) ||
    googleapisFieldBehaviorOption === GoogleapisFieldBehavior.REQUIRED;

  if (
    wktTyping &&
    !required &&
    googleapisFieldBehaviorOption !== GoogleapisFieldBehavior.OUTPUT_ONLY
  ) {
    // whent WKT can be set from the client, it must be nullable
    f.print`${localName(field)}?: ${wktTyping} | null;`;
  } else {
    f.print`${localName(field)}${required ? `` : `?`}: ${wktTyping || typing};`;
  }
}

// TODO: this currently prints all fields, like intersection, but we want to print union of types instead
function generateOneof(schema: Schema, f: GeneratedFile, oneof: DescOneof) {
  for (const field of oneof.fields) {
    generateField(schema, f, field);
  }
}

function generateMessage(
  schema: Schema,
  f: GeneratedFile,
  message: DescMessage
) {
  const openApiV2Schema = getOpenapiMessageOption(message);
  f.print(makeJsDoc(message));
  f.print`export type ${message} = {`;
  for (const member of message.members) {
    switch (member.kind) {
      case "oneof":
        generateOneof(schema, f, member);
        break;
      default:
        generateField(schema, f, member, openApiV2Schema?.jsonSchema?.required);
        break;
    }
    f.print();
  }
  f.print`}`;
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
    f.print(makeJsDoc(method));
    f.print`export const ${service.name}_${method.name} = ${runtimeFile.createRPC}<${method.input.name}, ${method.output.name}>("${httpMethod}", "${path}")}
    `;
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
