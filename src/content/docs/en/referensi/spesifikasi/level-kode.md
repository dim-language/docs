---
title: Code level
description: Paradigms, code-level kinds, members, and structural relations.
---

## 7. Code level

The code level describes what's inside a component: data types, functions, classes, and their contracts. It serves two purposes: an editor can draw class diagrams and call graphs from the same model, and anyone reading the model, human or AI, knows each unit's job and contract without opening the source.

dim **isn't tied to a programming language**, but it follows **paradigms**. Concepts like `class`, `function`, and `record` exist in many languages, while syntax like `&Order` or `Result<T, E>` exists in only one. So the code level uses the vocabulary of paradigms and dim's own type system ([§8](/en/referensi/spesifikasi/tipe/#8-types)).

```dim
component orders "Orders" {
  description "Creates and stores orders.";
  paradigm oop;

  record order "Order" {
    description "An order that has been created.";
    field id: uuid;
    field total: decimal "Total after discounts";
  }

  enum orderStatus "OrderStatus" {
    description "The stage an order is in.";
    variant pending;
    variant paid;
    variant shipped "Handed to the courier";
  }

  interface orderStore "OrderStore" {
    description "Where orders are stored.";
    method save "save()" {
      description "Stores a new order.";
      param value: order;
      throws storageFailure;
    }
  }

  class postgresOrderStore "PostgresOrderStore" {
    description "An OrderStore backed by Postgres.";
    method save "save()" {
      description "Stores an order in one transaction.";
      async;
      param value: order;
      throws storageFailure "Writing to the database failed";
    }
  }

  record storageFailure "StorageFailure" {
    description "An error while writing to storage.";
    field reason: string;
  }

  storeContract: postgresOrderStore -> orderStore { op implements; }
}
```

### 7.1 Paradigms

| Paradigm | Allowed kinds |
|---|---|
| all | `record`, `enum`, `union`, `alias` |
| `procedural` | `module`, `function` |
| `functional` | `module`, `function` |
| `oop` | `class`, `interface`, `method`, `constructor` |

- A container with code-level elements must write `paradigm`, and a component can narrow it ([§6.6](/en/referensi/spesifikasi/model/#66-paradigms)).
- A kind its effective paradigms don't include is `E301`. Data types (`record`, `enum`, `union`, `alias`) are always allowed.
- Paradigms limit properties as well as kinds: `pure`/`effects` exist only in `functional`, and `visibility`, `static`, and `abstract` only in `oop` ([§7.3](#73-code-unit-properties)).

### 7.2 Code-level kinds

| Kind | Meaning | Can be inside |
|---|---|---|
| `module` | a group of functions and types | `component`, `module` |
| `function` | a standalone function | `component`, `module` |
| `class` | a class | `component`, `module` |
| `interface` | a contract that classes fulfil (interface, trait, protocol) | `component`, `module` |
| `method` | a function that belongs to a class or interface | `class`, `interface` |
| `constructor` | how an instance of a class is created | `class` |
| `record` | data with fields (struct, data class, record) | `component`, `module`, `class` |
| `enum` | a fixed set of choices without data | `component`, `module`, `class` |
| `union` | a fixed set of choices, each of which can carry data | `component`, `module`, `class` |
| `alias` | another name for a type | `component`, `module`, `class` |

- `function`, `method`, `constructor`, `record`, `enum`, `union`, and `alias` have no child elements. Their content is members ([§7.4](#74-members)).
- A `module` inside an `oop` component is allowed only if its effective paradigms also include `procedural` or `functional`.
- Placement that breaks this table is `E201`.

Every kind in this table belongs to the **code level** for zooming, and all of them are called **code units**.

### 7.3 Code unit properties

| Property | Value | Applies to | Notes |
|---|---|---|---|
| `description` | prose | all | required, see below |
| `source`, `tags`, `meta` | | all | [§6.3](/en/referensi/spesifikasi/model/#63-common-properties) |
| `async` | flag | `function`, `method` | |
| `pure` | flag | `function` under the `functional` paradigm | a function without side effects |
| `effects` | flag | `function` under the `functional` paradigm | a function with side effects |
| `visibility` | `public`, `private`, `protected`, `internal` | `class`, `interface`, `method`, `constructor` | defaults to `public` |
| `static` | flag | `method` | |
| `abstract` | flag | `class`, `method` | |
| `type` | a type expression | `alias` | required |

Rules:

- **`description` is required** on `module`, `function`, `class`, `interface`, `method`, `constructor`, `record`, `enum`, `union`, and `alias` (`E205`). Others use these units, so their job must be written down. On members (`field`, `variant`, `param`), the note is optional.
- A `function` whose effective paradigms include `functional` must write **exactly one** of `pure` or `effects` (`E304`). Outside `functional`, neither is allowed (`E304`).
- `visibility`, `static`, and `abstract` are only allowed if the effective paradigms include `oop` (`E305`).
- An `abstract` `method` is only allowed inside an `abstract` `class` (`E305`).

### 7.4 Members

A member is part of one code unit. Members have no path and can't be relation ends.

```dim
field <id>: <type> ["<note>"];
variant <id> ["<note>"];
variant <id>: <type> ["<note>"];
param <id>: <type> ["<note>"];
returns <type> ["<note>"];
throws <type> ["<note>"];
```

| Member | Applies to | Notes |
|---|---|---|
| `field` | `record`, `class` | repeatable, order is kept |
| `variant` without a type | `enum` | repeatable, at least one |
| `variant` with a type | `union` | repeatable, at least two; variants without a type are allowed too |
| `param` | `function`, `method`, `constructor` | repeatable, order is the parameter order |
| `returns` | `function`, `method` | at most one; without it, nothing is returned |
| `throws` | `function`, `method`, `constructor` | repeatable; the type must be a `record`, `enum`, or `union` (`E307`) |

- A member that doesn't apply to the kind is `E302`.
- A member id is unique within its code unit, per kind of member (`E303`). A `field` or `variant` can share an id with another element, because members aren't part of path resolution.
- An `enum` without variants, or a `union` with fewer than two variants, is `E302`.

### 7.5 Relations at the code level

Interaction relations (`call`, `use`, and so on) can connect code units with elements at any level ([§9](/en/referensi/spesifikasi/relasi/#9-relations)). Direct recursion is written as a `call` from a `function` or `method` to itself.

**Structural** relations describe the shape of code, not something that happens at runtime:

| `op` | From | To | Paradigm |
|---|---|---|---|
| `inherits` | `class` | `class` | `oop` |
| `inherits` | `interface` | `interface` | `oop` |
| `implements` | `class` | `interface` | `oop` |
| `owns` | `class`, `record` | `class`, `record`, `enum`, `union`, `alias` | all |
| `refers` | `class`, `record` | `class`, `record`, `enum`, `union`, `alias` | all |

`owns` is composition: the target lives and dies with its owner. `refers` is association: the owner keeps a reference without owning it. Any pair outside this table, or a paradigm mismatch at either end, is `E407`.
