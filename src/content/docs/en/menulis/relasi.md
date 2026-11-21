---
title: Relations and paths
description: Connect elements across levels, describe interactions with op, and resolve paths inside blocks.
---

A relation connects two elements at any level. A function can connect to a database, and a container can connect to a function in another system.

```dim
[<id>:] <dari> -> <ke> ["<label>"] [{ <atribut> … }]
```

```dim
customer -> shop.web "Belanja";
shop.web -> shop.api "POST /orders" {
  op call;
  tech "HTTPS/JSON";
  data push "Order";
  data pull "OrderId";
}
```

## Arrow direction

Write the arrow **from the party that starts the interaction**. In `api -> db { op read }`, the API initiates the read and depends on the database. The data flows back to the API. Record its direction separately with `data push` or `data pull`. See [Interactions and data flow](/en/konsep/aliran-data/).

## Relation attributes

| Attribute | Value | Meaning |
|---|---|---|
| `op` | One name | Kind of interaction. Defaults to `use`. |
| `data` | `[push\|pull]` and a data name | What flows. Can occur multiple times. |
| `tech` | One string | Protocol, such as `"HTTPS/JSON"`, `"gRPC"`, or `"SQS"` |
| `description` | One string | Additional description |
| `tags` | One or more strings | Free-form labels |

Use the following operations for runtime interactions.

| `op` | Meaning |
|---|---|
| `use` | General interaction |
| `call` | Synchronous call such as a function call, HTTP request, or RPC |
| `read` | Read data from the target |
| `write` | Send or store data at the target |
| `publish` | Send an asynchronous message to a queue or topic |
| `subscribe` | Receive asynchronous messages from a queue or topic |

Use `extends`, `implements`, `owns`, and `refers` for structural relations. They connect two `code` elements and carry no data. See [Relations between code elements](/en/konsep/level-kode/#relations-between-code-elements) for examples.

## Where to write a relation

Write a relation at the top level or inside any element block. dim resolves each path **relative to the block that contains the relation**.

```dim
system shop "Online Shop" {
  container api "API" {
    component orders "Orders" {
      code repo "OrderRepository";
    }
    orders.repo -> db "INSERT orders" { op write }
  }
  container db "Postgres";
}
```

For each path, dim looks for the first name in the current block, then in enclosing blocks up to the top level. In this example, it finds `orders` in `shop.api` and `db` in `shop`. Once it finds the first name, each later segment has to name a direct child of the previous one.

Keep relations within a system block for shorter paths. The top level is a convenient place for relations between systems.

**Shadowing.** The nearest matching name wins. Inside `shop.web`, `checkout` resolves to `shop.web.checkout`. To reach the API checkout, write a longer path (`api.checkout`) or an absolute path (`::shop.api.checkout`). The `::` prefix starts the lookup at the top level. Shadowed paths produce warning `W011`.

## Relation IDs

Give a relation an explicit ID by putting `<id>:` before it.

```dim
checkout_post: web.checkout.button -> api.checkout.route "POST /checkout" { op call }
```

A `step` in a [flow](/en/konsep/alur/) or `remove` in a [derived model](/en/konsep/komposisi/) uses that ID. Relation IDs must be unique across the model (`E023`). You can display and trace a relation without an explicit ID. To refer to it in the source, give it an ID.

## Validation rules

- **`E021`.** A self-relation is valid only for direct recursion, with `op call` and the same `code` element on both ends.
- **`E022`.** Relations between an element and its ancestor or descendant are invalid, as in `shop.api.orders -> shop.api`. Both endpoints would lift to the same box when zoomed out.
- **`E020`.** A path must resolve. The diagnostic identifies where lookup failed.

See [specification §4.4](/en/referensi/spesifikasi/sintaks/#44-relations) and [§7](/en/referensi/spesifikasi/model/#7-path-resolution) for the full rules.
