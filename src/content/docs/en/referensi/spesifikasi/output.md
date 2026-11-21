---
title: JSON output format
description: The JSON model structure produced by the dim parser.
---

## 9. JSON output format

The parser emits one JSON document.

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

- `nodes` follows source order in preorder, with imported and amended files first ([§11.4](/en/referensi/spesifikasi/komposisi-dan-flow/#114-application-order)). A parent always precedes its children. Children added by `extend` appear at the position of that statement.
- `parent` is `null` on top-level elements.
- `from` and `to` are full paths to the elements named in the relation. The parser leaves them at their original level.
- `code` is an object for `kind: "code"` with all fields present and defaults of `null`, `false`, or `[]`. It is `null` on other element kinds. See [§6.4](/en/referensi/spesifikasi/model/#64-code-details).
- `source` is `null` unless declared. Otherwise it is an object with `path`, `line`, and `url`. A URL fills `url` and leaves the other two `null`. A file fills `path` relative to the main file directory ([§6.5](/en/referensi/spesifikasi/model/#65-implementation-location-source)), with `line` set to `null` if omitted.
- `refs` contains the IDs of the type elements referenced by the type string on the same object ([§6.6](/en/referensi/spesifikasi/model/#66-type-references)). It is `[]` if there are no references. It occurs in each `data`, `code.params`, `code.returns`, and `code.throws` entry, and on `body`, `query`, `headers`, and `cookies` in `code.http`. References for the string `code.type` go in `code.typeRefs`.
- `code.http` contains the endpoint contract after inheritance ([§13.6](/en/referensi/spesifikasi/endpoint-http/#136-output)) on `form endpoint` and is `null` on other forms.
- `httpDefaults` contains the `prefix`, `auth`, and `rate` written directly on the element ([§13.6](/en/referensi/spesifikasi/endpoint-http/#136-output)). It is `null` on endpoints and when none are declared.
- `op` is always present. If omitted, it defaults to `"call"` for a relation targeting an endpoint ([§13.5](/en/referensi/spesifikasi/endpoint-http/#135-relations-to-endpoints)), and `"use"` otherwise.
- `category` is `"structure"` for `extends`, `implements`, `owns`, and `refers`. All other operations, including unknown ones, use `"interaction"`.
- `data` contains one entry per `data` attribute and its explicit or default `dir`. If the relation declares no `data` and targets an endpoint, dim derives it from the endpoint contract ([§13.5](/en/referensi/spesifikasi/endpoint-http/#135-relations-to-endpoints)). Otherwise, if the operation supplies a default direction, dim emits an entry with `payload: []`. Without any of these, `data` is `[]`.
- `label` is `null` if omitted, except when the target is an endpoint ([§13.5](/en/referensi/spesifikasi/endpoint-http/#135-relations-to-endpoints)).
- `from` and `to` omit `::` even if the source used an absolute path.
- To assign `edges[].id`:
  - Use an explicit ID such as `checkout_post` if present.
  - Otherwise use `<from>-><to>#<k>`. `k` is the zero-based occurrence index among **all** relations with the same ordered endpoint pair, including explicitly named ones.
  - A default ID is stable under additions, removals, or moves of unrelated relations. It changes when the edge's own endpoints change or the order of relations with those endpoints changes.
  - A default ID contains `->`, which makes it distinct from an explicit IDENT.
- `span.file` is the source file path relative to the directory of the main file passed to the parser.
- `flows` follows source order. Each `steps[].edge` refers to the explicit ID of an entry in `edges`. If omitted, `name` defaults to `id`.
- Omit elements, relations, and flows deleted by `remove`.
- Preserve optional fields with `null` for unset strings and `[]` for unset lists.
