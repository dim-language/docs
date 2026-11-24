---
title: JSON output format
description: The structure of the JSON model produced by the dim parser.
---

## 16. JSON output format

The parser produces one JSON document. Its shape is defined by a JSON Schema generated from the language's meta-schema, and the TypeScript types in `@dim/sdk` are generated from the same JSON Schema. This section describes the content. If anything differs, the JSON Schema wins.

```json
{
  "version": "0.6",
  "config": {
    "techs": [{ "id": "postgres", "name": "PostgreSQL", "version": "16" }],
    "tags": [{ "id": "pci", "name": "Stores card data" }],
    "scopes": [],
    "roots": [],
    "styles": [{ "selector": { "role": "database" }, "icon": "database", "background": "neutral" }]
  },
  "elements": [
    { "kind": "system", "id": "shop", "name": "Online Shop" },
    { "kind": "container", "id": "shop.api", "parent": "shop", "name": "API",
      "role": "service", "paradigms": ["oop"], "techs": ["kotlin"] },
    { "kind": "component", "id": "shop.api.orders", "parent": "shop.api", "name": "Orders",
      "description": "Creates and stores orders." },
    { "kind": "code", "form": "record", "id": "shop.api.orders.order", "parent": "shop.api.orders",
      "name": "Order", "description": "An order that has been created.",
      "fields": [
        { "id": "id", "type": { "primitive": "uuid" } },
        { "id": "total", "type": { "primitive": "decimal" }, "description": "Total after discounts" }
      ] },
    { "kind": "endpoint", "protocol": "http", "id": "shop.api.orders.createOrder", "parent": "shop.api.orders",
      "name": "Create order", "description": "Creates an order from a cart.",
      "method": "post", "path": "/orders", "fullPath": "/orders",
      "body": { "ref": "shop.api.orders.cart" },
      "returns": { "status": 201, "type": { "ref": "shop.api.orders.order" } } }
  ],
  "relations": [
    { "id": "saveOrder", "from": "shop.api.orders", "to": "shop.db", "op": "write", "category": "interaction",
      "label": "Save order",
      "data": [{ "dir": "push", "type": { "ref": "shop.api.orders.order" } }] }
  ],
  "flows": [
    { "id": "checkout", "name": "Checkout",
      "steps": [
        { "kind": "step", "relation": "openCheckout", "number": "1" },
        { "kind": "alt", "number": "2", "branches": [
          { "id": "paid", "label": "Payment succeeded", "letter": "a",
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

### 16.1 Principles

- **No `null`.** An optional property that isn't written doesn't appear in the output. Empty lists don't appear either, except at the top level of the document.
- **One shape per kind.** Each object in `elements` carries only the fields that apply to its kind, and for code units also to its `form`. Consumers tell them apart by `kind` and `form`.
- **Every reference is resolved** to a full path or id. `this` and relative paths never appear in the output.
- **Derived values are included when they're costly to recompute**, such as an HTTP endpoint's `fullPath` after joining `prefix`, and the `auth` and `rate` that apply after inheritance.
- **Order** follows [§11.4](/en/referensi/spesifikasi/komposisi-dan-flow/#114-order-of-application). A parent always comes before its children.

### 16.2 `elements`

Fields on every element: `kind`, `id` (the full path), `name`, and, except at the top level, `parent`. Common optional fields: `description`, `tags`, `source`, `meta`.

| `kind` | Additional fields |
|---|---|
| `person` | — |
| `system` | `external` |
| `container` | `role`, `paradigms`, `techs`, `external`, `prefix`, `auth`, `rates` |
| `component` | `paradigms`, `techs`, `prefix`, `auth`, `rates` |
| `endpoint` | `protocol` (`http`, `grpc`, `graphql`, or `event`, from its protocol line), `handler`, `auth`, `rates` (as applied), then per-protocol fields: `method`, `path`, `fullPath`, `params`, `queries`, `headers`, `cookies`, `body`, `returns`, `throws`, `sets` for HTTP; `service`, `rpc`, `request`, `returns`, `stream`, `throws` for gRPC; `operation`, `field`, `params`, `returns`, `throws` for GraphQL; `event`, `queue`, `payload` for events |
| `code` | `form`, then per-form fields: `async`, `pure`, `effects`, `visibility`, `static`, `abstract`, `fields`, `variants`, `params`, `returns`, `throws`, `type` per [§7.3](/en/referensi/spesifikasi/level-kode/#73-code-unit-properties)–[§7.4](/en/referensi/spesifikasi/level-kode/#74-members) |

`source` has the shape `{ "root": "<id>", "path": "<path>", "line": <n> }`, with `root` already inherited.

### 16.3 Types

A type expression ([§8](/en/referensi/spesifikasi/tipe/#8-types)) is written as an object with exactly one key:

| Expression | JSON |
|---|---|
| `uuid` | `{ "primitive": "uuid" }` |
| `orders.order` | `{ "ref": "shop.api.orders.order" }` |
| `T[]` | `{ "list": T }` |
| `T?` | `{ "optional": T }` |
| `map<K, V>` | `{ "map": { "key": K, "value": V } }` |

### 16.4 `relations`

`id`, `from`, `to`, `op`, and `category` (`"interaction"` or `"structure"`) are always present. Optional fields: `label` (only when written; derived labels are computed by consumers), `data`, `techs`, `description`, `tags`, `meta`.

Each `data` entry has the shape `{ "dir": "push" | "pull", "type": <type> }`. For a relation to an endpoint, `data` is filled from the endpoint and marked `"derived": true`.

### 16.5 `flows`

`id`, `name`, and `steps` are always present. Each step is one of:

| `kind` | Fields |
|---|---|
| `step` | `relation`, `number`, `note` |
| `opt` | `number`, `branch` (one branch) |
| `alt` | `number`, `branches` |
| `par` | `number`, `branches` |

A branch has the shape `{ "id", "label", "letter", "steps" }`. `number` is the number in the full model ([§12.3](/en/referensi/spesifikasi/komposisi-dan-flow/#123-numbering)). Numbers at a particular zoom level are computed by consumers.

### 16.6 `environments`

Each environment has the shape `{ "id", "name", "description", "elements", "relations", "omitted" }`:

- `elements`: nodes, infra, and deploys as a flat list with `kind`, `id` (the path within the environment), and `parent`. A `deploy` carries `container` and `replicas`. An `infra` carries `role`.
- `relations`: infra relations ([§13.5](/en/referensi/spesifikasi/deployment/#135-relations-in-an-environment)).
- `omitted`: the paths of omitted containers.

### 16.7 `spans`

Source locations are kept apart from the model in `spans`, grouped by namespace and keyed by id. Each span has the shape `{ "file", "line", "col", "endLine", "endCol" }`, with lines and columns starting at 1. `spans` is written only on request (`dim parse --spans`), because only editors and similar tools need it.
