# protoc-gen-grpc-gateway-es

Generate TypeScript client for gRPC API exposed via grpc-gateway. Powered by [protobuf-es framework](https://github.com/bufbuild/protobuf-es) and [bun toolchain](https://github.com/oven-sh/bun).

## Philosophy

The plugin walks over the proto files and converts protobuf messages to TypeScipt types and protobuf RPC to RPC JavaScript classes. The RPCs are exported as `ServiceName_MethodName` and have following signature

```TypeScript
class RPC<RequestMessage, ResponseMessage> = {
  // HTTP method of the RPC if not specified by google.api.http option it is `POST`
  readonly method: `DELETE` | `GET` | `PATCH` | `POST` | `PUT`;
  // URL path of the RPC if not specified by the google.api.http option it is the "$proto_package.$service_name/$method_name"
  readonly path: string;
  // Optional: the path to body in RequestMessage, only if specified by the google.api.http option
  readonly bodyKey?: string;
  /**
   * Creates a JavaScript Request object which can be used directly with fetch API. If you are using other HTTP client,
   * you can read the request properties from the Request object.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request
   * @param config the request configuration for the RPC
   * @param params the request message for the RPC as defined in the proto file
   */
  createRequest: (c: RequestConfig, m: RequestMessage) => Request;
  /**
   * Simple identity function that just types the input as ResponseMessage.
   * Usefull for TypeScript code to assing a type to the response.
   */
  responseTypeId: (r: any) => ResponseMessage;
};
```

Unlike many other gRPC-to-TypeScript generators, this one tries to be as minimal as possible, we don't do any extra data de/-serialization for you, but we are using the TypeScript type system to provide more safety and the `runtime.ts` file generated alongside your files contains a few conversion helpers.

- The well-known protobuf types ` google.protobuf.Timestamp` an `google.protobuf.Duration` are typed as a `string`. You can pass the `Timestamp` string to JS `Date`. The `Duration` is a float with `s` suffix for _seconds_, there is no appropriate JS type for that.
- The protobuf `bytes` type is converted to `BytesString` type, which is a type alias for a `string` with type-only symbol, that prevents you from using it as a regular `string` in TypeScript. There are helper functions in the `runtime.ts` module for conversion from/to `UInt8Array`.
- The protobuf `int64` type is converted to `BigIntString` type, which is a type alias for a `string` with type-only symbol, that prevents you from using it as a regular `string` in TypeScript. There are helper functions in the `runtime.ts` module for conversion from/to `BigInt`.

## Usage

The usage has two phases, first you need to generate the {Java,Type}Script files and then use them in your app.

### Generate {Java,Type}Script files

The package outputs an executable, which contains fixed version of `bun` runtime and all the needed source files. The executable is currently little overweight (~60MB), but it is a [known issue of `bun`](https://github.com/oven-sh/bun/issues/4453), hopefully they will fix this soon 🤞.

The executable is standard `protoc` plugin so you can use it with any `protoc` based tool, but the `buf generate` is hightly recommended since it takes the burden of resolving proto dependencies from your shoulders. If you need some intro to `buf generate` there is a [tutorial on buf website](https://buf.build/docs/generate/tutorial).

To run this plugin copy the executable to your codebase and configure the buf to use it in your `buf.yaml` file, for example

```yaml
version: v1
managed:
  enabled: true
  go_package_prefix:
    default: example/package/prefix
    except:
      - buf.build/googleapis/googleapis
      - buf.build/grpc-ecosystem/grpc-gateway
plugins:
  - name: es
    opt: target=ts
    out: gen/es
    path: ./path/to/protoc-gen-grpc-gateway-es
```

You need to change:

- `managed.go_package_prefix.default` to your package prefix,
- `plugins[0].out` to the output directory of your choice,
- `plugins[0].path` to the path of the `protoc-gen-grpc-gateway-es` executable.

Then run `buf generate` (assuming you have properly installed and configured the `buf`) and it will generate the TypeScript files for you.

If you want to generate JavaScript instead, just pass change the plugin option `opt: target=js`.

The list of all plugin options is [here](https://github.com/bufbuild/protobuf-es/tree/5893ec6efb7111d7dbc263aeeb75d693426cacdd/packages/protoc-gen-es#plugin-options).

#### Note on formatting

To simplify the development, this plugin is not concerned with pretty printed output. The generated files are readable, but if your eyes are bleeding, use your favorite formatter after the files generation, e.g.

```sh
npx prettier --write gen/es/
```

### Usage in apps code

The generated files relies on some browser API, i.e. it is anticipated you will use it in the browser only, usage in Node.js is not tested, but in theory should work.

The generated files contains all the the protobuf messages as TypeScript types, all the protobuf enums as TypeScript enums and protobuf methods are converted to `RPC` JavaScript classes. There is also a top-level `runtime.ts` file which contains the constructor of `RPC` class and a few helper TypeScript types and functions.

The typical usage with `fetch` might look like this.

```TypeScript
import { SomeService_SomeMethod, type SomeMethodRequest } from "./gen/es/example/package/prefix/some_service_pb.ts";
import { type RequestConfig } from "./gen/es/runtime.ts"

const getBearerToken = () => {
  // your getter for bearer token in you app
  return `XYZ`;
}

const requestConfig: RequestConfig = {
  basePath: "https://example.test/api/v1",
  bearerToken: getBearerToken
};

const someMethodRequest: SomeMethodRequest = {
  flip: "flop",
}

// this is not required, but let's say we want to abort the request after 5 seconds
const signal = AbortSignal.timeout(5_000);

const request = SomeService_SomeMethod.getRequest(config, variables)

const serviceMethodCall = fetch(request, { signal }).then(response => {
  if (response.ok) {
    // type the response with the `responseTypeId` identity function, only needed in TypeScript
    // if you are concerned with extra micro-task generated by the `.then` call, you can type
    // the `response.json()` with TypeScript `as` keyword `response.json() as SomeMethodResponse`
    return response.json().then(SomeService_SomeMethod.responseTypeId)
  }
  // reject the non-succesfull (non 2xx status code) response or do other things in your app
  return Promise.reject(response)
})
```

You will likely create a wrapper function around the `RPC` class since the logic will be probably the same for all RPCs. We don't provide this wrapper since it is app specific, but it might look something like this.

```TypeScript
import { SomeService_SomeMethod } from "./gen/es/example/package/prefix/some_service_pb.ts";
import { type RPC, type RequestConfig } from "./gen/es/runtime.ts"

// this is usually constant for all RPC's in one API
const requestConfig: RequestConfig = {
  basePath: "https://example.test/api/v1",
  bearerToken: getBearerToken
};

// The generic types `RequestMessage` and `ResponseMessage` are inferred from the `RPC` passed as an argument
const fetchWrapRPC = <RequestMessage, ResponseMessage>(
  rpc: RPC<RequestMessage, ResponseMessage>
) => {
  return (
    variables: RequestMessage,
    { signal }: { signal?: AbortSignal } = {}
  ) => {
    return fetch(rpc.createRequest(requestConfig, variables), { signal })
      .then((response) => {
        if (response.ok) {
          return response.json() as ResponseMessage;
        }
        return Promise.reject(response);
      });
  };
};

// use the wrapper for generated RPC
const someServiceSomeMethodAsyncFunction = fetchWrapRPC(SomeService_SomeMethod);

// example of AbortController that you can abort imperetively later
const abortController = new AbortController();
// call the async function which accepts the request message and returns a promise of response JSON
const responseJSON = await someServiceSomeMethodAsyncFunction(
  { flip: "flop" },
  { signal: abortController.signal }
);
```

#### Usage caveats

1. The generated TypeScript files import other TypeScript files with `.js` extension, [this can be changed in the plugin configuration](https://github.com/bufbuild/protobuf-es/tree/5893ec6efb7111d7dbc263aeeb75d693426cacdd/packages/protoc-gen-es#import_extensionjs), but it might be hard to find solution that works everywhere. In my setup, I went with the default setting which works OK in the bundler, but it broke my Jest tests. I found a solution in [this GitHub issue](https://github.com/kulshekhar/ts-jest/issues/1057) - add a [`moduleNameMapper` to Jest config](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring) which removes the `.js` extension from imports, i.e. makes the JS imports extension-less and the Jest will use its resolution algorithm to find the file.

   ```json
   // jest.config.json

   {
     "moduleNameMapper": {
       "^(.+)\\.js$": "$1"
     }
   }
   ```

1. The protobuf `oneof` are generated into the TypeScript as union, i.e. the message

   ```protobuf
   // flip.proto

   message Flip {
     string flap = 1;
     oneof toss {
       bool heads = 2;
       bool tails = 3;
     }
   }
   ```

   is generated as

   ```TypeScript
   // flip_pb.ts

   export type Flip = { flap?: string } & (
    | { heads?: boolean; }
    | { tails?: boolean; }
   );
   ```

   this captures the mutual exclusivity but is a little cumbersome to work with in TypeScript, because if you attempt to access `flip.heads` the compiler complains that `heads` might not be defined. This forces you to use [the JavaScript `in` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in) which acts as a type guard. It is little inconvenient to use it each time you want to access the `oneof` field, but it is the proper way to tackle this problem.

   ```TypeScript
   let test = flip.heads; // ❌ TS error: Object is possibly 'undefined'.
   if ("heads" in flip) {
     test = flip.heads; // ✅ OK, the `heads` is the `oneof` field
     test = flip.tails; // ❌ TS error: the `heads` and `tails` are mutually exclusive
   }

   ```

1. We decided to generate the [JavaScript `Request` object](https://developer.mozilla.org/en-US/docs/Web/API/Request) for you, which is neatly compatible with the fetch API. Unfortunately, the `Request` object has a few quirks inherited from the streaming nature of the fetch. If you would ever need to read the `body` of the `Request`, you'll find it is a [`ReadableStream` object](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) and as such it is uneasy to obtain it's value. The most straight-forward way to consume the stream is to pass it to the `Response` object and then read it asynchronously

   ```TypeScript
   const request = SomeService_SomeMethod.getRequest(config, variables);
   const requestBodyAsText = await(new Response(request.body).text());
   ```

   you can as well parse the body to a string with `Response#json` you know from the fetch API responses. After this call the readable stream will be consumed and no longer available, so if you read the `body` of the `Request` you can no longer use the `Request` object for the fetch API call 😒 You need to create a new `Request` object, where the constructor allows you clone the original request and you can pass in the old body you have read as a new body.

   ```TypeScript
   // here passing the original request and the old body which was read into a text.
   const requestClone = new Request(request, { body: requestBodyAsText });
   ```

   The fetch API has identical signature so you can pass the same parameters to `fetch`

   ```TypeScript
   // instead of creating a new Request object, you can pass the arguments directly to fetch call
   const response = await fetch(request, { body: requestBodyAsText });
   ```

   But you will most likely read the `Request` to use other network library than `fetch`. In any case, the `runtime.ts` library exports all of it's internals so you can use it as a plumbing in case you don't like the `RPC#createRequest` method 😉.

## Development

First, read the [Protobuf-ES: Writing Plugins](https://github.com/bufbuild/protobuf-es/blob/main/docs/writing_plugins.md#protobuf-es-writing-plugins) and familiarize yourself with the [Bun toolkit](https://bun.sh/docs).

Use test-driven development, first write a failing test with feature you want to implement and then change the code.

Folders and their meaning

- `/options/` - when you want to read options (a.k.a. extensions) from the proto files, and the options are non-scalar, such as

  ```proto
  option (google.api.http) = {get: "/v1/{name_test=projects/*/documents/*}:customMethod"};
  ```

  where the value of the `google.api.http` is an object, the protobuf-es framework requires you to have prepared the object types as `@bufbuild/protobuf/Message` JavaScript classes. Jere we are using `buf` to convert all options commonly used in gRPC-gateway into the required messages classes. There is a script `bun run generateOptions` which outputs the JavaScript classes into the `/options/` folder, from which we import the classes during generation.

- `/src/` - the main source code of this plugin

  - `index.ts` - instantiates the plugin with protobuf-es framework
  - `generate.Ts.ts` - the main logic of the plugin,
  - `helpers.ts` - various helpers for the plugin,
  - `runtime.ts` - this file is not used during generation, but contains common code for the runtime - the file is coppied by the plugin into the output folder and other generated files imports common logic from there.

- `/tests/` - the test files, written using [`bun` test API](https://bun.sh/docs/cli/test), you can run the test from CLI with `bun test` in the root of this repo or use bun plugin for your IDE to run and debug the tests selectivelly (highly recommended). There is an e2e setup which abstracts the `protoc` generation. The test framework accepts string representing a proto file, uses `buf` "black-magic" to resolve all proto dependencies and prepares the `CodeGeneratorRequest`[^2], which is then passed to our logic and you can assert the generated TypeScript code.

  The generated code and your asserts are compiled via `tsc` so formatting nuances and comments are stripped away and the syntax of both values is verified before the test. Each test case is selfcontained, you must pass in valid proto file content and you obtain all generated TypeScript files.

- `/tools/go` - the shell script for invoking GO libraries with pinned version.

[^2]: the `protoc` feeds the plugin with gRPC message `CodeGenerationRequest` on stdin and awaits the gRPC `CodeGeneraionResponse` on stdout.

### Development caveats

1. The `bun` is used also as a package manager, use [`bun add`](https://bun.sh/docs/cli/add) for adding dependencies, [`bun run`](https://bun.sh/docs/cli/run) for running NPM scripts or [`bunx`](https://bun.sh/docs/cli/bunx) instead of `npx`.
1. Beware that `bun` and `buf` are two different things and easy to confuse, it is easy to make mistake like running `bun` command with `buf` and vice versa.
1. Because `buf` can only read proto files from the file-system, each test writes a temporary file into `/tests/proto/`. The name of the file passed to `getCodeGeneratorRequest` function in the test is the actual name of the file created in `/tests/proto/` directory, therefor **each test must use unique file name**. I usually name the file loosely after the test-case.
