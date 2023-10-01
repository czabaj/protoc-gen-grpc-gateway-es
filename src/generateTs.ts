import {
  DescEnum,
  DescField,
  DescMessage,
  DescOneof,
} from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import {
  type GeneratedFile,
  getFieldTyping,
  localName,
  makeJsDoc,
  findCustomMessageOption,
} from "@bufbuild/protoplugin/ecmascript";

import { Schema as OpenApiV2Schema } from "../options/gen/protoc-gen-openapi-v2/openapiv2_pb";

const getProtocGenOpenapiv2Option = (message: DescMessage) => {
  const option = findCustomMessageOption(message, 1042, OpenApiV2Schema);
  return option;
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
  const required = openApiV2Required?.includes(field.name);
  f.print`${localName(field)}${required ? `` : `?`}: ${typing};`;
}

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
  const openApiV2Schema = getProtocGenOpenapiv2Option(message);
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

export function generateTs(schema: Schema) {
  for (const file of schema.files) {
    const f = schema.generateFile(file.name + "_pb.ts");
    f.preamble(file);
    for (const enumeration of file.enums) {
      generateEnum(schema, f, enumeration);
    }
    for (const message of file.messages) {
      generateMessage(schema, f, message);
    }
  }
}
