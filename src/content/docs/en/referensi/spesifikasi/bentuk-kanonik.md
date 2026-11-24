---
title: Canonical form
description: One text form for every dim model, including the order of block contents.
---

## 17. Canonical form

Every valid dim text has **one** canonical form. `dim fmt` produces it, and tools that write dim text (such as an editor that edits through the map) must write the parts they change in this form.

The formatter changes spaces, line breaks, indentation, and **the order of statements within blocks**. It never changes ids, names, prose, values, paths, or comments, so the parsed model is identical except for `spans`. Formatting text that's already canonical changes nothing.

The formatter only works on valid text. Text with errors isn't formatted.

### 17.1 Layout

1. **Files.** UTF-8 without a BOM, `\n` line breaks, ending in exactly one `\n`, with no trailing spaces.
2. **Indentation.** Two spaces per block level, no tabs.
3. **One statement per line**, except in one-line blocks (rule 5).
4. **Multiline blocks.** `{` on the same line as the statement head, separated by one space. Each item on its own line, one level deeper. `}` on its own line, aligned with the statement head.
5. **One-line blocks** are written `head { a; b; }`. This form is used when every condition holds, and a multiline block is used otherwise:
   - the content is only properties, members, or `step`s, with no elements, relations, flow branches, `extend`, or `unset`,
   - at most three statements,
   - no comments or multiline prose inside,
   - the line, including indentation, is at most 100 characters.
6. **Empty blocks** on elements and relations aren't written: `container db "Orders DB";` is only valid if the element has no required properties. `extend`, `flow`, `environment`, and flow branches always use a block.
7. **Spaces within a line.** Tokens are separated by one space, except: no spaces around `.`, after a leading `::`, before `;`, `,`, a member's `:`, and `[]`; no spaces inside `<` `>`; a relation id's `:` sticks to the id; one space after `,`.
8. **Blank lines.** One blank line is required between groups of statements ([§17.2](#172-order-within-blocks)), and around elements, relations, or `extend`s written with a multiline block. Elsewhere, blank lines written by the author are kept, at most one in a row. There are no blank lines at the start of a file, right after `{`, or right before `}`.
9. **Comments.** Their content isn't changed. A comment belongs to the statement below it and moves with it. A trailing comment stays on its line, separated by one space.
10. **Multiline prose.** The opening `"""` ends its property's line. Content lines and the closing `"""` are indented one level deeper than the property.
11. **`meta`.** Its content is written as JSON with two-space indentation, with keys in the order written.
12. **Long lines.** Apart from rule 5, the formatter doesn't break long lines.

### 17.2 Order within blocks

Within every block, statements are grouped and ordered:

1. **Properties**, in a fixed order: `description`, `role`, the endpoint protocol line, `paradigm`, kind-specific properties (in the order of their table in each chapter), `tech`, `tags`, `external`, `source`, `meta`.
2. **Members**, in the order of the tables in [§7.4](/en/referensi/spesifikasi/level-kode/#74-members) and [§10.3](/en/referensi/spesifikasi/endpoint/#103-http). Members of the same kind keep the order written, because the order of `param`s and `field`s is meaningful.
3. **Child elements**, in the order written.
4. **`extend`s**, in the order written.
5. **Relations**, in the order written.

In a relation block: `op`, `data` (in the order written), `tech`, `description`, `tags`, `meta`.

At the top level of a file: the version declaration, `amends`, `import`s (sorted by path), then `person`, `system`, `extend`, relations, `flow`, `environment`, `remove`, each in the order written.

In `dim.config`: the version declaration, `tech`, `tag`, `scope`, `root`, then `style` with selectors ordered `kind`, `role`, `tag`. Declarations of the same kind keep the order written, because the order of `tag`s decides style precedence ([§5.6](/en/referensi/spesifikasi/konfigurasi/#56-style)).

Steps in a flow are never reordered.

### 17.3 Example

Before:

```dim
dim "0.6";
system shop "Online Shop"{
  container db "Orders DB" { tags pci ; role database; tech postgres;}
  saveOrder:api.orders->db { data push api.orders.order; op write; }
  container api "API" {
    tech kotlin;
    component orders "Orders" { description "Stores orders."; }
    role service;
  }
}
```

After:

```dim
dim "0.6";

system shop "Online Shop" {
  container db "Orders DB" { role database; tech postgres; tags pci; }

  container api "API" {
    role service;
    tech kotlin;

    component orders "Orders" { description "Stores orders."; }
  }

  saveOrder: api.orders -> db { op write; data push api.orders.order; }
}
```

The properties of `db` are reordered, `role` in `api` moves above its child element, and the relation moves below the elements.
