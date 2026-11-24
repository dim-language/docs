---
title: Choose elements and properties
description: dim's element kinds, their nesting rules, ids and names, container roles, and the properties that describe each element.
---

The checkout team owns one API and one database. Put both inside the store system so a reader can open the store and see the parts the team maintains.

A dim model is made of nested **elements** and the **relations** between them. This page covers elements. Relations are covered in [Connect two elements](/en/menulis/relasi/).

```dim
system shop "Online Shop" {
  description "An online store for shoppers in Indonesia.";

  container api "API" {
    role service;
    paradigm oop;
    tech kotlin;
    tags checkoutTeam;

    component orders "Orders" {
      description "Stores and looks up orders.";

      class orderRepo "OrderRepository" {
        description "Stores orders in Postgres.";
      }
    }
  }

  container db "Postgres" { role database; tech postgres; }
}
```

## Writing an element

```dim
<kind> <id> "<name>" [{ … }]
```

- The **`id`** is used to refer to the element, and is written in camelCase: it starts with a lowercase letter, has no `_` or `-`, and acronyms are written like ordinary words (`httpClient`, not `HTTPClient`).
- The **`name`** is required, and is prose for people. It can contain anything, including the real name in the code such as `"save_order()"`.
- The **block** `{ … }` holds properties, child elements, and relations. An element with no content can end with `;`, but an element with required properties, such as `role` on a container, always uses a block.

An `id` only has to be unique among its siblings. `shop.web.checkout` and `shop.api.checkout` can coexist, because an element's identity is its **full path**.

## Element kinds

Element kinds follow the levels of the [C4 model](https://c4model.com):

| Kind | What it holds | Can be inside |
|---|---|---|
| `person` | a person or role: shopper, admin, operator | top level |
| `system` | a system owned by one team or organization | top level |
| `container` | a part that runs on its own: web app, API, database, queue | `system` |
| `component` | a module, internal service, or page | `container`, `component` |
| `endpoint` | an HTTP route, gRPC method, GraphQL field, or event | `component` |
| code level | `function`, `class`, `record`, and others | `component` |

- Levels below `container` are **optional**. A container without components, or a component without code-level elements, is valid.
- Code-level elements **can't** sit directly inside a `container`. Every function needs a named owning module, so opening a container always shows modules, not a mix of modules and loose functions.
- Code-level kinds and their rules are covered in [Record a function contract](/en/konsep/level-kode/). Endpoints are covered in [Document an endpoint](/en/konsep/endpoint/).

## Container roles

Every container must have a `role`:

| `role` | For |
|---|---|
| `app` | an application people use: web, mobile, desktop |
| `service` | a backend process: API, worker, job |
| `database` | structured data storage |
| `queue` | a message queue or topic |
| `storage` | file or object storage |
| `cache` | a cache |

The role decides which relations can point at the container, and is what its appearance is based on in `dim.config`.

## Properties

| Property | Value | Applies to |
|---|---|---|
| `description` | prose; required on `component`, `endpoint`, and code units | all |
| `role` | a container role | `container`, required |
| `paradigm` | `procedural`, `functional`, `oop` | `container`, `component`; required on containers with code |
| `tech` | tech ids from `dim.config` | `container`, `component` |
| `tags` | tag ids from `dim.config` | all |
| `external` | flag | `system`, `container` |
| `source` | `{ root …; path "…"; line …; }` | all except `person` |
| `meta` | a JSON object | all |

- A property without a value (`external`, `async`) is a **flag**.
- Each property appears at most once per element. An unknown property, or one that doesn't apply to the kind, is an error. That way `desciption` is caught right away.
- Information that doesn't have a property yet goes into `meta` as JSON. The core doesn't read it, so `meta` is a safe place to try out a new property. If a key proves useful, it's proposed as a real property.

## Writing style

**`;` is always required.** Every statement without a block ends with `;`, including the last one before `}`. Line breaks have no meaning, so these two forms are the same:

```dim
container db "Postgres" { role database; tech postgres; }

container db "Postgres" {
  role database;
  tech postgres;
}
```

`dim fmt` picks one of them automatically and orders the block's contents, so you don't have to think about it.

**Comments.** `// to the end of the line` and `/* block */`.

**Prose.** Written with `"…"`, with the escapes `\"`, `\\`, `\n`, and `\t`. For a long `description`, use multiline prose. The indentation before the closing `"""` is removed from every line:

```dim
container api "API" {
  description """
    The main backend.
    Handles checkout and orders.
    """;
  role service;
}
```

The full rules are in [specification §3–§6](/en/referensi/spesifikasi/sintaks/#3-lexical-structure).

## Check the result

Save the first example as `shop.dim` next to a `dim.config` that declares `kotlin`, `postgres`, and the tag `checkoutTeam`, then run `dim check shop.dim`. Remove `role database;` from `db` and run it again: the message points to that container with `E205`.
