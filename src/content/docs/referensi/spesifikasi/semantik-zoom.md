---
title: Semantik zoom
description: Cara menampilkan, mengangkat, dan menggabungkan relasi pada tiap level zoom.
---

## 10. Semantik zoom (lifting)

Bagian ini normatif untuk **konsumen** (frontend), bukan parser. Ditulis di sini supaya semua konsumen menghasilkan diagram yang sama dari model yang sama.

### 10.1 State tampilan
Konsumen menyimpan himpunan elemen yang sedang **terbuka** (`expanded`). Elemen top-level selalu terlihat.

- Elemen **terlihat** kalau semua leluhurnya terbuka.
- Elemen **frontier** adalah elemen terlihat yang tertutup atau tidak punya anak. Elemen frontier digambar sebagai node; elemen terbuka digambar sebagai boundary yang membungkus anak-anaknya.

### 10.2 Lifting
Untuk setiap elemen `x`, `vis(x)` adalah leluhur-atau-diri-sendiri dari `x` yang berada di frontier: telusuri dari top-level ke bawah, berhenti di elemen pertama yang tertutup atau tidak punya anak.

Untuk setiap edge `a -> b`:
- Hitung `vis(a)` dan `vis(b)`.
- Kalau `a == b` (rekursi, [§4.4](/referensi/spesifikasi/sintaks/#44-relasi)) dan `vis(a) == a`: edge digambar sebagai **loop** di elemen itu.
- Kalau `vis(a) == vis(b)` selain kasus di atas: edge **internal**, tidak digambar. Rekursi di dalam elemen yang tertutup ikut menjadi internal.
- Selain itu: edge digambar sebagai `vis(a) -> vis(b)`.

Karena frontier tidak pernah berisi dua elemen yang saling leluhur, dan `E022` melarang edge antara leluhur–keturunan, `vis(a)` dan `vis(b)` selalu sama atau saling lepas.

### 10.3 Aggregasi
Edge yang sudah di-lift dikelompokkan berdasarkan pasangan berarah `(vis(a), vis(b))`. Setiap kelompok digambar sebagai satu panah:

```json
{
  "from": "shop.api",
  "to": "shop.db",
  "sources": [
    "shop.api.orders.repo.save->shop.db#0",
    "shop.api.orders.repo.find->shop.db#0"
  ],
  "ops": ["write", "read"],
  "labels": ["INSERT orders", "SELECT orders"],
  "data": [
    { "dir": "push", "payload": ["Order"], "refs": ["shop.api.orders.order"] },
    { "dir": "pull", "payload": ["Order"], "refs": ["shop.api.orders.order"] }
  ]
}
```

- `sources`: id edge asal, untuk ditelusuri balik.
- `ops`: himpunan `op` unik dari edge asal, urut sesuai urutan kemunculan pertama.
- Relasi struktural ikut di-lift dengan aturan yang sama. Class di komponen A yang `extends` class di komponen B tetap terlihat sebagai `A → B` di level komponen, karena itu dependency yang nyata. Konsumen disarankan menggambar kelompok yang hanya berisi relasi struktural dengan garis putus-putus, dan kelompok campuran sebagai panah interaksi biasa.
- `data`: entri `data` dari semua edge asal, digabung per `dir` (paling banyak satu entri `push` dan satu `pull`). `payload` dan `refs` adalah gabungan unik, urut sesuai kemunculan pertama. Arah tetap valid setelah lifting karena kelompok dibentuk dari pasangan berarah.
- Konsumen disarankan menggambar arah data sebagai indikator di sepanjang garis (mis. titik bergerak atau chevron), terpisah dari kepala panah: `push` searah panah, `pull` berlawanan, keduanya ada berarti `⇄`.
- `a -> b` dan `b -> a` adalah dua kelompok berbeda.
- Kalau kelompok hanya berisi satu edge dan edge itu tidak di-lift, konsumen boleh menampilkan labelnya apa adanya.

### 10.4 Contoh
Dari contoh di [§2](/referensi/spesifikasi/#2-contoh-singkat):

| Yang terbuka | Panah yang tampil |
|---|---|
| (tidak ada) | `customer → shop`, `shop → payment` (⇄ ChargeRequest / ChargeResult) |
| `shop` | `customer → web`, `web → api` (⇄ CheckoutRequest / OrderId), `api → db` (⇄ Order), `api → payment` (⇄ ChargeRequest / ChargeResult) |
| `shop`, `api` | `customer → web`, `web → checkout` (⇄ CheckoutRequest / OrderId), `checkout → orders` (push Order), `orders → db` (⇄ Order), `checkout → payment` (⇄ ChargeRequest / ChargeResult) |

Relasi `handler -> repo.save` hilang di level `shop` saja karena kedua ujungnya ada di `api`, lalu muncul kembali sebagai `checkout → orders` saat `api` dibuka.
