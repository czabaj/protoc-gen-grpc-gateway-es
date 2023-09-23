import { DescEnum, DescMessage, DescOneof } from "@bufbuild/protobuf";
import { Schema } from "@bufbuild/protoplugin";
import {
  GeneratedFile,
  getFieldTyping,
} from "@bufbuild/protoplugin/dist/types/ecmascript";
import { localName, makeJsDoc } from "@bufbuild/protoplugin/ecmascript";

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

// function generateOneof(schema: Schema, f: GeneratedFile, oneof: DescOneof) {
//   for (const field of oneof.fields) {
//     generateField(schema, f, field, '    ');
//   }
// }

// function generateMessage(
//   schema: Schema,
//   f: GeneratedFile,
//   message: DescMessage
// ) {
//   const protoN = schema.runtime[message.file.syntax];
//   const {
//     PartialMessage,
//     FieldList,
//     Message,
//     PlainMessage,
//     BinaryReadOptions,
//     JsonReadOptions,
//     JsonValue,
//   } = schema.runtime;
//   f.print(makeJsDoc(message));
//   f.print`export type ${message} = {`;
//   for (const member of message.members) {
//     // eslint-disable-next-line sonarjs/no-small-switch
//     switch (member.kind) {
//       case 'oneof':
//         generateOneof(schema, f, member);
//         break;
//       default:
//         generateField(schema, f, member);
//         break;
//     }
//     f.print();
//   }
//   f.print('  constructor(data?: ', PartialMessage, '<', message, '>) {');
//   f.print('    super();');
//   f.print('    ', protoN, '.util.initPartial(data, this);');
//   f.print('  }');
//   f.print();
//   generateWktMethods(schema, f, message);
//   f.print('  static readonly runtime: typeof ', protoN, ' = ', protoN, ';');
//   f.print(
//     '  static readonly typeName = ',
//     literalString(message.typeName),
//     ';'
//   );
//   f.print(
//     '  static readonly fields: ',
//     FieldList,
//     ' = ',
//     protoN,
//     '.util.newFieldList(() => ['
//   );
//   for (const field of message.fields) {
//     generateFieldInfo(schema, f, field);
//   }
//   f.print('  ]);');
//   // In case we start supporting options, we have to surface them here
//   //f.print("  static readonly options: { readonly [extensionName: string]: ", rt.JsonValue, " } = {};")
//   f.print();
//   generateWktStaticMethods(schema, f, message);
//   f.print(
//     '  static fromBinary(bytes: Uint8Array, options?: Partial<',
//     BinaryReadOptions,
//     '>): ',
//     message,
//     ' {'
//   );
//   f.print('    return new ', message, '().fromBinary(bytes, options);');
//   f.print('  }');
//   f.print();
//   f.print(
//     '  static fromJson(jsonValue: ',
//     JsonValue,
//     ', options?: Partial<',
//     JsonReadOptions,
//     '>): ',
//     message,
//     ' {'
//   );
//   f.print('    return new ', message, '().fromJson(jsonValue, options);');
//   f.print('  }');
//   f.print();
//   f.print(
//     '  static fromJsonString(jsonString: string, options?: Partial<',
//     JsonReadOptions,
//     '>): ',
//     message,
//     ' {'
//   );
//   f.print(
//     '    return new ',
//     message,
//     '().fromJsonString(jsonString, options);'
//   );
//   f.print('  }');
//   f.print();
//   f.print(
//     '  static equals(a: ',
//     message,
//     ' | ',
//     PlainMessage,
//     '<',
//     message,
//     '> | undefined, b: ',
//     message,
//     ' | ',
//     PlainMessage,
//     '<',
//     message,
//     '> | undefined): boolean {'
//   );
//   f.print('    return ', protoN, '.util.equals(', message, ', a, b);');
//   f.print('  }');
//   f.print('}');
//   f.print();
//   for (const nestedEnum of message.nestedEnums) {
//     generateEnum(schema, f, nestedEnum);
//   }
//   for (const nestedMessage of message.nestedMessages) {
//     generateMessage(schema, f, nestedMessage);
//   }
//   // We do not support extensions at this time
// }

export function generateTs(schema: Schema) {
  for (const file of schema.files) {
    const f = schema.generateFile(file.name + "_pb.ts");
    f.preamble(file);
    for (const enumeration of file.enums) {
      generateEnum(schema, f, enumeration);
    }
    // for (const message of file.messages) {
    //   generateMessage(schema, f, message);
    // }
  }
}
