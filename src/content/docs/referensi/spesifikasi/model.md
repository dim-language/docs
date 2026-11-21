---
title: Elemen, atribut, dan path
description: Jenis elemen, aturan nesting, atribut, dan resolusi path.
---

## 5. Model elemen

### 5.1 Jenis elemen dan aturan nesting

| Kind | Boleh berada di dalam | Contoh |
|---|---|---|
| `person` | top-level | user, admin, operator |
| `system` | top-level | sistem yang dikelola satu tim/organisasi |
| `container` | `system` | web app, mobile app, API, database, queue |
| `component` | `container`, `component` | modul, service internal, halaman UI |
| `code` | `component`, `code` | class, fungsi, method, handler |

Konsekuensinya:
- `person` tidak punya anak.
- `component` dan `code` boleh nested tanpa batas kedalaman (misalnya class → method).
- Level di bawah `container` **opsional**. Container tanpa component, atau component tanpa code, itu valid.
- `code` tidak boleh langsung di dalam `container`; harus ada `component` di antaranya.

**Rasional: kenapa `code` harus di dalam `component`?**

1. **Definisi C4.** Di C4, level Code adalah zoom ke dalam *satu component*: code adalah implementasi dari sebuah component. Parent `code` karenanya selalu `component` (atau `code` lain, untuk class → method).
2. **Satu level abstraksi per zoom.** Saat container dibuka, isinya selalu component. Kalau `code` boleh langsung di container, membuka `api` bisa menampilkan `Orders` (modul) bersebelahan dengan `parse_date()` (fungsi lepas), dan relasi dari fungsi itu tampil setara dengan relasi antar-modul. Diagram di level itu jadi tidak konsisten.
3. **Setiap fungsi punya pemilik yang bernama.** Aturan ini memaksa model menjawab "fungsi ini bagian dari modul apa?". Untuk container yang sangat kecil (mis. satu Lambda dengan satu handler), cukup buat satu component; biayanya satu baris.

Di dalam `component`, anak boleh campuran `component` dan `code`. Ini pengecualian yang disengaja: modul yang berisi submodul sekaligus fungsi lepas itu umum di kode nyata, dan di level ini pembaca memang sudah melihat detail implementasi.

### 5.2 Identitas
- `id` harus unik di antara **saudara** (anak dari parent yang sama), apa pun jenisnya.
- Identitas global elemen adalah **path lengkap**: gabungan `id` dari top-level sampai elemen tersebut, dipisah `.`. Contoh: `shop.api.orders.repo.find`.
- `id` yang sama boleh muncul di parent berbeda (`shop.web.checkout` dan `shop.api.checkout`).

---

## 6. Atribut yang dikenal

Atribut di luar daftar ini adalah **error**. Ini disengaja supaya typo (`desciption`) langsung ketahuan; atribut bebas bisa ditaruh di `tags`.

### 6.1 Atribut elemen

| Atribut | Nilai | Berlaku untuk | Keterangan |
|---|---|---|---|
| `description` | 1 STRING | semua | deskripsi bebas |
| `tech` | 1 STRING | semua kecuali `person` | teknologi, mis. `"Rust/axum"` |
| `tags` | ≥1 STRING | semua | label bebas untuk filter/styling |
| `shape` | 1 IDENT | semua | petunjuk bentuk, lihat di bawah |
| `external` | flag | semua | elemen di luar kepemilikan kita |
| `ui` | flag | `container`, `component` | elemen yang berinteraksi langsung dengan manusia |
| `source` | 1 STRING | semua kecuali `person` | lokasi implementasi: path atau URL, lihat [§6.5](#65-lokasi-implementasi-source) |
| `auth` | IDENT [STRING ...] | `container`, `component`, `code` | siapa yang boleh memanggil endpoint di bawahnya, lihat [§13.3](/referensi/spesifikasi/endpoint-http/#133-auth-rate-dan-prefix) |
| `rate` | IDENT STRING, boleh berulang | `container`, `component`, `code` | batas laju endpoint di bawahnya, lihat [§13.3](/referensi/spesifikasi/endpoint-http/#133-auth-rate-dan-prefix) |
| `prefix` | 1 STRING | `container`, `component`, `code` | awalan path endpoint di bawahnya, lihat [§13.3](/referensi/spesifikasi/endpoint-http/#133-auth-rate-dan-prefix) |

Nilai `shape` yang dikenal: `box` (default), `person`, `database`, `queue`, `browser`, `mobile`, `folder`, `cylinder`. Nilai lain menghasilkan **warning** dan diperlakukan sebagai `box`.

Setiap atribut paling banyak muncul **satu kali** per elemen, kecuali `param` dan `throws` ([§6.4](#64-detail-kode)), serta `rate`, `query`, `header`, `cookie`, dan `sets` ([§13](/referensi/spesifikasi/endpoint-http/#13-endpoint-http)). Duplikat adalah error.

Elemen `code` punya atribut tambahan untuk detail kode; lihat [§6.4](#64-detail-kode). Endpoint HTTP punya atributnya sendiri; lihat [§13](/referensi/spesifikasi/endpoint-http/#13-endpoint-http).

### 6.2 Atribut relasi

| Atribut | Nilai | Keterangan |
|---|---|---|
| `op` | 1 IDENT | jenis interaksi, lihat di bawah |
| `data` | `[push\|pull]` + ≥0 STRING | aliran data, lihat [§6.3](#63-aliran-data) |
| `tech` | 1 STRING | protokol/teknologi, mis. `"HTTPS/JSON"` |
| `description` | 1 STRING | penjelasan tambahan |
| `tags` | ≥1 STRING | label bebas |

Setiap atribut relasi paling banyak muncul satu kali, **kecuali `data`** yang boleh muncul berkali-kali.

Nilai `op` dibagi dua kategori. **Interaksi** menggambarkan sesuatu yang terjadi saat program berjalan:

| `op` | Arti (dari sisi pemula interaksi) |
|---|---|
| `use` | interaksi umum (default kalau `op` tidak ditulis) |
| `call` | panggilan sinkron (fungsi, HTTP, RPC) |
| `read` | mengambil data dari target |
| `write` | mengirim/menyimpan data ke target |
| `publish` | mengirim pesan async ke target (queue, topic) |
| `subscribe` | menerima pesan async dari target |

**Struktural** menggambarkan bentuk kode, bukan kejadian saat berjalan. Dipakai untuk class diagram:

| `op` | Arti | Arah panah |
|---|---|---|
| `extends` | pewarisan | dari turunan ke induk |
| `implements` | memenuhi kontrak (interface/trait) | dari implementasi ke kontrak |
| `owns` | komposisi: target hidup dan mati bersama pemilik | dari pemilik ke yang dimiliki |
| `refers` | asosiasi: menyimpan referensi tanpa memiliki | dari yang menyimpan ke yang dirujuk |

Aturan relasi struktural:
- Kedua ujungnya harus elemen `code` (`E037`).
- Tidak punya aliran data; `data` dilarang (`E038`).
- Di output, `category` bernilai `"structure"` (interaksi: `"interaction"`).

Nilai `op` lain menghasilkan **warning** dan tetap diteruskan apa adanya ke output sebagai interaksi.

### 6.3 Aliran data

Relasi punya dua aspek yang terpisah:

- **Panah (`->`) = siapa yang memulai interaksi.** Selalu dari pemula ke target.
- **`data` = ke mana data mengalir, dan data apa.** Arahnya dilihat dari sisi pemula:

| Arah | Arti | Relatif ke panah |
|---|---|---|
| `push` | pemula mengirim data ke target | searah |
| `pull` | pemula mengambil data dari target | berlawanan |

Sintaks:

```dim
data [push|pull] ["<payload>" ...];
```

- `payload` adalah nama data yang mengalir, bebas (mis. `"Order"`, `"Order[]"`, `"CheckoutRequest"`).
- Minimal salah satu dari arah atau payload harus ditulis. `data;` saja adalah error.
- `data` boleh ditulis berkali-kali dalam satu relasi, mis. untuk request dan response.

**Arah default dari `op`.** Kalau arah tidak ditulis, arah diambil dari `op`:

| `op` | Arah default |
|---|---|
| `read`, `subscribe` | `pull` |
| `write`, `publish` | `push` |
| `call`, `use`, `op` tak dikenal | tidak ada: arah **wajib** ditulis |
| `extends`, `implements`, `owns`, `refers` | tidak ada aliran data; `data` dilarang |

`call` dan `use` tidak punya default karena datanya bisa dua arah (request dikirim, response diterima).

Contoh:

```dim
repo.find -> db "SELECT orders" { op read; data "Order" }     // pull "Order"
repo.save -> db "INSERT orders" { op write; data "Order" }    // push "Order"

button -> handler "POST /checkout" {
  op call;
  data push "CheckoutRequest";
  data pull "OrderId";
}

worker -> queue "Antrian email" { op publish }                // push, tanpa payload
```

**Kenapa panah tidak dipakai untuk arah data?**

1. `call` mengalirkan data dua arah, sedangkan satu panah hanya punya satu arah.
2. Panah sebagai arah data membalik arah dependency: `api` yang membaca `db` akan digambar `db → api`, padahal `api` yang bergantung pada `db`.
3. Simbol panah tambahan (`=>`, `<-`) memaksa pembaca menghafal arti simbol. `push`/`pull` bisa dibaca langsung.

### 6.4 Detail kode

Elemen `code` bisa menjelaskan bentuknya, parameternya, nilai kembalinya, dan error yang mungkin terjadi. Tujuannya dua: editor bisa menggambar **class diagram** dan **call graph**, dan siapa pun yang membaca model, manusia atau AI, tahu persis tugas dan kontrak setiap unit tanpa membuka source.

```dim
code repo "OrderRepository" {
  form class;
  description "Implementasi OrderStore di atas Postgres.";
  param pool "PgPool" "Koneksi database bersama";

  code pool "pool" { form field; type "PgPool"; visibility private }

  code save "save()" {
    form method;
    description "Menyimpan order baru dalam satu transaksi.";
    param order "&Order";
    returns "Result<()>";
    throws "DbError" "Gagal menulis ke database";
    async;
  }
}
```

| Atribut | Nilai | Berlaku untuk `form` | Keterangan |
|---|---|---|---|
| `form` | 1 IDENT | | bentuk elemen, lihat di bawah |
| `visibility` | `public`, `private`, `protected`, `internal` | semua | |
| `static` | flag | `function`, `method`, `field` | |
| `abstract` | flag | `class`, `method` | |
| `async` | flag | `function`, `method` | |
| `type` | 1 STRING | `field` | tipe field |
| `param` | IDENT STRING [STRING], boleh berulang | `function`, `method`, `class`, `struct`, `endpoint` | nama, tipe, keterangan. Untuk `class`/`struct`: parameter konstruktor. Untuk `endpoint`: parameter path ([§13.2](/referensi/spesifikasi/endpoint-http/#132-atribut-endpoint)) |
| `returns` | STRING [STRING] | `function`, `method`, `endpoint` | tipe nilai kembali dan keterangannya. Untuk `endpoint`: body respons sukses |
| `throws` | STRING [STRING], boleh berulang | `function`, `method`, `endpoint` | error yang bisa terjadi dan kapan. Untuk `endpoint`: INT [STRING], status HTTP ([§13.2](/referensi/spesifikasi/endpoint-http/#132-atribut-endpoint)) |

Nilai `form` yang dikenal: `module`, `class`, `interface`, `struct`, `enum`, `trait`, `function`, `method`, `field`, `endpoint`. Nilai lain menghasilkan warning `W004` dan diteruskan apa adanya. `endpoint` dijelaskan di [§13](/referensi/spesifikasi/endpoint-http/#13-endpoint-http).

Aturan:
- Atribut di tabel ini hanya berlaku untuk elemen `code` (`E031`).
- Urutan atribut bebas. Kecocokan atribut dengan `form` dicek setelah seluruh blok dibaca; atribut yang tidak cocok adalah `E031`. Kalau `form` tidak ditulis atau tidak dikenal, semua atribut di tabel diterima.
- Nama `param` adalah IDENT dan unik dalam satu elemen (`E036`).
- Tipe ditulis sebagai string bebas (`"Option<Order>"`, `"&str"`, `"Promise<void>"`), karena dim tidak terikat ke satu bahasa pemrograman.

**Keterangan wajib.** Elemen dengan `form` `class`, `interface`, `struct`, `enum`, `trait`, `function`, `method`, atau `endpoint` tanpa `description` mendapat warning `W020`. Unit-unit ini dipanggil atau dipakai pihak lain, jadi tugasnya harus tertulis. `field` dan `module` tidak wajib.

**Penempatan anggota.** `method` sebaiknya berada di dalam `code` dengan form `class`, `interface`, `struct`, `enum`, atau `trait`; `field` di dalam salah satu dari itu atau `module`. `endpoint` sebaiknya langsung di dalam `component`, atau di dalam `code` dengan form `module` atau `class` (mis. class controller). Di luar itu warning `W021`.

### 6.5 Lokasi implementasi (`source`)

`source` menunjuk tempat elemen itu diimplementasikan: folder, file, baris di file, atau URL.

```dim
system shop "Online Shop" {
  source "https://github.com/acme/shop";
  container api "API" {
    source "../../services/api";
    component orders "Orders" {
      code repo "OrderRepository" { form class; source "../../services/api/src/orders/repo.rs:42" }
    }
  }
}

system payment "Payment Gateway" {
  external;
  source "https://docs.gateway.example/api";
}
```

- **Opsional.** Elemen tanpa `source` berarti implementasinya belum ada atau belum dicatat, mis. elemen baru di model *to-be* ([§11.3](/referensi/spesifikasi/komposisi-dan-flow/#113-amends-dan-remove)). Tidak ada warning untuk itu, dan `source` tidak diwariskan ke anak.
- **URL** adalah nilai yang diawali skema dan `://` (`https://…`). URL diteruskan apa adanya.
- **Path** selain itu. Path ditulis dengan pemisah `/`, relatif terhadap folder **file `.dim` yang menulisnya**, sama seperti `import` ([§11.1](/referensi/spesifikasi/komposisi-dan-flow/#111-import)), dan `..` boleh dipakai. Path absolut (`/…`, `C:\…`), `\`, dan path kosong adalah `E039`.
- Path boleh diakhiri `:<baris>`, dengan baris bilangan bulat ≥ 1. Selain itu, `:` di path adalah `E039`.
- Parser tidak memeriksa apakah path atau URL itu ada. Pemeriksaan seperti itu urusan alat lain.
- Di output ([§9](/referensi/spesifikasi/output/#9-format-output-json)), path ditulis relatif terhadap folder file utama, sama seperti `span.file`, dengan `.` dan `..` yang bisa diringkas sudah diringkas.

### 6.6 Rujukan tipe

Tipe di dim adalah string bebas ([§6.4](#64-detail-kode)), tapi nama di dalamnya dihubungkan ke elemen `code` yang mendeskripsikan tipe itu. Dengan begitu konsumen (editor, ekspor OpenAPI) tidak perlu menebak sendiri, dan semuanya sampai ke elemen yang sama.

**Elemen tipe** adalah elemen `code` dengan `form` `struct`, `class`, `interface`, `enum`, atau `trait`. Nama elemen tipe adalah `nama`-nya ([§4.2](/referensi/spesifikasi/sintaks/#42-elemen)), bukan id-nya.

**String tipe** adalah nilai di posisi berikut:

| Tempat | Nilai |
|---|---|
| `data` di relasi | setiap payload |
| `type` | tipe field |
| `param`, `query`, `header`, `cookie` | tipe (nilai kedua) |
| `returns`, `body` | tipe (nilai pertama) |
| `throws` | tipe (nilai pertama), kecuali di endpoint, yang berisi status HTTP |

Aturan:
1. Dari setiap string tipe diambil semua **kata**: potongan terpanjang yang cocok dengan `[A-Za-z_][A-Za-z0-9_]*`. Jadi `"Option<Order>"` menjadi `Option` dan `Order`, `"Result<(), DbError>"` menjadi `Result` dan `DbError`, dan `"orders::Order[]"` menjadi `orders` dan `Order`.
2. Setiap kata dibandingkan dengan nama semua elemen tipe di model akhir (setelah [§11.4](/referensi/spesifikasi/komposisi-dan-flow/#114-urutan-penerapan)), persis sama termasuk huruf besar-kecil.
3. Kata yang tidak cocok dengan elemen mana pun diabaikan. Tipe bawaan atau pustaka (`Option`, `Vec`, `string`) tidak perlu dimodelkan.
4. Nama elemen tipe **unik di seluruh model**, termasuk di system yang berbeda. Dua elemen tipe dengan nama yang sama adalah error `E025`, walaupun nama itu tidak pernah dirujuk, supaya rujukan tidak pernah ambigu dan tidak tiba-tiba rusak saat rujukan pertamanya ditulis. Pesannya menyebut semua elemen bernama sama; perbaiki dengan memberi nama yang berbeda (mis. `"PaymentConfig"` dan `"ShopConfig"`). Kontrak yang sama di dua sisi (mis. `CheckoutRequest` di web dan di API) cukup dimodelkan sekali.
5. Elemen tipe yang namanya bukan satu kata (mis. `"Order Entity"`) tidak pernah cocok dengan apa pun, dan tidak ikut dicek keunikannya.

Hasilnya ditulis sebagai `refs` di output ([§9](/referensi/spesifikasi/output/#9-format-output-json)): id elemen tipe yang cocok, urut sesuai kemunculan pertama di string, tanpa duplikat.

---

## 7. Resolusi path

Path di relasi di-resolve relatif terhadap **scope** tempat relasi itu ditulis. Scope adalah elemen yang bloknya berisi relasi tersebut, atau root untuk relasi top-level.

Algoritma untuk path `p1.p2.….pn` di scope `S`:

1. Mulai dari `S`. Cari anak langsung bernama `p1`.
2. Kalau tidak ketemu, naik ke parent `S`, ulangi. Terus sampai root.
3. Scope pertama yang punya anak bernama `p1` menang. Kalau sampai root tidak ketemu: error *unresolved reference*.
4. Dari elemen `p1` itu, `p2 … pn` harus berupa anak langsung berturut-turut. Tidak ada pencarian ulang ke atas di tengah path.

**Path absolut.** Path yang diawali `::` (mis. `::shop.api.checkout`) melewati langkah 1–3: `p1` dicari langsung di antara elemen top-level.

Contoh:

```dim
system shop {
  container api {
    component orders {
      code repo;
    }
    orders.repo -> db { op write }   // orders → shop.api.orders, db → shop.db
  }
  container db;
}
```

**Shadowing.** Nama di scope dalam menutupi nama yang sama di scope luar. Di dalam `shop.web`, `checkout` merujuk ke `shop.web.checkout`, bukan `shop.api.checkout`. Untuk merujuk yang lain, tulis path yang lebih panjang (`api.checkout`) atau path absolut (`::shop.api.checkout`).

### 7.1 `this`

`this` di awal path merujuk elemen yang bloknya sedang ditulis, yaitu scope `S` itu sendiri. Path `this.p1.….pn` melewati langkah 1–3: `p1 … pn` harus berupa anak langsung berturut-turut dari `S`.

```dim
code total "total_price()" {
  form method;
  this -> this "Isi bundel" { op call }        // rekursi
}

component orders "Orders" {
  code repo "OrderRepository" {
    code save "save()";
  }
  this.repo.save -> db "INSERT orders" { op write }
}
```

- Di dalam blok `extend X { … }`, `this` merujuk `X`, karena isi blok itu diperlakukan seperti isi deklarasi aslinya ([§11.2](/referensi/spesifikasi/komposisi-dan-flow/#112-extend)).
- `this` di top-level (termasuk di `remove`, yang hanya ada di top-level), atau di posisi selain awal path, adalah `E024`.
- `this` tidak bisa tertutup shadowing. Kalau `orders` punya anak bernama `orders`, `orders -> db` di dalam bloknya merujuk anak itu, sedangkan `this -> db` tetap merujuk `orders` sendiri.
- Relasi yang ditulis dengan `this` tidak perlu dirapikan saat elemennya dipindah, karena tidak menyebut path elemen itu sama sekali.
- Aturan relasi tetap berlaku pada elemen hasil resolusi. `this -> this` hanya boleh untuk rekursi (`E021`), dan relasi antara `this` dan leluhur atau keturunannya (mis. `this -> this.repo`) adalah `E022`.
- Di output, `this` sudah di-resolve menjadi path lengkap ([§9](/referensi/spesifikasi/output/#9-format-output-json)), sama seperti path lain.
