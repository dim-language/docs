---
title: Interactions and data flow
description: How dim records who initiates an interaction and which way the data flows.
---

A relation in dim answers two questions.

1. **Who starts the interaction?** Follow the arrow `->`.
2. **What data moves, and where does it go?** Read the `data` attribute.

## Who starts the interaction

Write the arrow from the party that starts the interaction to its target.

```dim
shop.api.orders.repo.find -> shop.db "SELECT orders" { op read }
```

`repo.find` queries the database, so the arrow starts at `repo.find`. It follows the dependency from `repo.find` to `db`.

## What data flows

The direction of `data` is relative to the initiator.

| Direction | Meaning | Compared with the arrow |
|---|---|---|
| `push` | The initiator sends data to the target | Same direction |
| `pull` | The initiator receives data from the target | Opposite direction |

```dim
shop.api.orders.repo.find -> shop.db "SELECT orders" { op read; data "Order" }
```

Here `op read` supplies the default direction, `pull`.

### Default direction by operation

| `op` | Default |
|---|---|
| `read`, `subscribe` | `pull` |
| `write`, `publish` | `push` |
| `call`, `use` | Specify the direction explicitly. |

A call commonly sends a request and receives a response. Write one `data` attribute for each direction.

```dim
checkout_post: shop.web.checkout.button -> shop.api.checkout.handler "POST /checkout" {
  op call;
  data push "CheckoutRequest";
  data pull "OrderId";
}
```

If an explicit direction conflicts with the operation, as in `op read; data push`, dim accepts the model and reports warning `W003`.

## Why keep the directions separate?

- A call can move data both ways, while an arrow has one direction.
- If arrows followed the data, a read would appear as `db → api`. The dependency runs from `api` to `db` at every zoom level.
- `push` and `pull` make the data direction readable without additional arrow symbols.

## What happens when you zoom out

The data flows lift with the relation. In the [zoomable map](/en/konsep/peta-zoom/), `API → Postgres` carries `send Order · receive Order` because one function writes to the database and another reads from it. See [specification §6.3](/en/referensi/spesifikasi/model/#63-data-flow) for the full rules.
