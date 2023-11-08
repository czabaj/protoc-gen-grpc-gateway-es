

## [0.1.1](https://github.com/czabaj/protoc-gen-grpc-gateway-es/compare/v0.1.0...v0.1.1) (2023-11-08)


### Bug Fixes

* export binary for `npx` ([d96ab93](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/d96ab930caa21e91f211de96c80626c296420c8b))

## 0.1.0 (2023-11-08)


### Features

* add basic service generation ([0d917c9](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/0d917c901982cf985ecaeea27277a5a2fefb1fe4))
* add common "runtime.js" file ([94d9441](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/94d94412b33eeb11f01fa60db63b09d3edaabd53))
* add support for binary payload ([6f14403](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/6f1440390d38e260669bf7cb80fe0b4c0c5ab44e))
* build executable ([1a875b9](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/1a875b9dde6299f1a6d978b2e7acea8943186867))
* generate simple messages ([c11c383](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/c11c383110bc935e8132394e2d783935fedfaf2e))
* handle adjacent messages ([5186631](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/518663106bdf8cb2f82a02d473b272d73c2a1a18))
* handle big ints ([3fadd26](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/3fadd26982e65fdc894f8dd25e2c0746c5b44a64))
* handle well-known types ([fa23dd1](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/fa23dd1583d651b42a573b276da12bfcab44af2e))
* initial commit with basic test ([d4c1ae3](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/d4c1ae3289ea817a854802969bc02a6bce6ba93a))
* subtracts common prefix from enums ([cd62949](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/cd6294928b1e674b32a5ef98a57a98086157dd54))
* suport protobuf bytes ([6aeedbd](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/6aeedbd6fa3382db9b8f644497d7e0d04ed6b5b1))
* support all HTTP methods ([86c58ef](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/86c58ef60b78660cf0430532b3812b62cb380e2e))
* support nested path parameters ([17fb2e2](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/17fb2e2a63adc7351f8eedc9dfa561a98c672c31))
* support oneof ([22feddb](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/22feddbfe91c08bce2be4e6847aafa4ed0e77997))
* support openapiv2 options ([4291361](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/42913615cb2d2d607939c73cf23ed24f30b9b6bd))
* support path parameters ([c42ba8b](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/c42ba8b976bc2a56a3a68ee01381e0bac9ff1c83))
* support the `google.api.http.body` option ([748839b](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/748839b5ecef1dbef8dc82b6494693b6f8be3312))
* writable WKT can is nullable ([5ff00d5](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/5ff00d5e5a88a586fdff3db1216d05d8e6de7a8f))


### Bug Fixes

* `runtime.ts` lacks ignore pragmas ([a6614e6](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/a6614e6c92474557017f900e48b60d53678e7a02))
* FieldMask is serialized to @bufbuild/protobuf type ([80d4550](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/80d4550f35b2cf3c8962a71fa8091f98c7589aae))
* handler non-http-option schemas ([f8601ec](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/f8601ecee479e704d37530ff92b4e89dbb03f702))
* pathname of basePath is ignored ([fea5c6e](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/fea5c6ed1a03d5c45962b0e97479596ed6dfe1ac))
* repeated WKTs are generated as non-repeated ([97ad9f6](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/97ad9f6c8b7b720d15fc32234cbacf4d40d54271))


### Performance Improvements

* speed up the test a little bit ([e79447f](https://github.com/czabaj/protoc-gen-grpc-gateway-es/commit/e79447f64563ede84e90c117d6380f3e107020d8))