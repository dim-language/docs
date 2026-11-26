---
title: Relations
description: Relation syntax, op kinds, relation end rules, data flow, and labels.
---

## 9. Relations

```dim
saveOrder: api.orders -> db "Save order" {
  op write;
  data push api.orders.order;
  tech postgres;
}
```

### 9.1 Syntax

```dim
<id>: <from> -> <to> ["<label>"] { op <op>; ... }
```

- **The id is required** (`E401`). Relation ids are unique across the model and have their own namespace, separate from element paths (`E401`). They're used by `step` in flows, by `remove`, and by consumers to trace a lifted arrow back to its sources.
- **`op` is required** (`E402`).
- A relation can be written at the top level or in any element's block. Its end paths resolve from the scope where it's written ([§6.9](/referensi/spesifikasi/model/#69-path-resolution)).

**The arrow points from whoever starts the interaction**, not in the direction data flows. `api -> db { op read; }` means `api` reads from `db`. The data flows from `db` to `api`, but the arrow is still `api -> db`. The direction of data is written with `data` ([§9.5](#95-data-flow)).

### 9.2 Relation properties

| Property | Value | Notes |
|---|---|---|
| `op` | a relation kind | required |
| `data` | `push`\|`pull` + a type expression | repeatable ([§9.5](#95-data-flow)) |
| `tech` | ≥1 tech reference | a protocol or technology, e.g. `https`, `grpc` |
| `description` | prose | |
| `tags` | ≥1 tag reference | |
| `meta` | JSON object | [§6.8](/referensi/spesifikasi/model/#68-meta) |

### 9.3 `op` kinds

**Interactions** describe something that happens at runtime:

| `op` | Meaning, from the initiator's side |
|---|---|
| `use` | a general interaction, including a person using an application |
| `call` | a synchronous call: function, HTTP, RPC |
| `read` | fetching data from storage |
| `write` | saving data to storage |
| `publish` | sending an async message |
| `subscribe` | receiving async messages |

**Structural** relations describe the shape of code: `inherits`, `implements`, `owns`, `refers`. Their rules are in [§7.5](/referensi/spesifikasi/level-kode/#75-relations-at-the-code-level).

Any other `op` is `E207`.

### 9.4 Relation end rules

These rules exist only where an `op` would otherwise be meaningless. Without them, `op` would be just a label, and lifting couldn't be relied on.

"Storage" means a container with the `database`, `storage`, or `cache` role, or an element inside one.

| `op` | `from` end | `to` end |
|---|---|---|
| `use` | anything | anything except storage and queues |
| `call` | not a `person` | not a `person`, storage, or a queue; for endpoints, only HTTP, gRPC, or GraphQL |
| `read`, `write` | not a `person` | storage |
| `publish`, `subscribe` | not a `person` | a container with the `queue` role, or an event endpoint ([§10.6](/referensi/spesifikasi/endpoint/#106-events)) |
| structural | a code unit | a code unit, per the table in [§7.5](/referensi/spesifikasi/level-kode/#75-relations-at-the-code-level) |

Additional rules for `person`:

- If `from` is a `person`, `to` must be a `system`, a container with the `app` role, or an element inside an `app` container. People use applications; they don't call APIs or databases directly.
- `person -> person` isn't allowed.

General rules:

- **A relation to itself** is allowed only for direct recursion: a `call` from a `function` or `method` to itself. Otherwise `E403`.
- **A relation between an ancestor and a descendant**, such as `shop.api.orders -> shop.api`, is `E404`. Such a relation always disappears when lifted, because both ends rise to the same element.

Breaking this table is `E405`, and the message names the rule. Breaking the structural table is `E407`.

### 9.5 Data flow

```dim
data push <type>;
data pull <type>;
```

A relation has two separate aspects:

- **The arrow = who starts the interaction.**
- **`data` = which way data flows, and what data.** The direction is seen from the initiator: `push` means the initiator sends data to the target (with the arrow), and `pull` means the initiator fetches data from the target (against the arrow).

```dim
loadOrder: rows -> db "Load order" { op read; data pull order; }
saveOrder: rows -> db "Save order" { op write; data push order; }

submit: button -> handler "Submit cart" {
  op call;
  data push cart;
  data pull order;
}
```

Rules:

- The direction is **always written**. There's no default from `op`, so every `data` line can be read without remembering a table.
- The direction must fit the `op`. `read` and `subscribe` only `pull`. `write` and `publish` only `push`. `call` and `use` can do both. A missing or mismatched direction is `E406`.
- Structural relations have no `data` (`E406`).
- Relations to endpoints don't write `data` (`E406`), because the endpoint already defines it ([§10.8](/referensi/spesifikasi/endpoint/#108-relations-to-endpoints)).

**Why isn't the arrow used for the direction of data?**

1. `call` moves data both ways, and one arrow has only one direction.
2. Using the arrow for data reverses the dependency: an `api` that reads a `db` would be drawn `db → api`, even though `api` depends on `db`.
3. `push` and `pull` read directly, without memorizing what a symbol means.

### 9.6 Labels

A label is prose drawn on an arrow and shown in flow step lists. Labels are **optional**. Without one, consumers derive a label from the relation's structure:

| Relation | Derived label |
|---|---|
| `call` to an HTTP endpoint | the method and full path, e.g. `POST /v1/orders` |
| `call` to a gRPC endpoint | `<Service>/<Rpc>` |
| `call` to a GraphQL endpoint | the operation and field, e.g. `mutation createOrder` |
| `publish`/`subscribe` to an event endpoint | the event name |
| `read`, `write`, `publish`, `subscribe` with `data` | the `op` verb followed by the type name, e.g. "write Order" |
| structural | the `op` name |
| anything else | no label |

The words and punctuation of derived labels follow the consumer's display language. A written label always wins.
