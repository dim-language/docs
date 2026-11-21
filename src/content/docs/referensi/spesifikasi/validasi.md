---
title: Validasi
description: Daftar kode error dan warning dalam spesifikasi dim.
---

## 8. Validasi

### 8.1 Error (parsing gagal, tidak ada output model)

| Kode | Kondisi |
|---|---|
| `E001` | sintaks tidak valid |
| `E002` | string tidak valid: escape tidak dikenal, tidak ditutup, atau `"""` pembuka tidak langsung diikuti baris baru |
| `E003` | keyword reserved dipakai sebagai id |
| `E004` | indentasi string multi-baris tidak konsisten dengan `"""` penutup |
| `E005` | `dim` bukan statement pertama di file, ditulis lebih dari sekali, atau di dalam blok |
| `E006` | versi di `dim` bukan `MAJOR.MINOR`, atau lebih baru dari versi yang didukung parser |
| `E010` | nesting melanggar [§5.1](/referensi/spesifikasi/model/#51-jenis-elemen-dan-aturan-nesting) |
| `E011` | id duplikat di antara saudara, termasuk elemen top-level yang sama di dua file. Pesannya menyarankan `extend`. |
| `E020` | path tidak bisa di-resolve, atau menunjuk elemen yang sudah dihapus dengan `remove` |
| `E021` | relasi ke diri sendiri (`a -> a`), kecuali rekursi: elemen `code` dengan `op call` |
| `E022` | relasi antara elemen dan leluhur/keturunannya sendiri (mis. `shop.api.orders -> shop.api`) |
| `E023` | id relasi eksplisit duplikat (id eksplisit unik di seluruh model) |
| `E024` | `this` di top-level, atau bukan di awal path |
| `E025` | dua elemen tipe dengan nama yang sama di seluruh model ([§6.6](/referensi/spesifikasi/model/#66-rujukan-tipe)) |
| `E030` | atribut tidak dikenal |
| `E031` | atribut tidak berlaku untuk jenis elemen atau `form` ini |
| `E032` | jumlah/tipe nilai atribut salah, termasuk `auth none` yang menulis syarat |
| `E033` | atribut duplikat (kecuali `data` di relasi) |
| `E034` | atribut di top-level, statement selain atribut di dalam blok relasi, atau selain `step`/atribut di dalam blok `flow` |
| `E035` | arah `data` tidak ditulis dan tidak bisa diambil dari `op` (`call`, `use`, atau `op` tak dikenal) |
| `E036` | nama `param`, `query`, `cookie`, atau `header` duplikat dalam satu elemen (`header` tanpa membedakan huruf besar-kecil), atau kunci `rate` duplikat |
| `E037` | relasi struktural (`extends`, `implements`, `owns`, `refers`) dengan ujung yang bukan `code`, atau yang salah satu ujungnya `endpoint` |
| `E038` | relasi struktural yang menulis `data` |
| `E039` | `source` berisi path kosong, path absolut, `\`, atau `:` yang bukan `:<baris>` dengan baris ≥ 1 |
| `E040` | file yang di-`import` atau di-`amends` tidak bisa dibaca |
| `E041` | import melingkar |
| `E042` | `import`, `amends`, `remove`, atau `flow` di dalam blok, bukan di top-level |
| `E043` | `amends` bukan statement pertama di file (setelah `dim`, kalau ada), atau ditulis lebih dari sekali |
| `E044` | `extend` mengisi atribut yang sudah terisi, di file yang bukan `amends` |
| `E045` | `remove` atau `unset` di file yang bukan `amends` |
| `E046` | target `remove` bisa berarti elemen top-level dan id relasi/flow sekaligus |
| `E047` | `unset` tidak langsung di dalam blok `extend`, atau atribut (atau entri dengan kunci itu) tidak ada di elemen target |
| `E050` | `step` merujuk id relasi yang tidak ada |
| `E051` | id flow duplikat |
| `E060` | `form endpoint` tanpa `http` |
| `E061` | method `http` tidak dikenal |
| `E062` | path `http` atau `prefix` tidak diawali `/`, diakhiri `/` (kecuali path `"/"`), atau berisi placeholder yang namanya bukan IDENT |
| `E063` | `param` endpoint tanpa placeholder yang cocok di path lengkap, atau placeholder tanpa `param` |
| `E064` | `status` di luar 200–399, status `throws` endpoint di luar 400–599, atau format `rate` salah |
| `E065` | dua endpoint dalam satu container dengan method dan path lengkap yang sama |

`E022` ada karena relasi seperti itu selalu hilang saat lifting (kedua ujung naik ke node yang sama) dan hampir pasti kesalahan model.

### 8.2 Warning (output tetap dihasilkan)

| Kode | Kondisi |
|---|---|
| `W001` | nilai `shape` tidak dikenal |
| `W002` | nilai `op` tidak dikenal |
| `W004` | nilai `form` tidak dikenal |
| `W003` | arah `data` yang ditulis bertentangan dengan arah default `op` (mis. `op read; data push`) |
| `W010` | `person` terhubung ke container, component, atau code, tapi tidak ada elemen bertanda `ui` di jalur dari elemen itu naik sampai container-nya. Relasi ke `person` atau `system` tidak diperiksa. |
| `W011` | nama di scope dalam menutupi nama di scope luar dan dipakai di path. Pesan warning menyarankan path absolut ke elemen yang tertutup. |
| `W020` | `code` dengan form `class`, `interface`, `struct`, `enum`, `trait`, `function`, `method`, atau `endpoint` tanpa `description` |
| `W021` | `method`, `field`, atau `endpoint` di luar tempat yang bisa menampungnya ([§6.4](/referensi/spesifikasi/model/#64-detail-kode)) |
| `W030` | `step` dibuang karena relasinya dihapus oleh `remove` (langsung, atau karena ujungnya dihapus) |
| `W031` | `flow` tanpa `step` |
| `W040` | skema `auth` tidak dikenal |
| `W041` | kunci `rate` tidak dikenal |
| `W042` | `body` pada endpoint `GET` atau `HEAD` |
| `W043` | `auth`, `rate`, atau `prefix` di elemen yang bukan endpoint dan tidak punya endpoint di bawahnya |

Setiap diagnostik menyertakan lokasi sumber (file, baris, kolom, rentang).
