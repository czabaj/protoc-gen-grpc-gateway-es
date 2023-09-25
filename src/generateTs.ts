import {
  DescEnum,
  DescField,
  DescMessage,
  DescOneof,
} from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import {
  type GeneratedFile,
  type Printable,
  getFieldTyping,
  localName,
  makeJsDoc,
  getFieldIntrinsicDefaultValue,
} from "@bufbuild/protoplugin/ecmascript";

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

function generateField(schema: Schema, f: GeneratedFile, field: DescField) {
  f.print(makeJsDoc(field));
  const { typing } = getFieldTyping(field, f);
  f.print`${localName(field)}?: ${typing};`;
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
  const protoN = schema.runtime[message.file.syntax];
  const {
    PartialMessage,
    FieldList,
    Message,
    PlainMessage,
    BinaryReadOptions,
    JsonReadOptions,
    JsonValue,
  } = schema.runtime;
  f.print(makeJsDoc(message));
  f.print`export type ${message} = {`;
  for (const member of message.members) {
    switch (member.kind) {
      case "oneof":
        generateOneof(schema, f, member);
        break;
      default:
        generateField(schema, f, member);
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
  // We do not support extensions at this time
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
