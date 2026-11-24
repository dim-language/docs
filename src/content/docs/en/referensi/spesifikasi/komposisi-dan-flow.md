---
title: File composition and flows
description: Rules for import, extend, amends, remove, and unset, and flows with alt, opt, and par branches.
---

## 11. File composition

A large model can be split across several files. All files still form **one model**: paths, lifting, and relation ids work as if everything were written in one file. All files use the same `dim.config` ([§5.1](/en/referensi/spesifikasi/konfigurasi/#51-files-and-projects)).

### 11.1 `import`

```dim
// main.dim
dim "0.6";
import "shop.dim";
import "payment.dim";

person customer "Customer" { description "Shops online."; }
openCheckout: customer -> shop.web.checkout "Click pay" { op use; }
```

- `import "<path>";` loads every top-level element, relation, flow, and environment from that file into the same model.
- The path is relative to the file that writes `import`, and is a `filePath` literal ([§3.9](/en/referensi/spesifikasi/sintaks/#39-typed-literals)). A file outside the project folder is `E107`.
- A file is loaded only once, even if several files import it. A file that can't be read is `E601`. A circular import is `E602`.
- `import` is only allowed at the top level, after the version declaration and `amends` (`E603`).
- Top-level elements with the same id in two files are `E202`. To add to an existing element, use `extend`.

### 11.2 `extend`

```dim
extend shop.db {
  description "One primary instance with one read replica.";
}

extend shop {
  container replica "Read Replica" { role database; tech postgres; }
  replicate: replica -> db "Replication" { op read; data pull walRecord; }
}
```

- `extend <path> { … }` reopens an element that's already declared, in any file. Its content is treated as part of the original declaration: properties, members, child elements, relations, and further `extend`s.
- The target path resolves from the scope where `extend` is written ([§6.9](/en/referensi/spesifikasi/model/#69-path-resolution)). `extend` can be at the top level or inside an element's block.
- The target must already be declared: in an imported file, or higher up in the same file (`E609`).
- In an ordinary file, `extend` can only fill in properties that aren't set yet (`E605`), so splitting a file never silently changes its content. Members and repeatable properties are still added. A member with an existing id is `E303`.

### 11.3 `amends`, `remove`, and `unset`

A file can be a **derivative** of another model and change it, for example for *as-is* and *to-be* architectures, or a migration proposal. The idea comes from `amends` in [Pkl](https://pkl-lang.org).

```dim
// to-be.dim
dim "0.6";
amends "main.dim";

remove shop.reports;

extend shop.api {
  tech kotlin spring;
  component audit "Audit Log" { description "Records every change to an order."; }
}

extend payment {
  unset external;
}
```

- `amends "<path>";` must be the second statement, directly after the version declaration, and appear only once (`E604`). The base file is loaded first with all its imports, then the derived file's content is applied on top.
- Inside an `amends` file:
  - `extend` can **override** properties. A member with an existing id replaces the old one.
  - `unset <property>;` inside an `extend` block removes a property, including turning off a flag.
  - `unset <member> <id>;` removes one member, for example `unset param order;` or `unset field total;`.
  - `remove <target>;` removes an element along with all its descendants, every relation touching them, and every `deploy` and `omit` that refers to them, a relation by its id, a flow by its id, a flow branch by `<flow>.<branch>`, or an environment by its id.
- `remove` and `unset` in an ordinary file are `E606`.
- An `unset` not directly inside an `extend` block, or one that removes something that doesn't exist, is `E608`. Required properties can't be `unset`; to change their value, write the property again.
- A one-segment `remove` target without `::` can mean a top-level element, a relation id, a flow id, or an environment id. If more than one matches, `E607`. Write `remove ::name` for an element.
- A relation or `extend` written **after** a `remove` that refers to a removed element is `E208`.
- Steps whose relation disappears because of `remove` disappear from their flow too. If a branch or flow becomes empty as a result, `E612`. Remove that branch or flow explicitly as well.

Because element paths and relation ids are stable, consumers can show a **diff** between a base model and its derivative: added, changed, and removed elements and relations.

### 11.4 Order of application

1. The main file is read. The files it names in `amends` and `import` are loaded first, recursively, in the order `amends`, then `import` in the order written.
2. Statements in each file are applied in order. This order decides what `extend` and `remove` see, and the order of elements, relations, flows, and environments in the output.
3. Relation paths, types, steps, and other references resolve after every file has been applied, so a reference can point to something declared further down.

---

## 12. Flows

A `flow` marks a sequence of relations as one journey, so consumers can highlight it at every zoom level. Real journeys branch, so flows have three kinds of branch.

```dim
flow checkout "Checkout" {
  description "From the shopper clicking pay to the order being saved.";
  step openCheckout;
  step placeOrder;
  opt coupon "Use a coupon" {
    step validateCoupon;
  }
  alt {
    case paid "Payment succeeded" {
      step saveOrder;
      par {
        lane receipt "Send receipt" { step sendReceipt; }
        lane audit "Write audit log" { step writeAudit; }
      }
    }
    case declined "Payment declined" {
      step showPaymentError "Show why the payment was declined";
    }
  }
}
```

### 12.1 Syntax

```dim
flow <id> "<name>" { ... }
step <relation-id> ["<note>"];
opt <id> "<label>" { ... }
alt { case <id> "<label>" { ... } ... }
par { lane <id> "<label>" { ... } ... }
```

- `flow` is only allowed at the top level (`E603`). Flow ids are unique across the model and have their own namespace (`E611`).
- A flow block contains `description`, `tags`, `meta`, and then a sequence of steps. A sequence contains `step`, `opt`, `alt`, and `par`, which can nest.
- `step` refers to a relation by its id ([§9.1](/en/referensi/spesifikasi/relasi/#91-syntax)), including relations in other files or further down. An id that doesn't exist is `E610`. The step note is optional.

### 12.2 Branches

| Block | Meaning | Content |
|---|---|---|
| `opt` | steps that may be skipped | ≥1 step |
| `alt` | exactly one of several paths | ≥2 `case`s, each with ≥1 step |
| `par` | paths that run at the same time | ≥2 `lane`s, each with ≥1 step |

- Every `opt`, `case`, and `lane` must have an id and a label (`E613`). The id is unique within one flow (`E611`), so it can be referenced as `<flow>.<branch>`.
- A flow without steps, an empty branch, an `alt` with fewer than two `case`s, or a `par` with fewer than two `lane`s is `E612`.
- One relation can appear in several steps or several flows. Steps don't have to connect end to end, because journeys often pass through asynchronous work.

### 12.3 Numbering

Steps are numbered so they can be referred to in conversation and shown on the map:

- Steps on the main path are numbered `1`, `2`, `3`, ….
- A branch block takes one number in its sequence. Each `case` or `lane` gets a letter in the order written, and an `opt` gets the letter `a`.
- Steps inside a branch are numbered `<block number><letter>.<position>`, and so on for nested branches.

For the example above: `openCheckout` 1, `placeOrder` 2, `validateCoupon` 3a.1, `saveOrder` 4a.1, `sendReceipt` 4a.2a.1, `writeAudit` 4a.2b.1, and `showPaymentError` 4b.1.

### 12.4 Flows at each zoom level

At each zoom level, every step is lifted like its relation ([§14.2](/en/referensi/spesifikasi/semantik-zoom/#142-lifting)), and these rules apply **per sequence**, never across branch boundaries:

1. A step whose relation becomes internal is hidden.
2. **Consecutive steps in the same sequence** that land on the same lifted arrow merge into one step.
3. A branch whose steps are all hidden becomes empty. An `alt` or `par` whose branches are all empty disappears. An `alt` or `par` with only one non-empty branch left is still shown as a branch, so the reader knows there are other paths at a more detailed level.
4. The remaining steps are renumbered with the rules in [§12.3](#123-numbering) for that level.
