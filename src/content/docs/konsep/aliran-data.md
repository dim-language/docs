---
title: Interaksi dan aliran data
description: Kenapa arah panah di dim berarti siapa yang memulai, dan bagaimana arah data dicatat terpisah lewat push dan pull.
---

Setiap relasi di dim menjawab dua pertanyaan yang berbeda:

1. **Siapa yang memulai?** Dijawab oleh arah panah `->`.
2. **Data apa yang mengalir, dan ke mana?** Dijawab oleh atribut `data`.

## Panah: siapa yang memulai

Panah selalu ditulis dari pihak yang memulai interaksi ke target interaksi.

```dim
shop.api.orders.repo.find -> shop.db "SELECT orders" { op read }
```

`repo.find` yang bertanya ke database, jadi panahnya dari `repo.find`. Ini sama dengan arah dependency: `repo.find` bergantung pada `db`, bukan sebaliknya.

## `data`: apa yang mengalir

Arah data ditulis relatif terhadap pihak yang memulai:

| Arah | Artinya | Terhadap panah |
|---|---|---|
| `push` | pemula mengirim data ke target | searah |
| `pull` | pemula mengambil data dari target | berlawanan |

```dim
shop.api.orders.repo.find -> shop.db "SELECT orders" { op read; data "Order" }
```

Di sini arahnya tidak ditulis, karena `op read` sudah berarti `pull`.

### Arah default dari `op`

| `op` | Arah default |
|---|---|
| `read`, `subscribe` | `pull` |
| `write`, `publish` | `push` |
| `call`, `use` | tidak ada, arah wajib ditulis |

`call` tidak punya default karena satu panggilan biasanya mengalirkan data dua arah: request dikirim, response diterima. Untuk itu `data` boleh ditulis lebih dari sekali:

```dim
checkout_post: shop.web.checkout.button -> shop.api.checkout.handler "POST /checkout" {
  op call;
  data push "CheckoutRequest";
  data pull "OrderId";
}
```

Kalau arah yang ditulis bertentangan dengan `op` (misalnya `op read; data push`), dim tetap menerimanya tapi memberi warning `W003`.

## Kenapa tidak memakai arah panah untuk data?

- Panggilan `call` mengalirkan data dua arah, sedangkan satu panah hanya punya satu arah.
- Kalau panah mengikuti data, `api` yang membaca `db` akan digambar `db → api`, padahal `api` yang bergantung pada `db`. Saat di-zoom out, arah dependency jadi bercampur dengan arah data.
- Simbol panah tambahan seperti `=>` atau `<-` memaksa pembaca menghafal arti simbol. `push` dan `pull` bisa dibaca langsung.

## Saat di-zoom out

Aliran data ikut naik bersama relasinya. Di [peta zoom](/konsep/peta-zoom/), panah `API → Postgres` membawa `kirim Order · ambil Order` karena di dalamnya ada satu fungsi yang menulis dan satu yang membaca. Aturan lengkapnya ada di [spesifikasi §6.3](/referensi/spesifikasi/model/#63-aliran-data).
