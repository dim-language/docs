---
title: Types
description: Type expressions, primitive types, composite types, and references to named types.
---

## 8. Types

dim has a small type system of its own. A type in dim describes the **shape of data**, not how one programming language represents it. Mapping `decimal` to `BigDecimal` or `uuid` to `string` is the job of tools that read the model, such as code generators.

Types are written as **expressions**, not strings, so the parser can check every part of them.

```dim
field id: uuid;
field items: orderItem[];
field note: string?;
field prices: map<uuid, decimal>;
param filter: orderFilter?;
returns order[];
data pull orders.order;
```

### 8.1 Grammar

```text
type      = base { "[" "]" | "?" } ;
base      = PRIMITIVE
          | path
          | "map" "<" type "," type ">" ;
```

- `T[]` is a list of `T`.
- `T?` means the value can be absent.
- Suffixes read left to right: `order[]?` is a list that can be absent, while `order?[]` is a list whose items can each be absent.
- `T??` is `E001`.

### 8.2 Primitive types

| Type | Content |
|---|---|
| `string` | text |
| `int` | an integer |
| `float` | a binary floating-point number |
| `decimal` | an exact decimal number, for money |
| `bool` | true or false |
| `bytes` | binary data |
| `date` | a date without a time |
| `datetime` | a date and time with a time zone |
| `duration` | a span of time |
| `uuid` | a UUID |
| `url` | a URL |

### 8.3 `map`

`map<K, V>` holds key-value pairs. The key must be `string`, `int`, `uuid`, or an `enum` (`E308`).

### 8.4 Named types

Named types are the code units `record`, `enum`, `union`, `alias`, `class`, and `interface` ([§7.2](/referensi/spesifikasi/level-kode/#72-code-level-kinds)). `class` and `interface` exist only under the `oop` paradigm, but they can be referenced as types from anywhere. A named type is referenced by **path**, which resolves like any other path from the scope where the expression is written ([§6.9](/referensi/spesifikasi/model/#69-path-resolution)).

```dim
component orders "Orders" {
  description "Creates orders.";

  record order "Order" {
    description "An order that has been created.";
    field id: uuid;
    field status: orderStatus;              // a child of the same component
  }

  enum orderStatus "OrderStatus" {
    description "The stage of an order.";
    variant pending;
    variant paid;
  }

  function findOrder "findOrder()" {
    description "Looks up an order.";
    param id: uuid;
    returns order?;
    throws ::shop.api.common.notFound;      // an absolute path to another component
  }
}
```

- A path that doesn't point to a named type is `E306`.
- Type names **don't** have to be unique across the model. Two components can both have a `record config`, because references go through paths.
- Types from another component, container, or system can be referenced. That's how shared contracts are written: a type is defined once, where it belongs, and referenced from anywhere.

### 8.5 `alias`

```dim
alias orderId "OrderId" {
  description "An order id, created at checkout.";
  type uuid;
}
```

`alias` gives a type a new name. An alias that refers to itself, directly or through another alias, is `E310`.

### 8.6 Recursion

A record can refer to itself, directly or through other types, as long as the reference goes through `[]`, `?`, or `map`. A direct reference without one of them describes a value that never ends, so it's `E309`.

```dim
record category "Category" {
  description "A product category that can be nested.";
  field name: string;
  field children: category[];   // ✅
  field parent: category?;      // ✅
}
```

### 8.7 What is left out on purpose

- **User-defined generics.** Lists, optionals, and `map` are enough for contracts at the architecture level.
- **Anonymous unions** such as `a | b`. Every choice must be declared as a `union` so it has a name and a description.
- **Result types that wrap errors**, such as `Result<T, E>`. Errors are written with `throws`.
- **References and pointers** such as `&T` or `*T`. Those are representation details of particular languages.
