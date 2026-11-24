---
title: Elements
description: Element kinds, nesting, common properties, container roles, source, meta, and path resolution.
---

## 6. Elements

### 6.1 Element kinds and nesting

| Kind | Can be inside | Examples |
|---|---|---|
| `person` | top level | shopper, admin, operator |
| `system` | top level | a system owned by one team or organization |
| `container` | `system` | web app, API, database, queue |
| `component` | `container`, `component` | module, internal service, UI page |
| `endpoint` | `component` | HTTP route, gRPC method, GraphQL field, event ([§10](/en/referensi/spesifikasi/endpoint/#10-endpoints)) |
| code-level kinds | `component` and each other | see [§7](/en/referensi/spesifikasi/level-kode/#7-code-level) |

Deployment elements (`environment`, `node`, `infra`, `deploy`) form a separate hierarchy ([§13](/en/referensi/spesifikasi/deployment/#13-deployment)).

- A `person` has no children.
- Levels below `container` are optional. A container without components, or a component without code-level elements, is valid.
- Code-level elements can't sit directly inside a `container`; there must be a `component` in between. In C4, the code level zooms into *one component*, so every unit of code has a named owning module.

Nesting that breaks this table is `E201`.

### 6.2 Identity

- An `id` is written in camelCase ([§3.4](/en/referensi/spesifikasi/sintaks/#34-identifiers)) and is unique among its **siblings** (children of the same parent), whatever their kind (`E202`).
- An element's global identity is its **full path**: the `id`s from the top level down to the element, joined with `.`. For example: `shop.api.orders.createOrder`.
- The same `id` can appear under different parents.
- The name after the id is required (`E203`) and is prose.

### 6.3 Common properties

| Property | Value | Applies to | Required |
|---|---|---|---|
| `description` | prose | all | `component`, `endpoint`, and code units ([§7.3](/en/referensi/spesifikasi/level-kode/#73-code-unit-properties)) |
| `tags` | ≥1 tag reference | all | |
| `tech` | ≥1 tech reference | `container`, `component` | |
| `role` | a role ([§6.5](#65-container-roles)) | `container` | yes |
| `paradigm` | ≥1 paradigm ([§6.6](#66-paradigms)) | `container`, `component` | containers with code units other than data types |
| `external` | flag | `system`, `container` | |
| `source` | block ([§6.7](#67-implementation-location-source)) | all except `person` | |
| `meta` | JSON object ([§6.8](#68-meta)) | all | |

A missing required property is `E205`. A property that doesn't apply to the kind is `E204`.

### 6.4 `external`

`external` marks an element we don't own, such as a third-party payment gateway.

- Everything inside an `external` system is external too. Writing `external` on a container inside an external system is `E212`.
- An external container inside a system we own is also allowed, for example a SaaS product used by only one system.
- External elements aren't deployed ([§13](/en/referensi/spesifikasi/deployment/#13-deployment)). At the code level, an external element can contain only data types (`record`, `enum`, `union`, `alias`), so a third party's API contract can still be written (`E201`).

### 6.5 Container roles

Every container must state its role. The role decides which relations can point at the container ([§9.4](/en/referensi/spesifikasi/relasi/#94-relation-end-rules)) and serves as a style selector ([§5.6](/en/referensi/spesifikasi/konfigurasi/#56-style)).

| `role` | Meaning |
|---|---|
| `app` | an application people use directly: web, mobile, desktop |
| `service` | a backend process that's called or runs on its own: API, worker, job |
| `database` | structured data storage |
| `queue` | a message queue or topic |
| `storage` | file or object storage |
| `cache` | temporary storage that speeds up reads |

Any other role is `E207`.

### 6.6 Paradigms

```dim
container api "API" {
  role service;
  paradigm oop functional;
}
```

`paradigm` states the style of code in the container: `procedural`, `functional`, and/or `oop`. Paradigms decide which code-level kinds can be used ([§7.1](/en/referensi/spesifikasi/level-kode/#71-paradigms)).

- Required on every container that contains code units other than data types (`E213`). Data types can be used under any paradigm, so a container with only data types doesn't need `paradigm`. Other containers can write it to state their intent.
- A component can write `paradigm` to **narrow** the paradigms that apply. A paradigm its containing container or component doesn't have is `E213`.
- An element's **effective paradigms** are the `paradigm` of the nearest component or container above it that writes one.
- A paradigm can't be listed twice (`E207`).

### 6.7 Implementation location (`source`)

```dim
system shop "Online Shop" {
  source { root shopRepo; path "."; }

  container api "API" {
    role service;
    source { path "services/api"; }

    component orders "Orders" {
      description "Creates and stores orders.";
      source { path "services/api/src/orders"; }
    }
  }
}
```

`source` points to where an element is implemented.

| Property | Value | Notes |
|---|---|---|
| `root` | a root reference ([§5.5](/en/referensi/spesifikasi/konfigurasi/#55-root)) | required unless an ancestor writes one |
| `path` | a `filePath` literal | required; relative to the root |
| `line` | `INT` ≥ 1 | a line in the file |

- **The root is inherited.** An element without a `root` uses the root of the nearest ancestor that writes `source`. If there's none, `E211`.
- **A path is always relative to the root**, not to the parent's path. Every `source` can be read without looking at its parent.
- `path "."` means the root itself.
- `source` is optional and isn't inherited as a location. An element without `source` has no implementation yet, or it hasn't been recorded, for example a new element in a *to-be* model.
- The parser doesn't check whether the file exists. `dim check --sources` checks it against a local checkout of each root.

### 6.8 `meta`

```dim
container api "API" {
  role service;
  meta {
    "owner": "checkout",
    "costCenter": 4120,
    "slo": { "availability": 99.9 }
  }
}
```

`meta` holds **experimental properties**: information that isn't part of the language yet. With `meta`, a property can be tried out without waiting for the language to change.

- Its content is one JSON object (RFC 8259). Invalid JSON is `E009`.
- Top-level keys are camelCase ([§3.4](/en/referensi/spesifikasi/sintaks/#34-identifiers)) and can't match a language property name (`E009`). Keys in nested objects are free-form.
- `meta` is allowed on every element, relation, flow, and deployment element.
- **The core never reads `meta`.** The parser only checks its shape and passes it to the output as is ([§16](/en/referensi/spesifikasi/output/#16-json-output-format)). Validation, zoom, and styles never depend on what's in `meta`.
- **Promotion.** A key that proves useful is proposed as a language property with a clear type. Once it's promoted, a `meta` key with that name becomes `E009`, and the message points to the new property. That way there are never two ways to write the same thing.

### 6.9 Path resolution

Paths in relations, types, and other references resolve relative to the **scope** where they're written. The scope is the element whose block contains the statement, or the model root for a top-level statement.

The algorithm for a path `p1.p2.….pn` in scope `S`:

1. Start at `S`. Look for a direct child named `p1`.
2. If there's none, move up to the parent of `S` and repeat, up to the root.
3. The first scope with a child named `p1` wins. If none is found up to the root, `E208`.
4. From that `p1`, each of `p2 … pn` must be a direct child of the one before.

**Absolute paths.** A path starting with `::` (for example `::shop.api.orders`) skips steps 1–3: `p1` is looked up among the top-level elements.

**`this`.** `this` at the start of a path refers to the element whose block is being written. `this.p1.….pn` skips steps 1–3. `this` at the top level, or anywhere other than the start of a path, is `E210`. Inside an `extend X { … }` block, `this` refers to `X`.

**Shadowed names.** If `p1` is found in scope `S'` and **also** exists as a child in an enclosing scope further out, a reader can't tell which element is meant without tracing scopes. Such a path is `E209`. Write a path that starts from the intended scope, use `this`, or use an absolute path.

```dim
system shop "Online Shop" {
  container payments "Payments Service" { role service; }

  container api "API" {
    role service;
    component payments "Payment Client" { description "Calls the Payments Service."; }
    component orders "Orders" {
      description "Stores orders.";
      charge: this -> payments { op call; }       // ❌ E209: shop.api.payments or shop.payments?
      charge: this -> api.payments { op call; }   // ✅
    }
  }
}
```

`payments` is found as a child of `api`, but `shop` also has a child named `payments`.
