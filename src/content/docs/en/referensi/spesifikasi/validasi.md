---
title: Validation
description: Error and warning codes in the dim language specification.
---

## 8. Validation

### 8.1 Errors

An error stops parsing without model output.

| Code | Condition |
|---|---|
| `E001` | Invalid syntax |
| `E002` | Unknown string escape, unterminated string, or an opening `"""` without a following newline |
| `E003` | A reserved keyword used as an ID |
| `E004` | Multiline string indentation inconsistent with its closing `"""` |
| `E005` | A `dim` statement after the first statement, more than once in a file, or inside a block |
| `E006` | A `dim` version outside the `MAJOR.MINOR` format or newer than the parser supports |
| `E010` | Nesting violates [§5.1](/en/referensi/spesifikasi/model/#51-element-kinds-and-nesting) |
| `E011` | Duplicate sibling ID, including matching top-level IDs in different files. The diagnostic suggests `extend`. |
| `E020` | A path fails to resolve or refers to an element deleted by `remove` |
| `E021` | A self-relation (`a -> a`) other than direct recursion on `code` with `op call` |
| `E022` | A relation between an element and its own ancestor or descendant, such as `shop.api.orders -> shop.api` |
| `E023` | Duplicate explicit relation ID. Explicit IDs are unique across the model. |
| `E024` | `this` at the top level or anywhere other than the start of a path |
| `E025` | Two type elements share a name in one model ([§6.6](/en/referensi/spesifikasi/model/#66-type-references)) |
| `E030` | Unknown attribute |
| `E031` | Attribute invalid for the element kind or form |
| `E032` | Invalid attribute value count or type, including requirements on `auth none` |
| `E033` | Duplicate attribute, except repeatable `data` on a relation |
| `E034` | An attribute at the top level, a non-attribute statement in a relation block, or a statement other than `step` or an attribute in a flow block |
| `E035` | Missing `data` direction when `op` supplies no default (`call`, `use`, or an unknown operation) |
| `E036` | Duplicate `param`, `query`, `cookie`, or case-insensitive `header` name in one element, or a duplicate `rate` key |
| `E037` | A structural relation (`extends`, `implements`, `owns`, `refers`) with an endpoint that is outside `code` or has `form endpoint` |
| `E038` | A structural relation with `data` |
| `E039` | An empty or absolute `source` path, a `\` in the path, or a colon other than `:<line>` with line ≥ 1 |
| `E040` | A file referenced by `import` or `amends` cannot be read |
| `E041` | Circular import |
| `E042` | `import`, `amends`, `remove`, or `flow` inside a block |
| `E043` | `amends` more than once or after another statement, except an optional leading `dim` |
| `E044` | `extend` sets an existing attribute outside an `amends` file |
| `E045` | `remove` or `unset` outside an `amends` file |
| `E046` | A `remove` target matches both a top-level element and a relation or flow ID |
| `E047` | `unset` outside the immediate body of `extend`, or the target element has no such attribute or keyed entry |
| `E050` | A `step` refers to a missing relation ID |
| `E051` | Duplicate flow ID |
| `E060` | `form endpoint` without `http` |
| `E061` | Unsupported `http` method |
| `E062` | An `http` or `prefix` path without a leading `/`, with a trailing `/` other than the root path `"/"`, or with a placeholder whose name is invalid as IDENT |
| `E063` | An endpoint `param` without a matching placeholder in the full path, or a placeholder without a `param` |
| `E064` | `status` outside 200–399, endpoint `throws` status outside 400–599, or invalid `rate` format |
| `E065` | Two endpoints in one container share a method and full path |

A relation covered by `E022` would always lift to the same node at both ends, which leaves it hidden at every level.

### 8.2 Warnings

Warnings allow model output.

| Code | Condition |
|---|---|
| `W001` | Unknown `shape` value |
| `W002` | Unknown `op` value |
| `W004` | Unknown `form` value |
| `W003` | Explicit `data` direction conflicts with the default for `op`, as in `op read; data push` |
| `W010` | A `person` connects to a container, component, or code with no `ui` element between that target and its container, inclusive. Relations to people or systems are exempt. |
| `W011` | A path uses an inner name that shadows an outer name. The diagnostic suggests an absolute path to the shadowed element. |
| `W020` | A `class`, `interface`, `struct`, `enum`, `trait`, `function`, `method`, or `endpoint` has no `description` |
| `W021` | A `method`, `field`, or `endpoint` appears outside a supported parent ([§6.4](/en/referensi/spesifikasi/model/#64-code-details)) |
| `W030` | dim drops a `step` because `remove` deleted its relation directly or removed an endpoint |
| `W031` | A `flow` has no `step` |
| `W040` | Unknown `auth` scheme |
| `W041` | Unknown `rate` key |
| `W042` | `body` on a `GET` or `HEAD` endpoint |
| `W043` | `auth`, `rate`, or `prefix` on an element with no endpoints below it or at the element itself |

Each diagnostic includes the source file, line, column, and range.
