---
title: Sintaks
description: Struktur leksikal dan grammar bahasa dim.
---

## 3. Struktur leksikal

### 3.1 Encoding
File `.dim` di-encode sebagai UTF-8. Identifier dibatasi ke ASCII. String boleh berisi Unicode apa pun.

### 3.2 Whitespace
Spasi, tab, dan baris baru (`\n`, `\r\n`) diabaikan, kecuali sebagai pemisah token. Baris baru **tidak** bermakna: akhir statement ditandai `;` atau `}` (lihat [§4.1](#41-ebnf)). Jadi satu statement boleh dipecah ke beberapa baris, dan beberapa statement boleh ditulis dalam satu baris.

### 3.3 Komentar
```dim
// komentar sampai akhir baris
/* komentar blok,
   boleh lintas baris, tidak boleh nested */
```

### 3.4 Identifier
```
IDENT = [A-Za-z_][A-Za-z0-9_]*
```
Case-sensitive. Tanda `-` tidak diizinkan supaya tidak bentrok dengan `->`.

### 3.5 Keyword
Keyword berikut **reserved** dan tidak boleh dipakai sebagai identifier elemen:

| Keyword | Status |
|---|---|
| `person`, `system`, `container`, `component`, `code` | dipakai (jenis elemen) |
| `import`, `amends`, `extend`, `remove` | dipakai (komposisi file, [§11](/referensi/spesifikasi/komposisi-dan-flow/#11-komposisi-file)) |
| `flow` | dipakai ([§12](/referensi/spesifikasi/komposisi-dan-flow/#12-flow)) |
| `dim` | dipakai (deklarasi versi, [§4.6](#46-deklarasi-versi)) |
| `this` | dipakai (awal path, [§7.1](/referensi/spesifikasi/model/#71-this)) |
| `unset` | dipakai (menghapus atribut di file `amends`, [§11.3](/referensi/spesifikasi/komposisi-dan-flow/#113-amends-dan-remove)) |

Nama atribut (`tech`, `description`, dst.) **bukan** keyword. Elemen boleh bernama `tech`; parser membedakannya dari konteks ([§4.3](#43-membedakan-statement)).

### 3.6 String
```dim
"teks biasa"
"dengan \"kutip\" dan \\ backslash"
```
Escape yang didukung: `\"`, `\\`, `\n`, `\t`. Escape lain adalah error. String biasa tidak boleh mengandung baris baru literal; untuk teks panjang, pakai string multi-baris.

### 3.7 String multi-baris
```dim
container api "API" {
  description """
    Backend utama.
    Menangani checkout dan order.
    """;
}
```
Nilai string di atas adalah `"Backend utama.\nMenangani checkout dan order."`.

Aturan:
1. `"""` pembuka harus langsung diikuti baris baru. Baris itu tidak ikut jadi isi.
2. `"""` penutup harus berada di barisnya sendiri, hanya didahului spasi/tab. Baris baru sebelum penutup tidak ikut jadi isi.
3. Indentasi di depan `"""` penutup dibuang dari **setiap** baris isi. Setiap baris isi yang tidak kosong harus diawali indentasi yang persis sama; kalau tidak, error `E004`.
4. Escape sama dengan string biasa. `"` tunggal di dalam isi tidak perlu di-escape.

Di semua tempat yang menerima STRING, string biasa dan multi-baris setara.

### 3.8 Simbol
`{` `}` `->` `.` `::` `:` `;`

Lexer memakai *maximal munch*: `::` selalu dibaca sebagai satu token. Jadi `a:::shop` dibaca `a` `::` `:` `shop` (error); tulis `a: ::shop` dengan spasi.

### 3.9 Bilangan bulat
```
INT = [0-9]+
```
Bilangan hanya dipakai sebagai nilai atribut, mis. status HTTP ([§13](/referensi/spesifikasi/endpoint-http/#13-endpoint-http)). Tidak ada tanda minus, pecahan, atau pemisah ribuan. Bilangan yang langsung diikuti huruf atau `_` (mis. `60s`) adalah error `E001`; nilai seperti itu ditulis sebagai string (`"5/60s"`).

Identifier tidak boleh diawali angka ([§3.4](#34-identifier)), jadi bilangan tidak pernah bentrok dengan id.

---

## 4. Grammar

### 4.1 EBNF

```text
file          = { item } [ simple ] EOF ;
block         = "{" { item } [ simple ] "}" ;

item          = simple ";"
              | compound
              | ";" ;

simple        = element_head
              | relation_head
              | attribute
              | "dim" STRING
              | "import" STRING
              | "amends" STRING
              | "remove" path
              | "unset" IDENT { value } ;
compound      = element_head block
              | relation_head block
              | "extend" path block
              | "flow" IDENT [ STRING ] block ;

element_head  = KIND IDENT [ STRING ] ;
relation_head = [ IDENT ":" ] path "->" path [ STRING ] ;
attribute     = IDENT { value } ;

path          = [ "::" ] IDENT { "." IDENT }
              | "this" { "." IDENT } ;
value         = STRING | IDENT | INT ;

KIND          = "person" | "system" | "container" | "component" | "code" ;
```

Aturan `;` dalam bahasa sehari-hari:

1. Statement **tanpa blok** diakhiri `;`: `tech "Next.js";`, `container gateway "Gateway API";`, `a -> b "label";`.
2. Statement **dengan blok** berakhir di `}`, tanpa `;` setelahnya.
3. `;` pada statement terakhir sebelum `}` (atau sebelum akhir file) **boleh dihilangkan**, jadi `{ op call }` dan `{ op call; tech "HTTPS" }` valid.
4. `;` berlebih (mis. `;;` atau `};`) diabaikan.

```dim
container api "API" {
  tech "Rust/axum";      // ✅ diakhiri ;
  component orders;      // ✅ elemen tanpa blok
}                        // ✅ tidak perlu ; setelah }

container api "API"
{                        // ✅ baris baru tidak bermakna
  tech "Rust/axum"
  ui                     // ❌ E032: dibaca sebagai tech "Rust/axum" ui (dua nilai)
}
```

### 4.2 Elemen
```dim
<kind> <id> ["<nama>"] [{ ... }]
```
- `id` dipakai untuk referensi (path). `nama` adalah label untuk manusia.
- Kalau `nama` tidak ditulis, nilainya sama dengan `id`.
- Blok elemen boleh berisi atribut, elemen anak, dan relasi.

### 4.3 Membedakan statement
Parser cukup melihat paling banyak dua token ke depan:

| Token pertama | Token kedua | Statement |
|---|---|---|
| `KIND` | apa pun | element |
| `dim` | apa pun | deklarasi versi ([§4.6](#46-deklarasi-versi)) |
| `import`, `amends`, `extend`, `remove`, `unset` | apa pun | komposisi ([§11](/referensi/spesifikasi/komposisi-dan-flow/#11-komposisi-file)) |
| `flow` | apa pun | flow ([§12](/referensi/spesifikasi/komposisi-dan-flow/#12-flow)) |
| `::`, `this` | apa pun | relation |
| `IDENT` | `.`, `->`, atau `:` | relation |
| `IDENT` | lainnya | attribute |

Contoh: `tech "Next.js"` adalah atribut, sedangkan `tech -> db` adalah relasi dari elemen bernama `tech`.

### 4.4 Relasi
```dim
[<id>:] <path> -> <path> ["<label>"] [{ ... }]
```
Blok relasi hanya boleh berisi atribut.

`<id>:` opsional, untuk memberi relasi nama yang stabil supaya bisa dirujuk oleh `step` di `flow` ([§12](/referensi/spesifikasi/komposisi-dan-flow/#12-flow)) dan oleh `remove` ([§11.3](/referensi/spesifikasi/komposisi-dan-flow/#113-amends-dan-remove)). Lihat [§9](/referensi/spesifikasi/output/#9-format-output-json) untuk id default kalau tidak ditulis.

```dim
checkout_post: button -> handler "POST /checkout" { op call }
```

**Rekursi.** Relasi dari sebuah elemen ke dirinya sendiri hanya boleh untuk rekursi langsung: kedua ujungnya elemen `code` yang sama dan `op`-nya `call`. Selain itu error `E021`. Rekursi tidak langsung (`a → b → a`) cukup ditulis sebagai relasi biasa; konsumen bisa mendeteksinya sebagai siklus.

```dim
walk -> walk "telusuri anak berikutnya" { op call }
```

**Arah panah = siapa yang memulai interaksi**, bukan arah aliran data. `api -> db { op read }` berarti `api` yang membaca dari `db`; datanya mengalir dari `db` ke `api`, tapi panahnya tetap `api -> db`. Arah data dinyatakan lewat atribut `data` ([§6.3](/referensi/spesifikasi/model/#63-aliran-data)).

### 4.5 Atribut
```dim
<key> [value ...]
```
Atribut adalah pasangan key dengan nol atau lebih nilai. Atribut tanpa nilai disebut *flag* (misalnya `external`). Atribut yang dikenal dan tipenya ada di [§6](/referensi/spesifikasi/model/#6-atribut-yang-dikenal). Atribut di top-level file adalah error.

### 4.6 Deklarasi versi
```dim
dim "0.5";
amends "main.dim";
```

`dim "<MAJOR>.<MINOR>";` menyatakan versi bahasa yang dipakai untuk menulis file ini.

- Opsional. File tanpa deklarasi dibaca dengan versi terbaru yang didukung parser.
- Kalau ditulis, harus menjadi statement pertama di file (sebelum `amends`), hanya sekali, dan hanya di top-level (`E005`).
- Nilainya dua bilangan bulat dipisah `.`, tanpa nol di depan (`"0.5"`, `"1.0"`). Format lain, atau versi yang lebih baru dari yang didukung parser, adalah `E006`. Pesannya menyebut versi yang didukung.
- Versi yang lebih lama dari parser tetap dibaca dengan aturan parser. Selama masih 0.x, versi minor boleh tidak kompatibel dengan sebelumnya, jadi diagnostik untuk file seperti itu boleh menyebut versi yang ditulisnya.
- Setiap file punya deklarasinya sendiri. File yang di-`import` atau di-`amends` boleh menulis versi yang berbeda dengan file yang memuatnya.
- `version` di output JSON ([§9](/referensi/spesifikasi/output/#9-format-output-json)) adalah versi format output parser, bukan versi yang ditulis di file.
