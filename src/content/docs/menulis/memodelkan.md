---
title: Cara memodelkan sistem
description: Langkah-langkah menulis model dim untuk sistem yang sudah ada, dari gambaran besar sampai detail yang perlu saja.
---

Model dim tidak perlu ditulis lengkap sekaligus. Setiap langkah di bawah menghasilkan model yang valid dan sudah berguna, jadi kamu bisa berhenti di langkah mana pun, lalu menambah detail saat dibutuhkan.

## 1. Mulai dari luar

Tulis siapa saja yang memakai sistemmu, dan sistem lain yang kamu ajak bicara. Tandai sistem milik pihak lain dengan `external`.

```dim
person customer "Customer";
person admin "Admin Toko";

system shop "Online Shop";

system payment "Payment Gateway" {
  external;
  description "Gateway pihak ketiga untuk kartu dan e-wallet.";
}

customer -> shop "Belanja";
admin -> shop "Mengelola produk";
shop -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
```

Ini setara dengan diagram *system context* di C4, dan biasanya sudah cukup untuk orang di luar tim.

## 2. Pecah sistemmu jadi container

Container adalah bagian yang dijalankan atau di-deploy sendiri-sendiri: web app, mobile app, API, worker, database, queue. Satu repo bisa berisi beberapa container, dan satu container bisa dipecah ke beberapa repo. Yang menentukan adalah cara bagian itu berjalan, bukan letak kodenya.

```dim
system shop "Online Shop" {
  container web "Web App" { tech "Next.js"; ui }
  container api "API" { tech "Rust/axum" }
  container worker "Worker" { tech "Rust" }
  container db "Postgres" { tech "PostgreSQL"; shape database }
  container queue "Antrian Email" { tech "SQS"; shape queue }
}
```

- Isi `tech` dengan teknologi yang benar-benar dipakai. Pembaca model biasanya mencari ini lebih dulu.
- Tandai bagian yang dipakai langsung oleh manusia dengan `ui`.
- Pakai `shape` untuk database dan queue supaya mudah dikenali di peta.

## 3. Tulis relasi yang kamu tahu

Sekarang ganti relasi di level sistem dengan relasi di level container. Tulis hanya yang kamu yakin.

```dim
customer -> shop.web "Belanja";
admin -> shop.web "Mengelola produk";
shop.web -> shop.api "REST" { op call; tech "HTTPS/JSON"; data push "Request"; data pull "Response" }
shop.api -> shop.db "Simpan dan baca order" { op write; data "Order" }
shop.api -> shop.queue "Kirim tugas email" { op publish; data "EmailJob" }
shop.worker -> shop.queue "Ambil tugas email" { op subscribe; data "EmailJob" }
shop.api -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
```

Relasi `customer -> shop` dari langkah 1 dihapus, karena `customer -> shop.web` sudah tampil sebagai `customer → shop` saat `shop` tertutup. **Jangan menyimpan relasi yang sama di dua level.** Relasi di level atas selalu dihitung dari yang lebih detail, jadi menulisnya lagi hanya membuat dua sumber yang bisa berbeda.

Untuk menentukan arah panah, tanyakan siapa yang memulai interaksi. `worker` yang mengambil dari queue, jadi panahnya `worker -> queue` dengan `op subscribe`, walaupun datanya mengalir dari queue.

## 4. Turunkan relasi saat detailnya penting

Tidak semua container perlu dibuka. Buka yang sering ditanyakan, yang sedang diubah, atau yang alurnya paling penting. Saat kamu menulis component dan code di dalamnya, **pindahkan** relasinya ke elemen yang paling tepat:

```dim
system shop "Online Shop" {
  // web, worker, db, dan queue tetap seperti di langkah 2
  container api "API" {
    tech "Rust/axum";
    component checkout "Checkout" {
      code run "checkout()";
    }
    component orders "Orders" {
      code save "save_order()";
    }
  }
}

shop.api.orders.save -> shop.db "INSERT orders" { op write; data "Order" }
shop.api.checkout.run -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
```

Relasi `shop.api -> shop.db` dan `shop.api -> payment` dari langkah 3 dihapus. Peta di level container tetap sama, tapi sekarang setiap panah bisa ditelusuri sampai fungsi yang membuatnya.

Kalau sebuah unit dipanggil banyak pihak, tulis kontraknya di [level kode](/konsep/level-kode/) (`param`, `returns`, `throws`, `description`). Untuk API HTTP, tulis setiap route sebagai [endpoint](/konsep/endpoint/), supaya relasi dari client cukup ditulis `button -> api.orders.create` dan label serta datanya diambil dari endpoint.

## 5. Tandai alur yang penting

Untuk user journey yang sering dibahas (checkout, pendaftaran, refund), susun relasinya sebagai [alur](/konsep/alur/). Alur bisa disorot di setiap level zoom. Relasi yang dilewati alur perlu id, yang ditulis dengan `<id>:` di depannya:

```dim
belanja: customer -> shop.web "Belanja";
pesan: shop.web -> shop.api "REST" { op call; tech "HTTPS/JSON"; data push "Request"; data pull "Response" }
charge: shop.api.checkout.run -> payment "Menagih pembayaran" { op call; data push "ChargeRequest"; data pull "ChargeResult" }
save_order: shop.api.orders.save -> shop.db "INSERT orders" { op write; data "Order" }

flow checkout "Checkout" {
  step belanja;
  step pesan;
  step charge "Tagih dulu";
  step save_order;
}
```

## 6. Pecah file saat model membesar

- Satu file per sistem atau per tim, digabung dengan `import` dari satu file utama.
- Tim lain bisa menambah keterangan tanpa mengubah file asli, dengan `extend`.
- Rencana perubahan arsitektur ditulis sebagai model turunan dengan `amends`, sehingga *as-is* dan *to-be* bisa dibandingkan.

Contohnya ada di [Komposisi file](/konsep/komposisi/).

## 7. Jaga supaya tetap benar

- Jalankan validasi dari SDK di CI, supaya path yang tidak ada lagi atau atribut yang salah ketik langsung ketahuan. Lihat [SDK TypeScript](/referensi/cli/).
- Ubah model di pull request yang sama dengan perubahan kodenya.
- Saat sebuah fungsi dihapus, relasinya ikut terhapus, dan peta di semua level ikut berubah.

## Kebiasaan yang membantu

- **id** pendek, huruf kecil, dengan `_`: `order_repo`, `checkout`. **Nama** boleh panjang dan berbentuk apa pun: `"OrderRepository"`, `"save_order()"`.
- **Label relasi** menjelaskan apa yang dilakukan pemula: `"INSERT orders"`, `"Menagih pembayaran"`, bukan `"relasi ke db"`.
- **Nama data** ditulis seperti nama tipe di kode (`"Order"`, `"ChargeRequest"`), supaya sama di semua relasi.
- **`description`** menjawab *kenapa* elemen itu ada, bukan mengulang namanya.
