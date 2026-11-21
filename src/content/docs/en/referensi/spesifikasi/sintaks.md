---
title: Syntax
description: The lexical structure and grammar of dim.
---

## 3. Lexical structure

### 3.1 Encoding

Encode `.dim` files as UTF-8. Identifiers use ASCII. Strings can contain any Unicode text.

### 3.2 Whitespace

Whitespace (spaces, tabs, `\n`, and `\r\n`) separates tokens. Statements end with `;` or `}` as specified in [§4.1](#41-ebnf). You can split a statement across lines or write several on one line.

### 3.3 Comments

```dim
// komentar sampai akhir baris
/* komentar blok,
   boleh lintas baris, tidak boleh nested */
```

### 3.4 Identifiers

```
IDENT = [A-Za-z_][A-Za-z0-9_]*
```

Identifiers are case-sensitive. They exclude `-`, which is part of the `->` token.

### 3.5 Keywords

These keywords are **reserved**. An element ID cannot use one of these words.

| Keyword | Role |
|---|---|
| `person`, `system`, `container`, `component`, `code` | Element kind |
| `import`, `amends`, `extend`, `remove` | File composition ([§11](/en/referensi/spesifikasi/komposisi-dan-flow/#11-file-composition)) |
| `flow` | Flow declaration ([§12](/en/referensi/spesifikasi/komposisi-dan-flow/#12-flows)) |
| `dim` | Version declaration ([§4.6](#46-version-declaration)) |
| `this` | Path prefix ([§7.1](/en/referensi/spesifikasi/model/#71-this)) |
| `unset` | Attribute removal in an `amends` file ([§11.3](/en/referensi/spesifikasi/komposisi-dan-flow/#113-amends-and-remove)) |

Names like `tech` and `description` are valid element IDs. The parser recognizes attribute names from context ([§4.3](#43-distinguishing-statements)).

### 3.6 Strings

```dim
"teks biasa"
"dengan \"kutip\" dan \\ backslash"
```

The accepted escapes are `\"`, `\\`, `\n`, and `\t`. Any other escape is an error. Ordinary strings cannot contain a literal newline. Use a multiline string for text that spans lines.

### 3.7 Multiline strings

```dim
container api "API" {
  description """
    Backend utama.
    Menangani checkout dan order.
    """;
}
```

The example above has the value `"Backend utama.\nMenangani checkout dan order."`.

1. The opening `"""` must be immediately followed by a newline, which is excluded from the value.
2. Put the closing `"""` on its own line with only spaces or tabs before it. The newline immediately before the closing delimiter is excluded from the value.
3. Strip the exact indentation before the closing `"""` from **every** line of content. Each non-empty line must start with that indent. Otherwise report `E004`.
4. The ordinary string escapes still work. A single double quote in the content needs no escape.

Ordinary and multiline strings are interchangeable wherever the grammar accepts STRING.

### 3.8 Symbols

`{` `}` `->` `.` `::` `:` `;`

The lexer uses *maximal munch*. It reads `::` as a single token. `a:::shop` becomes `a` `::` `:` `shop` and is invalid. Write `a: ::shop` with a space.

### 3.9 Integers

```
INT = [0-9]+
```

Numbers appear only in attribute values such as HTTP status codes ([§13](/en/referensi/spesifikasi/endpoint-http/#13-http-endpoints)). The grammar excludes minus signs, fractions, and thousands separators. A letter or `_` immediately after an integer produces `E001`, as in `60s`. Write such values as strings (`"5/60s"`).

An [identifier](#34-identifiers) cannot start with a digit, so an integer is unambiguous.

---

## 4. Grammar

### 4.1 EBNF

```text
file          = { item } [ simple ] EOF ;
block         = "{" { item } [ simple ] "}" ;

item          = simple ";"
              | compound
              | ";" ;

simple        = element_head
              | relation_head
              | attribute
              | "dim" STRING
              | "import" STRING
              | "amends" STRING
              | "remove" path
              | "unset" IDENT { value } ;
compound      = element_head block
              | relation_head block
              | "extend" path block
              | "flow" IDENT [ STRING ] block ;

element_head  = KIND IDENT [ STRING ] ;
relation_head = [ IDENT ":" ] path "->" path [ STRING ] ;
attribute     = IDENT { value } ;

path          = [ "::" ] IDENT { "." IDENT }
              | "this" { "." IDENT } ;
value         = STRING | IDENT | INT ;

KIND          = "person" | "system" | "container" | "component" | "code" ;
```

The semicolon rules in words:

1. End a statement **without a block** with `;`, for example `tech "Next.js";`, `container gateway "Gateway API";`, or `a -> b "label";`.
2. End a statement **with a block** at its closing `}`.
3. The final statement before `}` or EOF may omit `;`. Both `{ op call }` and `{ op call; tech "HTTPS" }` are valid.
4. The parser ignores extra semicolons, as in `;;` or `};`.

```dim
container api "API" {
  tech "Rust/axum";      // ✅ diakhiri ;
  component orders;      // ✅ elemen tanpa blok
}                        // ✅ tidak perlu ; setelah }

container api "API"
{                        // ✅ baris baru tidak bermakna
  tech "Rust/axum"
  ui                     // ❌ E032: dibaca sebagai tech "Rust/axum" ui (dua nilai)
}
```

### 4.2 Elements

```dim
<kind> <id> ["<nama>"] [{ ... }]
```

- Use the ID to refer to an element in paths. The name is a label for readers.
- If omitted, the name defaults to the ID.
- An element block may contain attributes, children, and relations.

### 4.3 Distinguishing statements

The parser needs at most two tokens of lookahead.

| First token | Second token | Statement |
|---|---|---|
| `KIND` | Any | Element |
| `dim` | Any | Version declaration ([§4.6](#46-version-declaration)) |
| `import`, `amends`, `extend`, `remove`, `unset` | Any | Composition ([§11](/en/referensi/spesifikasi/komposisi-dan-flow/#11-file-composition)) |
| `flow` | Any | Flow ([§12](/en/referensi/spesifikasi/komposisi-dan-flow/#12-flows)) |
| `::`, `this` | Any | Relation |
| `IDENT` | `.`, `->`, or `:` | Relation |
| `IDENT` | Anything else | Attribute |

`tech "Next.js"` is an attribute. `tech -> db` is a relation from the element named `tech`.

### 4.4 Relations

```dim
[<id>:] <path> -> <path> ["<label>"] [{ ... }]
```

A relation block contains only attributes.

The optional `<id>:` gives the relation a stable name for `step` in a [flow](/en/referensi/spesifikasi/komposisi-dan-flow/#12-flows) or [`remove`](/en/referensi/spesifikasi/komposisi-dan-flow/#113-amends-and-remove). [§9](/en/referensi/spesifikasi/output/#9-json-output-format) specifies the ID generated when one is omitted.

```dim
checkout_post: button -> handler "POST /checkout" { op call }
```

**Recursion.** A self-relation must be direct recursion with `op call` and the same `code` element on both ends. Other self-relations raise `E021`. Write indirect recursion (`a → b → a`) as ordinary relations. A consumer can identify the cycle.

```dim
walk -> walk "telusuri anak berikutnya" { op call }
```

**Arrow direction follows the initiator.** In `api -> db { op read }`, the API starts the read and the data travels back from the database to the API. The `data` attribute records that direction ([§6.3](/en/referensi/spesifikasi/model/#63-data-flow)).

### 4.5 Attributes

```dim
<key> [value ...]
```

An attribute consists of a key and zero or more values. An attribute without a value is a *flag*, such as `external`. [§6](/en/referensi/spesifikasi/model/#6-recognized-attributes) lists recognized keys and their types. Attributes at the top level are invalid.

### 4.6 Version declaration

```dim
dim "0.5";
amends "main.dim";
```

`dim "<MAJOR>.<MINOR>";` declares the language version used in the file.

- The declaration is optional. Without it, the parser assumes the newest version it supports.
- When present, it must be the first statement (before `amends`), once per file, at the top level (`E005`).
- Use two integers separated by `.` with no leading zeroes, as in `"0.5"` or `"1.0"`. Invalid format or a newer version than the parser supports produces `E006`. The diagnostic states the supported version.
- The parser applies its own rules to older versions. Minor versions in the 0.x series may introduce breaking changes, so a diagnostic can mention the version written in the file.
- Each file has its own declaration. A file referenced by `import` or `amends` can declare a different version from the file that loads it.
- The JSON `version` field ([§9](/en/referensi/spesifikasi/output/#9-json-output-format)) records the parser's output format version.
