---
title: Komposisi file dan flow
description: Aturan import, extend, amends, remove, dan alur relasi.
---

## 11. Komposisi file

Model besar bisa dipecah ke beberapa file. Semua file tetap membentuk **satu model**: path, lifting, dan id relasi bekerja seolah semuanya ditulis di satu file.

### 11.1 `import`

```dim
// main.dim
import "shop.dim";
import "payment.dim";

person customer "Customer";
checkout_click: customer -> shop.web.checkout.button "Klik bayar";
```

- `import "<path>";` memuat semua elemen, relasi, dan flow top-level dari file itu ke model yang sama.
- Path relatif terhadap **file yang menulis `import`**. `..` boleh dipakai.
- Satu file hanya dimuat sekali, walau di-import dari beberapa file. Import melingkar adalah error `E041`.
- `import` hanya boleh di top-level (`E042`), boleh di posisi mana pun di file.
- Elemen top-level dengan id yang sama di dua file adalah error `E011`, sama seperti dua saudara dengan id sama. Untuk menambah isi elemen yang sudah ada, pakai `extend`.

### 11.2 `extend`

```dim
extend shop.db {
  description "Satu instance primer dengan satu replika baca.";
}

extend shop {
  container replica "Read Replica" { shape database }
  replica -> db "Replikasi" { op subscribe; data "WAL" }
}
```

- `extend <path> { … }` membuka kembali elemen yang sudah dideklarasikan, di file mana pun. Isi bloknya diperlakukan seperti isi deklarasi aslinya: boleh berisi atribut, elemen anak, relasi, dan `extend` lain. Path relasi di dalamnya di-resolve dari scope elemen itu.
- Path target di-resolve seperti path relasi ([§7](/referensi/spesifikasi/model/#7-resolusi-path)), dari scope tempat `extend` ditulis. `extend` boleh di top-level maupun di dalam blok elemen.
- Elemen target harus **sudah dideklarasikan sebelumnya**: di file yang di-import, atau lebih atas di file yang sama. Kalau tidak, error `E020`.
- `extend` hanya boleh **mengisi atribut yang belum ada**. Mengisi ulang atribut yang sudah terisi adalah error `E044`, supaya memecah file tidak diam-diam mengubah isi. Atribut yang boleh berulang (`param`, `throws`) tetap ditambahkan; `param` dengan nama yang sudah ada tetap `E036`.
- Nesting anak divalidasi terhadap elemen target ([§5.1](/referensi/spesifikasi/model/#51-jenis-elemen-dan-aturan-nesting)).

### 11.3 `amends` dan `remove`

Satu file bisa menjadi **turunan** dari model lain lalu mengubahnya. Kasus pakainya: arsitektur *as-is* vs *to-be*, proposal migrasi, atau varian per environment. Idenya dari `amends` di [Pkl](https://pkl-lang.org).

```dim
// to-be.dim
amends "main.dim";

remove shop.reports;               // elemen beserta anak dan relasinya

extend shop.api {
  tech "Rust/axum 0.8";            // menimpa: boleh karena file ini amends
  component audit "Audit Log";
}
```

- `amends "<path>";` harus menjadi statement pertama setelah deklarasi versi opsional, dan hanya sekali (`E043`). File dasar dimuat dulu (beserta semua import-nya), lalu isi file turunan diterapkan di atasnya. File dasar tetap bisa dipakai sendiri.
- Di dalam file `amends`:
  - `extend` boleh **menimpa** atribut. `param` dengan nama yang sudah ada menggantikan yang lama, begitu juga `throws` dengan tipe yang sama.
  - `unset <atribut> [<kunci>];` di dalam blok `extend` menghapus atribut dari elemen itu, termasuk mematikan flag (lihat di bawah).
  - `remove <target>;` menghapus elemen (beserta semua turunannya dan semua relasi yang menyentuhnya), relasi (lewat id eksplisit), atau flow (lewat id-nya).
- `remove` dan `unset` di file biasa adalah error `E045`.

**`unset`.** Kasus pakainya: `main.dim` menandai `payment` sebagai `external`, lalu di model *to-be* payment dibangun sendiri.

```dim
// to-be.dim
amends "main.dim";

extend payment {
  unset external;
  tech "Rust/axum";
}

extend shop.api.orders.repo.save {
  unset throws "DbError";
  unset param order;
}
```

- `unset` hanya boleh langsung di dalam blok `extend` (`E047`). Elemen baru tidak punya atribut lama untuk dihapus.
- Untuk atribut yang paling banyak muncul sekali, `unset <atribut>;` menghapusnya.
- Untuk atribut yang boleh berulang, `unset <atribut>;` menghapus semua entrinya, dan `unset <atribut> <kunci>;` hanya menghapus entri dengan kunci itu. Kuncinya sama dengan yang dipakai untuk mengecek duplikat:

| Atribut | Kunci |
|---|---|
| `param` | nama (IDENT) |
| `query`, `cookie` | nama (STRING) |
| `header` | nama (STRING), tanpa membedakan huruf besar-kecil |
| `rate` | kunci rate (IDENT) |
| `throws` | tipe (STRING), atau status (INT) di endpoint; semua entri dengan tipe/status itu |
| `sets` | jenis dan nama, mis. `unset sets cookie "refreshToken";` |

- Atribut yang tidak dikenal adalah `E030`. Atribut, atau entri dengan kunci itu, yang tidak ada di elemen target adalah `E047`, supaya salah ketik tidak lolos diam-diam.
- `unset` dan pengisian ulang atribut yang sama di satu blok diterapkan berurutan. Untuk mengganti nilai, cukup tulis atributnya lagi tanpa `unset`.
- Model setelah `unset` divalidasi ulang seperti biasa. Menghapus `http` dari endpoint, misalnya, tetap `E060`.
- Target `remove` berupa path. Nama satu segmen tanpa `::` bisa berarti elemen top-level, id relasi, atau id flow; kalau lebih dari satu cocok, error `E046`. Tulis `remove ::nama` untuk elemen.
- Elemen yang dihapus boleh dideklarasikan ulang dengan id yang sama. Relasi yang ditulis sebelum `remove` tetap merujuk elemen lama, jadi ikut hilang.
- Relasi atau `extend` yang ditulis **setelah** `remove` dan merujuk elemen yang dihapus adalah error `E020`.
- `step` yang relasinya hilang karena `remove` dibuang dari flow-nya dengan warning `W030`.
- File `amends` boleh juga memakai `import`. File dasar diterapkan lebih dulu, lalu file yang di-import, lalu isi file turunan.

Karena id elemen (path) dan id relasi ([§9](/referensi/spesifikasi/output/#9-format-output-json)) stabil, konsumen bisa menampilkan **diff** antara model dasar dan turunannya: elemen dan relasi yang ditambah, diubah, dan dihapus. Relasi yang dihapus tetap dihitung saat memberi id default ([§9](/referensi/spesifikasi/output/#9-format-output-json)), jadi id relasi lain di model turunan sama persis dengan di model dasar.

Bedanya dengan Pkl: di Pkl, `amends` tidak boleh menambah properti baru. Di dim, file `amends` boleh menambah elemen, karena arsitektur memang berevolusi.

### 11.4 Urutan penerapan

1. File utama dibaca. File yang ditulisnya di `amends` dan `import` dimuat lebih dulu, rekursif, dengan urutan: `amends`, lalu `import` sesuai urutan tulisan.
2. Statement di setiap file diterapkan berurutan. Urutan ini menentukan:
   - `extend` hanya melihat elemen yang sudah ada,
   - `remove` hanya mengenai apa yang ditulis sebelumnya,
   - urutan `nodes`, `edges`, dan `flows` di output.
3. Relasi dan `step` di-resolve setelah semua file selesai diterapkan, jadi relasi boleh merujuk elemen yang dideklarasikan lebih bawah, seperti di satu file.

---

## 12. Flow

`flow` menandai urutan relasi sebagai satu user journey, supaya konsumen bisa menyorotnya di semua level zoom.

```dim
flow checkout "Checkout" {
  description "Dari pembeli menekan bayar sampai order tersimpan.";
  step checkout_click;
  step checkout_post;
  step charge "Tagih dulu";
  step save_order;
}
```

- `flow <id> ["<nama>"] { … }` hanya boleh di top-level (`E042`). Id flow unik di seluruh model (`E051`) dan punya namespace sendiri, terpisah dari id elemen dan relasi.
- Isi blok: `step`, `description`, dan `tags`. Statement lain adalah `E030`/`E034`.
- `step <id-relasi> ["<keterangan>"]` merujuk relasi lewat **id eksplisit**-nya ([§4.4](/referensi/spesifikasi/sintaks/#44-relasi)), boleh relasi di file lain atau yang ditulis lebih bawah. Id yang tidak ada adalah `E050`. Id default (`a->b#0`) tidak bisa dipakai, karena berubah kalau ujung relasinya berubah.
- Satu relasi boleh muncul di beberapa step atau beberapa flow. Step tidak harus bersambung (ujung step sebelumnya tidak harus sama dengan pangkal step berikutnya), karena journey sering melewati kerja asinkron.
- Flow tanpa step mendapat warning `W031`.

**Semantik zoom (untuk konsumen).** Di setiap level, setiap step di-lift seperti relasinya ([§10.2](/referensi/spesifikasi/semantik-zoom/#102-lifting)):

1. Step yang relasinya menjadi internal disembunyikan.
2. Step **berurutan** yang jatuh ke panah lift yang sama digabung menjadi satu langkah.
3. Langkah yang tersisa dinomori ulang 1..n untuk level itu.

Contoh di Z2 untuk flow di atas: `customer → web` (1), `web → api` (2), lalu `charge` dan `save_order` hilang karena keduanya di dalam `api`.
