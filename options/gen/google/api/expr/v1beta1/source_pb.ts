// Copyright 2019 Google LLC.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

// @generated by protoc-gen-es v1.3.1 with parameter "target=ts"
// @generated from file google/api/expr/v1beta1/source.proto (package google.api.expr.v1beta1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * Source information collected at parse time.
 *
 * @generated from message google.api.expr.v1beta1.SourceInfo
 */
export class SourceInfo extends Message<SourceInfo> {
  /**
   * The location name. All position information attached to an expression is
   * relative to this location.
   *
   * The location could be a file, UI element, or similar. For example,
   * `acme/app/AnvilPolicy.cel`.
   *
   * @generated from field: string location = 2;
   */
  location = "";

  /**
   * Monotonically increasing list of character offsets where newlines appear.
   *
   * The line number of a given position is the index `i` where for a given
   * `id` the `line_offsets[i] < id_positions[id] < line_offsets[i+1]`. The
   * column may be derivd from `id_positions[id] - line_offsets[i]`.
   *
   * @generated from field: repeated int32 line_offsets = 3;
   */
  lineOffsets: number[] = [];

  /**
   * A map from the parse node id (e.g. `Expr.id`) to the character offset
   * within source.
   *
   * @generated from field: map<int32, int32> positions = 4;
   */
  positions: { [key: number]: number } = {};

  constructor(data?: PartialMessage<SourceInfo>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "google.api.expr.v1beta1.SourceInfo";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 2, name: "location", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "line_offsets", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
    { no: 4, name: "positions", kind: "map", K: 5 /* ScalarType.INT32 */, V: {kind: "scalar", T: 5 /* ScalarType.INT32 */} },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SourceInfo {
    return new SourceInfo().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SourceInfo {
    return new SourceInfo().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SourceInfo {
    return new SourceInfo().fromJsonString(jsonString, options);
  }

  static equals(a: SourceInfo | PlainMessage<SourceInfo> | undefined, b: SourceInfo | PlainMessage<SourceInfo> | undefined): boolean {
    return proto3.util.equals(SourceInfo, a, b);
  }
}

/**
 * A specific position in source.
 *
 * @generated from message google.api.expr.v1beta1.SourcePosition
 */
export class SourcePosition extends Message<SourcePosition> {
  /**
   * The soucre location name (e.g. file name).
   *
   * @generated from field: string location = 1;
   */
  location = "";

  /**
   * The character offset.
   *
   * @generated from field: int32 offset = 2;
   */
  offset = 0;

  /**
   * The 1-based index of the starting line in the source text
   * where the issue occurs, or 0 if unknown.
   *
   * @generated from field: int32 line = 3;
   */
  line = 0;

  /**
   * The 0-based index of the starting position within the line of source text
   * where the issue occurs.  Only meaningful if line is nonzer..
   *
   * @generated from field: int32 column = 4;
   */
  column = 0;

  constructor(data?: PartialMessage<SourcePosition>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "google.api.expr.v1beta1.SourcePosition";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "location", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "offset", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 3, name: "line", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 4, name: "column", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SourcePosition {
    return new SourcePosition().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SourcePosition {
    return new SourcePosition().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SourcePosition {
    return new SourcePosition().fromJsonString(jsonString, options);
  }

  static equals(a: SourcePosition | PlainMessage<SourcePosition> | undefined, b: SourcePosition | PlainMessage<SourcePosition> | undefined): boolean {
    return proto3.util.equals(SourcePosition, a, b);
  }
}
