---
title: What is dim?
description: dim (Diagram In Markup) is a text language for describing software architecture as one zoomable model.
---

**dim** stands for *Diagram In Markup*. Write it in lowercase. Its full name is **dim language**.

dim is a text language for describing software architecture. You specify who uses a system, what it contains, and how its parts interact. The result is one model you can explore as a map. Close its boxes to see the whole system, or open one at a time to reach the functions in the code.

```dim
person customer "Customer";

system shop "Online Shop" {
  container web "Web App" { tech "Next.js"; ui }
  container api "API" {
    tech "Rust/axum";
    component orders "Orders" {
      code save "save_order()";
    }
  }
  container db "Postgres" { shape database }
}

customer -> shop.web "Belanja";
shop.web -> shop.api "POST /orders" { op call; data push "Order"; data pull "OrderId" }
shop.api.orders.save -> shop.db "INSERT orders" { op write; data "Order" }
```

## Why one model

People often draw architecture diagrams by hand, and the diagrams can go out of date within weeks. In the [C4 model](https://c4model.com), context, container, component, and code each have a diagram. A change to a relation can require edits in several diagrams. Miss one and the diagrams disagree.

dim uses the same four levels in **one model**.

- Elements nest. A `system` contains a `container`, a `container` contains a `component`, and a `component` contains `code`.
- Write the relation at the **most detailed level you know**. In the example, the relation to `db` starts inside the `save_order()` function.
- dim derives arrows for each level. At the container level, the relation appears as `api → db`. At the system level, the whole relation fits inside `shop`.

Every level comes from the same relations, so views stay in sync.

| Open elements | Visible arrows |
|---|---|
| None | `customer → shop` |
| `shop` | `customer → web`, `web → api`, `api → db` |

## Why text

- **Review changes in pull requests.** An architecture change has a line-by-line diff, just like a code change.
- **Check the model in CI.** `compileProject` catches mistyped paths, unknown attributes, and invalid relations.
- **Share a model between tools.** The parser produces JSON that editors, docs sites, and AI agents can read directly.

## How dim fits into your tools

- The map renderer chooses colors, positions, and line styles.
- dim describes code and its interactions. The software itself runs in the languages you implement it in.
- dim records HTTP methods, paths, authentication, inputs, and responses for architecture maps. Use API documentation such as OpenAPI for field schemas and request examples.

## Next steps

- [Your first model](/en/mulai/) walks through a small model.
- [Modeling a system](/en/menulis/memodelkan/) explains where to start with an existing system.
- The [language specification](/en/referensi/spesifikasi/) lists the complete rules.
