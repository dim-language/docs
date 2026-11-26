---
title: Language specification
description: The normative specification for dim v0.6, from lexical structure to project configuration, the code level, types, relations, endpoints, flows, deployment, zoom semantics, and canonical form.
---

**Version 0.6 (draft)** · File extension `.dim` · Project configuration `dim.config`

:::caution[Draft]
Version 0.6 is a redesign and is **not implemented yet**. The compiler, SDK, and editor still use v0.5. A v0.6 parser can't read v0.5 models, and there is no automatic migration.
:::

`dim` describes software architecture as **one zoomable, hierarchical model**. It takes its concepts from the [C4 model](https://c4model.com), with two main differences:

1. All levels (system, container, component, code) live in **one model**, not in separate diagrams.
2. Relations can connect elements at **any level**. Relations at higher levels aren't written; they're **derived** from more detailed ones ([§14](/referensi/spesifikasi/semantik-zoom/#14-zoom-semantics-lifting)).

---

## 1. Design principles

**A zoomable model**

1. **Write each relation at the most detailed level you know.** If you know the function, write it from the function. If you only know the container, write it from the container. Both are valid.
2. **Higher levels are derived, not written.** `system → system` appears automatically from the relations below it, so a high-level diagram can't go stale or contradict its details.
3. **Zooming out summarizes; it doesn't discard.** A lifted relation keeps the list of relations it came from.
4. **The parser knows nothing about layout.** It only produces the model. Zoom, lifting, aggregation, and layout are the consumer's job.

**Order**

5. **Every value has a clear kind.** A value in dim is exactly one of three things:
   - **prose** for people to read: element names, `description`, relation labels, flow branch labels, and notes;
   - a **reference** to something declared: an element, type, relation, tech, tag, scope, or root;
   - a **typed literal** whose format is checked: numbers, durations, URLs, file paths, HTTP paths, and so on ([§3.9](/referensi/spesifikasi/sintaks/#39-typed-literals)).

   There are no free-form strings outside prose.
6. **Declare once, reference everywhere.** Techs, tags, scopes, source roots, and styles are declared in [`dim.config`](/referensi/spesifikasi/konfigurasi/#5-project-configuration). Models only reference them.
7. **One thing, one way to write it.** Every concept has exactly one syntactic form, and every keyword has exactly one meaning.
8. **No warnings.** Every violation is an error, and a model with errors produces no output ([§15](/referensi/spesifikasi/validasi/#15-validation)).
9. **Independent of programming languages, faithful to paradigms.** The code level uses the concepts of programming paradigms (procedural, functional, object-oriented) and dim's own type system, not the syntax of a particular language ([§7](/referensi/spesifikasi/level-kode/#7-code-level), [§8](/referensi/spesifikasi/tipe/#8-types)).

---

## 2. Short example

A dim project consists of `dim.config` and one or more `.dim` files:

```dim
// dim.config
dim "0.6";

tech nextjs "Next.js";
tech kotlin "Kotlin" { version "2.1"; }
tech postgres "PostgreSQL" { version "16"; }

tag pci "Stores card data";

style role database { icon database; background neutral; }
style tag pci { background warning; }
```

```dim
// main.dim
dim "0.6";

person customer "Customer" {
  description "Shops online.";
}

system shop "Online Shop" {
  container web "Web App" {
    role app;
    tech nextjs;

    component checkout "Checkout Page" {
      description "Cart summary and the pay button.";
    }
  }

  container api "API" {
    role service;
    paradigm oop;
    tech kotlin;

    component orders "Orders" {
      description "Creates and stores orders.";

      record cart "Cart" {
        description "Items about to be paid for.";
        field productIds: uuid[];
      }

      record order "Order" {
        description "An order that has been created.";
        field id: uuid;
        field total: decimal "Total after discounts";
      }

      endpoint createOrder "Create order" {
        description "Creates an order from a cart.";
        http post "/orders";
        body cart;
        returns 201 order;
      }
    }
  }

  container db "Orders DB" {
    role database;
    tech postgres;
    tags pci;
  }

  placeOrder: web.checkout -> api.orders.createOrder { op call; }
  saveOrder: api.orders -> db "Save order" { op write; data push api.orders.order; }
}

openCheckout: customer -> shop.web.checkout "Click pay" { op use; }

flow checkout "Checkout" {
  description "From the shopper clicking pay to the order being saved.";
  step openCheckout;
  step placeOrder;
  step saveOrder;
}
```

`placeOrder` writes neither a label nor `data`. Both come from the `createOrder` endpoint: the label `POST /orders`, the data `push cart`, and `pull order` ([§10](/referensi/spesifikasi/endpoint/#10-endpoints)).

---

## Specification chapters

- [§3 Lexical structure](/referensi/spesifikasi/sintaks/#3-lexical-structure)
- [§4 Grammar](/referensi/spesifikasi/sintaks/#4-grammar)
- [§5 Project configuration](/referensi/spesifikasi/konfigurasi/#5-project-configuration)
- [§6 Elements](/referensi/spesifikasi/model/#6-elements)
- [§7 Code level](/referensi/spesifikasi/level-kode/#7-code-level)
- [§8 Types](/referensi/spesifikasi/tipe/#8-types)
- [§9 Relations](/referensi/spesifikasi/relasi/#9-relations)
- [§10 Endpoints](/referensi/spesifikasi/endpoint/#10-endpoints)
- [§11 File composition](/referensi/spesifikasi/komposisi-dan-flow/#11-file-composition)
- [§12 Flows](/referensi/spesifikasi/komposisi-dan-flow/#12-flows)
- [§13 Deployment](/referensi/spesifikasi/deployment/#13-deployment)
- [§14 Zoom semantics](/referensi/spesifikasi/semantik-zoom/#14-zoom-semantics-lifting)
- [§15 Validation](/referensi/spesifikasi/validasi/#15-validation)
- [§16 JSON output format](/referensi/spesifikasi/output/#16-json-output-format)
- [§17 Canonical form](/referensi/spesifikasi/bentuk-kanonik/#17-canonical-form)

---

## Changes from 0.5

Version 0.6 isn't compatible with 0.5. In summary:

| Topic | 0.5 | 0.6 |
|---|---|---|
| Version declaration | optional | required in every file ([§4.6](/referensi/spesifikasi/sintaks/#46-version-declaration)) |
| Ids | `snake_case` | camelCase, with acronyms written `httpClient` ([§3.4](/referensi/spesifikasi/sintaks/#34-identifiers)) |
| `;` | could be omitted before `}` | required |
| Configuration | none | `dim.config` for techs, tags, scopes, roots, and styles ([§5](/referensi/spesifikasi/konfigurasi/#5-project-configuration)) |
| `tech`, `tags` | free strings | references to `dim.config` |
| `shape`, `ui` | present | removed; containers must have a `role`, and appearance comes from styles ([§6.5](/referensi/spesifikasi/model/#65-container-roles)) |
| `source` | one string | `source { root …; path "…"; line …; }` ([§6.7](/referensi/spesifikasi/model/#67-implementation-location-source)) |
| Extension | `tags` | `meta` holds JSON for experimental properties ([§6.8](/referensi/spesifikasi/model/#68-meta)) |
| Code level | `code` + free-form `form` | one kind per concept (`function`, `class`, `record`, …), limited by `paradigm` ([§7](/referensi/spesifikasi/level-kode/#7-code-level)) |
| Types | strings split into words | type expressions with dim primitives and references by path ([§8](/referensi/spesifikasi/tipe/#8-types)) |
| Relations | optional id and `op` | required id and `op`; end rules per `op` ([§9](/referensi/spesifikasi/relasi/#9-relations)) |
| Inheritance | `op extends` | `op inherits` |
| Endpoints | `code` with `form endpoint`, HTTP only | `endpoint` kind with one protocol line: `http`, `grpc`, `graphql`, or `event` ([§10](/referensi/spesifikasi/endpoint/#10-endpoints)) |
| Flows | a straight sequence | `alt`, `opt`, and `par` branches ([§12](/referensi/spesifikasi/komposisi-dan-flow/#12-flows)) |
| Deployment | none | `environment`, `node`, `infra`, `deploy` ([§13](/referensi/spesifikasi/deployment/#13-deployment)) |
| Warnings | present | none; every violation is an error |
| Output | `nodes`/`edges` with `null` fields | `elements`/`relations` per kind, no `null`, separate `spans` ([§16](/referensi/spesifikasi/output/#16-json-output-format)) |
