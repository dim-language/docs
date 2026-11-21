---
title: Apa itu dim
description: dim (Diagram In Markup) adalah bahasa teks untuk menulis arsitektur software sebagai satu model yang bisa di-zoom.
---

**dim** adalah singkatan dari *Diagram In Markup*. Ditulis dengan huruf kecil, dan nama lengkapnya **dim language**.

dim adalah bahasa teks untuk menulis arsitektur software. Kamu menulis siapa yang memakai sistemmu, sistem itu terdiri dari apa, dan bagian-bagiannya saling memanggil bagaimana. Hasilnya satu model yang bisa dilihat sebagai peta: tutup semuanya untuk melihat gambaran besar, buka satu kotak untuk melihat isinya, sampai ke fungsi di dalam kode.

```dim
person customer "Customer";

system shop "Online Shop" {
  container web "Web App" { tech "Next.js"; ui }
  container api "API" {
    tech "Rust/axum";
    component orders "Orders" {
      code save "save_order()";
    }
  }
  container db "Postgres" { shape database }
}

customer -> shop.web "Belanja";
shop.web -> shop.api "POST /orders" { op call; data push "Order"; data pull "OrderId" }
shop.api.orders.save -> shop.db "INSERT orders" { op write; data "Order" }
```

## Masalah yang dijawab

Diagram arsitektur biasanya digambar dengan tangan, dan biasanya basi dalam hitungan minggu. Di [C4 model](https://c4model.com), setiap level (context, container, component, code) adalah diagram tersendiri. Kalau satu relasi berubah, setiap diagram yang memuatnya harus diubah juga, dan yang terlupa akan bertentangan dengan yang lain.

dim memakai level yang sama dengan C4, tapi menulis semuanya sebagai **satu model**:

- Elemen ditulis bersarang: `system` berisi `container`, `container` berisi `component`, `component` berisi `code`.
- Relasi ditulis **di level paling detail yang kamu tahu**. Di contoh di atas, `save_order() -> db` ditulis dari fungsi.
- Panah di level yang lebih tinggi **dihitung**, tidak ditulis. Saat peta di-zoom out sampai level container, relasi tadi tampil sebagai `api → db`. Saat di-zoom out sampai level sistem, ia masuk ke dalam kotak `shop`.

Karena level atas selalu dihitung dari detailnya, keduanya tidak bisa saling bertentangan.

| Yang dibuka | Panah yang tampil |
|---|---|
| (tidak ada) | `customer → shop` |
| `shop` | `customer → web`, `web → api`, `api → db` |

## Kenapa teks

- **Bisa di-review.** Perubahan arsitektur masuk pull request seperti kode, lengkap dengan diff baris per baris.
- **Bisa dicek.** `compileProject` menolak path yang salah ketik, atribut yang tidak dikenal, dan relasi yang tidak masuk akal, dan bisa dipasang di CI.
- **Bisa dibaca mesin.** Parser menghasilkan model JSON, jadi editor, situs dokumentasi, dan agent AI membaca model yang sama tanpa membuka source.

## Yang bukan dim

- **Bukan alat gambar.** Warna, posisi kotak, dan gaya garis tidak ditulis di bahasa. Semuanya diatur oleh alat yang menampilkan peta.
- **Bukan bahasa pemrograman.** Model dim tidak dijalankan. Ia mendeskripsikan kode, tapi tidak menggantikannya.
- **Bukan pengganti OpenAPI.** dim mencatat kontrak endpoint (method, path, auth, input, respons) supaya terbaca di peta, tapi skema field dan contoh request tetap di dokumen API.

## Selanjutnya

- [Model pertama](/mulai/): tulis model kecil langkah demi langkah.
- [Cara memodelkan sistem](/menulis/memodelkan/): dari mana mulai saat memodelkan sistem yang sudah ada.
- [Spesifikasi bahasa](/referensi/spesifikasi/): aturan lengkapnya.
