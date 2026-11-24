---
title: Zoom semantics
description: How relations are shown, lifted, and grouped at each zoom level, including in the deployment view.
---

## 14. Zoom semantics (lifting)

This section is normative for **consumers** (maps, editors), not the parser. It's written here so every consumer draws the same diagram from the same model.

### 14.1 View state

A consumer keeps the set of elements that are currently **open**. Top-level elements are always visible.

- An element is **visible** if all its ancestors are open.
- An element is on the **frontier** if it's visible and either closed or childless. Frontier elements are drawn as boxes. Open elements are drawn as boundaries around their children.

### 14.2 Lifting

For every element `x`, `vis(x)` is the ancestor-or-self of `x` that's on the frontier.

For every relation `a -> b`:

- If `a == b` (recursion) and `vis(a) == a`: the relation is drawn as a **loop** on that element.
- If `vis(a) == vis(b)` otherwise: the relation is **internal** and isn't drawn.
- Otherwise: the relation is drawn as `vis(a) -> vis(b)`.

Because the frontier never contains two elements where one is the other's ancestor, and `E404` forbids relations between an ancestor and a descendant, `vis(a)` and `vis(b)` are always either equal or disjoint.

### 14.3 Aggregation

Lifted relations are grouped by the directed pair `(vis(a), vis(b))`. Each group is drawn as one arrow:

```json
{
  "from": "shop.api",
  "to": "shop.db",
  "sources": ["saveOrder", "loadOrder"],
  "ops": ["write", "read"],
  "data": [
    { "dir": "push", "types": [{ "ref": "shop.api.orders.order" }] },
    { "dir": "pull", "types": [{ "ref": "shop.api.orders.order" }] }
  ]
}
```

- `sources`: the ids of the source relations, for tracing back.
- `ops`: the unique `op`s of the source relations, in order of first appearance.
- `data`: every data flow of the source relations, including those taken from endpoints ([§10.8](/en/referensi/spesifikasi/endpoint/#108-relations-to-endpoints)), merged per direction. At most one `push` and one `pull` entry, with unique types in order of first appearance.
- Structural relations are lifted too. A class in component A that `inherits` a class in component B still shows as `A → B`, because that's a real dependency. A group containing only structural relations is drawn with a dashed line.
- `a -> b` and `b -> a` are two different groups.
- A group with one relation that isn't lifted uses that relation's label ([§9.6](/en/referensi/spesifikasi/relasi/#96-labels)). Other groups get a summary label, such as the number of relations.

Consumers draw the direction of data as a marker along the line, separate from the arrowhead: `push` with the arrow, `pull` against it, and both meaning `⇄`.

### 14.4 Example

From the example in [§2](/en/referensi/spesifikasi/#2-short-example):

| Open | Arrows shown |
|---|---|
| (none) | `customer → shop` |
| `shop` | `customer → web`, `web → api` (⇄ Cart / Order), `api → db` (push Order) |
| `shop`, `web`, `api` | `customer → checkout`, `checkout → orders` (⇄ Cart / Order), `orders → db` (push Order) |

The `placeOrder` relation goes to the `createOrder` endpoint, so at the component level its arrow ends at `orders`, which owns that endpoint.

Flows at each level follow [§12.4](/en/referensi/spesifikasi/komposisi-dan-flow/#124-flows-at-each-zoom-level).

### 14.5 Deployment view

The deployment view draws one environment. Its hierarchy is environment → node → `deploy` and `infra`, with the same open and closed rules as [§14.1](#141-view-state).

Relations in this view are derived from the software model:

1. Each software relation `a -> b` is mapped to containers: `c(a)` and `c(b)` are the containers that hold `a` and `b`, or the elements themselves if they're containers. Relations from or to a `person` or `system` map to that element itself.
2. For every pair of a `deploy` of `c(a)` and a `deploy` of `c(b)` in the environment, there's one deployment relation `deploy(c(a)) -> deploy(c(b))`. If `c(a)` is deployed in several places, each place gets a relation.
3. Ends that aren't deployed, such as a `person`, an external system or container, and an omitted container, are drawn outside the nodes. Relations to an omitted container aren't drawn.
4. Infra relations ([§13.5](/en/referensi/spesifikasi/deployment/#135-relations-in-an-environment)) are added as written.
5. The lifting and aggregation in [§14.2](#142-lifting)–[§14.3](#143-aggregation) apply to the node hierarchy. Relations between two `deploy`s inside a closed node become internal.
