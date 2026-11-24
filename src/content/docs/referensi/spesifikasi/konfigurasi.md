---
title: Konfigurasi proyek
description: File dim.config, deklarasi tech, tag, scope, root, dan style, serta set icon dan palet warna.
---

## 5. Konfigurasi proyek

Semua yang dirujuk dari banyak tempat dideklarasikan **sekali** di `dim.config`: teknologi, tag, scope auth, root source, dan tampilan. Model hanya merujuknya lewat id, jadi penulisannya selalu seragam, dan salah ketik langsung menjadi error.

```dim
// dim.config
dim "0.6";

tech kotlin "Kotlin" { version "2.1"; }
tech postgres "PostgreSQL" { version "16"; url "https://www.postgresql.org"; }

tag pci "Menyimpan data kartu";
tag deprecated "Akan dihapus" { description "Jangan menambah pemakai baru."; }

scope ordersWrite "orders:write";

root shopRepo {
  repo "https://github.com/acme/shop";
  branch "main";
}

style role database { icon database; background neutral; }
style tag pci { background warning; }
```

### 5.1 File dan proyek

- **Satu proyek, satu config.** `dim.config` harus berada di folder yang sama dengan file utama. Kalau tidak ada, `E101`.
- Semua file proyek, yaitu file utama dan semua file yang di-`import` atau di-`amends` darinya, harus berada di folder itu atau subfoldernya (`E107`). Semuanya memakai `dim.config` yang sama.
- `dim.config` memakai sintaks dim. Isinya hanya boleh deklarasi versi, `tech`, `tag`, `scope`, `root`, dan `style`. Statement lain di `dim.config`, atau statement konfigurasi di file `.dim`, adalah `E102`.
- Setiap jenis deklarasi punya namespace sendiri. Id yang sama di dua deklarasi sejenis adalah `E103`. Rujukan ke deklarasi yang tidak ada adalah `E104`.

### 5.2 `tech`

```dim
tech <id> "<nama>" [{ version "<versi>"; url "<url>"; description "<prosa>"; }]
```

Satu teknologi: bahasa, framework, database, layanan cloud, atau protokol. `version` adalah literal `version`, dan `url` adalah literal `url` ([§3.9](/referensi/spesifikasi/sintaks/#39-literal-bertipe)). Ketiganya opsional.

Tech dirujuk dengan `tech <id> [<id> ...];` di container, component, relasi, node, dan infra. Kalau dua versi dari satu teknologi dipakai bersamaan, deklarasikan sebagai dua tech: `postgres15` dan `postgres16`.

### 5.3 `tag`

```dim
tag <id> "<nama>" [{ description "<prosa>"; }]
```

Tag mengelompokkan elemen **lintas hierarki**, misalnya semua elemen yang menyentuh data kartu, atau yang akan dihapus. Tag dipakai untuk memfilter tampilan dan sebagai selector style ([§5.6](#56-style)).

Tag dirujuk dengan `tags <id> [<id> ...];` di elemen, relasi, dan flow.

### 5.4 `scope`

```dim
scope <id> "<nilai>";
```

Scope izin yang diminta `auth` di endpoint ([§10.7](/referensi/spesifikasi/endpoint/#107-prefix-auth-dan-rate)). `nilai` adalah literal `scopeValue`, yaitu bentuk scope seperti yang dikirim di token, misalnya `"orders:write"`. Nilai yang sama di dua scope adalah `E103`.

### 5.5 `root`

```dim
root <id> {
  repo "<url>";
  branch "<branch>";
}
```

Repositori tempat source sebuah elemen berada. `repo` dan `branch` wajib (`E106`). Path di `source` ditulis relatif terhadap root ([§6.7](/referensi/spesifikasi/model/#67-lokasi-implementasi-source)).

### 5.6 `style`

```dim
style kind <kind> { ... }
style role <peran> { ... }
style tag <tag> { ... }
```

Tampilan elemen **hanya** diatur lewat style di `dim.config`. Model tidak bisa mengatur tampilan elemennya sendiri.

| Properti | Nilai |
|---|---|
| `icon` | nama icon dari [§5.7](#57-icon) |
| `background` | token palet dari [§5.8](#58-palet) |

Aturan:

- Selector `kind` menerima kind elemen apa pun ([§6.1](/referensi/spesifikasi/model/#61-jenis-elemen-dan-nesting), [§7.2](/referensi/spesifikasi/level-kode/#72-kind-level-kode), [§13](/referensi/spesifikasi/deployment/#13-deployment)). Selector `role` menerima peran container ([§6.5](/referensi/spesifikasi/model/#65-peran-container)) dan peran infra ([§13.3](/referensi/spesifikasi/deployment/#133-infra)). Selector `tag` menerima tag yang dideklarasikan.
- Setiap style harus mengisi minimal satu properti. Selector yang sama dua kali, kind atau peran yang tidak dikenal, atau nilai yang tidak dikenal adalah `E105`.
- **Urutan prioritas**: `kind`, lalu `role`, lalu `tag`. Style yang lebih kanan menimpa properti yang sama dari style sebelumnya. Kalau elemen punya beberapa tag yang sama-sama mengatur satu properti, tag yang **dideklarasikan paling akhir** di `dim.config` yang menang.
- Elemen tanpa style yang cocok tidak punya icon dan memakai background `neutral`.
- Tampilan elemen `external` tidak bisa diatur: konsumen selalu menggambarnya dengan border putus-putus. Begitu juga warna teks dan border, yang dihitung dari background supaya kontrasnya cukup di tema terang maupun gelap.

`dim init` membuat `dim.config` awal yang berisi style untuk setiap peran container.

### 5.7 Icon

Icon bersifat opsional dan diambil dari set tertutup berikut. Set ini sengaja semantik, tanpa logo merek. Konsumen menggambar setiap icon dari set icon open source di web dan dari padanannya di platform native (misalnya SF Symbols di Apple).

| Icon | Untuk | Icon | Untuk |
|---|---|---|---|
| `user` | satu orang | `users` | kelompok orang |
| `browser` | aplikasi web | `mobile` | aplikasi mobile |
| `desktop` | aplikasi desktop | `server` | service backend |
| `api` | antarmuka API | `database` | database |
| `queue` | antrian pesan | `storage` | penyimpanan file |
| `cache` | cache | `cloud` | layanan cloud |
| `lock` | keamanan | `key` | kredensial |
| `mail` | email | `payment` | pembayaran |
| `cart` | belanja | `search` | pencarian |
| `chart` | analitik | `file` | dokumen |
| `folder` | kumpulan file | `gear` | konfigurasi atau job |
| `bell` | notifikasi | `globe` | internet atau DNS |

### 5.8 Palet

Background diambil dari 12 token. Setiap token punya warna untuk tema terang dan gelap.

| Jenis | Token |
|---|---|
| Semantik | `neutral`, `accent`, `info`, `success`, `warning`, `danger` |
| Kategori | `blue`, `green`, `purple`, `orange`, `pink`, `teal` |

Token semantik dipakai untuk makna, misalnya `warning` untuk elemen ber-tag `pci`. Token kategori dipakai untuk membedakan kelompok yang setara, misalnya per tim. Nilai warna setiap token ditentukan konsumen, bukan spesifikasi ini.
