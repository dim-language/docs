---
title: Format output JSON
description: Struktur model JSON yang dihasilkan parser dim.
---

## 16. Format output (JSON)

Parser menghasilkan satu dokumen JSON. Bentuknya didefinisikan oleh JSON Schema yang dibuat dari meta-skema bahasa, dan tipe TypeScript di `@dim/sdk` dibuat dari JSON Schema yang sama. Bagian ini menjelaskan isinya. Kalau ada perbedaan, JSON Schema yang berlaku.

```json
{
  "version": "0.6",
  "config": {
    "techs": [{ "id": "postgres", "name": "PostgreSQL", "version": "16" }],
    "tags": [{ "id": "pci", "name": "Menyimpan data kartu" }],
    "scopes": [],
    "roots": [],
    "styles": [{ "selector": { "role": "database" }, "icon": "database", "background": "neutral" }]
  },
  "elements": [
    { "kind": "system", "id": "shop", "name": "Online Shop" },
    { "kind": "container", "id": "shop.api", "parent": "shop", "name": "API",
      "role": "service", "paradigms": ["oop"], "techs": ["kotlin"] },
    { "kind": "component", "id": "shop.api.orders", "parent": "shop.api", "name": "Orders",
      "description": "Membuat dan menyimpan order." },
    { "kind": "code", "form": "record", "id": "shop.api.orders.order", "parent": "shop.api.orders",
      "name": "Order", "description": "Order yang sudah dibuat.",
      "fields": [
        { "id": "id", "type": { "primitive": "uuid" } },
        { "id": "total", "type": { "primitive": "decimal" }, "description": "Total setelah diskon" }
      ] },
    { "kind": "endpoint", "protocol": "http", "id": "shop.api.orders.createOrder", "parent": "shop.api.orders",
      "name": "Buat order", "description": "Membuat order dari keranjang.",
      "method": "post", "path": "/orders", "fullPath": "/orders",
      "body": { "ref": "shop.api.orders.cart" },
      "returns": { "status": 201, "type": { "ref": "shop.api.orders.order" } } }
  ],
  "relations": [
    { "id": "saveOrder", "from": "shop.api.orders", "to": "shop.db", "op": "write", "category": "interaction",
      "label": "Simpan order",
      "data": [{ "dir": "push", "type": { "ref": "shop.api.orders.order" } }] }
  ],
  "flows": [
    { "id": "checkout", "name": "Checkout",
      "steps": [
        { "kind": "step", "relation": "openCheckout", "number": "1" },
        { "kind": "alt", "number": "2", "branches": [
          { "id": "paid", "label": "Pembayaran berhasil", "letter": "a",
            "steps": [{ "kind": "step", "relation": "saveOrder", "number": "2a.1" }] }
        ] }
      ] }
  ],
  "environments": [],
  "spans": {
    "elements": { "shop.api": { "file": "main.dim", "line": 12, "col": 3, "endLine": 30, "endCol": 4 } },
    "relations": {},
    "flows": {},
    "environments": {},
    "config": {}
  }
}
```

### 16.1 Prinsip

- **Tidak ada `null`.** Properti opsional yang tidak ditulis tidak muncul di output. List kosong juga tidak muncul, kecuali di tingkat teratas dokumen.
- **Satu bentuk per kind.** Setiap objek di `elements` hanya membawa field yang berlaku untuk kind-nya, dan untuk unit kode juga untuk `form`-nya. Konsumen membedakannya lewat `kind` dan `form`.
- **Semua rujukan sudah di-resolve** menjadi path lengkap atau id. `this` dan path relatif tidak pernah muncul di output.
- **Nilai turunan ikut ditulis kalau mahal dihitung ulang**, misalnya `fullPath` endpoint HTTP setelah `prefix` digabung, dan `auth` serta `rate` yang berlaku setelah pewarisan.
- **Urutan** mengikuti [§11.4](/referensi/spesifikasi/komposisi-dan-flow/#114-urutan-penerapan). Parent selalu muncul sebelum anaknya.

### 16.2 `elements`

Field yang ada di setiap elemen: `kind`, `id` (path lengkap), `name`, dan, kecuali untuk top-level, `parent`. Field opsional umum: `description`, `tags`, `source`, `meta`.

| `kind` | Field tambahan |
|---|---|
| `person` | — |
| `system` | `external` |
| `container` | `role`, `paradigms`, `techs`, `external`, `prefix`, `auth`, `rates` |
| `component` | `paradigms`, `techs`, `prefix`, `auth`, `rates` |
| `endpoint` | `protocol` (`http`, `grpc`, `graphql`, atau `event`, dari baris protokolnya), `handler`, `auth`, `rates` (yang berlaku), lalu field per protokol: `method`, `path`, `fullPath`, `params`, `queries`, `headers`, `cookies`, `body`, `returns`, `throws`, `sets` untuk HTTP; `service`, `rpc`, `request`, `returns`, `stream`, `throws` untuk gRPC; `operation`, `field`, `params`, `returns`, `throws` untuk GraphQL; `event`, `queue`, `payload` untuk event |
| `code` | `form`, lalu field per form: `async`, `pure`, `effects`, `visibility`, `static`, `abstract`, `fields`, `variants`, `params`, `returns`, `throws`, `type` sesuai [§7.3](/referensi/spesifikasi/level-kode/#73-properti-unit-kode)–[§7.4](/referensi/spesifikasi/level-kode/#74-member) |

`source` berbentuk `{ "root": "<id>", "path": "<path>", "line": <n> }`, dengan `root` yang sudah diwariskan.

### 16.3 Tipe

Ekspresi tipe ([§8](/referensi/spesifikasi/tipe/#8-tipe)) ditulis sebagai objek dengan tepat satu key:

| Ekspresi | JSON |
|---|---|
| `uuid` | `{ "primitive": "uuid" }` |
| `orders.order` | `{ "ref": "shop.api.orders.order" }` |
| `T[]` | `{ "list": T }` |
| `T?` | `{ "optional": T }` |
| `map<K, V>` | `{ "map": { "key": K, "value": V } }` |

### 16.4 `relations`

`id`, `from`, `to`, `op`, dan `category` (`"interaction"` atau `"structure"`) selalu ada. Field opsional: `label` (hanya kalau ditulis; label turunan dihitung konsumen), `data`, `techs`, `description`, `tags`, `meta`.

Setiap entri `data` berbentuk `{ "dir": "push" | "pull", "type": <tipe> }`. Untuk relasi ke endpoint, `data` diisi dari endpoint dan diberi `"derived": true`.

### 16.5 `flows`

`id`, `name`, dan `steps` selalu ada. Setiap langkah adalah salah satu dari:

| `kind` | Field |
|---|---|
| `step` | `relation`, `number`, `note` |
| `opt` | `number`, `branch` (satu cabang) |
| `alt` | `number`, `branches` |
| `par` | `number`, `branches` |

Cabang berbentuk `{ "id", "label", "letter", "steps" }`. `number` adalah nomor di model penuh ([§12.3](/referensi/spesifikasi/komposisi-dan-flow/#123-penomoran)). Nomor di level zoom tertentu dihitung konsumen.

### 16.6 `environments`

Setiap environment berbentuk `{ "id", "name", "description", "elements", "relations", "omitted" }`:

- `elements`: node, infra, dan deploy dalam bentuk datar dengan `kind`, `id` (path di dalam environment), dan `parent`. `deploy` membawa `container` dan `replicas`. `infra` membawa `role`.
- `relations`: relasi infra ([§13.5](/referensi/spesifikasi/deployment/#135-relasi-di-environment)).
- `omitted`: path container yang di-`omit`.

### 16.7 `spans`

Lokasi sumber dipisah dari model ke `spans`, dikelompokkan per namespace dan dikunci dengan id. Setiap span berbentuk `{ "file", "line", "col", "endLine", "endCol" }`, dengan baris dan kolom mulai dari 1. `spans` hanya ditulis kalau diminta (`dim parse --spans`), karena hanya editor dan alat sejenis yang membutuhkannya.
