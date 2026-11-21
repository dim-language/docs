---
title: Bentuk kanonik dan rencana versi
description: Bentuk kanonik teks dim dan rencana versi berikutnya.
---

## 14. Bentuk kanonik

Setiap teks `.dim` yang valid punya satu bentuk kanonik. Formatter menghasilkan bentuk ini, dan alat yang menulis teks `.dim` (mis. editor yang mengedit lewat peta) wajib menulis bagian yang ia ubah dalam bentuk ini. Bagian yang tidak diubah tidak boleh ikut diformat ulang, supaya diff tetap kecil.

**Prinsipnya:** formatter hanya mengubah spasi, baris baru, indentasi, dan `;`. Token lain (id, nama, string, bilangan, path, komentar) dan urutan statement tetap seperti yang ditulis, jadi model hasil parse-nya sama persis kecuali `span`. Memformat teks yang sudah kanonik tidak mengubah apa-apa.

### 14.1 Aturan

1. **File.** UTF-8 tanpa BOM, baris baru `\n`, diakhiri tepat satu `\n`, dan tanpa spasi di akhir baris.
2. **Indentasi.** Dua spasi per tingkat blok, tanpa tab.
3. **Satu statement per baris**, kecuali di dalam blok satu baris (aturan 5).
4. **Blok banyak baris.** `{` di baris yang sama dengan kepala statement, dipisah satu spasi. Setiap isi blok di barisnya sendiri, satu tingkat lebih dalam. `}` di barisnya sendiri, sejajar dengan kepala statement.
5. **Blok satu baris** ditulis `kepala { a; b }`. Bentuk ini dipertahankan hanya kalau semua syarat terpenuhi:
   - penulis menulisnya dalam satu baris (tidak ada baris baru antara `{` dan `}`),
   - isinya hanya atribut (termasuk `step` di flow), tanpa elemen, relasi, `extend`, atau `unset`,
   - tidak ada komentar atau string multi-baris di dalamnya,
   - barisnya, termasuk indentasi, paling panjang 100 karakter.

   Kalau salah satu tidak terpenuhi, blok ditulis banyak baris. Formatter tidak pernah menggabung blok banyak baris menjadi satu baris.
6. **Blok kosong** pada elemen atau relasi ditulis sebagai statement sederhana, misalnya `container db "Postgres";`. `extend` dan `flow` membutuhkan blok dalam grammar, jadi bentuk kosongnya tetap `{}`.
7. **`;`.** Di top-level dan di blok banyak baris, setiap statement tanpa blok diakhiri `;`, termasuk yang terakhir sebelum `}`. Statement dengan blok tidak diikuti `;`. Di blok satu baris, `;` hanya di antara isi, tidak setelah isi terakhir. `;` berlebih dibuang.
8. **Spasi di dalam baris.** Token dipisah satu spasi, kecuali: tanpa spasi di sekitar `.`, tanpa spasi setelah `::` di awal path, tanpa spasi sebelum `;`, dan `:` id relasi menempel ke id-nya (`checkout_post: a -> b`).
9. **Baris kosong.** Baris kosong yang ditulis penulis dipertahankan, tapi paling banyak satu berturut-turut. Tidak ada baris kosong di awal file, tepat setelah `{`, atau tepat sebelum `}`.
10. **Komentar.** Isinya tidak diubah. Komentar di barisnya sendiri diindentasi sesuai tingkat blok tempatnya berada. Komentar `//` di akhir statement tetap di baris itu, dipisah satu spasi.
11. **String multi-baris.** `"""` pembuka tetap di akhir baris atributnya. Baris isi dan `"""` penutup diindentasi satu tingkat lebih dalam dari atributnya. Indentasi tambahan di dalam isi dipertahankan, jadi nilai string tidak berubah ([§3.7](/referensi/spesifikasi/sintaks/#37-string-multi-baris)).
12. **Panjang baris.** Selain aturan 5, formatter tidak memecah baris yang panjang.

### 14.2 Contoh

Sebelum:

```dim
system shop "Online Shop"{
	container api "API" { tech "Rust/axum"; component orders "Orders" {} }


  container db "Postgres" { tech "PostgreSQL" ; shape database ; }
  api->db "SELECT"{op read;data "Order";};
}
```

Sesudah:

```dim
system shop "Online Shop" {
  container api "API" {
    tech "Rust/axum";
    component orders "Orders";
  }

  container db "Postgres" { tech "PostgreSQL"; shape database }
  api -> db "SELECT" { op read; data "Order" }
}
```

Blok `api` menjadi banyak baris karena berisi elemen, `orders` kehilangan blok kosongnya, dan blok `db` serta relasinya tetap satu baris karena penulis menulisnya begitu dan isinya hanya atribut.

---

## 15. Rencana versi berikutnya

Bagian ini **belum normatif**.

- **Envelope respons**, mis. `{ success, statusCode, data }` yang membungkus semua respons sukses, belum punya atribut. Kandidatnya atribut di container yang diwariskan seperti `auth`.
- **Protokol lain** (gRPC, GraphQL, WebSocket) direncanakan sebagai atribut saudara `http` di `form endpoint`, bukan form baru.
- **Ekspor OpenAPI** dari CLI, berdasarkan `code.http` dan rujukan tipe ([§6.6](/referensi/spesifikasi/model/#66-rujukan-tipe)) ke elemen berform `struct`.
- **Flow bercabang** (alternatif, opsional, paralel). Sementara ini, setiap jalur ditulis sebagai flow terpisah.
- **Deployment view**: di mana container berjalan (region, cluster, node).

**Di luar bahasa.** Hal-hal berikut sengaja tidak diatur di spesifikasi ini. Semuanya bagian dari alat yang memakainya:

- styling: warna, ikon, dan gaya garis, dengan selector berdasarkan field di output JSON (`kind`, `tags`, `shape`, `external`, `ui`, `op`),
- layout dan posisi kotak di peta,
- format diff antara model dasar dan turunannya ([§11.3](/referensi/spesifikasi/komposisi-dan-flow/#113-amends-dan-remove)),
- format diagnostik untuk alat lain, dan perilaku editor selama teks punya error.
