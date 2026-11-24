---
title: Petakan sistem yang sudah berjalan
description: Langkah-langkah menulis model dim untuk sistem yang sudah ada, dari gambaran besar sampai detail yang perlu saja.
---

Ambil satu PR yang menyentuh dua layanan. Buka handler yang berubah, cari pemanggilnya, lalu ikuti panggilan pertama yang keluar dari layanan itu. Pakai tiga fakta tersebut untuk memilih bagian sistem yang akan digambar.

Model dim tidak perlu ditulis lengkap sekaligus. Setiap langkah di bawah menghasilkan model yang valid dan sudah berguna, jadi kamu bisa berhenti di langkah mana pun, lalu menambah detail saat dibutuhkan.

## 1. Siapkan config

Buat `dim.config` di folder model, dan deklarasikan teknologi yang sudah kamu tahu. Lihat [Siapkan dim.config](/menulis/konfigurasi/).

```dim
// dim.config
dim "0.6";

tech nextjs "Next.js";
tech rust "Rust";
tech postgres "PostgreSQL";
tech sqs "Amazon SQS";
tech https "HTTPS";
```

## 2. Mulai dari luar

Tulis siapa saja yang memakai sistemmu, dan sistem lain yang kamu ajak bicara. Tandai sistem milik pihak lain dengan `external`.

```dim
// main.dim
dim "0.6";

person customer "Customer" { description "Belanja online."; }
person admin "Admin Toko" { description "Mengelola produk dan harga."; }

system shop "Online Shop" { description "Toko online untuk pembeli di Indonesia."; }

system payment "Payment Gateway" {
  description "Gateway pihak ketiga untuk kartu dan e-wallet.";
  external;
}

shopping: customer -> shop "Belanja" { op use; }
managing: admin -> shop "Mengelola produk" { op use; }
charging: shop -> payment "Menagih pembayaran" { op call; }
```

Ini setara dengan diagram *system context* di C4, dan biasanya sudah cukup untuk orang di luar tim. Setiap relasi punya id (`shopping:`) dan `op`, supaya nanti bisa dirujuk oleh flow dan oleh model turunan.

## 3. Pecah sistemmu jadi container

Container adalah bagian yang dijalankan atau di-deploy sendiri-sendiri: web app, API, worker, database, antrian. Yang menentukan adalah cara bagian itu berjalan, bukan letak kodenya. Setiap container wajib menyatakan perannya dengan `role`.

```dim
system shop "Online Shop" {
  description "Toko online untuk pembeli di Indonesia.";

  container web "Web App" { role app; tech nextjs; }
  container api "API" { role service; tech rust; }
  container worker "Worker" { role service; tech rust; }
  container db "Postgres" { role database; tech postgres; }
  container queue "Antrian Email" { role queue; tech sqs; }
}
```

Peran menentukan relasi yang masuk akal: `read` dan `write` hanya ke penyimpanan, `publish` dan `subscribe` hanya ke antrian, dan manusia hanya memakai container `app`. Peran juga menentukan tampilan lewat style di `dim.config`.

## 4. Tulis relasi yang kamu tahu

Sekarang ganti relasi di level sistem dengan relasi di level container. Tulis hanya yang kamu yakin.

```dim
shopping: customer -> shop.web "Belanja" { op use; }
managing: admin -> shop.web "Mengelola produk" { op use; }
saveOrder: shop.api -> shop.db "Simpan order" { op write; }
queueEmail: shop.api -> shop.queue "Kirim tugas email" { op publish; }
takeEmail: shop.worker -> shop.queue "Ambil tugas email" { op subscribe; }
charging: shop.api -> payment "Menagih pembayaran" { op call; tech https; }
```

Relasi `customer -> shop` dari langkah 2 dihapus, karena `customer -> shop.web` sudah tampil sebagai `customer → shop` saat `shop` tertutup. **Jangan menyimpan relasi yang sama di dua level.** Relasi di level atas selalu dihitung dari yang lebih detail, jadi menulisnya lagi hanya membuat dua sumber yang bisa berbeda.

Untuk menentukan arah panah, tanyakan siapa yang memulai interaksi. `worker` yang mengambil dari antrian, jadi panahnya `worker -> queue` dengan `op subscribe`, walaupun datanya mengalir dari antrian.

## 5. Turunkan relasi saat detailnya penting

Tidak semua container perlu dibuka. Buka yang sering ditanyakan, yang sedang diubah, atau yang alurnya paling penting. Saat kamu menulis component di dalamnya, **pindahkan** relasinya ke elemen yang paling tepat:

```dim
container api "API" {
  role service;
  tech rust;

  component checkout "Checkout" { description "Menjalankan checkout sampai order tersimpan."; }
  component orders "Orders" { description "Menyimpan dan mencari order."; }
}

saveOrder: shop.api.orders -> shop.db "INSERT orders" { op write; }
charging: shop.api.checkout -> payment "Menagih pembayaran" { op call; tech https; }
```

Peta di level container tetap sama, tapi sekarang setiap panah bisa ditelusuri sampai component yang membuatnya.

Kalau sebuah unit dipanggil banyak pihak, tulis kontraknya di [level kode](/konsep/level-kode/), dengan tipe, parameter, dan error. Untuk API, tulis setiap route sebagai [endpoint](/konsep/endpoint/), supaya relasi dari client cukup ditulis `placeOrder: web.checkout -> api.orders.createOrder { op call; }`, dan label serta datanya diambil dari endpoint.

## 6. Tandai alur yang penting

Untuk journey yang sering dibahas (checkout, pendaftaran, refund), susun id relasinya sebagai [flow](/konsep/alur/). Flow bisa disorot di setiap level zoom, dan boleh bercabang untuk jalur gagal:

```dim
flow checkout "Checkout" {
  description "Dari pembeli menekan bayar sampai order tersimpan.";
  step shopping;
  step charging "Tagih dulu";
  alt {
    case paid "Pembayaran berhasil" { step saveOrder; }
    case declined "Pembayaran ditolak" { step showError; }
  }
}
```

## 7. Pecah file dan catat tempat berjalan

- Satu file per sistem atau per tim, digabung dengan `import` dari satu file utama.
- Tim lain bisa menambah keterangan tanpa mengubah file asli, dengan `extend`.
- Rencana perubahan arsitektur ditulis sebagai model turunan dengan `amends`, sehingga *as-is* dan *to-be* bisa dibandingkan.
- Tempat setiap container berjalan ditulis sebagai [environment](/konsep/deployment/).

Contohnya ada di [Komposisi file](/konsep/komposisi/).

## 8. Jaga supaya tetap benar

- Jalankan `dim check` di CI, supaya path yang tidak ada lagi atau properti yang salah ketik langsung ketahuan. Semua pelanggaran adalah error, jadi model yang lolos pemeriksaan memang konsisten.
- Ubah model di pull request yang sama dengan perubahan kodenya.
- Jalankan `dim fmt`, supaya urutan dan tata letak isi setiap file selalu sama.

## Kebiasaan yang membantu

- **Id** ditulis camelCase dan pendek: `orderRepo`, `checkout`, `httpClient`. **Nama** boleh berbentuk apa pun: `"OrderRepository"`, `"save_order()"`.
- **Label relasi** menjelaskan apa yang dilakukan pemula: `"INSERT orders"`, `"Menagih pembayaran"`, bukan `"relasi ke db"`. Untuk relasi ke endpoint, label tidak perlu ditulis.
- **`description`** menjawab *kenapa* elemen itu ada, bukan mengulang namanya.

## Cek hasilnya

Bandingkan panah model dengan satu request nyata dari log atau test. Pembaca harus bisa menelusuri pemanggil, layanan tujuan, dan operasi yang dilakukan dengan mengikuti path di model. Jalankan `dim check main.dim`; model yang benar tidak menghasilkan satu pun pesan.
