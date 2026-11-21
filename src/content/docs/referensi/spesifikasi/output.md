---
title: Format output JSON
description: Struktur model JSON yang dihasilkan parser dim.
---

## 9. Format output (JSON)

Parser menghasilkan satu dokumen JSON:

```json
{
  "version": "0.5",
  "nodes": [
    {
      "id": "shop.api.orders.repo.find",
      "kind": "code",
      "name": "find_by_id()",
      "parent": "shop.api.orders.repo",
      "description": "Mengambil satu order beserta item-itemnya.",
      "tech": null,
      "shape": "box",
      "tags": [],
      "external": false,
      "ui": false,
      "source": { "path": "services/api/src/orders/repo.rs", "line": 42, "url": null },
      "httpDefaults": null,
      "code": {
        "form": "method",
        "visibility": null,
        "static": false,
        "abstract": false,
        "async": true,
        "type": null,
        "typeRefs": [],
        "params": [
          { "name": "id", "type": "OrderId", "description": null, "refs": [] }
        ],
        "returns": {
          "type": "Option<Order>",
          "description": "None kalau order tidak ada",
          "refs": ["shop.api.orders.order"]
        },
        "throws": [],
        "http": null
      },
      "span": { "file": "shop.dim", "line": 101, "col": 9, "endLine": 107, "endCol": 10 }
    }
  ],
  "edges": [
    {
      "id": "insert_order",
      "from": "shop.api.orders.repo.save",
      "to": "shop.db",
      "label": "INSERT orders",
      "op": "write",
      "category": "interaction",
      "data": [
        { "dir": "push", "payload": ["Order"], "refs": ["shop.api.orders.order"] }
      ],
      "tech": null,
      "description": null,
      "tags": [],
      "span": { "file": "shop.dim", "line": 150, "col": 3, "endLine": 150, "endCol": 86 }
    }
  ],
  "flows": [
    {
      "id": "checkout",
      "name": "Checkout",
      "description": "Dari pembeli menekan bayar sampai order tersimpan.",
      "tags": [],
      "steps": [
        { "edge": "checkout_click", "label": null },
        { "edge": "charge", "label": "Tagih dulu" }
      ],
      "span": { "file": "main.dim", "line": 25, "col": 1, "endLine": 34, "endCol": 2 }
    }
  ]
}
```

Aturan:
- `nodes` berurutan sesuai urutan kemunculan di sumber (pre-order), dengan file yang di-import atau di-amends lebih dulu ([§11.4](/referensi/spesifikasi/komposisi-dan-flow/#114-urutan-penerapan)). Parent selalu muncul sebelum anaknya. Anak yang ditambahkan lewat `extend` muncul di posisi `extend`-nya.
- `parent` bernilai `null` untuk elemen top-level.
- `from`/`to` selalu path lengkap ke elemen yang ditulis, **tidak pernah** di-lift oleh parser.
- `code` selalu berupa objek untuk `kind: "code"` (semua field ada, nilai default `null`/`false`/`[]`), dan `null` untuk jenis elemen lain. Isinya mengikuti [§6.4](/referensi/spesifikasi/model/#64-detail-kode).
- `source` bernilai `null` kalau tidak ditulis. Kalau ditulis, berupa objek `{ "path", "line", "url" }`: untuk URL, `url` terisi dan dua lainnya `null`; untuk path, `path` relatif terhadap folder file utama ([§6.5](/referensi/spesifikasi/model/#65-lokasi-implementasi-source)), dan `line` bernilai `null` kalau tidak ditulis.
- `refs` berisi id elemen tipe yang dirujuk string tipe di objek yang sama ([§6.6](/referensi/spesifikasi/model/#66-rujukan-tipe)), dan `[]` kalau tidak ada. Field ini ada di setiap entri `data`, `code.params`, `code.returns`, `code.throws`, serta `body`, `query`, `headers`, dan `cookies` di `code.http`. Untuk `code.type`, yang berupa string, rujukannya ada di `code.typeRefs`.
- `code.http` berisi kontrak endpoint yang sudah diwariskan ([§13.6](/referensi/spesifikasi/endpoint-http/#136-output)) untuk `form endpoint`, dan `null` untuk form lain.
- `httpDefaults` berisi `prefix`, `auth`, dan `rate` yang ditulis di elemen itu sendiri ([§13.6](/referensi/spesifikasi/endpoint-http/#136-output)), dan `null` kalau tidak ada atau elemennya endpoint.
- `op` selalu terisi: `"call"` kalau tidak ditulis dan targetnya endpoint ([§13.5](/referensi/spesifikasi/endpoint-http/#135-relasi-ke-endpoint)), selain itu `"use"`.
- `category` bernilai `"structure"` untuk `extends`, `implements`, `owns`, `refers`, dan `"interaction"` untuk sisanya, termasuk `op` tak dikenal.
- `data` berisi satu entri per atribut `data`, dengan `dir` yang sudah diisi (dari tulisan atau default `op`). Kalau tidak ada atribut `data` dan targetnya endpoint, `data` diambil dari kontrak endpoint ([§13.5](/referensi/spesifikasi/endpoint-http/#135-relasi-ke-endpoint)). Kalau tidak ada atribut `data` tapi `op` punya arah default, `data` berisi satu entri dengan `payload: []`. Kalau semuanya tidak ada, `data` bernilai `[]`.
- `label` bernilai `null` kalau tidak ditulis, kecuali targetnya endpoint ([§13.5](/referensi/spesifikasi/endpoint-http/#135-relasi-ke-endpoint)).
- `from`/`to` ditulis tanpa `::`, meskipun di sumber ditulis sebagai path absolut.
- `edges[].id`:
  - Kalau relasi punya id eksplisit (`checkout_post: a -> b`), itu id-nya.
  - Kalau tidak, id default adalah `<from>-><to>#<k>`, dengan `k` urutan kemunculan (mulai 0) di antara **semua** relasi yang punya pasangan `from`/`to` sama, termasuk yang punya id eksplisit.
  - Id default stabil terhadap penambahan, penghapusan, atau pemindahan relasi lain. Id baru berubah kalau ujung relasinya sendiri berubah, atau kalau urutan relasi dengan pasangan `from`/`to` yang sama berubah.
  - Id default selalu mengandung `->`, jadi tidak pernah bentrok dengan id eksplisit (yang berupa IDENT).
- `span.file` adalah path file sumber, relatif terhadap folder file utama yang diberikan ke parser.
- `flows` berurutan sesuai kemunculan. `steps[].edge` selalu id eksplisit sebuah edge yang ada di `edges`. `name` sama dengan `id` kalau tidak ditulis.
- Elemen, relasi, dan flow yang dihapus dengan `remove` tidak muncul sama sekali.
- Field opsional yang tidak diisi bernilai `null` (string) atau `[]` (list), bukan dihilangkan.
