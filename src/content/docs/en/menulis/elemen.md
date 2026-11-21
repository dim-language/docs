---
title: Elements and attributes
description: The five kinds of dim elements, their nesting rules, IDs, names, and attributes.
---

A dim model contains nested **elements** connected by **relations**. See [Relations and paths](/en/menulis/relasi/) for how to connect them.

```dim
system shop "Online Shop" {
  description "Toko online untuk pembeli di Indonesia.";

  container api "API" {
    tech "Rust/axum";
    tags "tim-checkout";

    component orders "Orders" {
      code repo "OrderRepository";
    }
  }

  container db "Postgres" {
    tech "PostgreSQL";
    shape database;
  }
}
```

## Declaring an element

```dim
<jenis> <id> ["<nama>"] [{ … }]
```

- The **ID** identifies the element in paths. It is case-sensitive and uses ASCII letters, digits, and `_`. Start with a letter or underscore. The hyphen belongs to the `->` symbol and is invalid in IDs.
- The **name** is the label people see. It can contain arbitrary text. When omitted, it defaults to the ID.
- A **block** of `{ … }` contains attributes, children, and relations. End an element without a block with `;`.

IDs must be unique among siblings. `shop.web.checkout` and `shop.api.checkout` can coexist because an element's identity is its **full path**.

## Five kinds of elements

The kinds follow the levels of the [C4 model](https://c4model.com).

| Kind | Represents | Allowed parent |
|---|---|---|
| `person` | A person or role, such as customer, admin, or operator | Top level |
| `system` | A system owned by a team or organization | Top level |
| `container` | An independently running part such as a web app, API, database, or queue | `system` |
| `component` | A module, internal service, or page | `container` or `component` |
| `code` | A class, function, method, or field | `component` or `code` |

- Levels below `container` are optional. A container without components and a component without code are both valid.
- Components and code can nest as deeply as needed, for example a class containing a method.
- A component can contain both components and code.
- Put code inside a named component before adding it to a container. This makes the container view show modules. For a tiny container, one component is enough.

Invalid nesting raises `E010`.

## Attributes

Write an attribute inside an element block as `<name> <values …>;`.

| Attribute | Value | Allowed on | Meaning |
|---|---|---|---|
| `description` | One string | All kinds | Free-form description |
| `tech` | One string | All except `person` | Technology, such as `"Rust/axum"` |
| `tags` | One or more strings | All kinds | Labels for filtering or rendering |
| `shape` | One name | All kinds | `box`, `person`, `database`, `queue`, `browser`, `mobile`, `folder`, or `cylinder` |
| `external` | No value | All kinds | Outside your ownership, such as a third-party payment gateway |
| `ui` | No value | `container`, `component` | Used directly by a person |

- An attribute without a value, such as `external` or `ui`, is called a **flag**.
- An attribute can appear once per element. Repeating it raises `E033`.
- An unknown attribute such as `desciption` raises `E030`. Use `tags` for arbitrary labels.
- dim uses `ui` to check the model. If a `person` connects to a container or lower level without a `ui` element on the target path, dim emits `W010`.

Code elements have additional attributes such as `form`, `param`, `returns`, and `throws`. See [Code level](/en/konsep/level-kode/) and [HTTP endpoints](/en/konsep/endpoint/).

## Syntax

**Semicolons and newlines.** dim ignores newlines. A statement without a block ends in `;`. A block statement ends at `}`, and the semicolon immediately before `}` is optional. Both forms below are equivalent.

```dim
container db "Postgres" { tech "PostgreSQL"; shape database }

container db "Postgres" {
  tech "PostgreSQL";
  shape database;
}
```

**Comments.** Use `//` for a line comment or `/* … */` for a block comment.

**Strings.** Use double quotes and the escapes `\"`, `\\`, `\n`, and `\t`. Use a multiline string for longer text. dim strips the indentation before the closing `"""` from every line of the string.

```dim
container api "API" {
  description """
    Backend utama.
    Menangani checkout dan order.
    """;
}
```

See [specification §§3–6](/en/referensi/spesifikasi/sintaks/#3-lexical-structure) for the full rules.
