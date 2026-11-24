---
title: Tipe
description: Ekspresi tipe, tipe primitif, tipe komposit, dan rujukan ke tipe bernama.
---

## 8. Tipe

dim punya sistem tipe sendiri yang kecil. Tipe di dim menjelaskan **bentuk data**, bukan representasinya di satu bahasa pemrograman. Memetakan `decimal` ke `BigDecimal` atau `uuid` ke `string` adalah urusan alat yang membaca model, misalnya generator kode.

Tipe ditulis sebagai **ekspresi**, bukan string, jadi parser bisa memeriksa setiap bagiannya.

```dim
field id: uuid;
field items: orderItem[];
field note: string?;
field prices: map<uuid, decimal>;
param filter: orderFilter?;
returns order[];
data pull orders.order;
```

### 8.1 Grammar

```text
type      = base { "[" "]" | "?" } ;
base      = PRIMITIVE
          | path
          | "map" "<" type "," type ">" ;
```

- `T[]` adalah list berisi `T`.
- `T?` berarti nilainya boleh tidak ada.
- Akhiran dibaca dari kiri ke kanan: `order[]?` adalah list yang boleh tidak ada, sedangkan `order?[]` adalah list yang setiap isinya boleh tidak ada.
- `T??` adalah `E001`.

### 8.2 Tipe primitif

| Tipe | Isi |
|---|---|
| `string` | teks |
| `int` | bilangan bulat |
| `float` | bilangan pecahan biner |
| `decimal` | bilangan pecahan desimal yang presisi, untuk uang |
| `bool` | benar atau salah |
| `bytes` | data biner |
| `date` | tanggal tanpa jam |
| `datetime` | tanggal dan jam dengan zona waktu |
| `duration` | rentang waktu |
| `uuid` | UUID |
| `url` | URL |

### 8.3 `map`

`map<K, V>` adalah pasangan kunci-nilai. Kuncinya harus `string`, `int`, `uuid`, atau `enum` (`E308`).

### 8.4 Tipe bernama

Tipe bernama adalah unit kode `record`, `enum`, `union`, `alias`, `class`, atau `interface` ([§7.2](/referensi/spesifikasi/level-kode/#72-kind-level-kode)). `class` dan `interface` hanya ada di paradigma `oop`, tapi boleh dirujuk sebagai tipe dari mana pun. Tipe bernama dirujuk lewat **path**, yang di-resolve seperti path lain dari scope tempat ekspresi itu ditulis ([§6.9](/referensi/spesifikasi/model/#69-resolusi-path)).

```dim
component orders "Orders" {
  description "Membuat order.";

  record order "Order" {
    description "Order yang sudah dibuat.";
    field id: uuid;
    field status: orderStatus;              // anak component yang sama
  }

  enum orderStatus "OrderStatus" {
    description "Tahap order.";
    variant pending;
    variant paid;
  }

  function findOrder "findOrder()" {
    description "Mencari order.";
    param id: uuid;
    returns order?;
    throws ::shop.api.common.notFound;      // path absolut ke component lain
  }
}
```

- Path yang tidak menunjuk tipe bernama adalah `E306`.
- Nama tipe **tidak** harus unik di seluruh model. Dua component boleh sama-sama punya `record config`, karena rujukannya lewat path.
- Tipe dari component lain, container lain, atau system lain boleh dirujuk. Itulah cara menulis kontrak bersama: tipe didefinisikan sekali di tempat pemiliknya, lalu dirujuk dari mana pun.

### 8.5 `alias`

```dim
alias orderId "OrderId" {
  description "Id order, dibuat saat checkout.";
  type uuid;
}
```

`alias` memberi nama baru untuk sebuah tipe. Alias yang merujuk dirinya sendiri, langsung atau lewat alias lain, adalah `E310`.

### 8.6 Rekursi

Record boleh merujuk dirinya sendiri, langsung atau lewat tipe lain, asalkan rujukannya lewat `[]`, `?`, atau `map`. Rujukan langsung tanpa salah satunya membuat nilai yang tidak pernah selesai, jadi `E309`.

```dim
record category "Category" {
  description "Kategori produk yang bisa bersarang.";
  field name: string;
  field children: category[];   // ✅
  field parent: category?;      // ✅
}
```

### 8.7 Yang sengaja tidak ada

- **Generic buatan pengguna.** List, optional, dan `map` sudah cukup untuk kontrak di level arsitektur.
- **Union tanpa nama**, seperti `a | b`. Setiap pilihan harus dideklarasikan sebagai `union` supaya punya nama dan keterangan.
- **Tipe hasil yang membungkus error**, seperti `Result<T, E>`. Error ditulis lewat `throws`.
- **Referensi dan pointer**, seperti `&T` atau `*T`. Itu urusan representasi di bahasa tertentu.
