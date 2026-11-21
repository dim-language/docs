---
title: Elements, attributes, and paths
description: Element kinds, nesting rules, recognized attributes, and path resolution.
---

## 5. Element model

### 5.1 Element kinds and nesting

| Kind | Allowed parent | Examples |
|---|---|---|
| `person` | Top level | User, admin, operator |
| `system` | Top level | System owned by a team or organization |
| `container` | `system` | Web app, mobile app, API, database, queue |
| `component` | `container` or `component` | Module, internal service, UI page |
| `code` | `component` or `code` | Class, function, method, handler |

- A `person` has no children.
- `component` and `code` can nest to any depth, for example a class containing a method.
- Levels below `container` are optional. A container without components and a component without code are valid.
- A `code` element needs a `component` between itself and its enclosing `container`.

**Why code belongs inside a component**

1. **C4 definition.** The code level zooms into one component and shows its implementation. A code element belongs to a component or to another code element, as when a class contains a method.
2. **One level of abstraction per view.** Opening a container shows components. Allowing code directly inside it would put standalone functions such as `parse_date()` beside modules such as `Orders` and display relations from either at the same level.
3. **Every function belongs to a named unit.** A tiny container, such as a Lambda with one handler, needs only a single component.

A component can contain both subcomponents and code. A real module can have submodules and standalone functions, and readers at this level are already looking at implementation details.

### 5.2 Identity

- An `id` must be unique among siblings, regardless of their kinds.
- Global identity is the **full path**. Join each ID from the top-level element to the target with `.`, as in `shop.api.orders.repo.find`.
- The same ID can appear under different parents, as in `shop.web.checkout` and `shop.api.checkout`.

---

## 6. Recognized attributes

An unrecognized attribute such as `desciption` is an error. Use `tags` for arbitrary labels.

### 6.1 Element attributes

| Attribute | Value | Allowed on | Meaning |
|---|---|---|---|
| `description` | 1 STRING | All kinds | Free-form description |
| `tech` | 1 STRING | All except `person` | Technology, such as `"Rust/axum"` |
| `tags` | ≥1 STRING | All kinds | Labels for filtering or styling |
| `shape` | 1 IDENT | All kinds | Shape hint, see below |
| `external` | Flag | All kinds | Outside the owner's control |
| `ui` | Flag | `container`, `component` | Used directly by a person |
| `source` | 1 STRING | All except `person` | Implementation path or URL ([§6.5](#65-implementation-location-source)) |
| `auth` | IDENT [STRING ...] | `container`, `component`, `code` | Who can call endpoints within the element ([§13.3](/en/referensi/spesifikasi/endpoint-http/#133-auth-rate-and-prefix)) |
| `rate` | IDENT STRING, repeatable | `container`, `component`, `code` | Rate limits for endpoints within the element ([§13.3](/en/referensi/spesifikasi/endpoint-http/#133-auth-rate-and-prefix)) |
| `prefix` | 1 STRING | `container`, `component`, `code` | Path prefix for endpoints within the element ([§13.3](/en/referensi/spesifikasi/endpoint-http/#133-auth-rate-and-prefix)) |

Supported shapes are `box` (default), `person`, `database`, `queue`, `browser`, `mobile`, `folder`, and `cylinder`. An unknown value causes a warning and renders as `box`.

Each attribute can appear **at most once** per element except `param` and `throws` ([§6.4](#64-code-details)) and `rate`, `query`, `header`, `cookie`, and `sets` ([§13](/en/referensi/spesifikasi/endpoint-http/#13-http-endpoints)). Other duplicates are errors.

See [§6.4](#64-code-details) for the additional attributes of `code` elements and [§13](/en/referensi/spesifikasi/endpoint-http/#13-http-endpoints) for HTTP endpoint attributes.

### 6.2 Relation attributes

| Attribute | Value | Meaning |
|---|---|---|
| `op` | 1 IDENT | Operation, see below |
| `data` | `[push\|pull]` + ≥0 STRING | Data flow ([§6.3](#63-data-flow)) |
| `tech` | 1 STRING | Protocol or technology, such as `"HTTPS/JSON"` |
| `description` | 1 STRING | Additional description |
| `tags` | ≥1 STRING | Free-form labels |

Each relation attribute can appear at most once, except for `data`, which is repeatable.

Operations fall into two categories. **Interaction** operations describe runtime behavior from the initiator's point of view.

| `op` | Meaning |
|---|---|
| `use` | General interaction and default when `op` is omitted |
| `call` | Synchronous call such as a function call, HTTP request, or RPC |
| `read` | Read data from the target |
| `write` | Send or store data at the target |
| `publish` | Send an asynchronous message to a target such as a queue or topic |
| `subscribe` | Receive asynchronous messages from the target |

**Structural** operations describe relationships in code, such as those in a class diagram.

| `op` | Meaning | Arrow direction |
|---|---|---|
| `extends` | Inheritance | Derived type → base type |
| `implements` | Conforms to an interface or trait | Implementation → contract |
| `owns` | Composition, with the owned element sharing the owner's lifetime | Owner → owned element |
| `refers` | Association through a reference without ownership | Reference holder → referenced element |

- Both ends of a structural relation must be `code` elements (`E037`).
- Structural relations carry no data. The `data` attribute is invalid here (`E038`).
- Structural relations have `"structure"` in the output `category` field. Interaction relations use `"interaction"`.

An unknown operation raises a warning and passes through as an interaction with its original value.

### 6.3 Data flow

- The **arrow** (`->`) points from the initiator to the target.
- The **`data` attribute** records what flows and its direction relative to the initiator.

| Direction | Meaning | Relative to the arrow |
|---|---|---|
| `push` | The initiator sends data to the target | Same direction |
| `pull` | The initiator receives data from the target | Opposite direction |

```dim
data [push|pull] ["<payload>" ...];
```

- A `payload` is a free-form name for the data, such as `"Order"`, `"Order[]"`, or `"CheckoutRequest"`.
- Specify a direction, a payload, or both. `data;` on its own is an error.
- A relation can declare multiple `data` attributes, for example one for a request and another for the response.

If the direction is omitted, derive it from `op`.

| `op` | Default direction |
|---|---|
| `read`, `subscribe` | `pull` |
| `write`, `publish` | `push` |
| `call`, `use`, unknown operation | Specify the direction explicitly. |
| `extends`, `implements`, `owns`, `refers` | No data flow. `data` is invalid. |

A `call` or `use` can send a request as well as receive a response, so neither operation implies a direction.

```dim
repo.find -> db "SELECT orders" { op read; data "Order" }     // pull "Order"
repo.save -> db "INSERT orders" { op write; data "Order" }    // push "Order"

button -> handler "POST /checkout" {
  op call;
  data push "CheckoutRequest";
  data pull "OrderId";
}

worker -> queue "Antrian email" { op publish }                // push, tanpa payload
```

A call can carry data both ways, but an arrow has one direction. Using data direction for a read would draw `db → api` even though the API depends on the database. `push` and `pull` distinguish those directions without introducing additional arrow symbols.

### 6.4 Code details

A `code` element can describe its form, parameters, return value, and possible errors. Editors can use these declarations for **class diagrams** and **call graphs**. Readers can find a unit's purpose and contract without opening the implementation.

```dim
code repo "OrderRepository" {
  form class;
  description "Implementasi OrderStore di atas Postgres.";
  param pool "PgPool" "Koneksi database bersama";

  code pool "pool" { form field; type "PgPool"; visibility private }

  code save "save()" {
    form method;
    description "Menyimpan order baru dalam satu transaksi.";
    param order "&Order";
    returns "Result<()>";
    throws "DbError" "Gagal menulis ke database";
    async;
  }
}
```

| Attribute | Value | Allowed forms | Meaning |
|---|---|---|---|
| `form` | 1 IDENT | | Element form, see below |
| `visibility` | `public`, `private`, `protected`, `internal` | All | |
| `static` | Flag | `function`, `method`, `field` | |
| `abstract` | Flag | `class`, `method` | |
| `async` | Flag | `function`, `method` | |
| `type` | 1 STRING | `field` | Field type |
| `param` | IDENT STRING [STRING], repeatable | `function`, `method`, `class`, `struct`, `endpoint` | Name, type, description. A constructor parameter on a class or struct and a path parameter on an endpoint ([§13.2](/en/referensi/spesifikasi/endpoint-http/#132-endpoint-attributes)). |
| `returns` | STRING [STRING] | `function`, `method`, `endpoint` | Return type and description. On an endpoint this is the success response body. |
| `throws` | STRING [STRING], repeatable | `function`, `method`, `endpoint` | Possible error and when it occurs. On an endpoint this is INT [STRING], with an HTTP status ([§13.2](/en/referensi/spesifikasi/endpoint-http/#132-endpoint-attributes)). |

Known forms are `module`, `class`, `interface`, `struct`, `enum`, `trait`, `function`, `method`, `field`, and `endpoint`. An unknown form produces `W004` and passes through unchanged. See [§13](/en/referensi/spesifikasi/endpoint-http/#13-http-endpoints) for endpoints.

- The attributes above apply only to `code` elements (`E031`).
- Authors can order attributes freely. Validate attributes against `form` after reading the block. An incompatible attribute raises `E031`. If the form is missing or unknown, accept all attributes in the table.
- Each `param` name is an IDENT unique within the element (`E036`).
- Types are free-form strings such as `"Option<Order>"`, `"&str"`, or `"Promise<void>"` so that dim can describe code in any programming language.

**Descriptions.** Warn with `W020` if a `class`, `interface`, `struct`, `enum`, `trait`, `function`, `method`, or `endpoint` has no `description`. Other parts of the system rely on these units, so record their purpose. A `field` or `module` can omit it.

**Member placement.** A `method` should be inside a `class`, `interface`, `struct`, `enum`, or `trait`. A `field` can also be inside a `module`. An `endpoint` should be directly inside a `component`, `module`, or `class` such as a controller. Other placements produce `W021`.

### 6.5 Implementation location (`source`)

Use `source` to point to the folder, file, line, or URL where the element is implemented.

```dim
system shop "Online Shop" {
  source "https://github.com/acme/shop";
  container api "API" {
    source "../../services/api";
    component orders "Orders" {
      code repo "OrderRepository" { form class; source "../../services/api/src/orders/repo.rs:42" }
    }
  }
}

system payment "Payment Gateway" {
  external;
  source "https://docs.gateway.example/api";
}
```

- `source` is optional. An element might be proposed for the future or have an unrecorded location ([§11.3](/en/referensi/spesifikasi/komposisi-dan-flow/#113-amends-and-remove)). Omission produces no warning, and children do not inherit it.
- A URL starts with a scheme followed by `://`, as in `https://…`. Pass it through unchanged.
- Treat anything else as a path. Use `/` separators relative to the directory of the **declaring `.dim` file**, as with [`import`](/en/referensi/spesifikasi/komposisi-dan-flow/#111-import). `..` is allowed. An absolute path (`/…` or `C:\…`), a backslash, or an empty path raises `E039`.
- A path can end with `:<line>`, where the line is an integer ≥ 1. Colons in other positions raise `E039`.
- The parser leaves checks for the existence of a path or URL to other tools.
- In the [output](/en/referensi/spesifikasi/output/#9-json-output-format), write the path relative to the main file's directory as for `span.file`, simplifying `.` and `..` where possible.

### 6.6 Type references

Types in dim are [free-form strings](#64-code-details). The parser resolves names in them to the `code` elements that describe the types. Editors and OpenAPI exporters can then follow the same references.

A **type element** is a `code` element whose `form` is `struct`, `class`, `interface`, `enum`, or `trait`. Use its [display name](/en/referensi/spesifikasi/sintaks/#42-elements) for matching.

| Type string occurs in | Value to match |
|---|---|
| `data` on a relation | Each payload |
| `type` | Field type |
| `param`, `query`, `header`, `cookie` | Type (second value) |
| `returns`, `body` | Type (first value) |
| `throws` | Type (first value), except for endpoints where this is an HTTP status |

1. Extract every maximal word matching `[A-Za-z_][A-Za-z0-9_]*`. `"Option<Order>"` yields `Option` and `Order`, `"Result<(), DbError>"` yields `Result` and `DbError`, and `"orders::Order[]"` yields `orders` and `Order`.
2. Compare each word with the names of all type elements in the final model, after [file composition](/en/referensi/spesifikasi/komposisi-dan-flow/#114-application-order). The match is exact and case-sensitive.
3. Ignore unmatched words. Built-in and library types such as `Option`, `Vec`, and `string` can be left out of the model.
4. Type element names are unique across the entire model, including across systems. Duplicate names raise `E025` even when nobody refers to the name yet. The diagnostic names every conflicting element. Use distinct names such as `"PaymentConfig"` and `"ShopConfig"`, and model a shared contract such as `CheckoutRequest` once for both sides.
5. A type element with a name that is more than one word, such as `"Order Entity"`, cannot match and is exempt from the uniqueness check.

In the [output](/en/referensi/spesifikasi/output/#9-json-output-format), write `refs` as the matching type element IDs in the order they first occur in the string, without duplicates.

---

## 7. Path resolution

Resolve relation paths relative to the **scope** where the relation appears. The scope is the element whose block contains the relation, or the root for a top-level relation.

For a path `p1.p2.….pn` in scope `S`:

1. Start in `S` and look for a direct child with ID `p1`.
2. If there is no match, repeat in the parent scope and continue up to the root.
3. Use the first scope with a `p1` child. If there is no match at the root, report an unresolved reference.
4. From `p1`, each segment `p2 … pn` must name a direct child of the preceding segment. Looking up ancestors again is disallowed.

**Absolute paths.** A path that starts with `::`, such as `::shop.api.checkout`, skips steps 1–3 and looks for `p1` at the top level.

```dim
system shop {
  container api {
    component orders {
      code repo;
    }
    orders.repo -> db { op write }   // orders → shop.api.orders, db → shop.db
  }
  container db;
}
```

**Shadowing.** Names in inner scopes shadow the same names in outer scopes. In `shop.web`, `checkout` names `shop.web.checkout`. To reach the distinct API element, use `api.checkout` or `::shop.api.checkout`.

### 7.1 `this`

At the start of a path, `this` refers to the element whose block contains it, namely scope `S`. In `this.p1.….pn`, skip steps 1–3 and resolve `p1 … pn` as successive direct children starting from `S`.

```dim
code total "total_price()" {
  form method;
  this -> this "Isi bundel" { op call }        // rekursi
}

component orders "Orders" {
  code repo "OrderRepository" {
    code save "save()";
  }
  this.repo.save -> db "INSERT orders" { op write }
}
```

- In `extend X { … }`, `this` refers to `X` because the block acts as part of its [original declaration](/en/referensi/spesifikasi/komposisi-dan-flow/#112-extend).
- `this` at the top level, including in top-level `remove`, or anywhere other than the start of a path raises `E024`.
- A child cannot shadow `this`. If `orders` has a child also named `orders`, `orders -> db` inside the block refers to the child, while `this -> db` refers to the enclosing `orders` itself.
- A path starting with `this` continues to refer to the same element if it moves.
- After resolving endpoints, apply the normal relation rules. `this -> this` is valid only for recursion (`E021`). A relation between `this` and an ancestor or descendant, such as `this -> this.repo`, raises `E022`.
- The [output](/en/referensi/spesifikasi/output/#9-json-output-format) contains the resolved full path, as for any other relation.
