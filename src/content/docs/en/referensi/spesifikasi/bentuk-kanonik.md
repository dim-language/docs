---
title: Canonical form and future versions
description: The canonical form of dim text and plans for subsequent versions.
---

## 14. Canonical form

Every valid `.dim` source has one canonical form. A formatter produces it. A tool that changes `.dim` text, such as an editor applying an edit from the map, must write the edited portion in canonical form. Preserve untouched text to keep diffs small.

A formatter changes only whitespace, newlines, indentation, and semicolons. It preserves all other tokens (IDs, names, strings, numbers, paths, and comments) and statement order. The resulting model is identical except for `span`. Formatting canonical text leaves it identical.

### 14.1 Rules

1. **File.** Use UTF-8 without BOM and `\n` line endings. End with exactly one `\n` and trim trailing whitespace on each line.
2. **Indentation.** Use two spaces per block level. Tabs are disallowed.
3. **One statement per line**, except inside a single-line block (rule 5).
4. **Multiline blocks.** Write `{` on the same line as the statement header with one space before it. Write each child on its own line one level deeper. Put `}` on its own line aligned with the header.
5. **Single-line blocks.** Use `header { a; b }`. Preserve this form only when all of the following hold.
   - The author wrote it on one line, with no line break between `{` and `}`.
   - It contains only attributes, including flow `step` entries. It contains no elements, relations, `extend` or `unset` statements.
   - It contains no comments or multiline strings.
   - The line is at most 100 characters including indentation.

   Write the block over multiple lines if any condition fails. A formatter never collapses a multiline block to one line.
6. **Empty blocks.** Write an element or relation with an empty block as a simple statement, for example `container db "Postgres";`. The grammar requires a block for `extend` and `flow`, so keep `{}` on these statements.
7. **Semicolons.** At top level and in multiline blocks, end every statement without a block with `;`, including the last one before `}`. Omit the semicolon after a block statement. In single-line blocks, put semicolons between entries only. Remove extra semicolons.
8. **Spacing within a line.** Use one space between tokens. Omit spaces around `.`, after a leading `::`, and before `;`. Attach the relation ID's colon directly to its ID (`checkout_post: a -> b`).
9. **Blank lines.** Preserve at most one consecutive blank line. Remove blank lines at the start of a file, immediately after `{`, and immediately before `}`.
10. **Comments.** Preserve their text. Indent a standalone comment to its block level. Keep a trailing `//` comment on its statement's line with one space before it.
11. **Multiline strings.** Keep the opening `"""` at the end of the attribute line. Indent the contents and closing `"""` one level deeper than the attribute. Preserve extra indentation inside the string so its value stays the same ([§3.7](/en/referensi/spesifikasi/sintaks/#37-multiline-strings)).
12. **Line length.** Rule 5 is the only length constraint. Leave other long lines intact.

### 14.2 Example

Before formatting:

```dim
system shop "Online Shop"{
	container api "API" { tech "Rust/axum"; component orders "Orders" {} }


  container db "Postgres" { tech "PostgreSQL" ; shape database ; }
  api->db "SELECT"{op read;data "Order";};
}
```

After formatting:

```dim
system shop "Online Shop" {
  container api "API" {
    tech "Rust/axum";
    component orders "Orders";
  }

  container db "Postgres" { tech "PostgreSQL"; shape database }
  api -> db "SELECT" { op read; data "Order" }
}
```

The `api` block spans several lines because it contains an element. The formatter drops the empty block from `orders`. It preserves the one-line blocks on `db` and the relation because the author used one line and both blocks contain only attributes.

---

## 15. Plans for future versions

This section is **non-normative**.

- **Response envelopes** such as `{ success, statusCode, data }` could wrap every successful response. A possible design is an inherited container attribute, like `auth`.
- **Other protocols** (gRPC, GraphQL, WebSocket) are planned as attributes alongside `http` on `form endpoint`.
- **OpenAPI export** from the CLI could use `code.http` and [type references](/en/referensi/spesifikasi/model/#66-type-references) to `struct` elements.
- **Branching flows** could express alternative, optional, or parallel paths. Today each path is a separate flow.
- **Deployment views** could show where containers run, such as in a region, cluster, or node.

Tools decide styling (colors, icons, and line styles using JSON fields such as `kind`, `tags`, `shape`, `external`, `ui`, and `op`), layout, and box positions. They also decide how to show [model diffs](/en/referensi/spesifikasi/komposisi-dan-flow/#113-amends-and-remove), format diagnostics for other tools, and behave while a model contains errors.
