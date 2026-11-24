---
title: Endpoint
description: Antarmuka component lewat HTTP, gRPC, GraphQL, dan event, beserta pewarisan prefix, auth, dan rate.
---

## 10. Endpoint

Endpoint adalah **antarmuka** sebuah component: cara pihak lain memanggilnya atau menerima pesannya. Endpoint bukan konsep kode. Satu endpoint bisa diimplementasikan oleh `function` (misalnya di Express) atau `method` (misalnya di Spring), jadi endpoint berdiri sendiri di bawah component dan hanya **menunjuk** ke kode yang menanganinya.

Dengan begitu, kontrak API bisa ditulis sebelum kodenya ada, atau tanpa memodelkan level kode sama sekali.

dim tidak menggantikan OpenAPI, protobuf, atau skema GraphQL. Contoh request dan respons serta aturan validasi per field tetap di sana. dim mencatat kontraknya di level arsitektur: siapa memanggil apa, dengan tipe apa, dan apa yang bisa gagal.

```dim
component orders "Orders" {
  description "Membuat dan membaca order.";
  prefix "/orders";

  endpoint createOrder "Buat order" {
    description "Membuat order dari keranjang.";
    protocol http;
    verb post;
    path "/";
    auth bearer ordersWrite;
    rate user 10 per 1m;
    body cart;
    returns 201 order;
    throws 409 outOfStock "Ada barang yang stoknya habis";
    handler controller.create;
  }
}
```

### 10.1 Properti umum

| Properti | Nilai | Keterangan |
|---|---|---|
| `description` | prosa | wajib |
| `protocol` | `http`, `grpc`, `graphql`, `event` | wajib |
| `handler` | path ke `function` atau `method` | kode yang menangani endpoint ini |
| `auth` | skema + scope | [§10.6](#106-prefix-auth-dan-rate); tidak berlaku untuk `event` |
| `rate` | kunci, jumlah, durasi; boleh berulang | [§10.6](#106-prefix-auth-dan-rate); tidak berlaku untuk `event` |
| `source`, `tags`, `meta` | | [§6.3](/referensi/spesifikasi/model/#63-properti-umum) |

- `protocol` yang tidak ditulis atau tidak dikenal adalah `E501`. Properti yang tidak berlaku untuk protokolnya adalah `E502`.
- `handler` harus menunjuk `function` atau `method` di container yang sama (`E506`). Parser tidak membandingkan parameter handler dengan kontrak endpoint.

### 10.2 HTTP

```dim
endpoint suspendMember "Tangguhkan anggota" {
  description "Menangguhkan anggota sampai diaktifkan lagi.";
  protocol http;
  verb post;
  path "/{memberId}/suspend";
  param memberId: uuid "Id membership";
  header "X-Request-Id": uuid "Mencegah permintaan ganda";
  returns 200 membershipStatus;
  throws 403 forbidden "Mengubah membership sendiri";
  throws 404 notFound "Membership tidak ditemukan";
}
```

| Properti | Nilai | Keterangan |
|---|---|---|
| `verb` | `get`, `post`, `put`, `patch`, `delete`, `head`, `options` | wajib |
| `path` | literal `httpPath` | wajib; relatif terhadap `prefix` ([§10.6](#106-prefix-auth-dan-rate)) |
| `param` | `<id>: <tipe> ["ket"]`, boleh berulang | parameter path |
| `query` | `<id>: <tipe> ["ket"]`, boleh berulang | parameter query |
| `header` | `"<nama>": <tipe> ["ket"]`, boleh berulang | header request; nama berupa literal `headerName` |
| `cookie` | `"<nama>": <tipe> ["ket"]`, boleh berulang | cookie request; nama berupa literal `cookieName` |
| `body` | `<tipe>` | body request |
| `returns` | `<status> [<tipe>] ["ket"]` | wajib; respons sukses, dengan atau tanpa body |
| `throws` | `<status> <tipe> ["ket"]`, boleh berulang | respons error |
| `sets` | `cookie`\|`header` `"<nama>"` `["ket"]`, boleh berulang | cookie atau header yang di-set respons |

Aturan:

- Setiap `{nama}` di path lengkap (termasuk dari `prefix`) harus punya tepat satu `param` dengan id yang sama, dan setiap `param` harus punya placeholder-nya (`E503`).
- Status `returns` harus 200–399. Status `throws` harus 400–599 (`E504`). `throws` dengan status yang sama boleh berulang untuk tipe yang berbeda.
- Id `param` dan `query` unik dalam satu endpoint. Nama `header` unik tanpa membedakan huruf besar-kecil. Nama `cookie` unik. Duplikat adalah `E303`.
- `body` pada `get` atau `head` adalah `E509`.
- Dua endpoint HTTP dalam satu container dengan `verb` dan path lengkap yang sama adalah `E505`.

Respons 401 untuk endpoint yang `auth`-nya bukan `none`, dan 429 untuk endpoint yang punya `rate`, tidak perlu ditulis di `throws`. Konsumen menampilkannya sebagai respons tersirat.

### 10.3 gRPC

```dim
endpoint getOrder "Ambil order" {
  description "Mengambil satu order lewat id-nya.";
  protocol grpc;
  service "OrderService";
  rpc "GetOrder";
  request orderId;
  returns order;
  throws notFound orderMissing;
}
```

| Properti | Nilai | Keterangan |
|---|---|---|
| `service` | literal `externalName` | wajib |
| `rpc` | literal `externalName` | wajib |
| `request` | `<tipe>` | wajib |
| `returns` | `<tipe>` | wajib |
| `stream` | `client`, `server`, `bidi` | untuk RPC streaming |
| `throws` | `<kode> <tipe> ["ket"]`, boleh berulang | kode status gRPC dalam camelCase |

Kode status yang dikenal: `cancelled`, `unknown`, `invalidArgument`, `deadlineExceeded`, `notFound`, `alreadyExists`, `permissionDenied`, `resourceExhausted`, `failedPrecondition`, `aborted`, `outOfRange`, `unimplemented`, `internal`, `unavailable`, `dataLoss`, `unauthenticated`. Dua endpoint gRPC dalam satu container dengan `service` dan `rpc` yang sama adalah `E505`.

### 10.4 GraphQL

```dim
endpoint orderQuery "Query order" {
  description "Mengambil order milik pengguna yang sedang masuk.";
  protocol graphql;
  operation query "order";
  param id: uuid;
  returns order?;
  throws orderMissing;
}
```

| Properti | Nilai | Keterangan |
|---|---|---|
| `operation` | `query`, `mutation`, atau `subscription`, diikuti literal `externalName` | wajib; jenis operasi dan nama field di root type |
| `param` | `<id>: <tipe> ["ket"]`, boleh berulang | argumen field |
| `returns` | `<tipe>` | wajib |
| `throws` | `<tipe> ["ket"]`, boleh berulang | error yang dikembalikan di `errors` |

Dua endpoint GraphQL dalam satu container dengan `operation` yang sama adalah `E505`.

### 10.5 Event

```dim
endpoint orderPlaced "Order dibuat" {
  description "Dikirim setelah order tersimpan.";
  protocol event;
  event "OrderPlaced";
  channel ::shop.events;
  payload order;
}
```

| Properti | Nilai | Keterangan |
|---|---|---|
| `event` | literal `externalName` | wajib; nama event |
| `channel` | path ke container berperan `queue` | wajib (`E507`) |
| `payload` | `<tipe>` | wajib |

Endpoint event berada di component **pemilik** event-nya, biasanya pengirimnya. Pengirim menulis `publish` ke endpoint ini, dan penerima menulis `subscribe` ke endpoint ini. Dua endpoint event dengan `event` dan `channel` yang sama adalah `E505`.

### 10.6 `prefix`, `auth`, dan `rate`

```dim
container api "API" {
  role service;
  prefix "/v1";
  auth bearer;
  rate ip 100 per 1m;

  component auth "Auth" {
    description "Login dan refresh token.";
    prefix "/auth";

    endpoint login "Masuk" {
      description "Masuk dengan email dan password.";
      protocol http;
      verb post;
      path "/login";
      auth none;
      rate ip 5 per 1m;
      body credentials;
      returns 200 session;
      throws 401 invalidCredentials;
    }
  }
}
```

| Properti | Nilai | Berlaku untuk |
|---|---|---|
| `prefix` | literal `httpPath` | `container`, `component` |
| `auth` | `none`, atau skema diikuti ≥0 rujukan scope | `container`, `component`, `endpoint` |
| `rate` | `<kunci> <INT> per <DURATION>`, boleh berulang | `container`, `component`, `endpoint` |

- Skema `auth`: `none`, `bearer`, `cookie`, `basic`, `apiKey`. `auth none` tidak boleh diikuti scope (`E508`). Scope merujuk deklarasi `scope` di `dim.config` (`E104`).
- Kunci `rate`: `ip`, `user`, `session`, `apiKey`. Kunci yang sama dua kali di satu elemen adalah `E508`.
- **Pewarisan.** Endpoint memakai `auth` dari dirinya sendiri, atau dari leluhur terdekat yang menulisnya. `rate` diwariskan per kunci: untuk setiap kunci, nilai dari elemen terdekat yang menulis kunci itu yang berlaku. `prefix` dari semua leluhur digabung dari luar ke dalam, lalu `path` endpoint ditambahkan di belakangnya.
- `prefix`, `auth`, atau `rate` di elemen yang tidak punya endpoint dengan protokol yang cocok di bawahnya adalah `E510`.

### 10.7 Relasi ke endpoint

```dim
placeOrder: web.checkout -> api.orders.createOrder { op call; }
notifyWarehouse: api.orders -> api.orders.orderPlaced { op publish; }
reserveStock: warehouse.stock -> ::shop.api.orders.orderPlaced { op subscribe; }
```

- `call` ke endpoint `http`, `grpc`, atau `graphql`. `publish` dan `subscribe` ke endpoint `event`. `op` lain ke endpoint adalah `E405`.
- Relasi ke endpoint **tidak menulis `data`** (`E406`). Datanya diambil dari endpoint: `push` dari `body`, `request`, `param`, atau `payload`, dan `pull` dari `returns`.
- Label turunannya dijelaskan di [§9.6](/referensi/spesifikasi/relasi/#96-label).
