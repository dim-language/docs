---
title: Relasi dan path
description: Menulis relasi antar elemen di level mana pun, jenis interaksi dengan op, dan cara path dirujuk dari dalam blok.
---

Relasi menghubungkan dua elemen, di level mana pun. Fungsi boleh berelasi dengan database, container boleh berelasi dengan fungsi di sistem lain.

```dim
[<id>:] <dari> -> <ke> ["<label>"] [{ <atribut> … }]
```

```dim
customer -> shop.web "Belanja";
shop.web -> shop.api "POST /orders" {
  op call;
  tech "HTTPS/JSON";
  data push "Order";
  data pull "OrderId";
}
```

## Arah panah

Panah selalu ditulis **dari pihak yang memulai interaksi**. `api -> db { op read }` berarti `api` yang membaca dari `db`. Datanya mengalir dari `db` ke `api`, tapi panahnya tetap dari `api`, karena `api` yang bergantung pada `db`. Arah data dicatat terpisah dengan `data push` dan `data pull`. Penjelasan lengkapnya ada di [Interaksi dan aliran data](/konsep/aliran-data/).

## Atribut relasi

| Atribut | Nilai | Arti |
|---|---|---|
| `op` | satu nama | jenis interaksi, lihat di bawah. Default `use` |
| `data` | `[push\|pull]` dan nama data | apa yang mengalir; boleh ditulis berkali-kali |
| `tech` | satu string | protokol, mis. `"HTTPS/JSON"`, `"gRPC"`, `"SQS"` |
| `description` | satu string | keterangan tambahan |
| `tags` | satu string atau lebih | label bebas |

Nilai `op` untuk **interaksi**, yaitu sesuatu yang terjadi saat program berjalan:

| `op` | Arti |
|---|---|
| `use` | interaksi umum |
| `call` | panggilan sinkron: fungsi, HTTP, RPC |
| `read` | mengambil data dari target |
| `write` | mengirim atau menyimpan data ke target |
| `publish` | mengirim pesan async ke queue atau topic |
| `subscribe` | menerima pesan async dari queue atau topic |

Nilai `op` untuk **struktur kode**: `extends`, `implements`, `owns`, dan `refers`. Kedua ujungnya harus elemen `code`, dan relasinya tidak membawa data. Contohnya ada di [Level kode](/konsep/level-kode/#relasi-antar-kode).

## Tempat menulis relasi

Relasi boleh ditulis di top-level file, atau di dalam blok elemen mana pun. Path di dalamnya dibaca **relatif terhadap blok tempat relasi itu ditulis**:

```dim
system shop "Online Shop" {
  container api "API" {
    component orders "Orders" {
      code repo "OrderRepository";
    }
    orders.repo -> db "INSERT orders" { op write }
  }
  container db "Postgres";
}
```

Untuk setiap path, nama pertamanya dicari mulai dari blok tempat relasi ditulis. Kalau tidak ketemu, pencarian naik ke blok di atasnya, terus sampai top-level. Di contoh ini, `orders` ditemukan di `shop.api`, dan `db` ditemukan di `shop`. Setelah nama pertama ketemu, sisa path harus berupa anak langsung, berturut-turut.

Menulis relasi di dalam blok `system` membuat path-nya pendek. Relasi antar sistem lebih enak ditulis di top-level.

**Shadowing.** Kalau nama yang sama ada di dua tingkat, yang lebih dekat yang menang. Di dalam `shop.web`, `checkout` merujuk `shop.web.checkout`, bukan `shop.api.checkout`. Untuk merujuk yang lain, tulis path yang lebih panjang (`api.checkout`), atau path absolut yang diawali `::` (`::shop.api.checkout`), yang selalu dicari dari top-level. Path yang tertutup shadowing mendapat warning `W011`.

## Id relasi

Relasi boleh diberi nama dengan `<id>:` di depannya:

```dim
checkout_post: web.checkout.button -> api.checkout.route "POST /checkout" { op call }
```

Id ini dipakai oleh `step` di [alur](/konsep/alur/), dan oleh `remove` di [model turunan](/konsep/komposisi/). Id relasi unik di seluruh model (`E023`). Relasi tanpa id tetap bisa ditampilkan dan ditelusuri, tapi tidak bisa dirujuk.

## Yang tidak boleh

- **Relasi ke diri sendiri** (`E021`), kecuali rekursi langsung: kedua ujungnya elemen `code` yang sama, dan `op`-nya `call`.
- **Relasi antara elemen dan leluhur atau keturunannya** (`E022`), mis. `shop.api.orders -> shop.api`. Relasi seperti itu selalu hilang saat peta di-zoom out, karena kedua ujungnya naik ke kotak yang sama.
- **Path yang tidak ada** (`E020`). Pesannya menyebut di bagian path mana pencariannya berhenti.

Aturan lengkapnya ada di [spesifikasi §4.4](/referensi/spesifikasi/sintaks/#44-relasi) dan [§7](/referensi/spesifikasi/model/#7-resolusi-path).
