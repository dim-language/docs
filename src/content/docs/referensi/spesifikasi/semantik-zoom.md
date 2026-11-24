---
title: Semantik zoom
description: Cara menampilkan, mengangkat, dan menggabungkan relasi pada tiap level zoom, termasuk di view deployment.
---

## 14. Semantik zoom (lifting)

Bagian ini normatif untuk **konsumen** (peta, editor), bukan parser. Ditulis di sini supaya semua konsumen menghasilkan diagram yang sama dari model yang sama.

### 14.1 State tampilan

Konsumen menyimpan himpunan elemen yang sedang **terbuka**. Elemen top-level selalu terlihat.

- Elemen **terlihat** kalau semua leluhurnya terbuka.
- Elemen **frontier** adalah elemen terlihat yang tertutup atau tidak punya anak. Elemen frontier digambar sebagai kotak. Elemen terbuka digambar sebagai batas yang membungkus anak-anaknya.

### 14.2 Lifting

Untuk setiap elemen `x`, `vis(x)` adalah leluhur-atau-diri-sendiri dari `x` yang berada di frontier.

Untuk setiap relasi `a -> b`:

- Kalau `a == b` (rekursi) dan `vis(a) == a`: relasi digambar sebagai **loop** di elemen itu.
- Kalau `vis(a) == vis(b)` selain kasus di atas: relasi **internal**, tidak digambar.
- Selain itu: relasi digambar sebagai `vis(a) -> vis(b)`.

Karena frontier tidak pernah berisi dua elemen yang saling leluhur, dan `E404` melarang relasi antara leluhur dan keturunan, `vis(a)` dan `vis(b)` selalu sama atau saling lepas.

### 14.3 Aggregasi

Relasi yang sudah di-lift dikelompokkan berdasarkan pasangan berarah `(vis(a), vis(b))`. Setiap kelompok digambar sebagai satu panah:

```json
{
  "from": "shop.api",
  "to": "shop.db",
  "sources": ["saveOrder", "loadOrder"],
  "ops": ["write", "read"],
  "data": [
    { "dir": "push", "types": [{ "ref": "shop.api.orders.order" }] },
    { "dir": "pull", "types": [{ "ref": "shop.api.orders.order" }] }
  ]
}
```

- `sources`: id relasi asal, untuk ditelusuri balik.
- `ops`: himpunan `op` unik dari relasi asal, urut sesuai kemunculan pertama.
- `data`: semua aliran data dari relasi asal, termasuk yang diambil dari endpoint ([§10.7](/referensi/spesifikasi/endpoint/#107-relasi-ke-endpoint)), digabung per arah. Paling banyak satu entri `push` dan satu `pull`, dengan tipe unik sesuai kemunculan pertama.
- Relasi struktural ikut di-lift. Class di component A yang `inherits` class di component B tetap terlihat sebagai `A → B`, karena itu dependency yang nyata. Kelompok yang hanya berisi relasi struktural digambar dengan garis putus-putus.
- `a -> b` dan `b -> a` adalah dua kelompok berbeda.
- Kelompok dengan satu relasi yang tidak di-lift memakai label relasi itu ([§9.6](/referensi/spesifikasi/relasi/#96-label)). Kelompok lain diberi label ringkasan, misalnya jumlah relasinya.

Konsumen menggambar arah data sebagai penanda di sepanjang garis, terpisah dari kepala panah: `push` searah panah, `pull` berlawanan, dan keduanya berarti `⇄`.

### 14.4 Contoh

Dari contoh di [§2](/referensi/spesifikasi/#2-contoh-singkat):

| Yang terbuka | Panah yang tampil |
|---|---|
| (tidak ada) | `customer → shop` |
| `shop` | `customer → web`, `web → api` (⇄ Cart / Order), `api → db` (push Order) |
| `shop`, `web`, `api` | `customer → checkout`, `checkout → orders` (⇄ Cart / Order), `orders → db` (push Order) |

Relasi `placeOrder` menuju endpoint `createOrder`, jadi di level component panahnya berakhir di `orders`, pemilik endpoint itu.

Flow di setiap level mengikuti [§12.4](/referensi/spesifikasi/komposisi-dan-flow/#124-flow-di-setiap-level-zoom).

### 14.5 View deployment

View deployment menggambar satu environment. Hierarkinya adalah environment → node → `deploy` dan `infra`, dengan aturan terbuka dan tertutup yang sama seperti [§14.1](#141-state-tampilan).

Relasi di view ini diturunkan dari model software:

1. Setiap relasi software `a -> b` dipetakan ke container: `c(a)` dan `c(b)` adalah container yang memuat `a` dan `b`, atau elemen itu sendiri kalau ia container. Relasi dari atau ke `person` dan `system` dipetakan ke elemen itu sendiri.
2. Untuk setiap pasangan `deploy` dari `c(a)` dan `deploy` dari `c(b)` di environment itu, terbentuk satu relasi deployment `deploy(c(a)) -> deploy(c(b))`. Kalau `c(a)` di-deploy di beberapa tempat, setiap tempatnya mendapat relasi.
3. Ujung yang tidak di-deploy, seperti `person`, system atau container eksternal, dan container yang di-`omit`, digambar di luar node. Relasi ke container yang di-`omit` tidak digambar.
4. Relasi infra ([§13.5](/referensi/spesifikasi/deployment/#135-relasi-di-environment)) ditambahkan apa adanya.
5. Lifting dan aggregasi [§14.2](#142-lifting)–[§14.3](#143-aggregasi) diterapkan di hierarki node. Relasi antara dua `deploy` di dalam node yang tertutup menjadi internal.
