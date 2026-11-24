---
title: Siapkan dim.config
description: Mendeklarasikan teknologi, tag, scope, root source, dan tampilan sekali untuk seluruh proyek.
---

Tim kamu memakai Kotlin, Postgres, dan Kafka di beberapa layanan. Daripada menulis `"Postgres 16"` di satu tempat dan `"PostgreSQL"` di tempat lain, deklarasikan setiap teknologi sekali, lalu rujuk id-nya dari model.

Setiap proyek dim punya satu `dim.config` di folder yang sama dengan file utamanya. Semua file proyek memakai config itu.

```dim
// dim.config
dim "0.6";

tech kotlin "Kotlin" { version "2.1"; }
tech postgres "PostgreSQL" { version "16"; }
tech kafka "Apache Kafka";
tech https "HTTPS";

tag pci "Menyimpan data kartu";
tag deprecated "Akan dihapus";

scope ordersWrite "orders:write";

root shopRepo {
  repo "https://github.com/acme/shop";
  branch "main";
}

style role app { icon browser; background blue; }
style role service { icon server; background accent; }
style role database { icon database; background neutral; }
style role queue { icon queue; background purple; }
style tag pci { background warning; }
```

`dim init` membuat file awal seperti ini, lengkap dengan style untuk setiap peran container.

## Teknologi: `tech`

Deklarasikan setiap bahasa, framework, database, layanan cloud, dan protokol yang muncul di model. Model lalu cukup menulis id-nya:

```dim
container db "Orders DB" {
  role database;
  tech postgres;
}

publishOrder: api.orders -> events { op publish; data push api.orders.order; tech kafka; }
```

Salah ketik seperti `tech postgress` langsung menjadi error, dan editor bisa melengkapi id-nya. Kalau dua versi dipakai bersamaan, deklarasikan dua tech: `postgres15` dan `postgres16`.

## Tag: `tag`

Tag mengelompokkan elemen yang tersebar di banyak tempat: semua yang menyentuh data kartu, semua yang akan dihapus, semua milik satu tim. Elemen, relasi, dan flow memakainya dengan `tags pci deprecated;`.

Tag yang belum dideklarasikan tidak bisa dipakai. Itu yang membuat tag tetap rapi: tidak ada `pci`, `PCI`, dan `cardData` untuk hal yang sama.

## Scope auth: `scope`

Endpoint yang meminta izin tertentu merujuk scope yang dideklarasikan di sini. Nilai string-nya adalah bentuk scope seperti yang dikirim di token. Lihat [Dokumentasikan endpoint](/konsep/endpoint/).

## Lokasi source: `root`

`root` mencatat repositori tempat kode berada. Elemen menunjuk lokasinya relatif terhadap root itu:

```dim
system shop "Online Shop" {
  source { root shopRepo; path "."; }

  container api "API" {
    role service;
    source { path "services/api"; }
  }
}
```

Root diwariskan ke anak, tapi path selalu ditulis lengkap dari root, jadi setiap `source` bisa dibaca sendiri.

## Tampilan: `style`

Model tidak mengatur warna atau icon elemennya sendiri. Semua tampilan diatur di `dim.config`, per kind, per peran, atau per tag. Kalau beberapa style cocok, urutannya kind, lalu peran, lalu tag, dan yang terakhir menang.

- **Icon** diambil dari set tertutup berisi 24 icon semantik, misalnya `database`, `queue`, `server`, `payment`. Icon opsional.
- **Background** diambil dari 12 token palet: enam semantik (`neutral`, `accent`, `info`, `success`, `warning`, `danger`) dan enam kategori (`blue`, `green`, `purple`, `orange`, `pink`, `teal`). Warna teks dan border dihitung otomatis supaya tetap terbaca di tema terang dan gelap.

Daftar lengkapnya ada di [spesifikasi §5](/referensi/spesifikasi/konfigurasi/#5-konfigurasi-proyek).

## Cek hasilnya

Ganti satu `tech` di model dengan id yang tidak dideklarasikan, lalu jalankan `dim check main.dim`. Pesannya menunjuk baris itu dengan `E104`. Kembalikan id-nya, lalu tambahkan `tags pci;` ke database dan pastikan background-nya berubah di peta.
