---
title: TypeScript SDK
description: Validate models, export JSON, and format DIM files in TypeScript.
---

## Install

```sh
npm install https://github.com/dim-language/dim-sdk/releases/download/v0.3.0/dim-sdk-0.3.0.tgz
```

The package is also available from [GitHub Releases](https://github.com/dim-language/dim-sdk/releases/tag/v0.3.0).

The SDK includes a WebAssembly runtime. Call and await `initDim()` before using the compiler, formatter, or map.

## Check one file

Save this script as `check.mjs` in the project where you installed the SDK.

```js contoh-tutorial="check.mjs"
```

```sh
node check.mjs toko.dim
```

Exit code `1` means the model failed to compile. Diagnostics include the file, line, and column, along with a code such as `E601` for missing files.

## Compile a project with imports

`compileProject` takes an entry filename and the contents of all project files, including `dim.config`. Use relative paths with `/` separators.

```ts
import { compileProject, formatFile, initDim } from '@dim/sdk';

await initDim();
const files = {
  'dim.config': 'dim "0.6";',
  'main.dim': 'dim "0.6"; import "shop.dim"; person buyer "Buyer"; shopping: buyer -> shop { op use; }',
  'shop.dim': 'dim "0.6"; system shop "Store";',
};

const { model, diagnostics } = compileProject('main.dim', files);
if (model) console.log(JSON.stringify(model));
else console.error(diagnostics);

const formatted = formatFile('main.dim', files['main.dim']);
if (formatted.text !== null) console.log(formatted.text);
```

`createMap(model)` gives you the map state and view model computed by the Rust SDK: `map.view(state, 'en')` returns the boxes, arrows, relations, and flow steps with their text. Call `free()` when you are done. To show the map on a web page, use `renderMapHtml` and `mountAll` from `@dim/sdk/map` with `@dim/sdk/map.css`. See the [SDK license](https://github.com/dim-language/dim-sdk/blob/main/LICENSE) for commercial use terms.
