---
title: Level kode
description: Paradigma, kind level kode, member, dan relasi struktural.
---

## 7. Level kode

Level kode menjelaskan isi sebuah component: tipe data, fungsi, class, dan kontraknya. Tujuannya dua: editor bisa menggambar diagram class dan call graph dari model yang sama, dan siapa pun yang membaca model, manusia atau AI, tahu tugas dan kontrak setiap unit tanpa membuka source.

dim **tidak terikat ke bahasa pemrograman**, tapi mengikuti **paradigma**. Konsep seperti `class`, `function`, dan `record` ada di banyak bahasa, sedangkan sintaks seperti `&Order` atau `Result<T, E>` hanya ada di satu bahasa. Karena itu level kode memakai kosakata paradigma dan sistem tipe milik dim sendiri ([§8](/referensi/spesifikasi/tipe/#8-tipe)).

```dim
component orders "Orders" {
  description "Membuat dan menyimpan order.";
  paradigm oop;

  record order "Order" {
    description "Order yang sudah dibuat.";
    field id: uuid;
    field total: decimal "Total setelah diskon";
  }

  enum orderStatus "OrderStatus" {
    description "Tahap sebuah order.";
    variant pending;
    variant paid;
    variant shipped "Sudah diserahkan ke kurir";
  }

  interface orderStore "OrderStore" {
    description "Tempat menyimpan order.";
    method save "save()" {
      description "Menyimpan order baru.";
      param value: order;
      throws storageFailure;
    }
  }

  class postgresOrderStore "PostgresOrderStore" {
    description "OrderStore di atas Postgres.";
    method save "save()" {
      description "Menyimpan order dalam satu transaksi.";
      async;
      param value: order;
      throws storageFailure "Gagal menulis ke database";
    }
  }

  record storageFailure "StorageFailure" {
    description "Error saat menulis ke penyimpanan.";
    field reason: string;
  }

  storeContract: postgresOrderStore -> orderStore { op implements; }
}
```

### 7.1 Paradigma

| Paradigma | Kind yang boleh |
|---|---|
| semua | `record`, `enum`, `union`, `alias` |
| `procedural` | `module`, `function` |
| `functional` | `module`, `function` |
| `oop` | `class`, `interface`, `method`, `constructor` |

- Container yang berisi level kode wajib menulis `paradigm`, dan component boleh mempersempitnya ([§6.6](/referensi/spesifikasi/model/#66-paradigma)).
- Kind yang tidak dimiliki paradigma efektifnya adalah `E301`. Tipe data (`record`, `enum`, `union`, `alias`) selalu boleh.
- Paradigma tidak hanya membatasi kind, tapi juga properti: `pure`/`effects` hanya di `functional`, dan `visibility`, `static`, serta `abstract` hanya di `oop` ([§7.3](#73-properti-unit-kode)).

### 7.2 Kind level kode

| Kind | Arti | Boleh berada di dalam |
|---|---|---|
| `module` | kumpulan fungsi dan tipe | `component`, `module` |
| `function` | fungsi yang berdiri sendiri | `component`, `module` |
| `class` | class | `component`, `module` |
| `interface` | kontrak yang dipenuhi class (interface, trait, protocol) | `component`, `module` |
| `method` | fungsi milik class atau interface | `class`, `interface` |
| `constructor` | cara membuat instance class | `class` |
| `record` | data berfield (struct, data class, record) | `component`, `module`, `class` |
| `enum` | pilihan tetap tanpa data | `component`, `module`, `class` |
| `union` | pilihan tetap, setiap varian boleh membawa data | `component`, `module`, `class` |
| `alias` | nama lain untuk sebuah tipe | `component`, `module`, `class` |

- `function`, `method`, `constructor`, `record`, `enum`, `union`, dan `alias` tidak punya anak elemen. Isinya member ([§7.4](#74-member)).
- `module` di dalam component `oop` hanya boleh kalau paradigma efektifnya juga punya `procedural` atau `functional`.
- Penempatan yang melanggar tabel ini adalah `E201`.

Semua kind di tabel ini termasuk **level kode** dalam zoom, dan semuanya disebut **unit kode**.

### 7.3 Properti unit kode

| Properti | Nilai | Berlaku untuk | Keterangan |
|---|---|---|---|
| `description` | prosa | semua | wajib, lihat di bawah |
| `source`, `tags`, `meta` | | semua | [§6.3](/referensi/spesifikasi/model/#63-properti-umum) |
| `async` | flag | `function`, `method` | |
| `pure` | flag | `function` di paradigma `functional` | fungsi tanpa efek samping |
| `effects` | flag | `function` di paradigma `functional` | fungsi dengan efek samping |
| `visibility` | `public`, `private`, `protected`, `internal` | `class`, `interface`, `method`, `constructor` | default `public` |
| `static` | flag | `method` | |
| `abstract` | flag | `class`, `method` | |
| `type` | ekspresi tipe | `alias` | wajib |

Aturan:

- **`description` wajib** di `module`, `function`, `class`, `interface`, `method`, `constructor`, `record`, `enum`, `union`, dan `alias` (`E205`). Unit-unit ini dipakai pihak lain, jadi tugasnya harus tertulis. Di member (`field`, `variant`, `param`), keterangannya opsional.
- `function` yang paradigma efektifnya mencakup `functional` wajib menulis **tepat satu** dari `pure` atau `effects` (`E304`). Di luar `functional`, keduanya tidak boleh (`E304`).
- `visibility`, `static`, dan `abstract` hanya boleh kalau paradigma efektifnya mencakup `oop` (`E305`).
- `method` `abstract` hanya boleh di dalam `class` `abstract` (`E305`).

### 7.4 Member

Member adalah bagian dari satu unit kode. Member tidak punya path dan tidak bisa menjadi ujung relasi.

```dim
field <id>: <tipe> ["<keterangan>"];
variant <id> ["<keterangan>"];
variant <id>: <tipe> ["<keterangan>"];
param <id>: <tipe> ["<keterangan>"];
returns <tipe> ["<keterangan>"];
throws <tipe> ["<keterangan>"];
```

| Member | Berlaku untuk | Keterangan |
|---|---|---|
| `field` | `record`, `class` | boleh berulang, urutan dipertahankan |
| `variant` tanpa tipe | `enum` | boleh berulang, minimal satu |
| `variant` dengan tipe | `union` | boleh berulang, minimal dua; varian tanpa tipe juga boleh |
| `param` | `function`, `method`, `constructor` | boleh berulang, urutan adalah urutan parameter |
| `returns` | `function`, `method` | paling banyak satu; tidak ditulis berarti tidak mengembalikan nilai |
| `throws` | `function`, `method`, `constructor` | boleh berulang; tipenya harus `record`, `enum`, atau `union` (`E307`) |

- Member yang tidak berlaku untuk kind itu adalah `E302`.
- Id member unik di dalam unit kodenya, per jenis member (`E303`). `field` dan `variant` boleh memakai id yang sama dengan elemen lain, karena member tidak ikut resolusi path.
- `enum` tanpa varian, atau `union` dengan kurang dari dua varian, adalah `E302`.

### 7.5 Relasi di level kode

Relasi interaksi (`call`, `use`, dan seterusnya) boleh menghubungkan unit kode dengan elemen di level mana pun ([§9](/referensi/spesifikasi/relasi/#9-relasi)). Rekursi langsung ditulis sebagai `call` dari `function` atau `method` ke dirinya sendiri.

Relasi **struktural** menggambarkan bentuk kode, bukan kejadian saat berjalan:

| `op` | Dari | Ke | Paradigma |
|---|---|---|---|
| `inherits` | `class` | `class` | `oop` |
| `inherits` | `interface` | `interface` | `oop` |
| `implements` | `class` | `interface` | `oop` |
| `owns` | `class`, `record` | `class`, `record`, `enum`, `union`, `alias` | semua |
| `refers` | `class`, `record` | `class`, `record`, `enum`, `union`, `alias` | semua |

`owns` adalah komposisi: target hidup dan mati bersama pemiliknya. `refers` adalah asosiasi: pemilik menyimpan rujukan tanpa memiliki. Pasangan di luar tabel ini, atau paradigma yang tidak cocok di salah satu ujung, adalah `E407`.
