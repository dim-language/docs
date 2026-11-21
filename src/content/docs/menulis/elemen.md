---
title: Elemen dan atribut
description: Lima jenis elemen dim, aturan nesting-nya, id dan nama, dan atribut yang menjelaskan setiap elemen.
---

Model dim terdiri dari **elemen** yang bersarang, dan **relasi** di antara elemen-elemen itu. Halaman ini membahas elemen. Relasi dibahas di [Relasi dan path](/menulis/relasi/).

```dim
system shop "Online Shop" {
  description "Toko online untuk pembeli di Indonesia.";

  container api "API" {
    tech "Rust/axum";
    tags "tim-checkout";

    component orders "Orders" {
      code repo "OrderRepository";
    }
  }

  container db "Postgres" {
    tech "PostgreSQL";
    shape database;
  }
}
```

## Menulis elemen

```dim
<jenis> <id> ["<nama>"] [{ … }]
```

- **`id`** dipakai untuk merujuk elemen. Huruf ASCII, angka, dan `_`, tidak diawali angka, dan membedakan huruf besar-kecil. Tanda `-` tidak boleh, supaya tidak tertukar dengan `->`.
- **`nama`** adalah label untuk manusia, boleh berisi apa saja. Kalau tidak ditulis, nama sama dengan id.
- **Blok** `{ … }` berisi atribut, elemen anak, dan relasi. Elemen tanpa isi cukup diakhiri `;`.

`id` cukup unik di antara saudaranya. `shop.web.checkout` dan `shop.api.checkout` boleh berdampingan, karena identitas elemen adalah **path lengkapnya**.

## Lima jenis elemen

Jenis elemen mengikuti level [C4 model](https://c4model.com):

| Jenis | Isinya | Boleh berada di dalam |
|---|---|---|
| `person` | orang atau peran: pembeli, admin, operator | top-level |
| `system` | sistem yang dikelola satu tim atau organisasi | top-level |
| `container` | bagian yang dijalankan sendiri: web app, API, database, queue | `system` |
| `component` | modul, service internal, halaman | `container`, `component` |
| `code` | class, fungsi, method, field | `component`, `code` |

- Level di bawah `container` **opsional**. Container tanpa component, atau component tanpa code, itu valid.
- `component` dan `code` boleh bersarang sedalam yang perlu, misalnya class berisi method.
- Di dalam `component`, `component` dan `code` boleh dicampur.
- `code` **tidak boleh** langsung di dalam `container`. Setiap fungsi harus punya modul pemilik yang bernama, supaya membuka sebuah container selalu menampilkan modul, bukan campuran modul dan fungsi lepas. Untuk container yang sangat kecil, cukup buat satu component.

Nesting yang salah adalah error `E010`.

## Atribut

Atribut ditulis `<nama> <nilai …>;` di dalam blok elemen.

| Atribut | Nilai | Berlaku untuk | Arti |
|---|---|---|---|
| `description` | satu string | semua | keterangan bebas |
| `tech` | satu string | semua kecuali `person` | teknologi, mis. `"Rust/axum"` |
| `tags` | satu string atau lebih | semua | label bebas untuk filter dan gaya tampilan |
| `shape` | satu nama | semua | bentuk kotak: `box`, `person`, `database`, `queue`, `browser`, `mobile`, `folder`, `cylinder` |
| `external` | tanpa nilai | semua | di luar kepemilikanmu, mis. payment gateway pihak ketiga |
| `ui` | tanpa nilai | `container`, `component` | dipakai langsung oleh manusia |

- Atribut tanpa nilai (`external`, `ui`) disebut **flag**.
- Setiap atribut paling banyak muncul sekali per elemen (`E033`).
- Atribut yang tidak dikenal adalah error `E030`. Dengan begitu `desciption` langsung ketahuan. Label bebas ditaruh di `tags`.
- `ui` dipakai untuk mengecek model: `person` yang terhubung ke container atau di bawahnya tanpa melewati elemen `ui` mendapat warning `W010`.

Elemen `code` punya atribut tambahan (`form`, `param`, `returns`, `throws`, …), dibahas di [Level kode](/konsep/level-kode/). Endpoint HTTP dibahas di [Endpoint HTTP](/konsep/endpoint/).

## Penulisan

**`;` dan baris baru.** Baris baru tidak bermakna. Statement tanpa blok diakhiri `;`, statement dengan blok berakhir di `}`, dan `;` sebelum `}` boleh dihilangkan. Jadi dua bentuk ini sama:

```dim
container db "Postgres" { tech "PostgreSQL"; shape database }

container db "Postgres" {
  tech "PostgreSQL";
  shape database;
}
```

**Komentar.** `// sampai akhir baris` dan `/* blok */`.

**String.** Ditulis dengan `"…"`, dengan escape `\"`, `\\`, `\n`, dan `\t`. Untuk teks panjang, pakai string multi-baris. Indentasi di depan `"""` penutup dibuang dari setiap baris:

```dim
container api "API" {
  description """
    Backend utama.
    Menangani checkout dan order.
    """;
}
```

Aturan lengkapnya ada di [spesifikasi §3–§6](/referensi/spesifikasi/sintaks/#3-struktur-leksikal).
