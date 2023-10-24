# protoc-gen-grpc-gateway-es

Generate TypeScript client for gRPC API exposed via grpc-gateway. Powered by [protobuf-es framework](https://github.com/bufbuild/protobuf-es) and [bun toolchain](https://github.com/oven-sh/bun).

## Philosophy

The plugin walks over the proto files and converts protobuf messages to TypeScipt types and protobuf RPC to functions. The functions are named as `ServiceName_MethodName` and have following signature

```TypeScript
import type { Config, PreparesRequest } from "./runtime.ts";

export type ServiceMethodRequest = {
  foo?: string;
}

export type ServiceMethodResponse = {
  bar?: string;
}

export const Service_Method = (config: Config) => (variables: ServiceMethodRequest): PreparedRequest<ServiceMethodResponse> => {
  ...
}
```

The `Config` is an object, which optionally provides base path and bearer token for the request.

The `PreparedRequest` is an object, which contains a [Request object](https://developer.mozilla.org/en-US/docs/Web/API/Request) for fetch API and a `responseTypeId` function, which is an identity function[^1] that just assigns the type of the response. The intended use is

[^1]: Function which returns the argument `a => a`, i.e. does nothing

```TypeScript
const config: Config = {
  basePath: "https://example.com/api/v1",
  bearerToken: () => virtualGetBearerToken()
};

const configuredServiceMethod = Service_Method(config)

const variables: ServiceMethodRequest = {
  foo: "hello",
}

const { request, responseTypeId } = configuredServiceMethod(variables)

const serviceMethodCall = fetch(request).then(response => {
  if (response.ok) {
    // type the response with the identity function, in non-TypeScript code, the `responseTypeId` is redundant
    return response.json().then(responseTypeId)
  }
  // reject the non-succesfull (non 2xx status code) response or do other things
  return Promise.reject(response)
})
```

If you don't want to use the fetch API, you can just read URL and body and headers from the [Request object](https://developer.mozilla.org/en-US/docs/Web/API/Request) and pass it to `axios` or whichever library you are using in the browser.

## Development

First, read the [Protobuf-ES: Writing Plugins](https://github.com/bufbuild/protobuf-es/blob/main/docs/writing_plugins.md#protobuf-es-writing-plugins) and familiarize yourself with the [Bun toolkit](https://bun.sh/docs).

Use test-driven development, first write a failing test with feature you want to implement and then change the code.

Folders and their meaning

- `/options/` - when you want to read options (a.k.a. extensions) from the proto files, and the options are non-scalar, such as

  ```proto
  option (google.api.http) = {get: "/v1/{name_test=projects/*/documents/*}:customMethod"};
  ```

  where the value of the `google.api.http` is an object, the protobuf-es framework requires you to have prepared the object types as `@bufbuild/protobuf/Message` JavaScript classes. We are using `buf` to convert all options commonly used in gRPC-gateway into the required messages classes. There is a script `bun run generateOptions` which outputs the JavaScript classes into the `/options/` folder, from where we import what we need during code generation.

- `/src/` - the main source code of this plugin

  - `index.ts` - instantiates the plugin with protobuf-es framework
  - `generate.Ts.ts` - the main logic of the plugin,
  - `helpers.ts` - various helpers for the plugin,
  - `runtime.ts` - this file is not used during generation, but contains common code for the runtime - the file is coppied by the plugin into the output folder and other generated files imports common logic from there.

- `/tests/` - the test files, written using [`bun` test API](https://bun.sh/docs/cli/test), you can run the test from CLI with `bun test` in the root of this repo or use bun plugin for your IDE to run and debug the tests selectivelly (highly recommended). There is an e2e setup which abstracts the `protoc` generation. The test framework accepts string representing a proto file, uses `buf` "black-magic" to resolve all proto dependencies and prepares the `CodeGeneratorRequest`[^2], which is then passed to our logic and you can assert the generated TypeScript code.

  The generated code and your asserts are compiled via `tsc` so formatting nuances and comments are stripped away and the syntax of both values is verified before the test. Each test case is selfcontained, you must pass in valid proto file content and you obtain all generated TypeScript files.

- `/tools/go` - the shell script for invoking GO libraries with pinned version.

[^2]: the `protoc` feeds the plugin with gRPC message `CodeGenerationRequest` on stdin and awaits the gRPC `CodeGeneraionResponse` on stdout.

### Caveats

1. The `bun` is used also as a package manager, use [`bun add`](https://bun.sh/docs/cli/add) for adding dependencies, [`bun run`](https://bun.sh/docs/cli/run) for running NPM scripts or [`bunx`](https://bun.sh/docs/cli/bunx) instead of `npx`.
1. Beware that `bun` and `buf` are two different things and easy to confuse, it is easy to make mistake like running `bun` command with `buf` and vice versa.
1. Because `buf` can only read proto files from the file-system, each test writes a temporary file into `/tests/proto/`. The name of the file passed to `getCodeGeneratorRequest` function in the test is the actual name of the file created in `/tests/proto/` directory, therefor **each test must use uniqie file name**. I usually name the file loosely after the test-case.

## Usage and deployment

TBD
