---
title: Project configuration
description: The dim.config file, declarations of techs, tags, scopes, roots, and styles, and the icon set and color palette.
---

## 5. Project configuration

Everything that's referenced from many places is declared **once** in `dim.config`: technologies, tags, auth scopes, source roots, and styles. A model only refers to them by id, so they're always written the same way, and a typo is immediately an error.

```dim
// dim.config
dim "0.6";

tech kotlin "Kotlin" { version "2.1"; }
tech postgres "PostgreSQL" { version "16"; url "https://www.postgresql.org"; }

tag pci "Stores card data";
tag deprecated "Will be removed" { description "Don't add new users of this."; }

scope ordersWrite "orders:write";

root shopRepo {
  repo "https://github.com/acme/shop";
  branch "main";
}

style role database { icon database; background neutral; }
style tag pci { background warning; }
```

### 5.1 Files and projects

- **One project, one config.** `dim.config` must be in the same folder as the main file. If it isn't there, `E101`.
- All project files, meaning the main file and every file it `import`s or `amends`, must be in that folder or its subfolders (`E107`). They all use the same `dim.config`.
- `dim.config` uses dim syntax. It can contain only the version declaration, `tech`, `tag`, `scope`, `root`, and `style`. Any other statement in `dim.config`, or a configuration statement in a `.dim` file, is `E102`.
- Each kind of declaration has its own namespace. The same id in two declarations of the same kind is `E103`. A reference to a declaration that doesn't exist is `E104`.

### 5.2 `tech`

```dim
tech <id> "<name>" [{ version "<version>"; url "<url>"; description "<prose>"; }]
```

One technology: a language, framework, database, cloud service, or protocol. `version` is a `version` literal and `url` is a `url` literal ([§3.9](/en/referensi/spesifikasi/sintaks/#39-typed-literals)). All three are optional.

A tech is referenced with `tech <id> [<id> ...];` on containers, components, relations, nodes, and infra. If two versions of one technology are in use at the same time, declare them as two techs: `postgres15` and `postgres16`.

### 5.3 `tag`

```dim
tag <id> "<name>" [{ description "<prose>"; }]
```

A tag groups elements **across the hierarchy**, for example everything that touches card data, or everything that will be removed. Tags are used to filter views and as style selectors ([§5.6](#56-style)).

A tag is referenced with `tags <id> [<id> ...];` on elements, relations, and flows.

### 5.4 `scope`

```dim
scope <id> "<value>";
```

A permission scope requested by `auth` on an endpoint ([§10.7](/en/referensi/spesifikasi/endpoint/#107-prefix-auth-and-rate)). The `value` is a `scopeValue` literal: the scope as it's sent in a token, for example `"orders:write"`. The same value in two scopes is `E103`.

### 5.5 `root`

```dim
root <id> {
  repo "<url>";
  branch "<branch>";
}
```

The repository where an element's source lives. `repo` and `branch` are required (`E106`). Paths in `source` are relative to a root ([§6.7](/en/referensi/spesifikasi/model/#67-implementation-location-source)).

### 5.6 `style`

```dim
style kind <kind> { ... }
style role <role> { ... }
style tag <tag> { ... }
```

An element's appearance is set **only** through styles in `dim.config`. A model can't style its own elements.

| Property | Value |
|---|---|
| `icon` | an icon name from [§5.7](#57-icons) |
| `background` | a palette token from [§5.8](#58-palette) |

Rules:

- The `kind` selector accepts any element kind ([§6.1](/en/referensi/spesifikasi/model/#61-element-kinds-and-nesting), [§7.2](/en/referensi/spesifikasi/level-kode/#72-code-level-kinds), [§13](/en/referensi/spesifikasi/deployment/#13-deployment)). The `role` selector accepts container roles ([§6.5](/en/referensi/spesifikasi/model/#65-container-roles)) and infra roles ([§13.3](/en/referensi/spesifikasi/deployment/#133-infra)). The `tag` selector accepts declared tags.
- Every style must set at least one property. The same selector twice, or an unknown kind, role, icon, or token, is `E105`.
- **Precedence**: `kind`, then `role`, then `tag`. A later style overrides the same property from an earlier one. If an element has several tags that set the same property, the tag **declared last** in `dim.config` wins.
- An element with no matching style has no icon and uses the `neutral` background.
- The appearance of `external` elements can't be changed: consumers always draw them with a dashed border. The same goes for text and border colors, which are derived from the background so the contrast is sufficient in both light and dark themes.

`dim init` creates a starting `dim.config` with a style for every container role.

### 5.7 Icons

Icons are optional and come from this closed set. The set is deliberately semantic, with no brand logos. Consumers draw each icon from an open-source icon set on the web, and from its native counterpart elsewhere (for example SF Symbols on Apple platforms).

| Icon | For | Icon | For |
|---|---|---|---|
| `user` | one person | `users` | a group of people |
| `browser` | a web app | `mobile` | a mobile app |
| `desktop` | a desktop app | `server` | a backend service |
| `api` | an API | `database` | a database |
| `queue` | a message queue | `storage` | file storage |
| `cache` | a cache | `cloud` | a cloud service |
| `lock` | security | `key` | credentials |
| `mail` | email | `payment` | payments |
| `cart` | shopping | `search` | search |
| `chart` | analytics | `file` | a document |
| `folder` | a set of files | `gear` | configuration or a job |
| `bell` | notifications | `globe` | the internet or DNS |

### 5.8 Palette

Backgrounds come from 12 tokens. Every token has a color for the light theme and one for the dark theme.

| Kind | Tokens |
|---|---|
| Semantic | `neutral`, `accent`, `info`, `success`, `warning`, `danger` |
| Categorical | `blue`, `green`, `purple`, `orange`, `pink`, `teal` |

Semantic tokens carry meaning, for example `warning` for elements tagged `pci`. Categorical tokens tell equal groups apart, for example one per team. Consumers choose the actual color of each token; this specification doesn't.
