---
title: SDK TypeScript
description: Validasi model, ekspor JSON, dan format file DIM di TypeScript.
---

## Pasang

```sh
npm install https://github.com/dim-language/dim-sdk/releases/download/v0.3.1/dim-sdk-0.3.1.tgz
```

Paket juga tersedia di [GitHub Releases](https://github.com/dim-language/dim-sdk/releases/tag/v0.3.1).

SDK menyertakan runtime WebAssembly. Panggil dan tunggu `initDim()` sebelum menggunakan compiler, formatter, atau peta.

## Cek satu file

Simpan skrip ini sebagai `check.mjs` di proyek yang memasang SDK.

```js contoh-tutorial="check.mjs"
```

```sh
node check.mjs shop.dim
```

Kode keluar `1` berarti model gagal dikompilasi. Diagnostik memuat lokasi file, baris, dan kolom, beserta kode seperti `E601` untuk file yang tidak ditemukan.

## Kompilasi proyek dengan import

`compileProject` menerima nama file utama dan isi semua file proyek, termasuk `dim.config`. Pakai path relatif dengan pemisah `/`.

```ts
import { compileProject, formatFile, initDim } from '@dim/sdk';

await initDim();
const files = {
  'dim.config': 'dim "0.6";',
  'main.dim': 'dim "0.6"; import "shop.dim"; person buyer "Pembeli"; shopping: buyer -> shop { op use; }',
  'shop.dim': 'dim "0.6"; system shop "Toko";',
};

const { model, diagnostics } = compileProject('main.dim', files);
if (model) console.log(JSON.stringify(model));
else console.error(diagnostics);

const formatted = formatFile('main.dim', files['main.dim']);
if (formatted.text !== null) console.log(formatted.text);
```

`createMap(model)` memberi keadaan dan isi peta yang dihitung SDK Rust: `map.view(state, 'id')` mengembalikan kotak, panah, relasi, dan langkah alur dengan teksnya. Panggil `free()` setelah selesai. Untuk menampilkan peta di halaman web, pakai `renderMapHtml` dan `mountAll` dari `@dim/sdk/map` beserta `@dim/sdk/map.css`. Untuk syarat penggunaan komersial, baca [lisensi SDK](https://github.com/dim-language/dim-sdk/blob/main/LICENSE).
