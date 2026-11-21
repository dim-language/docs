---
title: File composition and flows
description: Rules for import, extend, amends, remove, and sequences of relations.
---

## 11. File composition

Split large models across files. Paths, lifting, and relation IDs work as if all files were written as **one model**.

### 11.1 `import`

```dim
// main.dim
import "shop.dim";
import "payment.dim";

person customer "Customer";
checkout_click: customer -> shop.web.checkout.button "Klik bayar";
```

- `import "<path>";` loads the file's top-level elements, relations, and flows into the model.
- Resolve the path relative to the file that declares the import. `..` is allowed.
- Load each file once even if several files import it. A circular import raises `E041`.
- `import` is valid anywhere at the top level (`E042`).
- Duplicate top-level IDs across files raise `E011`, like duplicate IDs among siblings. To add to an existing element, use `extend`.

### 11.2 `extend`

```dim
extend shop.db {
  description "Satu instance primer dengan satu replika baca.";
}

extend shop {
  container replica "Read Replica" { shape database }
  replica -> db "Replikasi" { op subscribe; data "WAL" }
}
```

- `extend <path> { … }` reopens an element declared in any file. Treat its block as part of the original declaration. It can contain attributes, children, relations, and other `extend` statements. Resolve relations inside the block from the target element's scope.
- Resolve the target using the same [path rules](/en/referensi/spesifikasi/model/#7-path-resolution) as relations, starting from the scope that contains `extend`. An `extend` can appear at the top level or inside an element.
- The target must **already be declared**, in an imported file or earlier in the same file. Otherwise report `E020`.
- In a regular file, `extend` can set attributes that are still unset. Resetting one raises `E044`. Append repeatable attributes such as `param` and `throws`. A `param` whose name already exists still raises `E036`.
- Validate children against the target's [nesting rules](/en/referensi/spesifikasi/model/#51-element-kinds-and-nesting).

### 11.3 `amends` and `remove`

A file can derive a model from another file and make changes to it. Use this for a migration proposal, a comparison between current and proposed architecture, or a variant for another environment. The idea comes from `amends` in [Pkl](https://pkl-lang.org).

```dim
// to-be.dim
amends "main.dim";

remove shop.reports;               // elemen beserta anak dan relasinya

extend shop.api {
  tech "Rust/axum 0.8";            // menimpa: boleh karena file ini amends
  component audit "Audit Log";
}
```

- `amends "<path>";` must be the first statement after an optional version declaration and can appear only once (`E043`). Load the base and its imports first, then apply the derived file. The base file remains usable on its own.
- In an `amends` file:
  - `extend` can override attributes. A `param` with an existing name replaces the old one. A `throws` with an existing type does the same.
  - `unset <attribute> [<key>];` in an `extend` block removes an attribute or turns off a flag.
  - `remove <target>;` deletes an element and all its descendants and incident relations, a relation by explicit ID, or a flow by ID.
- `remove` and `unset` in ordinary files raise `E045`.

**`unset`.** In the example, `main.dim` marks `payment` as `external`. The derived model brings payments in-house and clears the flag.

```dim
// to-be.dim
amends "main.dim";

extend payment {
  unset external;
  tech "Rust/axum";
}

extend shop.api.orders.repo.save {
  unset throws "DbError";
  unset param order;
}
```

- Put `unset` directly in the body of `extend` (`E047`). A new element has no existing attributes to clear.
- For a single-valued attribute, `unset <attribute>;` removes it.
- For a repeatable attribute, `unset <attribute>;` clears all entries. `unset <attribute> <key>;` clears just entries matching the key used for duplicate checks.

| Attribute | Key |
|---|---|
| `param` | Name (IDENT) |
| `query`, `cookie` | Name (STRING) |
| `header` | Case-insensitive name (STRING) |
| `rate` | Rate key (IDENT) |
| `throws` | Type (STRING) or, on an endpoint, status (INT). Applies to all matches. |
| `sets` | Kind and name, as in `unset sets cookie "refreshToken";` |

- An unknown attribute raises `E030`. An absent attribute or keyed entry on the target raises `E047`.
- Apply `unset` and attribute declarations in the same block in order. To replace a value, you can write the attribute again directly.
- Validate the result after `unset` using the usual rules. Removing `http` from an endpoint, for instance, raises `E060`.
- A `remove` target is a path. A single segment without `::` can match a top-level element, explicit relation ID, or flow ID. Multiple matches raise `E046`. Use `remove ::name` to target the element.
- You can declare an element again with the same ID after removing it. Relations written before `remove` still point to the original element and are removed with it.
- A relation or `extend` written **after** `remove` that refers to a removed element raises `E020`.
- Drop a `step` from its flow if `remove` deletes its relation, and report `W030`.
- An `amends` file can use `import`. Apply the base file first, then the imported files, then the derived file's own statements.

Stable element paths and [relation IDs](/en/referensi/spesifikasi/output/#9-json-output-format) let consumers show which elements and relations were added, changed, or deleted. Deleted relations still count when assigning default IDs, so other relation IDs match between the base and derived models.

Pkl limits amendments to existing properties. A dim amendment can add elements as the architecture evolves.

### 11.4 Application order

1. Read the main file. Load referenced files recursively, starting with `amends` and then following `import` statements in source order.
2. Apply each file's statements in order. `extend` sees only elements that already exist, and `remove` affects only preceding statements. This also determines the order of `nodes`, `edges`, and `flows` in the output.
3. Resolve relations and steps after applying all files. A relation can refer to an element declared later, as it can within one file.

---

## 12. Flows

A `flow` records a sequence of relations through a user journey so consumers can highlight it at any zoom level.

```dim
flow checkout "Checkout" {
  description "Dari pembeli menekan bayar sampai order tersimpan.";
  step checkout_click;
  step checkout_post;
  step charge "Tagih dulu";
  step save_order;
}
```

- Write `flow <id> ["<name>"] { … }` at the top level (`E042`). Flow IDs are unique across the model (`E051`), in a namespace separate from element and relation IDs.
- The block can contain `step`, `description`, and `tags`. Other statements raise `E030` or `E034`.
- `step <relation-id> ["<description>"]` refers to an [explicit relation ID](/en/referensi/spesifikasi/sintaks/#44-relations). The relation can appear in a different file or later in source order. A missing ID raises `E050`. Default IDs such as `a->b#0` are invalid here because they change when the endpoints change.
- A relation can appear in multiple steps or flows. Steps can describe asynchronous work, so the end of one step can be different from the start of the next.
- A flow without steps raises warning `W031`.

**Zoom semantics for consumers.** At each level, [lift](/en/referensi/spesifikasi/semantik-zoom/#102-lifting) each step with its relation.

1. Hide steps whose relations become internal.
2. Merge **consecutive** steps that lift to the same arrow.
3. Renumber the remaining steps from 1 for that level.

At Z2, the example starts with `customer → web` (1) and `web → api` (2). `charge` and `save_order` are hidden because both fit inside `api`.
