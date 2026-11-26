---
title: Syntax
description: Lexical structure and grammar of the dim language.
---

## 3. Lexical structure

### 3.1 Encoding
`.dim` files and `dim.config` are UTF-8 without a BOM. Identifiers are limited to ASCII. Prose can contain any Unicode.

### 3.2 Whitespace
Spaces, tabs, and line breaks (`\n`, `\r\n`) are ignored except as token separators. Line breaks have **no** meaning: a statement ends with `;` or `}`.

### 3.3 Comments
```dim
// comment to the end of the line
/* block comment,
   can span lines, cannot nest */
```

### 3.4 Identifiers

```text
IDENT = [a-z][a-zA-Z0-9]*
```

Identifiers are written in **camelCase**:

- They start with a lowercase letter, followed by letters or digits. No `_`, `-`, or other characters.
- Two uppercase letters can't be adjacent. Acronyms are written like ordinary words: `httpClient`, `parseUrl`, `apiKey`, not `HTTPClient` or `parseURL`.

An identifier that breaks these rules is `E005`. The message suggests the correct camelCase form.

The same rules apply to every id: elements, relations, flows, flow branches, members (`field`, `variant`, `param`), and every declaration in `dim.config`. Top-level keys in `meta` follow them too ([§6.8](/referensi/spesifikasi/model/#68-meta)).

Names shown to people aren't identifiers. They're prose, so they're free-form: `function saveOrder "save_order()"`.

### 3.5 Keywords

All keywords are lowercase and **reserved**: they can't be used as identifiers (`E003`).

| Group | Keywords |
|---|---|
| Element kinds | `person`, `system`, `container`, `component`, `endpoint` |
| Endpoint protocol lines | `http`, `grpc`, `graphql`, `event`, `on` |
| Code-level kinds | `module`, `function`, `class`, `interface`, `method`, `constructor`, `record`, `enum`, `union`, `alias` |
| Deployment | `environment`, `node`, `infra`, `deploy`, `omit` |
| Members | `field`, `variant`, `param`, `returns`, `throws`, `query`, `header`, `cookie`, `body`, `sets` |
| Composition and flows | `dim`, `import`, `amends`, `extend`, `remove`, `unset`, `flow`, `step`, `opt`, `alt`, `case`, `par`, `lane` |
| Configuration | `tech`, `tag`, `scope`, `root`, `style` |
| Properties | `description`, `tags`, `role`, `paradigm`, `external`, `source`, `path`, `line`, `repo`, `branch`, `version`, `url`, `meta`, `op`, `data`, `push`, `pull`, `handler`, `status`, `auth`, `rate`, `per`, `prefix`, `request`, `stream`, `payload`, `replicas`, `icon`, `background`, `kind`, `type`, `async`, `pure`, `effects`, `static`, `abstract`, `visibility` |
| Types | `string`, `int`, `float`, `decimal`, `bool`, `bytes`, `date`, `datetime`, `duration`, `uuid`, `url`, `map` |
| Other | `this` |

Enum values, such as `op` names (`call`, `read`), roles (`database`), or icon names, are **not** keywords. They're only recognized in the property position that uses them, so an element can be called `call` or `database`. Conversely, a keyword can appear as an enum value, for example `graphql query` or `type url`.

### 3.6 Prose

```dim
"plain text"
"with \"quotes\" and a \\ backslash"
```

Strings are used only for prose and typed literals ([§3.9](#39-typed-literals)). Supported escapes: `\"`, `\\`, `\n`, `\t`. Any other escape, an unterminated string, or a plain string containing a literal line break is `E002`.

Prose can't be empty or contain only spaces (`E002`).

### 3.7 Multiline prose

```dim
container api "API" {
  description """
    The main backend.
    Handles checkout and orders.
    """;
}
```

The value above is `"The main backend.\nHandles checkout and orders."`.

1. The opening `"""` must be followed directly by a line break (`E002`). That line isn't part of the value.
2. The closing `"""` must be on its own line, preceded only by spaces or tabs. The line break before it isn't part of the value.
3. The indentation before the closing `"""` is removed from every content line. Every non-empty content line must start with exactly that indentation (`E004`).
4. Escapes are the same as in plain strings. A single `"` inside the content doesn't need escaping.

Multiline prose is only allowed for `description`.

### 3.8 Numbers and durations

```text
INT      = "0" | [1-9][0-9]*
DURATION = INT ( "ms" | "s" | "m" | "h" | "d" )
```

- `INT` is a non-negative integer without leading zeros. There's no minus sign, fraction, or thousands separator.
- `DURATION` is a number followed directly by a unit: `500ms`, `30s`, `1m`, `6h`, `7d`.
- A number followed directly by any other letter, or with a leading zero, is `E008`.

Fractional numbers exist only inside `meta`, which follows JSON rules ([§6.8](/referensi/spesifikasi/model/#68-meta)).

### 3.9 Typed literals

Some properties take a string whose content is **checked against a format**. Such a string isn't prose. Content that doesn't match the format is `E007`, and the message names the expected format.

| Format | Rules | Used in |
|---|---|---|
| `url` | absolute URL with the `https` or `http` scheme | `repo`, `url` in a tech |
| `filePath` | relative, `/` separators, no `\`, no trailing `/`, no empty segments; `.` means the root itself; no `..` | `path` in `source` |
| `httpPath` | starts with `/`, doesn't end with `/` except `"/"`; parameters are written `{name}` where the name is an IDENT | the path in an `http` line, and `prefix` |
| `version` | letters, digits, `.`, `+`, `-`; starts with a letter or digit | `version` in a tech |
| `branch` | a valid git ref name, without spaces | `branch` in a root |
| `externalName` | `[A-Za-z_][A-Za-z0-9_]*` | service and rpc in a `grpc` line, the field in a `graphql` line, the name in an `event` line |
| `headerName` | letters, digits, and `-`; case-insensitive | `header`, `sets header` |
| `cookieName` | HTTP token characters (RFC 9110) | `cookie`, `sets cookie` |
| `scopeValue` | letters, digits, and `:._-` | a `scope` value in the config |

### 3.10 Symbols

```text
{  }  ->  .  ::  :  ;  [  ]  ?  <  >  ,
```

The lexer uses *maximal munch*: `::` and `->` are always read as one token, and `[]` can be written with or without a space between the brackets.

---

## 4. Grammar

### 4.1 General form

```text
file         = version { statement } EOF ;
version      = "dim" STRING ";" ;

statement    = head ";"
             | head block ;
block        = "{" { statement } "}" ;

element      = KIND IDENT STRING ;
relation     = IDENT ":" path "->" path [ STRING ] ;
property     = PROPERTY { value } ;
member       = MEMBER { value } [ ":" type ] [ STRING ] ;

path         = "::" IDENT { "." IDENT }
             | "this" { "." IDENT }
             | IDENT { "." IDENT } ;
type         = base { "[" "]" | "?" } ;
base         = PRIMITIVE | path | "map" "<" type "," type ">" ;
value        = IDENT | path | type | STRING | INT | DURATION ;
```

`head` is the part of a statement before `;` or a block: an element head, a relation head, a property, a member, or a composition statement. Each statement's full form is in the chapter that covers it.

Rules for `;`:

1. Every statement **without a block** ends with `;`, including the last statement before `}`. A missing `;` is `E001`.
2. A statement **with a block** ends at `}`, with no `;` after it.
3. An extra `;` (`;;`, `};`) is `E001`.

```dim
container api "API" {
  role service;          // ✅
  tech kotlin            // ❌ E001: missing ;
}
```

### 4.2 Elements

```dim
<kind> <id> "<name>" [{ ... }]
```

- The `id` is used in references (paths). The `name` is prose for people.
- Every element **must** have a name (`E203`).
- An element with required properties (such as `role` on a container) must be written with a block.

### 4.3 Telling statements apart

Every statement can be identified by its first token:

| First token | Statement |
|---|---|
| element kind | element ([§6](/referensi/spesifikasi/model/#6-elements), [§7](/referensi/spesifikasi/level-kode/#7-code-level), [§13](/referensi/spesifikasi/deployment/#13-deployment)) |
| member keyword | member ([§7.4](/referensi/spesifikasi/level-kode/#74-members)) |
| property keyword or protocol line | property |
| composition, flow, or configuration keyword | that statement |
| `IDENT` | relation; the second token must be `:` |

Because every property name is a keyword, no statement is ambiguous.

### 4.4 Relations

```dim
<id>: <path> -> <path> ["<label>"] { op <op>; ... }
```

A relation id and `op` are required. Details are in [§9](/referensi/spesifikasi/relasi/#9-relations).

### 4.5 Properties

```dim
<property> <value> ...;
<property> { ... }
```

A property is a keyword with zero or more values. A property with no values is a *flag* (for example `external`). The `source` and `meta` properties take a block.

- Each property applies only to certain kinds. A property that doesn't apply where it's written is `E204`.
- Each property appears at most once per element, unless stated to be repeatable. A duplicate is `E206`.
- The wrong number or kind of values is `E207`.
- A property at the top level of a file is `E001`.

### 4.6 Version declaration

```dim
dim "0.6";
```

- **Required** as the first statement of every `.dim` file and of `dim.config`, exactly once, at the top level (`E006`).
- The value is `"<MAJOR>.<MINOR>"`. A version the parser doesn't support is `E006`; the message names the supported version.
- All files in a project must declare the same version (`E006`).
