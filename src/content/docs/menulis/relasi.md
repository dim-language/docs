---
title: Hubungkan dua elemen
description: Menulis relasi dengan id dan op di level mana pun, aturan ujungnya, dan cara path dirujuk dari dalam blok.
---

Saat Web membuat pesanan lewat API, mulailah dengan mencari path kedua elemen. Beri relasinya id yang menjelaskan interaksinya, lalu pilih `op` yang sesuai.

Relasi menghubungkan dua elemen, di level mana pun. Fungsi boleh berelasi dengan database, container boleh berelasi dengan fungsi di sistem lain.

```dim
<id>: <dari> -> <ke> ["<label>"] { op <op>; … }
```

```dim
shopping: customer -> shop.web "Belanja" { op use; }
saveOrder: shop.api.orders -> shop.db "Simpan order" {
  op write;
  data push shop.api.orders.order;
  tech postgres;
}
```

## Id dan `op` selalu ditulis

- **Id** ditulis camelCase dan unik di seluruh model. Id dipakai oleh `step` di [flow](/konsep/alur/), oleh `remove` di [model turunan](/konsep/komposisi/), dan oleh peta untuk menelusuri asal sebuah panah.
- **`op`** menyatakan jenis interaksinya. Tidak ada `op` default, jadi setiap relasi bisa dibaca tanpa menebak.

| `op` | Arti |
|---|---|
| `use` | interaksi umum, termasuk manusia yang memakai aplikasi |
| `call` | panggilan sinkron: fungsi, HTTP, RPC |
| `read` | mengambil data dari penyimpanan |
| `write` | menyimpan data ke penyimpanan |
| `publish` | mengirim pesan async ke antrian |
| `subscribe` | menerima pesan async dari antrian |

Untuk bentuk kode, ada `inherits`, `implements`, `owns`, dan `refers`. Contohnya ada di [Catat kontrak fungsi](/konsep/level-kode/#relasi-antar-kode).

## Arah panah

Panah selalu ditulis **dari pihak yang memulai interaksi**. `api -> db { op read; }` berarti `api` yang membaca dari `db`. Datanya mengalir dari `db` ke `api`, tapi panahnya tetap dari `api`, karena `api` yang bergantung pada `db`. Arah data dicatat terpisah dengan `data push` dan `data pull`. Penjelasannya ada di [Bedakan pemanggil dari arah data](/konsep/aliran-data/).

## Ujung yang masuk akal

`op` dan peran container saling mengunci, supaya panah selalu berarti sesuatu:

| `op` | Tujuan yang boleh |
|---|---|
| `read`, `write` | container `database`, `storage`, atau `cache`, atau isinya |
| `publish`, `subscribe` | container `queue`, atau endpoint event |
| `call` | apa pun kecuali `person`, penyimpanan, dan antrian |
| `use` | apa pun kecuali penyimpanan dan antrian |

Manusia (`person`) hanya boleh memakai sistem atau aplikasi (`role app`). Ia tidak memanggil API atau database secara langsung.

## Tempat menulis relasi

Relasi boleh ditulis di top-level file, atau di dalam blok elemen mana pun. Path di dalamnya dibaca **relatif terhadap blok tempat relasi itu ditulis**:

```dim
system shop "Online Shop" {
  container api "API" {
    role service;
    component orders "Orders" { description "Menyimpan order."; }
    saveOrder: orders -> db "INSERT orders" { op write; }
  }
  container db "Postgres" { role database; }
}
```

Untuk setiap path, nama pertamanya dicari mulai dari blok tempat relasi ditulis. Kalau tidak ketemu, pencarian naik ke blok di atasnya, terus sampai top-level. Di contoh ini, `orders` ditemukan di `shop.api`, dan `db` ditemukan di `shop`. Setelah nama pertama ketemu, sisa path harus berupa anak langsung, berturut-turut.

**Nama yang sama di dua tingkat.** Kalau nama pertama sebuah path ditemukan di satu tingkat, tapi tingkat yang lebih luar juga punya anak dengan nama itu, pembaca tidak bisa tahu mana yang dimaksud. dim menolaknya dengan error `E209`. Tulis path yang lebih panjang (`api.payments`), `this` untuk elemen yang bloknya sedang ditulis, atau path absolut yang diawali `::` (`::shop.api.payments`).

## Yang tidak boleh

- **Relasi ke diri sendiri** (`E403`), kecuali rekursi langsung: `call` dari `function` atau `method` ke dirinya sendiri.
- **Relasi antara elemen dan leluhur atau keturunannya** (`E404`), misalnya `shop.api.orders -> shop.api`. Relasi seperti itu selalu hilang saat peta di-zoom out.
- **Ujung yang tidak cocok dengan `op`** (`E405`), misalnya `read` ke container `service`.
- **Path yang tidak ada** (`E208`). Pesannya menyebut di bagian path mana pencariannya berhenti.

Aturan lengkapnya ada di [spesifikasi §9](/referensi/spesifikasi/relasi/#9-relasi) dan [§6.9](/referensi/spesifikasi/model/#69-resolusi-path).

## Cek hasilnya

Ganti `op write` di `saveOrder` dengan `op read`, lalu jalankan `dim check`. Pesannya `E406`, karena `data push` tidak cocok dengan `read`. Kembalikan, lalu ubah tujuan relasi ke `shop.web`, yang berperan `app`, dan pastikan pesannya berganti menjadi `E405`: `write` hanya boleh ke penyimpanan.
