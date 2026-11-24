---
title: Map an existing system
description: Steps for writing a dim model of a system that already exists, from the big picture down to only the detail you need.
---

Take one PR that touches two services. Open the handler that changed, find its caller, then follow the first call that leaves the service. Use those three facts to choose the part of the system to draw.

A dim model doesn't have to be written all at once. Each step below produces a valid, useful model, so you can stop at any step and add detail when you need it.

## 1. Set up the config

Create a `dim.config` in the model's folder and declare the technologies you already know. See [Set up dim.config](/en/menulis/konfigurasi/).

```dim
// dim.config
dim "0.6";

tech nextjs "Next.js";
tech rust "Rust";
tech postgres "PostgreSQL";
tech sqs "Amazon SQS";
tech https "HTTPS";
```

## 2. Start from the outside

Write who uses your system and which other systems it talks to. Mark systems owned by someone else with `external`.

```dim
// main.dim
dim "0.6";

person customer "Customer" { description "Shops online."; }
person admin "Store Admin" { description "Manages products and prices."; }

system shop "Online Shop" { description "An online store for shoppers in Indonesia."; }

system payment "Payment Gateway" {
  description "A third-party gateway for cards and e-wallets.";
  external;
}

shopping: customer -> shop "Shops" { op use; }
managing: admin -> shop "Manages products" { op use; }
charging: shop -> payment "Charges payments" { op call; }
```

This matches a C4 *system context* diagram, and it's usually enough for people outside the team. Every relation has an id (`shopping:`) and an `op`, so flows and derived models can refer to it later.

## 3. Break your system into containers

A container is a part that's run or deployed on its own: a web app, an API, a worker, a database, a queue. What matters is how the part runs, not where its code lives. Every container must state its role with `role`.

```dim
system shop "Online Shop" {
  description "An online store for shoppers in Indonesia.";

  container web "Web App" { role app; tech nextjs; }
  container api "API" { role service; tech rust; }
  container worker "Worker" { role service; tech rust; }
  container db "Postgres" { role database; tech postgres; }
  container queue "Email Queue" { role queue; tech sqs; }
}
```

The role decides which relations make sense: `read` and `write` only to storage, `publish` and `subscribe` only to queues, and people only use `app` containers. The role also decides the appearance, through styles in `dim.config`.

## 4. Write the relations you know

Now replace the system-level relations with container-level ones. Write only what you're sure of.

```dim
shopping: customer -> shop.web "Shops" { op use; }
managing: admin -> shop.web "Manages products" { op use; }
saveOrder: shop.api -> shop.db "Save order" { op write; }
queueEmail: shop.api -> shop.queue "Queue email job" { op publish; }
takeEmail: shop.worker -> shop.queue "Take email job" { op subscribe; }
charging: shop.api -> payment "Charges payments" { op call; tech https; }
```

The `customer -> shop` relation from step 2 is gone, because `customer -> shop.web` already shows as `customer → shop` when `shop` is closed. **Don't keep the same relation at two levels.** Higher-level relations are always computed from more detailed ones, so writing them again only creates two sources that can disagree.

To pick the direction of an arrow, ask who starts the interaction. The `worker` takes from the queue, so the arrow is `worker -> queue` with `op subscribe`, even though the data flows out of the queue.

## 5. Move relations down when the detail matters

Not every container needs to be opened. Open the ones that are asked about often, that are changing, or that carry the most important flow. When you write components inside, **move** the relations to the most precise element:

```dim
container api "API" {
  role service;
  tech rust;

  component checkout "Checkout" { description "Runs checkout until the order is saved."; }
  component orders "Orders" { description "Stores and looks up orders."; }
}

saveOrder: shop.api.orders -> shop.db "INSERT orders" { op write; }
charging: shop.api.checkout -> payment "Charges payments" { op call; tech https; }
```

The container-level map stays the same, but now every arrow can be traced to the component that makes it.

If a unit is called from many places, write its contract at the [code level](/en/konsep/level-kode/), with types, parameters, and errors. For an API, write each route as an [endpoint](/en/konsep/endpoint/), so a relation from a client is just `placeOrder: web.checkout -> api.orders.createOrder { op call; }`, and its label and data come from the endpoint.

## 6. Mark the important flows

For journeys people often discuss (checkout, sign-up, refunds), arrange the relation ids as a [flow](/en/konsep/alur/). A flow can be highlighted at every zoom level, and it can branch for failure paths:

```dim
flow checkout "Checkout" {
  description "From the shopper clicking pay to the order being saved.";
  step shopping;
  step charging "Charge first";
  alt {
    case paid "Payment succeeded" { step saveOrder; }
    case declined "Payment declined" { step showError; }
  }
}
```

## 7. Split files and record where things run

- One file per system or team, joined with `import` from one main file.
- Other teams can add details without changing the original file, with `extend`.
- Planned architecture changes are written as a derived model with `amends`, so *as-is* and *to-be* can be compared.
- Where each container runs is written as an [environment](/en/konsep/deployment/).

Examples are in [File composition](/en/konsep/komposisi/).

## 8. Keep it correct

- Run `dim check` in CI, so paths that no longer exist and mistyped properties are caught right away. Every violation is an error, so a model that passes is consistent.
- Change the model in the same pull request as the code.
- Run `dim fmt`, so every file always has the same order and layout.

## Habits that help

- **Ids** are short camelCase: `orderRepo`, `checkout`, `httpClient`. **Names** can take any form: `"OrderRepository"`, `"save_order()"`.
- **Relation labels** say what the initiator does: `"INSERT orders"`, `"Charges payments"`, not `"relation to db"`. Relations to endpoints don't need a label.
- **`description`** answers *why* the element exists, not its name again.

## Check the result

Compare the model's arrows with one real request from a log or a test. A reader should be able to trace the caller, the target service, and the operation by following paths in the model. Run `dim check main.dim`; a correct model produces no messages at all.
