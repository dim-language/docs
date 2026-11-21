---
title: Modeling a system
description: Build a dim model of an existing system, starting with context and adding detail where you need it.
---

You can build the model in stages. Each step leaves you with a valid model you can use and extend later.

## 1. Start with the system context

List who uses your system and which other systems it interacts with. Mark systems owned by others as `external`.

```dim
person customer "Customer";
person admin "Admin Toko";

system shop "Online Shop";

system payment "Payment Gateway" {
  external;
  description "Gateway pihak ketiga untuk kartu dan e-wallet.";
}

customer -> shop "Belanja";
admin -> shop "Mengelola produk";
shop -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
```

This corresponds to a C4 system context diagram and is often enough for people outside the team.

## 2. Identify the containers

A container is a part you run or deploy separately, such as a web app, mobile app, API, worker, database, or queue. A repo can contain several containers, and a container can span repos. Group containers by how the software runs.

```dim
system shop "Online Shop" {
  container web "Web App" { tech "Next.js"; ui }
  container api "API" { tech "Rust/axum" }
  container worker "Worker" { tech "Rust" }
  container db "Postgres" { tech "PostgreSQL"; shape database }
  container queue "Antrian Email" { tech "SQS"; shape queue }
}
```

- Use `tech` to record the technology the container actually uses, since readers often look for it first.
- Mark parts people interact with directly as `ui`.
- Set `shape` on databases and queues so they are easy to spot on the map.

## 3. Write the relations you know

Replace the system-level relations with relations between their actual endpoints at the container level. Start with the interactions you can confirm.

```dim
customer -> shop.web "Belanja";
admin -> shop.web "Mengelola produk";
shop.web -> shop.api "REST" { op call; tech "HTTPS/JSON"; data push "Request"; data pull "Response" }
shop.api -> shop.db "Simpan dan baca order" { op write; data "Order" }
shop.api -> shop.queue "Kirim tugas email" { op publish; data "EmailJob" }
shop.worker -> shop.queue "Ambil tugas email" { op subscribe; data "EmailJob" }
shop.api -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
```

Remove `customer -> shop` from step 1. The more detailed `customer -> shop.web` lifts to `customer → shop` when the shop is closed. Write each relation once at the most detailed level you know so higher levels have a single source.

To choose the arrow direction, ask who starts the interaction. A worker initiates its subscription, so write `worker -> queue` with `op subscribe`. The queue sends the data back to the worker.

## 4. Move relations down when detail matters

Open the containers you get questions about, are changing, or need to understand in detail. As you add components and code, **move** each relation to the appropriate endpoint.

```dim
system shop "Online Shop" {
  // web, worker, db, dan queue tetap seperti di langkah 2
  container api "API" {
    tech "Rust/axum";
    component checkout "Checkout" {
      code run "checkout()";
    }
    component orders "Orders" {
      code save "save_order()";
    }
  }
}

shop.api.orders.save -> shop.db "INSERT orders" { op write; data "Order" }
shop.api.checkout.run -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
```

Remove `shop.api -> shop.db` and `shop.api -> payment` from step 3. The same arrows appear at the container level, and now you can trace them down to the functions that create them.

If several callers use a unit, describe its contract at the [code level](/en/konsep/level-kode/) using `param`, `returns`, `throws`, and `description`. For HTTP APIs, describe each route as an [endpoint](/en/konsep/endpoint/). Then the relation `button -> api.orders.create` can get its label and data from the endpoint.

## 5. Mark key flows

Record common user journeys such as checkout, signup, or refunds as [flows](/en/konsep/alur/). You can highlight a flow at every zoom level. Give each relation in the flow an explicit ID with `<id>:`.

```dim
belanja: customer -> shop.web "Belanja";
pesan: shop.web -> shop.api "REST" { op call; tech "HTTPS/JSON"; data push "Request"; data pull "Response" }
charge: shop.api.checkout.run -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
save_order: shop.api.orders.save -> shop.db "INSERT orders" { op write; data "Order" }

flow checkout "Checkout" {
  step belanja;
  step pesan;
  step charge "Tagih dulu";
  step save_order;
}
```

## 6. Split the file as the model grows

- Use one file per system or team and `import` them from a main file.
- Other teams can add detail with `extend` in their own files.
- Describe a proposed architecture with `amends` to compare it with the current one.

See [File composition](/en/konsep/komposisi/) for examples.

## 7. Keep the model accurate

- Validate models with the SDK in CI to catch missing paths and mistyped attributes. See the [SDK reference](/en/referensi/cli/).
- Update the model in the same pull request as the code.
- When you remove a function, remove its relations too. The map updates at every level.

## Naming and descriptions

- Use short lowercase IDs with underscores, such as `order_repo` and `checkout`. Names can be longer and have any format, such as `"OrderRepository"` or `"save_order()"`.
- Label a relation with what the initiator does, such as `"INSERT orders"` or `"Charge payment"`.
- Use code type names for data, such as `"Order"` and `"ChargeRequest"`, so the same data has the same name in each relation.
- Use `description` to explain why the element exists.
