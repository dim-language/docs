---
title: Validasi
description: Daftar kode error dalam spesifikasi dim.
---

## 15. Validasi

dim v0.6 **tidak punya warning**. Setiap pelanggaran adalah error, dan model dengan error tidak menghasilkan output. Setiap diagnostik menyertakan lokasi sumber (file, baris, kolom, rentang) dan, kalau ada, saran perbaikan.

Kode dikelompokkan per bab: `E0xx` leksikal dan grammar, `E1xx` konfigurasi, `E2xx` elemen dan path, `E3xx` level kode dan tipe, `E4xx` relasi, `E5xx` endpoint, `E6xx` komposisi dan flow, `E7xx` deployment.

### 15.1 Leksikal dan grammar

| Kode | Kondisi |
|---|---|
| `E001` | sintaks tidak valid, termasuk `;` yang hilang atau berlebih |
| `E002` | string tidak valid: escape tidak dikenal, tidak ditutup, baris baru literal, prosa kosong, atau `"""` pembuka tidak langsung diikuti baris baru |
| `E003` | keyword dipakai sebagai id |
| `E004` | indentasi prosa multi-baris tidak konsisten dengan `"""` penutup |
| `E005` | id tidak ditulis camelCase ([§3.4](/referensi/spesifikasi/sintaks/#34-identifier)) |
| `E006` | deklarasi versi tidak ada, bukan statement pertama, ditulis lebih dari sekali, versinya tidak didukung, atau berbeda antar-file |
| `E007` | literal bertipe tidak sesuai formatnya ([§3.9](/referensi/spesifikasi/sintaks/#39-literal-bertipe)) |
| `E008` | bilangan atau durasi tidak valid |
| `E009` | `meta` bukan objek JSON yang valid, key teratasnya bukan camelCase, memakai nama properti bahasa, atau sudah dipromosikan menjadi properti |

### 15.2 Konfigurasi

| Kode | Kondisi |
|---|---|
| `E101` | `dim.config` tidak ada di folder file utama |
| `E102` | statement selain konfigurasi di `dim.config`, atau statement konfigurasi di file `.dim` |
| `E103` | id deklarasi duplikat dalam satu jenis, atau nilai `scope` duplikat |
| `E104` | rujukan ke tech, tag, scope, atau root yang tidak dideklarasikan |
| `E105` | style tanpa properti, selector duplikat, atau kind, peran, icon, maupun token yang tidak dikenal |
| `E106` | `root` tanpa `repo` atau `branch` |
| `E107` | file proyek di luar folder `dim.config` |

### 15.3 Elemen dan path

| Kode | Kondisi |
|---|---|
| `E201` | nesting melanggar [§6.1](/referensi/spesifikasi/model/#61-jenis-elemen-dan-nesting) atau [§7.2](/referensi/spesifikasi/level-kode/#72-kind-level-kode), termasuk unit kode selain tipe data di elemen eksternal |
| `E202` | id duplikat di antara saudara, termasuk elemen top-level yang sama di dua file; pesannya menyarankan `extend` |
| `E203` | nama elemen tidak ditulis |
| `E204` | properti tidak berlaku untuk kind ini |
| `E205` | properti wajib tidak ditulis |
| `E206` | properti ditulis lebih dari sekali, padahal tidak boleh berulang |
| `E207` | jumlah atau jenis nilai properti salah, termasuk nilai enum yang tidak dikenal |
| `E208` | path tidak bisa di-resolve, atau menunjuk elemen yang sudah dihapus dengan `remove` |
| `E209` | segmen pertama path ditemukan di lebih dari satu scope ([§6.9](/referensi/spesifikasi/model/#69-resolusi-path)) |
| `E210` | `this` di top-level, atau bukan di awal path |
| `E211` | `source` tanpa `root` di dirinya maupun leluhurnya |
| `E212` | `external` di container yang sudah eksternal karena system-nya |
| `E213` | container berisi unit kode selain tipe data tanpa `paradigm`, atau component menulis paradigma yang tidak dimiliki leluhurnya |

### 15.4 Level kode dan tipe

| Kode | Kondisi |
|---|---|
| `E301` | kind level kode tidak dimiliki paradigma efektifnya |
| `E302` | member tidak berlaku untuk kind ini, `enum` tanpa varian, atau `union` dengan kurang dari dua varian |
| `E303` | id member duplikat dalam satu unit kode atau endpoint, termasuk nama `header` dan `cookie` |
| `E304` | `function` di paradigma `functional` tanpa tepat satu dari `pure` atau `effects`, atau salah satunya di luar `functional` |
| `E305` | `visibility`, `static`, atau `abstract` di luar paradigma `oop`, atau `method` `abstract` di luar `class` `abstract` |
| `E306` | rujukan tipe tidak menunjuk `record`, `enum`, `union`, `alias`, `class`, atau `interface` |
| `E307` | tipe di `throws` level kode bukan `record`, `enum`, `union`, atau `class` |
| `E308` | kunci `map` bukan `string`, `int`, `uuid`, atau `enum` |
| `E309` | record merujuk dirinya sendiri tanpa `[]`, `?`, atau `map` |
| `E310` | `alias` yang merujuk dirinya sendiri |

### 15.5 Relasi

| Kode | Kondisi |
|---|---|
| `E401` | relasi tanpa id, atau id relasi duplikat |
| `E402` | relasi tanpa `op` |
| `E403` | relasi ke diri sendiri selain `call` rekursif dari `function` atau `method` |
| `E404` | relasi antara elemen dan leluhur atau keturunannya |
| `E405` | ujung relasi melanggar aturan `op` ([§9.4](/referensi/spesifikasi/relasi/#94-aturan-ujung-relasi)) |
| `E406` | arah `data` tidak cocok dengan `op`, atau `data` di relasi struktural maupun relasi ke endpoint |
| `E407` | relasi struktural di luar tabel [§7.5](/referensi/spesifikasi/level-kode/#75-relasi-di-level-kode) |

### 15.6 Endpoint

| Kode | Kondisi |
|---|---|
| `E501` | endpoint tanpa baris protokol, atau dengan lebih dari satu |
| `E502` | properti atau member tidak berlaku untuk protokol endpoint ini |
| `E503` | placeholder di path HTTP lengkap tanpa `param`, atau `param` tanpa placeholder |
| `E504` | status `returns` HTTP di luar 200–399, status `throws` HTTP di luar 400–599, atau kode status gRPC tidak dikenal |
| `E505` | dua endpoint dalam satu container dengan kontrak yang sama (HTTP: method dan path lengkap; gRPC: service dan rpc; GraphQL: operasi dan field; event: nama dan queue) |
| `E506` | `handler` tidak menunjuk `function` atau `method` di container yang sama |
| `E507` | queue di baris `event` tidak menunjuk container berperan `queue` |
| `E508` | `auth none` dengan scope, atau kunci `rate` duplikat di satu elemen |
| `E509` | `body` pada `get` atau `head` |
| `E510` | `prefix`, `auth`, atau `rate` di elemen tanpa endpoint yang cocok di bawahnya |

### 15.7 Komposisi dan flow

| Kode | Kondisi |
|---|---|
| `E601` | file yang di-`import` atau di-`amends` tidak bisa dibaca |
| `E602` | import melingkar |
| `E603` | `import`, `amends`, `remove`, `flow`, atau `environment` di dalam blok, atau `import` sebelum `amends` |
| `E604` | `amends` bukan statement kedua, atau ditulis lebih dari sekali |
| `E605` | `extend` mengisi properti yang sudah terisi, di file yang bukan `amends` |
| `E606` | `remove` atau `unset` di file yang bukan `amends` |
| `E607` | target `remove` cocok dengan lebih dari satu jenis (elemen, relasi, flow, environment) |
| `E608` | `unset` tidak langsung di dalam blok `extend`, menghapus sesuatu yang tidak ada, atau menghapus properti wajib |
| `E609` | target `extend` belum dideklarasikan |
| `E610` | `step` merujuk id relasi yang tidak ada |
| `E611` | id flow duplikat, atau id cabang duplikat dalam satu flow |
| `E612` | flow tanpa langkah, cabang kosong, `alt` dengan kurang dari dua `case`, atau `par` dengan kurang dari dua `lane` |
| `E613` | `opt`, `case`, atau `lane` tanpa id atau label |

### 15.8 Deployment

| Kode | Kondisi |
|---|---|
| `E701` | container tidak di-`deploy` maupun di-`omit` di sebuah environment, di-`deploy` sekaligus di-`omit`, atau container eksternal di-`deploy` maupun di-`omit` |
| `E702` | `deploy` tidak menunjuk container |
| `E703` | `replicas` tidak ditulis atau kurang dari 1 |
| `E704` | relasi di environment yang ujungnya bukan `infra` atau `deploy`, tanpa ujung `infra`, atau dengan `op` selain `use` dan `call` |
| `E705` | id environment duplikat |
