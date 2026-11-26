---
title: Set up dim.config
description: Declare technologies, tags, scopes, source roots, and styles once for the whole project.
---

Your team uses Kotlin, Postgres, and Kafka across several services. Instead of writing `"Postgres 16"` in one place and `"PostgreSQL"` in another, declare each technology once and reference its id from the model.

Every dim project has one `dim.config` in the same folder as its main file. All project files use that config.

```dim
// dim.config
dim "0.6";

tech kotlin "Kotlin" { version "2.1"; }
tech postgres "PostgreSQL" { version "16"; }
tech kafka "Apache Kafka";
tech https "HTTPS";

tag pci "Stores card data";
tag deprecated "Will be removed";

scope ordersWrite "orders:write";

root shopRepo {
  repo "https://github.com/acme/shop";
  branch "main";
}

style role app { icon browser; background blue; }
style role service { icon server; background accent; }
style role database { icon database; background neutral; }
style role queue { icon queue; background purple; }
style tag pci { background warning; }
```

`dim init` creates a starting file like this one, with a style for every container role.

## Technologies: `tech`

Declare every language, framework, database, cloud service, and protocol that appears in the model. The model then only writes the id:

```dim
container db "Orders DB" {
  role database;
  tech postgres;
}

publishOrder: api.orders -> events { op publish; data push api.orders.order; tech kafka; }
```

A typo such as `tech postgress` is an immediate error, and the editor can complete the id. If two versions are used at the same time, declare two techs: `postgres15` and `postgres16`.

## Tags: `tag`

Tags group elements that are spread across the model: everything that touches card data, everything that will be removed, everything one team owns. Elements, relations, and flows use them with `tags pci deprecated;`.

A tag that isn't declared can't be used. That keeps tags tidy: there's no `pci`, `PCI`, and `cardData` for the same thing.

## Auth scopes: `scope`

Endpoints that need a particular permission refer to a scope declared here. Its string value is the scope as it's sent in a token. See [Document an endpoint](/konsep/endpoint/).

## Source locations: `root`

A `root` records the repository the code lives in. Elements point to their location relative to that root:

```dim
system shop "Online Shop" {
  source { root shopRepo; path "."; }

  container api "API" {
    role service;
    source { path "services/api"; }
  }
}
```

The root is inherited by children, but a path is always written in full from the root, so every `source` can be read on its own.

## Appearance: `style`

A model doesn't set the colors or icons of its own elements. All appearance is set in `dim.config`, by kind, by role, or by tag. If several styles match, the order is kind, then role, then tag, and the last one wins.

- **Icons** come from a closed set of 24 semantic icons, such as `database`, `queue`, `server`, and `payment`. Icons are optional.
- **Backgrounds** come from 12 palette tokens: six semantic (`neutral`, `accent`, `info`, `success`, `warning`, `danger`) and six categorical (`blue`, `green`, `purple`, `orange`, `pink`, `teal`). Text and border colors are derived so they stay readable in light and dark themes.

The full lists are in [specification §5](/referensi/spesifikasi/konfigurasi/#5-project-configuration).

## Check the result

Change one `tech` in the model to an id that isn't declared, then run `dim check main.dim`. The message points to that line with `E104`. Restore the id, then add `tags pci;` to the database and confirm its background changes on the map.
