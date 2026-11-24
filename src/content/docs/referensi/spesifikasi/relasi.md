---
title: Relasi
description: Sintaks relasi, jenis op, aturan ujung relasi, aliran data, dan label.
---

## 9. Relasi

```dim
saveOrder: api.orders -> db "Simpan order" {
  op write;
  data push api.orders.order;
  tech postgres;
}
```

### 9.1 Sintaks

```dim
<id>: <dari> -> <ke> ["<label>"] { op <op>; ... }
```

- **Id wajib** (`E401`). Id relasi unik di seluruh model dan punya namespace sendiri, terpisah dari path elemen (`E401`). Id dipakai oleh `step` di flow, oleh `remove`, dan oleh konsumen untuk menelusuri asal panah hasil lifting.
- **`op` wajib** (`E402`).
- Relasi boleh ditulis di top-level atau di dalam blok elemen mana pun. Path ujungnya di-resolve dari scope tempat relasi ditulis ([§6.9](/referensi/spesifikasi/model/#69-resolusi-path)).

**Arah panah adalah siapa yang memulai interaksi**, bukan arah aliran data. `api -> db { op read; }` berarti `api` yang membaca dari `db`. Datanya mengalir dari `db` ke `api`, tapi panahnya tetap `api -> db`. Arah data ditulis lewat `data` ([§9.5](#95-aliran-data)).

### 9.2 Properti relasi

| Properti | Nilai | Keterangan |
|---|---|---|
| `op` | jenis relasi | wajib |
| `data` | `push`\|`pull` + ekspresi tipe | boleh berulang ([§9.5](#95-aliran-data)) |
| `tech` | ≥1 rujukan tech | protokol atau teknologi, mis. `https`, `grpc` |
| `description` | prosa | |
| `tags` | ≥1 rujukan tag | |
| `meta` | objek JSON | [§6.8](/referensi/spesifikasi/model/#68-meta) |

### 9.3 Jenis `op`

**Interaksi** menggambarkan sesuatu yang terjadi saat program berjalan:

| `op` | Arti, dari sisi pemula |
|---|---|
| `use` | interaksi umum, termasuk manusia yang memakai aplikasi |
| `call` | panggilan sinkron: fungsi, HTTP, RPC |
| `read` | mengambil data dari penyimpanan |
| `write` | menyimpan data ke penyimpanan |
| `publish` | mengirim pesan async |
| `subscribe` | menerima pesan async |

**Struktural** menggambarkan bentuk kode: `inherits`, `implements`, `owns`, `refers`. Aturannya ada di [§7.5](/referensi/spesifikasi/level-kode/#75-relasi-di-level-kode).

`op` lain adalah `E207`.

### 9.4 Aturan ujung relasi

Aturan ini hanya ada di tempat yang membuat sebuah `op` tidak bermakna. Tanpanya, `op` hanya menjadi label, dan lifting tidak bisa diandalkan.

"Penyimpanan" berarti container dengan peran `database`, `storage`, atau `cache`, atau elemen di dalamnya.

| `op` | Ujung `dari` | Ujung `ke` |
|---|---|---|
| `use` | apa pun | apa pun kecuali penyimpanan dan antrian |
| `call` | bukan `person` | bukan `person`, penyimpanan, atau antrian; endpoint hanya yang protokolnya `http`, `grpc`, atau `graphql` |
| `read`, `write` | bukan `person` | penyimpanan |
| `publish`, `subscribe` | bukan `person` | container berperan `queue`, atau endpoint `event` ([§10.5](/referensi/spesifikasi/endpoint/#105-event)) |
| struktural | unit kode | unit kode, sesuai tabel [§7.5](/referensi/spesifikasi/level-kode/#75-relasi-di-level-kode) |

Aturan tambahan untuk `person`:

- Kalau `dari` adalah `person`, `ke` harus `system`, container berperan `app`, atau elemen di dalam container `app`. Manusia memakai aplikasi, bukan memanggil API atau database secara langsung.
- `person -> person` tidak boleh.

Aturan umum:

- **Relasi ke diri sendiri** hanya boleh untuk rekursi langsung: `call` dari `function` atau `method` ke dirinya sendiri. Selain itu `E403`.
- **Relasi antara leluhur dan keturunan**, misalnya `shop.api.orders -> shop.api`, adalah `E404`. Relasi seperti itu selalu hilang saat lifting karena kedua ujungnya naik ke elemen yang sama.

Pelanggaran tabel ini adalah `E405`, dan pesannya menyebut aturan yang dilanggar. Pelanggaran tabel struktural adalah `E407`.

### 9.5 Aliran data

```dim
data push <tipe>;
data pull <tipe>;
```

Relasi punya dua aspek yang terpisah:

- **Panah = siapa yang memulai interaksi.**
- **`data` = ke mana data mengalir, dan data apa.** Arahnya dilihat dari sisi pemula: `push` berarti pemula mengirim data ke target (searah panah), `pull` berarti pemula mengambil data dari target (berlawanan arah panah).

```dim
loadOrder: repo -> db "Baca order" { op read; data pull order; }
saveOrder: repo -> db "Simpan order" { op write; data push order; }

submit: button -> handler "Kirim keranjang" {
  op call;
  data push cart;
  data pull order;
}
```

Aturan:

- Arah **selalu ditulis**. Tidak ada arah default dari `op`, jadi setiap baris `data` bisa dibaca tanpa mengingat tabel.
- Arah harus cocok dengan `op`. `read` dan `subscribe` hanya `pull`. `write` dan `publish` hanya `push`. `call` dan `use` boleh keduanya. Pelanggaran adalah `E406`.
- Relasi struktural tidak punya `data` (`E406`).
- Relasi ke endpoint tidak menulis `data` (`E406`), karena datanya sudah ditentukan endpoint ([§10.7](/referensi/spesifikasi/endpoint/#107-relasi-ke-endpoint)).

**Kenapa panah tidak dipakai untuk arah data?**

1. `call` mengalirkan data dua arah, sedangkan satu panah hanya punya satu arah.
2. Panah sebagai arah data membalik arah dependency: `api` yang membaca `db` akan digambar `db → api`, padahal `api` yang bergantung pada `db`.
3. `push` dan `pull` bisa dibaca langsung, tanpa menghafal arti simbol.

### 9.6 Label

Label adalah prosa yang digambar di atas panah dan muncul di daftar langkah flow. Label **opsional**. Kalau tidak ditulis, konsumen menurunkannya dari struktur relasi:

| Relasi | Label turunan |
|---|---|
| `call` ke endpoint `http` | method dan path lengkap, mis. `POST /v1/orders` |
| `call` ke endpoint `grpc` | `<Service>/<Rpc>` |
| `call` ke endpoint `graphql` | operasi dan field, mis. `mutation createOrder` |
| `publish`/`subscribe` ke endpoint `event` | nama event |
| `read`, `write`, `publish`, `subscribe` dengan `data` | kata kerja `op` diikuti nama tipe, mis. "tulis Order" |
| struktural | nama `op` |
| selain itu | tidak ada label |

Kata kerja dan tanda baca label turunan mengikuti bahasa tampilan konsumen. Label yang ditulis selalu menang.
