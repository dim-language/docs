---
title: Komposisi file dan flow
description: Aturan import, extend, amends, remove, dan unset, serta flow dengan cabang alt, opt, dan par.
---

## 11. Komposisi file

Model besar bisa dipecah ke beberapa file. Semua file tetap membentuk **satu model**: path, lifting, dan id relasi bekerja seolah semuanya ditulis di satu file. Semua file memakai `dim.config` yang sama ([§5.1](/referensi/spesifikasi/konfigurasi/#51-file-dan-proyek)).

### 11.1 `import`

```dim
// main.dim
dim "0.6";
import "shop.dim";
import "payment.dim";

person customer "Customer" { description "Belanja online."; }
openCheckout: customer -> shop.web.checkout "Klik bayar" { op use; }
```

- `import "<path>";` memuat semua elemen, relasi, flow, dan environment top-level dari file itu ke model yang sama.
- Path relatif terhadap file yang menulis `import`, dan berupa literal `filePath` ([§3.9](/referensi/spesifikasi/sintaks/#39-literal-bertipe)). File di luar folder proyek adalah `E107`.
- Satu file hanya dimuat sekali walau di-import dari beberapa file. File yang tidak bisa dibaca adalah `E601`. Import melingkar adalah `E602`.
- `import` hanya boleh di top-level, setelah deklarasi versi dan `amends` (`E603`).
- Elemen top-level dengan id yang sama di dua file adalah `E202`. Untuk menambah isi elemen yang sudah ada, pakai `extend`.

### 11.2 `extend`

```dim
extend shop.db {
  description "Satu instance primer dengan satu replika baca.";
}

extend shop {
  container replica "Read Replica" { role database; tech postgres; }
  replicate: replica -> db "Replikasi" { op read; data pull walRecord; }
}
```

- `extend <path> { … }` membuka kembali elemen yang sudah dideklarasikan, di file mana pun. Isinya diperlakukan seperti isi deklarasi aslinya: properti, member, elemen anak, relasi, dan `extend` lain.
- Path target di-resolve dari scope tempat `extend` ditulis ([§6.9](/referensi/spesifikasi/model/#69-resolusi-path)). `extend` boleh di top-level maupun di dalam blok elemen.
- Elemen target harus sudah dideklarasikan sebelumnya: di file yang di-import, atau lebih atas di file yang sama (`E609`).
- Di file biasa, `extend` hanya boleh mengisi properti yang belum ada (`E605`), supaya memecah file tidak diam-diam mengubah isi. Member dan properti yang boleh berulang tetap ditambahkan. Member dengan id yang sudah ada adalah `E303`.

### 11.3 `amends`, `remove`, dan `unset`

Satu file bisa menjadi **turunan** dari model lain lalu mengubahnya, misalnya untuk arsitektur *as-is* dan *to-be*, atau proposal migrasi. Idenya dari `amends` di [Pkl](https://pkl-lang.org).

```dim
// to-be.dim
dim "0.6";
amends "main.dim";

remove shop.reports;

extend shop.api {
  tech kotlin spring;
  component audit "Audit Log" { description "Mencatat setiap perubahan order."; }
}

extend payment {
  unset external;
}
```

- `amends "<path>";` harus menjadi statement kedua, tepat setelah deklarasi versi, dan hanya sekali (`E604`). File dasar dimuat dulu beserta semua import-nya, lalu isi file turunan diterapkan di atasnya.
- Di dalam file `amends`:
  - `extend` boleh **menimpa** properti. Member dengan id yang sudah ada menggantikan yang lama.
  - `unset <properti>;` di dalam blok `extend` menghapus properti, termasuk mematikan flag.
  - `unset <member> <id>;` menghapus satu member, misalnya `unset param order;` atau `unset field total;`.
  - `remove <target>;` menghapus elemen beserta semua turunannya, semua relasi yang menyentuhnya, dan semua `deploy` serta `omit` yang merujuknya, relasi lewat id-nya, flow lewat id-nya, cabang flow lewat `<flow>.<cabang>`, atau environment lewat id-nya.
- `remove` dan `unset` di file biasa adalah `E606`.
- `unset` yang tidak langsung di dalam blok `extend`, atau yang menghapus sesuatu yang tidak ada, adalah `E608`. Properti wajib tidak bisa di-`unset`; untuk mengganti nilainya, tulis ulang propertinya.
- Target `remove` satu segmen tanpa `::` bisa berarti elemen top-level, id relasi, id flow, atau id environment. Kalau lebih dari satu cocok, `E607`. Tulis `remove ::nama` untuk elemen.
- Relasi atau `extend` yang ditulis **setelah** `remove` dan merujuk elemen yang dihapus adalah `E208`.
- Step yang relasinya hilang karena `remove` ikut hilang dari flow. Kalau sebuah cabang atau flow menjadi kosong karenanya, `E612`. Hapus cabang atau flow itu juga secara eksplisit.

Karena path elemen dan id relasi stabil, konsumen bisa menampilkan **diff** antara model dasar dan turunannya: elemen dan relasi yang ditambah, diubah, dan dihapus.

### 11.4 Urutan penerapan

1. File utama dibaca. File yang ditulisnya di `amends` dan `import` dimuat lebih dulu, rekursif, dengan urutan `amends`, lalu `import` sesuai urutan tulisan.
2. Statement di setiap file diterapkan berurutan. Urutan ini menentukan apa yang terlihat oleh `extend` dan `remove`, serta urutan elemen, relasi, flow, dan environment di output.
3. Path relasi, tipe, step, dan rujukan lain di-resolve setelah semua file selesai diterapkan, jadi rujukan boleh menunjuk sesuatu yang dideklarasikan lebih bawah.

---

## 12. Flow

`flow` menandai urutan relasi sebagai satu journey, supaya konsumen bisa menyorotnya di semua level zoom. Journey nyata sering bercabang, jadi flow punya tiga jenis cabang.

```dim
flow checkout "Checkout" {
  description "Dari pembeli menekan bayar sampai order tersimpan.";
  step openCheckout;
  step placeOrder;
  opt coupon "Pakai kupon" {
    step validateCoupon;
  }
  alt {
    case paid "Pembayaran berhasil" {
      step saveOrder;
      par {
        lane receipt "Kirim struk" { step sendReceipt; }
        lane audit "Catat audit" { step writeAudit; }
      }
    }
    case declined "Pembayaran ditolak" {
      step showPaymentError "Tampilkan alasan penolakan";
    }
  }
}
```

### 12.1 Sintaks

```dim
flow <id> "<nama>" { ... }
step <id-relasi> ["<keterangan>"];
opt <id> "<label>" { ... }
alt { case <id> "<label>" { ... } ... }
par { lane <id> "<label>" { ... } ... }
```

- `flow` hanya boleh di top-level (`E603`). Id flow unik di seluruh model dan punya namespace sendiri (`E611`).
- Isi blok flow: `description`, `tags`, `meta`, lalu urutan langkah. Urutan langkah berisi `step`, `opt`, `alt`, dan `par`, dan boleh bersarang.
- `step` merujuk relasi lewat id-nya ([§9.1](/referensi/spesifikasi/relasi/#91-sintaks)), boleh relasi di file lain atau yang ditulis lebih bawah. Id yang tidak ada adalah `E610`. Keterangan step opsional.

### 12.2 Cabang

| Blok | Arti | Isi |
|---|---|---|
| `opt` | langkah yang boleh dilewati | ≥1 langkah |
| `alt` | tepat satu dari beberapa jalur | ≥2 `case`, masing-masing ≥1 langkah |
| `par` | jalur yang berjalan bersamaan | ≥2 `lane`, masing-masing ≥1 langkah |

- Setiap `opt`, `case`, dan `lane` wajib punya id dan label (`E613`). Id-nya unik di dalam satu flow (`E611`), sehingga bisa dirujuk sebagai `<flow>.<cabang>`.
- Flow tanpa langkah, cabang kosong, `alt` dengan kurang dari dua `case`, atau `par` dengan kurang dari dua `lane` adalah `E612`.
- Satu relasi boleh muncul di beberapa step atau beberapa flow. Step tidak harus bersambung, karena journey sering melewati kerja asinkron.

### 12.3 Penomoran

Langkah dinomori supaya bisa dirujuk dalam percakapan dan ditampilkan di peta:

- Langkah di jalur utama bernomor `1`, `2`, `3`, ….
- Sebuah blok cabang memakai satu nomor di urutannya. Setiap `case` atau `lane` mendapat huruf sesuai urutan tulisan, dan `opt` mendapat huruf `a`.
- Langkah di dalam cabang bernomor `<nomor blok><huruf>.<urutan>`, dan seterusnya untuk cabang yang bersarang.

Untuk contoh di atas: `openCheckout` 1, `placeOrder` 2, `validateCoupon` 3a.1, `saveOrder` 4a.1, `sendReceipt` 4a.2a.1, `writeAudit` 4a.2b.1, dan `showPaymentError` 4b.1.

### 12.4 Flow di setiap level zoom

Di setiap level zoom, setiap step di-lift seperti relasinya ([§14.2](/referensi/spesifikasi/semantik-zoom/#142-lifting)), dan aturan berikut berlaku **per urutan langkah**, tanpa melintasi batas cabang:

1. Step yang relasinya menjadi internal disembunyikan.
2. Step **berurutan dalam urutan yang sama** yang jatuh ke panah lift yang sama digabung menjadi satu langkah.
3. Cabang yang semua langkahnya tersembunyi menjadi kosong. `alt` atau `par` yang semua cabangnya kosong ikut hilang. `alt` atau `par` yang tinggal satu cabang tidak kosong tetap ditampilkan sebagai cabang, supaya pembaca tahu ada jalur lain di level yang lebih detail.
4. Langkah yang tersisa dinomori ulang dengan aturan [§12.3](#123-penomoran) untuk level itu.
