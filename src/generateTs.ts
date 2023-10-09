import {
  DescEnum,
  DescField,
  DescMessage,
  DescMethod,
  DescOneof,
  DescService,
} from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import {
  type GeneratedFile,
  getFieldTyping,
  localName,
  makeJsDoc,
  findCustomMessageOption,
} from "@bufbuild/protoplugin/ecmascript";

import { Schema as OpenApiV2Schema } from "../options/gen/protoc-gen-openapiv2/options/openapiv2_pb";
import { HttpRule as GoogleapisHttpRule } from "../options/gen/google/api/http_pb";

const getOpenapiMessageOption = (message: DescMessage) => {
  const option = findCustomMessageOption(message, 1042, OpenApiV2Schema);
  return option;
};

const getGoogleapisHttpMethodOption = (method: DescMethod) => {
  const option = findCustomMessageOption(method, 72295728, GoogleapisHttpRule);
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
  service: DescService
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
    f.print(makeJsDoc(method));
    f.print`export const ${service.name}_${
      method.name
    } = (config: any) => (params: ${method.input.name}) => {
      const url = new URL("${
        googleapisHttpMethodOption.pattern.value as string
      }", config.basePath ?? window.location.href);
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
          }
        }
      const bearerToken = typeof config.bearerToken === "function" ? config.bearerToken() : config.bearerToken;
      const request = new Request(url.href, {
        method: "GET",
        headers bearerToken ? {Authorization: \`Bearer \${bearerToken}\`} : undefined,
      })
      const typeId = (response: any) => response as ${method.output.name};
      return { request, typeId }
    };
`;
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
    for (const service of file.services) {
      generateService(schema, f, service);
    }
  }
}
