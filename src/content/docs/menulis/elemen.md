---
title: Pilih elemen dan properti
description: Jenis elemen dim, aturan nesting-nya, id dan nama, peran container, dan properti yang menjelaskan setiap elemen.
---

Tim checkout punya satu API dan satu database. Letakkan keduanya di dalam sistem toko supaya pembaca bisa membuka toko dan melihat bagian-bagian yang dipelihara tim.

Model dim terdiri dari **elemen** yang bersarang, dan **relasi** di antara elemen-elemen itu. Halaman ini membahas elemen. Relasi dibahas di [Hubungkan dua elemen](/menulis/relasi/).

```dim
system shop "Online Shop" {
  description "Toko online untuk pembeli di Indonesia.";

  container api "API" {
    role service;
    paradigm oop;
    tech kotlin;
    tags checkoutTeam;

    component orders "Orders" {
      description "Menyimpan dan mencari order.";

      class orderRepo "OrderRepository" {
        description "Menyimpan order ke Postgres.";
      }
    }
  }

  container db "Postgres" { role database; tech postgres; }
}
```

## Menulis elemen

```dim
<kind> <id> "<nama>" [{ … }]
```

- **`id`** dipakai untuk merujuk elemen, dan ditulis camelCase: diawali huruf kecil, tanpa `_` atau `-`, dan singkatan ditulis seperti kata biasa (`httpClient`, bukan `HTTPClient`).
- **`nama`** wajib, dan berupa prosa untuk manusia. Boleh berisi apa saja, termasuk nama asli di kode seperti `"save_order()"`.
- **Blok** `{ … }` berisi properti, elemen anak, dan relasi. Elemen tanpa isi cukup diakhiri `;`, tapi elemen yang punya properti wajib, seperti `role` di container, selalu memakai blok.

`id` cukup unik di antara saudaranya. `shop.web.checkout` dan `shop.api.checkout` boleh berdampingan, karena identitas elemen adalah **path lengkapnya**.

## Jenis elemen

Jenis elemen mengikuti level [C4 model](https://c4model.com):

| Kind | Isinya | Boleh berada di dalam |
|---|---|---|
| `person` | orang atau peran: pembeli, admin, operator | top-level |
| `system` | sistem yang dikelola satu tim atau organisasi | top-level |
| `container` | bagian yang dijalankan sendiri: web app, API, database, antrian | `system` |
| `component` | modul, service internal, halaman | `container`, `component` |
| `endpoint` | route HTTP, RPC gRPC, field GraphQL, event | `component` |
| level kode | `function`, `class`, `record`, dan lainnya | `component` |

- Level di bawah `container` **opsional**. Container tanpa component, atau component tanpa level kode, itu valid.
- Level kode **tidak boleh** langsung di dalam `container`. Setiap fungsi harus punya modul pemilik yang bernama, supaya membuka sebuah container selalu menampilkan modul, bukan campuran modul dan fungsi lepas.
- Kind level kode dan aturannya dibahas di [Catat kontrak fungsi](/konsep/level-kode/). Endpoint dibahas di [Dokumentasikan endpoint](/konsep/endpoint/).

## Peran container

Setiap container wajib punya `role`:

| `role` | Untuk |
|---|---|
| `app` | aplikasi yang dipakai manusia: web, mobile, desktop |
| `service` | proses backend: API, worker, job |
| `database` | penyimpanan data terstruktur |
| `queue` | antrian atau topic pesan |
| `storage` | penyimpanan file atau objek |
| `cache` | cache |

Peran menentukan relasi yang boleh menuju container itu, dan menjadi patokan tampilannya di `dim.config`.

## Properti

| Properti | Nilai | Berlaku untuk |
|---|---|---|
| `description` | prosa; wajib di `component`, `endpoint`, dan unit kode | semua |
| `role` | peran container | `container`, wajib |
| `paradigm` | `procedural`, `functional`, `oop` | `container`, `component`; wajib di container yang berisi kode |
| `tech` | id tech dari `dim.config` | `container`, `component` |
| `tags` | id tag dari `dim.config` | semua |
| `external` | flag | `system`, `container` |
| `source` | `{ root …; path "…"; line …; }` | semua kecuali `person` |
| `meta` | objek JSON | semua |

- Properti tanpa nilai (`external`, `async`) disebut **flag**.
- Setiap properti paling banyak muncul sekali per elemen. Properti yang tidak dikenal, atau yang tidak berlaku untuk kind itu, adalah error. Dengan begitu `desciption` langsung ketahuan.
- Informasi yang belum punya properti ditaruh di `meta` sebagai JSON. Core tidak membaca isinya, jadi `meta` aman untuk mencoba properti baru. Kalau sebuah key terbukti berguna, ia diusulkan menjadi properti sungguhan.

## Penulisan

**`;` selalu wajib.** Setiap statement tanpa blok diakhiri `;`, termasuk yang terakhir sebelum `}`. Baris baru tidak bermakna, jadi dua bentuk ini sama:

```dim
container db "Postgres" { role database; tech postgres; }

container db "Postgres" {
  role database;
  tech postgres;
}
```

`dim fmt` memilih salah satunya secara otomatis dan mengurutkan isi blok, jadi kamu tidak perlu memikirkannya.

**Komentar.** `// sampai akhir baris` dan `/* blok */`.

**Prosa.** Ditulis dengan `"…"`, dengan escape `\"`, `\\`, `\n`, dan `\t`. Untuk `description` yang panjang, pakai prosa multi-baris. Indentasi di depan `"""` penutup dibuang dari setiap baris:

```dim
container api "API" {
  description """
    Backend utama.
    Menangani checkout dan order.
    """;
  role service;
}
```

Aturan lengkapnya ada di [spesifikasi §3–§6](/referensi/spesifikasi/sintaks/#3-struktur-leksikal).

## Cek hasilnya

Simpan contoh pertama sebagai `shop.dim` di samping `dim.config` yang mendeklarasikan `kotlin`, `postgres`, dan tag `checkoutTeam`, lalu jalankan `dim check shop.dim`. Hapus `role database;` dari `db` dan jalankan lagi: pesannya menunjuk container itu dengan `E205`.
