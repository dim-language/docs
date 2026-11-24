---
title: Spesifikasi bahasa
description: Spesifikasi normatif bahasa dim v0.6, dari struktur leksikal sampai konfigurasi proyek, level kode, tipe, relasi, endpoint, flow, deployment, semantik zoom, dan bentuk kanonik.
---

**Versi 0.6 (draf)** · Ekstensi file `.dim` · Konfigurasi proyek `dim.config`

:::caution[Draf]
Versi 0.6 adalah desain ulang dan **belum diimplementasi**. Compiler, SDK, dan editor masih memakai v0.5. Model v0.5 tidak bisa dibaca oleh parser v0.6, dan tidak ada migrasi otomatis.
:::

`dim` adalah bahasa untuk mendeskripsikan arsitektur software sebagai **satu model hierarkis** yang bisa di-zoom. Konsepnya diambil dari [C4 model](https://c4model.com), dengan dua perbedaan utama:

1. Semua level (system, container, component, code) ada di **satu model**, bukan diagram terpisah.
2. Relasi boleh menghubungkan elemen di **level mana pun**. Relasi di level yang lebih tinggi tidak ditulis, tapi **diturunkan** dari relasi yang lebih detail ([§14](/referensi/spesifikasi/semantik-zoom/#14-semantik-zoom-lifting)).

---

## 1. Prinsip desain

**Model yang bisa di-zoom**

1. **Tulis relasi di level paling detail yang kamu tahu.** Kalau tahu fungsinya, tulis dari fungsi. Kalau cuma tahu container-nya, tulis dari container. Keduanya valid.
2. **Level tinggi itu turunan, bukan tulisan.** `system → system` muncul otomatis dari relasi di bawahnya, jadi diagram level tinggi tidak bisa basi atau bertentangan dengan detailnya.
3. **Zoom out meringkas, tidak membuang.** Relasi hasil lifting tetap membawa daftar relasi asalnya.
4. **Parser tidak tahu soal layout.** Parser hanya menghasilkan model. Zoom, lifting, aggregasi, dan layout dikerjakan konsumen.

**Keteraturan**

5. **Setiap nilai punya jenis yang jelas.** Nilai di dim hanya bisa berupa salah satu dari tiga hal:
   - **prosa** untuk dibaca manusia: nama elemen, `description`, label relasi, label cabang flow, dan keterangan;
   - **rujukan** ke sesuatu yang dideklarasikan: elemen, tipe, relasi, tech, tag, scope, root;
   - **literal bertipe** yang formatnya diperiksa: bilangan, durasi, URL, path file, path HTTP, dan sejenisnya ([§3.9](/referensi/spesifikasi/sintaks/#39-literal-bertipe)).

   Tidak ada string bebas di luar prosa.
6. **Dideklarasikan sekali, dirujuk di mana-mana.** Tech, tag, scope, root source, dan tampilan dideklarasikan di [`dim.config`](/referensi/spesifikasi/konfigurasi/#5-konfigurasi-proyek). Model hanya merujuknya.
7. **Satu hal, satu cara menulis.** Setiap konsep punya tepat satu bentuk sintaks, dan setiap kata kunci punya tepat satu arti.
8. **Tidak ada warning.** Setiap pelanggaran adalah error, dan model dengan error tidak menghasilkan output ([§15](/referensi/spesifikasi/validasi/#15-validasi)).
9. **Bebas dari bahasa pemrograman, mengikuti paradigma.** Level kode memakai konsep paradigma (prosedural, fungsional, berorientasi objek) dan sistem tipe milik dim sendiri, bukan sintaks bahasa tertentu ([§7](/referensi/spesifikasi/level-kode/#7-level-kode), [§8](/referensi/spesifikasi/tipe/#8-tipe)).

---

## 2. Contoh singkat

Satu proyek dim terdiri dari `dim.config` dan satu atau lebih file `.dim`:

```dim
// dim.config
dim "0.6";

tech nextjs "Next.js";
tech kotlin "Kotlin" { version "2.1"; }
tech postgres "PostgreSQL" { version "16"; }

tag pci "Menyimpan data kartu";

style role database { icon database; background neutral; }
style tag pci { background warning; }
```

```dim
// main.dim
dim "0.6";

person customer "Customer" {
  description "Belanja online.";
}

system shop "Online Shop" {
  container web "Web App" {
    role app;
    tech nextjs;

    component checkout "Checkout Page" {
      description "Ringkasan keranjang dan tombol bayar.";
    }
  }

  container api "API" {
    role service;
    paradigm oop;
    tech kotlin;

    component orders "Orders" {
      description "Membuat dan menyimpan order.";

      record cart "Cart" {
        description "Barang yang akan dibayar.";
        field productIds: uuid[];
      }

      record order "Order" {
        description "Order yang sudah dibuat.";
        field id: uuid;
        field total: decimal "Total setelah diskon";
      }

      endpoint createOrder "Buat order" {
        description "Membuat order dari keranjang.";
        protocol http;
        verb post;
        path "/orders";
        body cart;
        returns 201 order;
      }
    }
  }

  container db "Orders DB" {
    role database;
    tech postgres;
    tags pci;
  }

  placeOrder: web.checkout -> api.orders.createOrder { op call; }
  saveOrder: api.orders -> db "Simpan order" { op write; data push api.orders.order; }
}

openCheckout: customer -> shop.web.checkout "Klik bayar" { op use; }

flow checkout "Checkout" {
  description "Dari pembeli menekan bayar sampai order tersimpan.";
  step openCheckout;
  step placeOrder;
  step saveOrder;
}
```

`placeOrder` tidak menulis label maupun `data`. Keduanya diambil dari endpoint `createOrder`: label `POST /orders`, data `push cart`, dan `pull order` ([§10](/referensi/spesifikasi/endpoint/#10-endpoint)).

---

## Bab spesifikasi

- [§3 Struktur leksikal](/referensi/spesifikasi/sintaks/#3-struktur-leksikal)
- [§4 Grammar](/referensi/spesifikasi/sintaks/#4-grammar)
- [§5 Konfigurasi proyek](/referensi/spesifikasi/konfigurasi/#5-konfigurasi-proyek)
- [§6 Elemen](/referensi/spesifikasi/model/#6-elemen)
- [§7 Level kode](/referensi/spesifikasi/level-kode/#7-level-kode)
- [§8 Tipe](/referensi/spesifikasi/tipe/#8-tipe)
- [§9 Relasi](/referensi/spesifikasi/relasi/#9-relasi)
- [§10 Endpoint](/referensi/spesifikasi/endpoint/#10-endpoint)
- [§11 Komposisi file](/referensi/spesifikasi/komposisi-dan-flow/#11-komposisi-file)
- [§12 Flow](/referensi/spesifikasi/komposisi-dan-flow/#12-flow)
- [§13 Deployment](/referensi/spesifikasi/deployment/#13-deployment)
- [§14 Semantik zoom](/referensi/spesifikasi/semantik-zoom/#14-semantik-zoom-lifting)
- [§15 Validasi](/referensi/spesifikasi/validasi/#15-validasi)
- [§16 Format output (JSON)](/referensi/spesifikasi/output/#16-format-output-json)
- [§17 Bentuk kanonik](/referensi/spesifikasi/bentuk-kanonik/#17-bentuk-kanonik)

---

## Perubahan dari 0.5

Versi 0.6 tidak kompatibel dengan 0.5. Ringkasannya:

| Topik | 0.5 | 0.6 |
|---|---|---|
| Deklarasi versi | opsional | wajib di setiap file ([§4.6](/referensi/spesifikasi/sintaks/#46-deklarasi-versi)) |
| Id | `snake_case` | camelCase, singkatan ditulis `httpClient` ([§3.4](/referensi/spesifikasi/sintaks/#34-identifier)) |
| `;` | boleh dihilangkan sebelum `}` | wajib |
| Konfigurasi | tidak ada | `dim.config` untuk tech, tag, scope, root, dan style ([§5](/referensi/spesifikasi/konfigurasi/#5-konfigurasi-proyek)) |
| `tech`, `tags` | string bebas | rujukan ke `dim.config` |
| `shape`, `ui` | ada | dihapus; container wajib punya `role`, tampilan diatur lewat style ([§6.5](/referensi/spesifikasi/model/#65-peran-container)) |
| `source` | satu string | `source { root …; path "…"; line …; }` ([§6.7](/referensi/spesifikasi/model/#67-lokasi-implementasi-source)) |
| Ekstensi | `tags` | `meta` berisi JSON untuk properti eksperimental ([§6.8](/referensi/spesifikasi/model/#68-meta)) |
| Level kode | `code` + `form` bebas bahasa | kind per konsep (`function`, `class`, `record`, …) dibatasi `paradigm` ([§7](/referensi/spesifikasi/level-kode/#7-level-kode)) |
| Tipe | string yang dipotong per kata | ekspresi tipe dengan primitif dim dan rujukan lewat path ([§8](/referensi/spesifikasi/tipe/#8-tipe)) |
| Relasi | id dan `op` opsional | id dan `op` wajib; aturan ujung per `op` ([§9](/referensi/spesifikasi/relasi/#9-relasi)) |
| Pewarisan | `op extends` | `op inherits` |
| Endpoint | `code` dengan `form endpoint`, hanya HTTP | kind `endpoint` dengan protokol `http`, `grpc`, `graphql`, `event` ([§10](/referensi/spesifikasi/endpoint/#10-endpoint)) |
| Flow | urutan lurus | cabang `alt`, `opt`, `par` ([§12](/referensi/spesifikasi/komposisi-dan-flow/#12-flow)) |
| Deployment | tidak ada | `environment`, `node`, `infra`, `deploy` ([§13](/referensi/spesifikasi/deployment/#13-deployment)) |
| Warning | ada | tidak ada; semua pelanggaran adalah error |
| Output | `nodes`/`edges` dengan field `null` | `elements`/`relations` per kind, tanpa `null`, `spans` terpisah ([§16](/referensi/spesifikasi/output/#16-format-output-json)) |
