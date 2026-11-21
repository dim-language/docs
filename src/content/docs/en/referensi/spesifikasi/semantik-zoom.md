---
title: Zoom semantics
description: How to display, lift, and aggregate relations at each zoom level.
---

## 10. Zoom semantics (lifting)

These rules are normative for consumers such as frontends. They let different frontends derive the same diagram from the same model.

### 10.1 View state

The consumer stores the set of open elements (`expanded`). Top-level elements are always visible.

- An element is **visible** when all its ancestors are open.
- The **frontier** is the set of visible elements that are closed or have no children. Draw a frontier element as a node and an open element as a boundary around its children.

### 10.2 Lifting

For an element `x`, `vis(x)` is the ancestor or self of `x` on the frontier. Traverse from the top level toward `x` and stop at the first element that is closed or has no children.

For each edge `a -> b`, compute `vis(a)` and `vis(b)`.

- If `a == b` (recursion, [§4.4](/en/referensi/spesifikasi/sintaks/#44-relations)) and `vis(a) == a`, draw a **loop** on that element.
- Otherwise, if `vis(a) == vis(b)`, the edge is **internal**. Hide it. This includes recursion inside a closed element.
- In all other cases, draw `vis(a) -> vis(b)`.

A frontier never contains both an ancestor and its descendant, and `E022` prohibits relations between them. The lifted endpoints therefore coincide or are disjoint.

### 10.3 Aggregation

Group lifted edges by the ordered pair `(vis(a), vis(b))`. Draw one arrow per group.

```json
{
  "from": "shop.api",
  "to": "shop.db",
  "sources": [
    "shop.api.orders.repo.save->shop.db#0",
    "shop.api.orders.repo.find->shop.db#0"
  ],
  "ops": ["write", "read"],
  "labels": ["INSERT orders", "SELECT orders"],
  "data": [
    { "dir": "push", "payload": ["Order"], "refs": ["shop.api.orders.order"] },
    { "dir": "pull", "payload": ["Order"], "refs": ["shop.api.orders.order"] }
  ]
}
```

- `sources` stores the original edge IDs for tracing.
- `ops` is the list of unique operations in the order they first occur.
- Use the same lifting rules for structural relations. A class in component A extending a class in B still creates a dependency `A → B` at the component level. Consumers should use dashed lines for groups consisting solely of structural relations and ordinary interaction arrows for mixed groups.
- Merge `data` entries by `dir`, with at most one `push` and one `pull`. `payload` and `refs` are unions in order of first occurrence. The ordered endpoints preserve data direction after lifting.
- Consumers should show data direction along the line, for example with dots or chevrons, separately from the arrowhead. `push` follows the arrow, `pull` runs against it, and both directions can be shown with `⇄`.
- `a -> b` and `b -> a` are distinct groups.
- If a group contains a single edge that was drawn at its original endpoints, the consumer may display its label as written.

### 10.4 Example

The example in [§2](/en/referensi/spesifikasi/#2-short-example) yields these arrows.

| Open elements | Visible arrows |
|---|---|
| None | `customer → shop`, `shop → payment` (⇄ ChargeRequest / ChargeResult) |
| `shop` | `customer → web`, `web → api` (⇄ CheckoutRequest / OrderId), `api → db` (⇄ Order), `api → payment` (⇄ ChargeRequest / ChargeResult) |
| `shop`, `api` | `customer → web`, `web → checkout` (⇄ CheckoutRequest / OrderId), `checkout → orders` (push Order), `orders → db` (⇄ Order), `checkout → payment` (⇄ ChargeRequest / ChargeResult) |

When only `shop` is open, `handler -> repo.save` is hidden because both endpoints are inside `api`. Opening `api` reveals it again as `checkout → orders`.
