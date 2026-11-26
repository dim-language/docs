---
title: Connect two elements
description: Writing relations with an id and an op at any level, their end rules, and how paths resolve from inside a block.
---

When the Web app creates an order through the API, start by finding the paths of both elements. Give the relation an id that describes the interaction, then pick a fitting `op`.

A relation connects two elements at any level. A function can relate to a database, and a container can relate to a function in another system.

```dim
<id>: <from> -> <to> ["<label>"] { op <op>; … }
```

```dim
shopping: customer -> shop.web "Shops" { op use; }
saveOrder: shop.api.orders -> shop.db "Save order" {
  op write;
  data push shop.api.orders.order;
  tech postgres;
}
```

## The id and `op` are always written

- The **id** is camelCase and unique across the model. It's used by `step` in [flows](/konsep/alur/), by `remove` in [derived models](/konsep/komposisi/), and by the map to trace where an arrow comes from.
- The **`op`** states the kind of interaction. There's no default `op`, so every relation can be read without guessing.

| `op` | Meaning |
|---|---|
| `use` | a general interaction, including a person using an application |
| `call` | a synchronous call: function, HTTP, RPC |
| `read` | fetching data from storage |
| `write` | saving data to storage |
| `publish` | sending an async message to a queue |
| `subscribe` | receiving async messages from a queue |

For the shape of code, there's `inherits`, `implements`, `owns`, and `refers`. Examples are in [Record a function contract](/konsep/level-kode/#relations-between-code).

## Arrow direction

The arrow always points **from whoever starts the interaction**. `api -> db { op read; }` means `api` reads from `db`. The data flows from `db` to `api`, but the arrow still starts at `api`, because `api` depends on `db`. The direction of data is recorded separately with `data push` and `data pull`. See [Separate the caller from the data direction](/konsep/aliran-data/).

## Ends that make sense

`op` and container roles lock together, so an arrow always means something:

| `op` | Allowed target |
|---|---|
| `read`, `write` | a `database`, `storage`, or `cache` container, or its contents |
| `publish`, `subscribe` | a `queue` container, or an event endpoint |
| `call` | anything except a `person`, storage, and queues |
| `use` | anything except storage and queues |

A `person` can only use a system or an application (`role app`). People don't call APIs or databases directly.

## Where to write a relation

A relation can be written at the top level of a file, or inside any element's block. Its paths are read **relative to the block where the relation is written**:

```dim
system shop "Online Shop" {
  container api "API" {
    role service;
    component orders "Orders" { description "Stores orders."; }
    saveOrder: orders -> db "INSERT orders" { op write; }
  }
  container db "Postgres" { role database; }
}
```

For each path, the first name is looked up starting at the block where the relation is written. If it isn't found, the lookup moves up to the enclosing block, all the way to the top level. In this example, `orders` is found in `shop.api`, and `db` is found in `shop`. Once the first name is found, the rest of the path must be direct children, one after another.

**The same name at two levels.** If the first name of a path is found at one level, but an outer level also has a child with that name, a reader can't tell which is meant. dim rejects it with `E209`. Write a longer path (`api.payments`), `this` for the element whose block you're in, or an absolute path starting with `::` (`::shop.api.payments`).

## What isn't allowed

- **A relation to itself** (`E403`), except direct recursion: a `call` from a `function` or `method` to itself.
- **A relation between an element and its ancestor or descendant** (`E404`), such as `shop.api.orders -> shop.api`. Such a relation always disappears when the map zooms out.
- **Ends that don't fit the `op`** (`E405`), such as a `read` that targets a `service` container.
- **A path that doesn't exist** (`E208`). The message says where in the path the lookup stopped.

The full rules are in [specification §9](/referensi/spesifikasi/relasi/#9-relations) and [§6.9](/referensi/spesifikasi/model/#69-path-resolution).

## Check the result

Change `op write` in `saveOrder` to `op read`, then run `dim check`. The message is `E406`, because `data push` doesn't fit `read`. Change it back, then point the relation at `shop.web`, which has the `app` role, and confirm the message becomes `E405`: `write` can only target storage.
