---
title: Bentuk kanonik
description: Satu bentuk teks untuk setiap model dim, termasuk urutan isi blok.
---

## 17. Bentuk kanonik

Setiap teks dim yang valid punya **satu** bentuk kanonik. `dim fmt` menghasilkan bentuk ini, dan alat yang menulis teks dim (misalnya editor yang mengedit lewat peta) wajib menulis bagian yang ia ubah dalam bentuk ini.

Formatter mengubah spasi, baris baru, indentasi, dan **urutan statement di dalam blok**. Formatter tidak pernah mengubah id, nama, prosa, nilai, path, atau komentar, jadi model hasil parse-nya sama persis kecuali `spans`. Memformat teks yang sudah kanonik tidak mengubah apa-apa.

Formatter hanya bekerja pada teks yang valid. Teks dengan error tidak diformat.

### 17.1 Tata letak

1. **File.** UTF-8 tanpa BOM, baris baru `\n`, diakhiri tepat satu `\n`, tanpa spasi di akhir baris.
2. **Indentasi.** Dua spasi per tingkat blok, tanpa tab.
3. **Satu statement per baris**, kecuali di dalam blok satu baris (aturan 5).
4. **Blok banyak baris.** `{` di baris yang sama dengan kepala statement, dipisah satu spasi. Setiap isi blok di barisnya sendiri, satu tingkat lebih dalam. `}` di barisnya sendiri, sejajar dengan kepala statement.
5. **Blok satu baris** ditulis `kepala { a; b; }`. Bentuk ini dipakai kalau semua syarat terpenuhi, dan blok banyak baris dipakai kalau tidak:
   - isinya hanya properti, member, atau `step`, tanpa elemen, relasi, cabang flow, `extend`, atau `unset`,
   - paling banyak tiga statement,
   - tidak ada komentar atau prosa multi-baris di dalamnya,
   - barisnya, termasuk indentasi, paling panjang 100 karakter.
6. **Blok kosong** pada elemen atau relasi tidak ditulis: `container db "Orders DB";` hanya valid kalau elemen itu tidak punya properti wajib. `extend`, `flow`, `environment`, dan cabang flow selalu memakai blok.
7. **Spasi dalam baris.** Token dipisah satu spasi, kecuali: tanpa spasi di sekitar `.`, setelah `::` di awal path, sebelum `;`, `,`, `:` member, dan `[]`; tanpa spasi di dalam `<` `>`; `:` id relasi menempel ke id-nya; satu spasi setelah `,`.
8. **Baris kosong.** Satu baris kosong wajib ada di antara kelompok statement ([§17.2](#172-urutan-isi-blok)), dan di sekitar elemen, relasi, atau `extend` yang ditulis dengan blok banyak baris. Di tempat lain, baris kosong yang ditulis penulis dipertahankan, paling banyak satu berturut-turut. Tidak ada baris kosong di awal file, tepat setelah `{`, atau tepat sebelum `}`.
9. **Komentar.** Isinya tidak diubah. Komentar menempel ke statement di bawahnya dan ikut berpindah bersamanya. Komentar di akhir baris tetap di baris itu, dipisah satu spasi.
10. **Prosa multi-baris.** `"""` pembuka di akhir baris propertinya. Baris isi dan `"""` penutup diindentasi satu tingkat lebih dalam dari propertinya.
11. **`meta`.** Isinya ditulis sebagai JSON dengan indentasi dua spasi, key dalam urutan tulisan.
12. **Baris panjang.** Selain aturan 5, formatter tidak memecah baris yang panjang.

### 17.2 Urutan isi blok

Di dalam setiap blok, statement dikelompokkan dan diurutkan:

1. **Properti**, dalam urutan tetap: `description`, `role`, baris protokol endpoint, `paradigm`, properti khusus kind (dalam urutan tabelnya di bab masing-masing), `tech`, `tags`, `external`, `source`, `meta`.
2. **Member**, dalam urutan tabel [§7.4](/referensi/spesifikasi/level-kode/#74-member) dan [§10.3](/referensi/spesifikasi/endpoint/#103-http). Member sejenis tetap dalam urutan tulisan, karena urutan `param` dan `field` bermakna.
3. **Elemen anak**, dalam urutan tulisan.
4. **`extend`**, dalam urutan tulisan.
5. **Relasi**, dalam urutan tulisan.

Di blok relasi: `op`, `data` (dalam urutan tulisan), `tech`, `description`, `tags`, `meta`.

Di top-level file: deklarasi versi, `amends`, `import` (diurutkan menurut path), lalu `person`, `system`, `extend`, relasi, `flow`, `environment`, `remove`, masing-masing dalam urutan tulisan.

Di `dim.config`: deklarasi versi, `tech`, `tag`, `scope`, `root`, lalu `style` dengan urutan selector `kind`, `role`, `tag`. Deklarasi sejenis tetap dalam urutan tulisan, karena urutan `tag` menentukan prioritas style ([§5.6](/referensi/spesifikasi/konfigurasi/#56-style)).

Di flow, langkah tidak pernah diurutkan ulang.

### 17.3 Contoh

Sebelum:

```dim
dim "0.6";
system shop "Online Shop"{
  container db "Orders DB" { tags pci ; role database; tech postgres;}
  saveOrder:api.orders->db { data push api.orders.order; op write; }
  container api "API" {
    tech kotlin;
    component orders "Orders" { description "Menyimpan order."; }
    role service;
  }
}
```

Sesudah:

```dim
dim "0.6";

system shop "Online Shop" {
  container db "Orders DB" { role database; tech postgres; tags pci; }

  container api "API" {
    role service;
    tech kotlin;

    component orders "Orders" { description "Menyimpan order."; }
  }

  saveOrder: api.orders -> db { op write; data push api.orders.order; }
}
```

Properti `db` diurutkan, `role` di `api` naik ke atas elemen anaknya, dan relasi pindah ke bawah elemen.
