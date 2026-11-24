---
title: Elemen
description: Jenis elemen, nesting, properti umum, peran container, source, meta, dan resolusi path.
---

## 6. Elemen

### 6.1 Jenis elemen dan nesting

| Kind | Boleh berada di dalam | Contoh |
|---|---|---|
| `person` | top-level | pembeli, admin, operator |
| `system` | top-level | sistem yang dikelola satu tim atau organisasi |
| `container` | `system` | web app, API, database, antrian |
| `component` | `container`, `component` | modul, service internal, halaman UI |
| `endpoint` | `component` | route HTTP, RPC gRPC, field GraphQL, event ([§10](/referensi/spesifikasi/endpoint/#10-endpoint)) |
| kind level kode | `component` dan sesamanya | lihat [§7](/referensi/spesifikasi/level-kode/#7-level-kode) |

Elemen deployment (`environment`, `node`, `infra`, `deploy`) membentuk hierarki terpisah ([§13](/referensi/spesifikasi/deployment/#13-deployment)).

- `person` tidak punya anak.
- Level di bawah `container` opsional. Container tanpa component, atau component tanpa level kode, itu valid.
- Level kode tidak boleh langsung di dalam `container`; harus ada `component` di antaranya. Di C4, level Code adalah zoom ke dalam *satu component*, jadi setiap unit kode punya modul pemilik yang bernama.

Nesting yang melanggar tabel ini adalah `E201`.

### 6.2 Identitas

- `id` ditulis camelCase ([§3.4](/referensi/spesifikasi/sintaks/#34-identifier)) dan unik di antara **saudara** (anak dari parent yang sama), apa pun kind-nya (`E202`).
- Identitas global elemen adalah **path lengkap**: gabungan `id` dari top-level sampai elemen itu, dipisah `.`. Contoh: `shop.api.orders.createOrder`.
- `id` yang sama boleh muncul di parent yang berbeda.
- Nama setelah id wajib ditulis (`E203`) dan berupa prosa.

### 6.3 Properti umum

| Properti | Nilai | Berlaku untuk | Wajib |
|---|---|---|---|
| `description` | prosa | semua | `component`, `endpoint`, dan unit kode ([§7.3](/referensi/spesifikasi/level-kode/#73-properti-unit-kode)) |
| `tags` | ≥1 rujukan tag | semua | |
| `tech` | ≥1 rujukan tech | `container`, `component` | |
| `role` | peran ([§6.5](#65-peran-container)) | `container` | ya |
| `paradigm` | ≥1 paradigma ([§6.6](#66-paradigma)) | `container`, `component` | container yang berisi unit kode selain tipe data |
| `external` | flag | `system`, `container` | |
| `source` | blok ([§6.7](#67-lokasi-implementasi-source)) | semua kecuali `person` | |
| `meta` | objek JSON ([§6.8](#68-meta)) | semua | |

Properti wajib yang tidak ditulis adalah `E205`. Properti yang tidak berlaku untuk kind itu adalah `E204`.

### 6.4 `external`

`external` menandai elemen di luar kepemilikan kita, misalnya payment gateway pihak ketiga.

- Semua isi system `external` ikut eksternal. Menulis `external` di container di dalam system eksternal adalah `E212`.
- Container eksternal di dalam system milik kita juga boleh, misalnya layanan SaaS yang dipakai satu system saja.
- Elemen eksternal tidak di-deploy ([§13](/referensi/spesifikasi/deployment/#13-deployment)). Di level kode, elemen eksternal hanya boleh berisi tipe data (`record`, `enum`, `union`, `alias`), supaya kontrak API pihak ketiga tetap bisa ditulis (`E201`).

### 6.5 Peran container

Setiap container wajib menyatakan perannya. Peran menentukan relasi yang boleh menuju container itu ([§9.4](/referensi/spesifikasi/relasi/#94-aturan-ujung-relasi)) dan menjadi selector style ([§5.6](/referensi/spesifikasi/konfigurasi/#56-style)).

| `role` | Arti |
|---|---|
| `app` | aplikasi yang dipakai manusia secara langsung: web, mobile, desktop |
| `service` | proses backend yang dipanggil atau berjalan sendiri: API, worker, job |
| `database` | penyimpanan data terstruktur |
| `queue` | antrian atau topic pesan |
| `storage` | penyimpanan file atau objek |
| `cache` | penyimpanan sementara untuk mempercepat baca |

Peran lain adalah `E207`.

### 6.6 Paradigma

```dim
container api "API" {
  role service;
  paradigm oop functional;
}
```

`paradigm` menyatakan gaya kode di dalam container: `procedural`, `functional`, dan/atau `oop`. Paradigma menentukan kind level kode yang boleh dipakai ([§7.1](/referensi/spesifikasi/level-kode/#71-paradigma)).

- Wajib di setiap container yang berisi unit kode selain tipe data (`E213`). Tipe data boleh dipakai di paradigma mana pun, jadi container yang hanya berisi tipe data tidak perlu `paradigm`. Container lain boleh menulisnya untuk menyatakan rencana.
- Component boleh menulis `paradigm` untuk **mempersempit** paradigma yang berlaku. Paradigma yang tidak dimiliki container atau component leluhurnya adalah `E213`.
- **Paradigma efektif** sebuah elemen adalah `paradigm` dari component atau container terdekat di atasnya yang menuliskannya.
- Satu paradigma tidak boleh ditulis dua kali (`E207`).

### 6.7 Lokasi implementasi (`source`)

```dim
system shop "Online Shop" {
  source { root shopRepo; path "."; }

  container api "API" {
    role service;
    source { path "services/api"; }

    component orders "Orders" {
      description "Membuat dan menyimpan order.";
      source { path "services/api/src/orders"; }
    }
  }
}
```

`source` menunjuk tempat elemen diimplementasikan.

| Properti | Nilai | Keterangan |
|---|---|---|
| `root` | rujukan root ([§5.5](/referensi/spesifikasi/konfigurasi/#55-root)) | wajib kalau tidak ada leluhur yang menulisnya |
| `path` | literal `filePath` | wajib; relatif terhadap root |
| `line` | `INT` ≥ 1 | baris di file |

- **Root diwariskan.** Elemen tanpa `root` memakai root dari leluhur terdekat yang menulis `source`. Kalau tidak ada, `E211`.
- **Path selalu relatif terhadap root**, bukan terhadap path parent. Jadi setiap `source` bisa dibaca tanpa melihat parent-nya.
- `path "."` berarti root itu sendiri.
- `source` opsional dan tidak diwariskan sebagai lokasi. Elemen tanpa `source` berarti lokasinya belum ada atau belum dicatat, misalnya elemen baru di model *to-be*.
- Parser tidak memeriksa apakah file itu ada. `dim check --sources` memeriksanya terhadap checkout lokal setiap root.

### 6.8 `meta`

```dim
container api "API" {
  role service;
  meta {
    "owner": "checkout",
    "costCenter": 4120,
    "slo": { "availability": 99.9 }
  }
}
```

`meta` menampung **properti eksperimental**: informasi yang belum menjadi bagian dari bahasa. Dengan `meta`, sebuah properti bisa dicoba dulu tanpa menunggu bahasanya berubah.

- Isinya satu objek JSON (RFC 8259). JSON yang tidak valid adalah `E009`.
- Key di tingkat teratas ditulis camelCase ([§3.4](/referensi/spesifikasi/sintaks/#34-identifier)) dan tidak boleh sama dengan nama properti bahasa (`E009`). Key di dalam objek yang lebih dalam bebas.
- `meta` berlaku di semua elemen, relasi, flow, dan elemen deployment.
- **Core tidak membaca `meta`.** Parser hanya memeriksa bentuknya lalu meneruskannya ke output apa adanya ([§16](/referensi/spesifikasi/output/#16-format-output-json)). Validasi, zoom, dan style tidak pernah bergantung pada isi `meta`.
- **Jalur promosi.** Key yang terbukti berguna diusulkan menjadi properti bahasa dengan tipe yang jelas. Setelah dipromosikan, key `meta` dengan nama itu menjadi `E009`, dan pesannya menunjuk properti barunya. Dengan begitu tidak pernah ada dua cara menulis hal yang sama.

### 6.9 Resolusi path

Path di relasi, tipe, dan rujukan lain di-resolve relatif terhadap **scope** tempat path itu ditulis. Scope adalah elemen yang bloknya berisi statement tersebut, atau root model untuk statement top-level.

Algoritma untuk path `p1.p2.….pn` di scope `S`:

1. Mulai dari `S`. Cari anak langsung bernama `p1`.
2. Kalau tidak ketemu, naik ke parent `S`, ulangi sampai root.
3. Scope pertama yang punya anak bernama `p1` menang. Kalau sampai root tidak ketemu, `E208`.
4. Dari elemen `p1` itu, `p2 … pn` harus berupa anak langsung berturut-turut.

**Path absolut.** Path yang diawali `::` (misalnya `::shop.api.orders`) melewati langkah 1–3: `p1` dicari langsung di antara elemen top-level.

**`this`.** `this` di awal path merujuk elemen yang bloknya sedang ditulis. `this.p1.….pn` melewati langkah 1–3. `this` di top-level, atau di posisi selain awal path, adalah `E210`. Di dalam blok `extend X { … }`, `this` merujuk `X`.

**Nama yang tertutup.** Kalau `p1` ditemukan di scope `S'` dan **juga** ada sebagai anak di scope lain yang lebih luar, pembaca tidak bisa tahu elemen mana yang dimaksud tanpa menelusuri scope. Path seperti itu adalah `E209`. Tulis path yang dimulai dari scope yang dimaksud, `this`, atau path absolut.

```dim
system shop "Online Shop" {
  container payments "Payments Service" { role service; }

  container api "API" {
    role service;
    component payments "Payment Client" { description "Memanggil Payments Service."; }
    component orders "Orders" {
      description "Menyimpan order.";
      charge: this -> payments { op call; }       // ❌ E209: shop.api.payments atau shop.payments?
      charge: this -> api.payments { op call; }   // ✅
    }
  }
}
```

`payments` ditemukan sebagai anak `api`, tapi `shop` juga punya anak bernama `payments`.
