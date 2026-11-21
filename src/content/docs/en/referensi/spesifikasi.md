---
title: Language specification
description: The normative specification for dim v0.5 covering syntax, models, zoom, file composition, HTTP endpoints, and canonical formatting.
---

**Version 0.5** · File extension `.dim`

The SDK compiler and editor support DIM v0.5. The `compileProject` function produces a v0.5 JSON model. The viewer can also open v0.4 JSON models.

:::note[Changes since 0.4]
- Declare a version with `dim "0.5";` at the start of a file ([§4.6](/en/referensi/spesifikasi/sintaks/#46-version-declaration)).
- Start a path with `this` to refer to the element whose block contains it ([§7.1](/en/referensi/spesifikasi/model/#71-this)).
- Record an implementation location as a path or URL using `source` ([§6.5](/en/referensi/spesifikasi/model/#65-implementation-location-source)).
- Resolve names in type strings such as `data`, `param`, and `returns` to type-form `code` elements. Type element names must be unique across the model ([§6.6](/en/referensi/spesifikasi/model/#66-type-references)).
- Use `unset` in an `amends` file to remove an attribute or turn off a flag ([§11.3](/en/referensi/spesifikasi/komposisi-dan-flow/#113-amends-and-remove)).
- Formatters and editors must produce canonical `.dim` text ([§14](/en/referensi/spesifikasi/bentuk-kanonik/#14-canonical-form)).
- `dim`, `this`, and `unset` become reserved keywords and are invalid as element IDs.
- JSON adds `source` to nodes, `refs` to entries with type strings, and `code.typeRefs` ([§9](/en/referensi/spesifikasi/output/#9-json-output-format)).
:::

### Migrating a v0.4 model

Run `compileProject` on the main file and each independently used derived model. Rename IDs that use keywords such as `dim` or `unset` and update their paths. For `E025`, give distinct types distinct names such as `ShopConfig` and `PaymentConfig`, then update their type strings. If both declarations describe one shared contract, define that type once and use its name in each reference.

Files without a version declaration follow the latest rules. A declaration applies to its own file, so adding `dim "0.5";` to the main file declares its version only.

`dim` describes software architecture as **one zoomable, hierarchical model**. It uses the levels of the [C4 model](https://c4model.com). Systems, containers, components, and code live in the same model. Relations can connect elements at any level. A consumer derives higher-level arrows from detailed relations using [zoom semantics](/en/referensi/spesifikasi/semantik-zoom/#10-zoom-semantics-lifting).

---

## Specification chapters

- [§3 Lexical structure](/en/referensi/spesifikasi/sintaks/#3-lexical-structure)
- [§4 Grammar](/en/referensi/spesifikasi/sintaks/#4-grammar)
- [§5 Element model](/en/referensi/spesifikasi/model/#5-element-model)
- [§6 Recognized attributes](/en/referensi/spesifikasi/model/#6-recognized-attributes)
- [§7 Path resolution](/en/referensi/spesifikasi/model/#7-path-resolution)
- [§8 Validation](/en/referensi/spesifikasi/validasi/#8-validation)
- [§9 JSON output format](/en/referensi/spesifikasi/output/#9-json-output-format)
- [§10 Zoom semantics](/en/referensi/spesifikasi/semantik-zoom/#10-zoom-semantics-lifting)
- [§11 File composition](/en/referensi/spesifikasi/komposisi-dan-flow/#11-file-composition)
- [§12 Flows](/en/referensi/spesifikasi/komposisi-dan-flow/#12-flows)
- [§13 HTTP endpoints](/en/referensi/spesifikasi/endpoint-http/#13-http-endpoints)
- [§14 Canonical form](/en/referensi/spesifikasi/bentuk-kanonik/#14-canonical-form)
- [§15 Plans for future versions](/en/referensi/spesifikasi/bentuk-kanonik/#15-plans-for-future-versions)

---

## 1. Design principles

1. **Write relations at the most detailed level you know.** Start at the function if you know it, or the container if that is what you know. Both are valid.
2. **Derive higher levels from detailed relations.** A `system → system` arrow is generated from the relations below it, so it stays consistent with them.
3. **Keep original relations when zooming out.** A lifted relation retains the list of relations it represents.
4. **Keep the model independent of its presentation.** The parser outputs nodes and edges. The consumer handles zoom, lifting, aggregation, and layout.

---

## 2. Short example

```dim
person customer "Customer" {
  description "Belanja online";
}

system shop "Online Shop" {
  container web "Web App" {
    tech "Next.js";
    ui;
    component checkout "Checkout Page" {
      code button "CheckoutButton.onClick()";
    }
  }

  container api "API" {
    tech "Rust/axum";
    component checkout "Checkout" {
      code handler "handle_checkout()";
    }
    component orders "Orders" {
      code repo "OrderRepository" {
        code find "find_by_id()";
        code save "save()";
      }
    }
  }

  container db "Postgres" {
    tech "PostgreSQL";
    shape database;
  }
}

system payment "Payment Gateway" {
  external;
  container gateway "Gateway API";
}

customer -> shop.web.checkout.button "Klik checkout";
shop.web.checkout.button -> shop.api.checkout.handler "POST /checkout" {
  op call;
  tech "HTTPS/JSON";
  data push "CheckoutRequest";
  data pull "OrderId";
}
shop.api.checkout.handler -> shop.api.orders.repo.save "Simpan order" { op call; data push "Order" }
shop.api.orders.repo.save -> shop.db "INSERT orders" { op write; data "Order" }
shop.api.orders.repo.find -> shop.db "SELECT orders" { op read; data "Order" }
shop.api.checkout.handler -> payment.gateway "Charge" {
  op call;
  tech "HTTPS";
  data push "ChargeRequest";
  data pull "ChargeResult";
}
```
