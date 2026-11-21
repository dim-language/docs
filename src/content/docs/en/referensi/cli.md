---
title: TypeScript SDK
description: Validate models, export JSON, and format DIM files in TypeScript.
---

## Install

```sh
npm install @dim/zoom-map
```

The package is also available from [GitHub Releases](https://github.com/dim-language/dim-sdk/releases/tag/v0.1.0).

The SDK includes a WebAssembly runtime. Call and await `initDim()` before using the compiler, formatter, or map.

## Check one file

Save this script as `check.mjs` in the project where you installed the SDK.

```js contoh-tutorial="check.mjs"
```

```sh
node check.mjs toko.dim
```

Exit code `1` means the model failed to compile. Diagnostics include the file, line, and column, along with a code such as `E040` for missing files.

## Compile a project with imports

`compileProject` takes an entry filename and the contents of all project files. Use relative paths with `/` separators.

```ts
import { compileProject, formatFile, initDim } from '@dim/zoom-map';

await initDim();
const files = {
  'main.dim': 'dim "0.5"; import "shop.dim"; person buyer; buyer -> shop;',
  'shop.dim': 'system shop "Shop";',
};

const { model, diagnostics } = compileProject('main.dim', files);
if (model) console.log(JSON.stringify(model));
else console.error(diagnostics);

const formatted = formatFile('main.dim', files['main.dim']);
if (formatted.text !== null) console.log(formatted.text);
```

Use `createMap(model)` to project a map and call `free()` when you are done. See the [SDK license](https://github.com/dim-language/dim-sdk/blob/main/LICENSE) for commercial use terms.
