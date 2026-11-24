---
title: Validation
description: The error codes in the dim specification.
---

## 15. Validation

dim v0.6 **has no warnings**. Every violation is an error, and a model with errors produces no output. Every diagnostic includes its source location (file, line, column, range) and, where possible, a suggested fix.

Codes are grouped by chapter: `E0xx` lexical and grammar, `E1xx` configuration, `E2xx` elements and paths, `E3xx` code level and types, `E4xx` relations, `E5xx` endpoints, `E6xx` composition and flows, `E7xx` deployment.

### 15.1 Lexical and grammar

| Code | Condition |
|---|---|
| `E001` | invalid syntax, including a missing or extra `;` |
| `E002` | invalid string: unknown escape, unterminated, a literal line break, empty prose, or an opening `"""` not followed directly by a line break |
| `E003` | a keyword used as an id |
| `E004` | multiline prose indentation inconsistent with the closing `"""` |
| `E005` | an id not written in camelCase ([§3.4](/en/referensi/spesifikasi/sintaks/#34-identifiers)) |
| `E006` | the version declaration is missing, not the first statement, written more than once, unsupported, or different between files |
| `E007` | a typed literal that doesn't match its format ([§3.9](/en/referensi/spesifikasi/sintaks/#39-typed-literals)) |
| `E008` | an invalid number or duration |
| `E009` | `meta` isn't a valid JSON object, a top-level key isn't camelCase, uses a language property name, or has been promoted to a property |

### 15.2 Configuration

| Code | Condition |
|---|---|
| `E101` | no `dim.config` in the main file's folder |
| `E102` | a non-configuration statement in `dim.config`, or a configuration statement in a `.dim` file |
| `E103` | a duplicate declaration id within one kind, or a duplicate `scope` value |
| `E104` | a reference to an undeclared tech, tag, scope, or root |
| `E105` | a style without properties, a duplicate selector, or an unknown kind, role, icon, or token |
| `E106` | a `root` without `repo` or `branch` |
| `E107` | a project file outside the `dim.config` folder |

### 15.3 Elements and paths

| Code | Condition |
|---|---|
| `E201` | nesting that breaks [§6.1](/en/referensi/spesifikasi/model/#61-element-kinds-and-nesting) or [§7.2](/en/referensi/spesifikasi/level-kode/#72-code-level-kinds), including code units other than data types in external elements |
| `E202` | a duplicate id among siblings, including the same top-level element in two files; the message suggests `extend` |
| `E203` | a missing element name |
| `E204` | a property that doesn't apply to this kind |
| `E205` | a missing required property |
| `E206` | a property written more than once when it can't repeat |
| `E207` | the wrong number or kind of property values, including an unknown enum value |
| `E208` | a path that can't be resolved, or that points to an element removed with `remove` |
| `E209` | the first segment of a path found in more than one scope ([§6.9](/en/referensi/spesifikasi/model/#69-path-resolution)) |
| `E210` | `this` at the top level, or not at the start of a path |
| `E211` | a `source` without a `root` on itself or any ancestor |
| `E212` | `external` on a container that's already external through its system |
| `E213` | a container with code units other than data types but no `paradigm`, or a component that lists a paradigm its ancestors don't have |

### 15.4 Code level and types

| Code | Condition |
|---|---|
| `E301` | a code-level kind its effective paradigms don't include |
| `E302` | a member that doesn't apply to this kind, an `enum` without variants, or a `union` with fewer than two variants |
| `E303` | a duplicate member id within a code unit or endpoint, including `header` and `cookie` names |
| `E304` | a `function` under the `functional` paradigm without exactly one of `pure` or `effects`, or either one outside `functional` |
| `E305` | `visibility`, `static`, or `abstract` outside the `oop` paradigm, or an `abstract` `method` outside an `abstract` `class` |
| `E306` | a type reference that doesn't point to a `record`, `enum`, `union`, `alias`, `class`, or `interface` |
| `E307` | a code-level `throws` type that isn't a `record`, `enum`, `union`, or `class` |
| `E308` | a `map` key that isn't `string`, `int`, `uuid`, or an `enum` |
| `E309` | a record that refers to itself without `[]`, `?`, or `map` |
| `E310` | an `alias` that refers to itself |

### 15.5 Relations

| Code | Condition |
|---|---|
| `E401` | a relation without an id, or a duplicate relation id |
| `E402` | a relation without an `op` |
| `E403` | a relation to itself other than a recursive `call` from a `function` or `method` |
| `E404` | a relation between an element and its ancestor or descendant |
| `E405` | relation ends that break the `op` rules ([§9.4](/en/referensi/spesifikasi/relasi/#94-relation-end-rules)) |
| `E406` | a `data` direction that doesn't fit the `op`, or `data` on a structural relation or a relation to an endpoint |
| `E407` | a structural relation outside the table in [§7.5](/en/referensi/spesifikasi/level-kode/#75-relations-at-the-code-level) |

### 15.6 Endpoints

| Code | Condition |
|---|---|
| `E501` | an endpoint without a protocol line, or with more than one |
| `E502` | a property or member that doesn't apply to the endpoint's protocol |
| `E503` | a placeholder in a full HTTP path without a `param`, or a `param` without a placeholder |
| `E504` | an HTTP `returns` status outside 200–399, an HTTP `throws` status outside 400–599, or an unknown gRPC status code |
| `E505` | two endpoints in one container with the same contract (HTTP: method and full path; gRPC: service and rpc; GraphQL: operation and field; events: name and queue) |
| `E506` | a `handler` that doesn't point to a `function` or `method` in the same container |
| `E507` | the queue in an `event` line doesn't point to a container with the `queue` role |
| `E508` | `auth none` with scopes, or a duplicate `rate` key on one element |
| `E509` | a `body` on `get` or `head` |
| `E510` | `prefix`, `auth`, or `rate` on an element without a matching endpoint below it |

### 15.7 Composition and flows

| Code | Condition |
|---|---|
| `E601` | a file named in `import` or `amends` can't be read |
| `E602` | a circular import |
| `E603` | `import`, `amends`, `remove`, `flow`, or `environment` inside a block, or `import` before `amends` |
| `E604` | `amends` isn't the second statement, or is written more than once |
| `E605` | `extend` sets a property that's already set, in a file that isn't an `amends` file |
| `E606` | `remove` or `unset` in a file that isn't an `amends` file |
| `E607` | a `remove` target that matches more than one kind (element, relation, flow, environment) |
| `E608` | `unset` not directly inside an `extend` block, removing something that doesn't exist, or removing a required property |
| `E609` | an `extend` target that isn't declared yet |
| `E610` | a `step` that refers to a relation id that doesn't exist |
| `E611` | a duplicate flow id, or a duplicate branch id within one flow |
| `E612` | a flow without steps, an empty branch, an `alt` with fewer than two `case`s, or a `par` with fewer than two `lane`s |
| `E613` | an `opt`, `case`, or `lane` without an id or label |

### 15.8 Deployment

| Code | Condition |
|---|---|
| `E701` | a container neither deployed nor omitted in an environment, both deployed and omitted, or an external container that's deployed or omitted |
| `E702` | a `deploy` that doesn't point to a container |
| `E703` | `replicas` missing or less than 1 |
| `E704` | a relation in an environment whose ends aren't `infra` or `deploy`, that has no `infra` end, or whose `op` isn't `use` or `call` |
| `E705` | a duplicate environment id |
