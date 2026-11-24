---
title: Sintaks
description: Struktur leksikal dan grammar bahasa dim.
---

## 3. Struktur leksikal

### 3.1 Encoding
File `.dim` dan `dim.config` di-encode sebagai UTF-8 tanpa BOM. Identifier dibatasi ke ASCII. Prosa boleh berisi Unicode apa pun.

### 3.2 Whitespace
Spasi, tab, dan baris baru (`\n`, `\r\n`) diabaikan, kecuali sebagai pemisah token. Baris baru **tidak** bermakna: akhir statement ditandai `;` atau `}`.

### 3.3 Komentar
```dim
// komentar sampai akhir baris
/* komentar blok,
   boleh lintas baris, tidak boleh nested */
```

### 3.4 Identifier

```text
IDENT = [a-z][a-zA-Z0-9]*
```

Identifier ditulis dalam **camelCase**:

- Diawali huruf kecil, lalu huruf atau angka. Tanpa `_`, `-`, atau tanda lain.
- Tidak boleh ada dua huruf besar berturut-turut. Singkatan ditulis seperti kata biasa: `httpClient`, `parseUrl`, `apiKey`, bukan `HTTPClient` atau `parseURL`.

Identifier yang tidak memenuhi aturan ini adalah `E005`. Pesannya menyarankan bentuk camelCase yang benar.

Aturan yang sama berlaku untuk semua id: elemen, relasi, flow, cabang flow, member (`field`, `variant`, `param`), dan semua deklarasi di `dim.config`. Key di `meta` juga mengikuti aturan ini ([§6.8](/referensi/spesifikasi/model/#68-meta)).

Nama yang ditampilkan ke manusia bukan identifier. Nama itu prosa, jadi bebas: `function saveOrder "save_order()"`.

### 3.5 Keyword

Semua keyword ditulis dengan huruf kecil dan **reserved**: tidak boleh dipakai sebagai identifier (`E003`).

| Kelompok | Keyword |
|---|---|
| Kind elemen | `person`, `system`, `container`, `component`, `endpoint` |
| Baris protokol endpoint | `http`, `grpc`, `graphql`, `event`, `on` |
| Kind level kode | `module`, `function`, `class`, `interface`, `method`, `constructor`, `record`, `enum`, `union`, `alias` |
| Deployment | `environment`, `node`, `infra`, `deploy`, `omit` |
| Member | `field`, `variant`, `param`, `returns`, `throws`, `query`, `header`, `cookie`, `body`, `sets` |
| Komposisi dan flow | `dim`, `import`, `amends`, `extend`, `remove`, `unset`, `flow`, `step`, `opt`, `alt`, `case`, `par`, `lane` |
| Konfigurasi | `tech`, `tag`, `scope`, `root`, `style` |
| Properti | `description`, `tags`, `role`, `paradigm`, `external`, `source`, `path`, `line`, `repo`, `branch`, `version`, `url`, `meta`, `op`, `data`, `push`, `pull`, `handler`, `status`, `auth`, `rate`, `per`, `prefix`, `request`, `stream`, `payload`, `replicas`, `icon`, `background`, `kind`, `type`, `async`, `pure`, `effects`, `static`, `abstract`, `visibility` |
| Tipe | `string`, `int`, `float`, `decimal`, `bool`, `bytes`, `date`, `datetime`, `duration`, `uuid`, `url`, `map` |
| Lainnya | `this` |

Nilai enum, seperti nama `op` (`call`, `read`), peran (`database`), atau nama icon, **bukan** keyword. Nilai itu hanya dikenali di posisi properti yang memakainya, jadi elemen boleh bernama `call` atau `database`. Sebaliknya, keyword boleh muncul sebagai nilai enum, misalnya `graphql query` atau `type url`.

### 3.6 Prosa

```dim
"teks biasa"
"dengan \"kutip\" dan \\ backslash"
```

String hanya dipakai untuk prosa dan literal bertipe ([§3.9](#39-literal-bertipe)). Escape yang didukung: `\"`, `\\`, `\n`, `\t`. Escape lain, string yang tidak ditutup, atau string biasa yang berisi baris baru literal adalah `E002`.

Prosa tidak boleh kosong atau hanya berisi spasi (`E002`).

### 3.7 Prosa multi-baris

```dim
container api "API" {
  description """
    Backend utama.
    Menangani checkout dan order.
    """;
}
```

Nilai prosa di atas adalah `"Backend utama.\nMenangani checkout dan order."`.

1. `"""` pembuka harus langsung diikuti baris baru (`E002`). Baris itu tidak ikut jadi isi.
2. `"""` penutup harus berada di barisnya sendiri, hanya didahului spasi atau tab. Baris baru sebelum penutup tidak ikut jadi isi.
3. Indentasi di depan `"""` penutup dibuang dari setiap baris isi. Setiap baris isi yang tidak kosong harus diawali indentasi yang persis sama (`E004`).
4. Escape sama dengan string biasa. `"` tunggal di dalam isi tidak perlu di-escape.

Prosa multi-baris hanya boleh dipakai untuk `description`.

### 3.8 Bilangan dan durasi

```text
INT      = "0" | [1-9][0-9]*
DURATION = INT ( "ms" | "s" | "m" | "h" | "d" )
```

- `INT` adalah bilangan bulat non-negatif tanpa nol di depan. Tanda minus, pecahan, dan pemisah ribuan tidak ada.
- `DURATION` adalah bilangan diikuti satuan tanpa spasi: `500ms`, `30s`, `1m`, `6h`, `7d`.
- Bilangan yang langsung diikuti huruf lain, atau nol di depan, adalah `E008`.

Bilangan pecahan hanya ada di dalam `meta`, yang memakai aturan JSON ([§6.8](/referensi/spesifikasi/model/#68-meta)).

### 3.9 Literal bertipe

Beberapa properti menerima string yang isinya **diperiksa formatnya**. String seperti itu bukan prosa. Isi yang tidak sesuai format adalah `E007`, dan pesannya menyebut format yang diharapkan.

| Format | Aturan | Dipakai di |
|---|---|---|
| `url` | URL absolut berskema `https` atau `http` | `repo`, `url` di tech |
| `filePath` | relatif, pemisah `/`, tanpa `\`, tanpa `/` di akhir, tanpa segmen kosong; `.` berarti root itu sendiri; `..` tidak boleh | `path` di `source` |
| `httpPath` | diawali `/`, tidak diakhiri `/` kecuali `"/"`; parameter ditulis `{nama}` dengan nama berupa IDENT | path di baris `http`, dan `prefix` |
| `version` | huruf, angka, `.`, `+`, `-`; diawali huruf atau angka | `version` di tech |
| `branch` | nama ref git yang valid, tanpa spasi | `branch` di root |
| `externalName` | `[A-Za-z_][A-Za-z0-9_]*` | service dan rpc di baris `grpc`, field di baris `graphql`, nama di baris `event` |
| `headerName` | huruf, angka, dan `-`; tanpa membedakan huruf besar-kecil | `header`, `sets header` |
| `cookieName` | karakter token HTTP (RFC 9110) | `cookie`, `sets cookie` |
| `scopeValue` | huruf, angka, dan `:._-` | nilai `scope` di config |

### 3.10 Simbol

```text
{  }  ->  .  ::  :  ;  [  ]  ?  <  >  ,
```

Lexer memakai *maximal munch*: `::` dan `->` selalu dibaca sebagai satu token, dan `[]` boleh ditulis dengan atau tanpa spasi di antaranya.

---

## 4. Grammar

### 4.1 Bentuk umum

```text
file         = version { statement } EOF ;
version      = "dim" STRING ";" ;

statement    = head ";"
             | head block ;
block        = "{" { statement } "}" ;

element      = KIND IDENT STRING ;
relation     = IDENT ":" path "->" path [ STRING ] ;
property     = PROPERTY { value } ;
member       = MEMBER { value } [ ":" type ] [ STRING ] ;

path         = "::" IDENT { "." IDENT }
             | "this" { "." IDENT }
             | IDENT { "." IDENT } ;
type         = base { "[" "]" | "?" } ;
base         = PRIMITIVE | path | "map" "<" type "," type ">" ;
value        = IDENT | path | type | STRING | INT | DURATION ;
```

`head` adalah bagian statement sebelum `;` atau blok: kepala elemen, kepala relasi, properti, member, atau statement komposisi. Bentuk lengkap setiap statement ada di bab yang membahasnya.

Aturan `;`:

1. Setiap statement **tanpa blok** diakhiri `;`, termasuk statement terakhir sebelum `}`. `;` yang hilang adalah `E001`.
2. Statement **dengan blok** berakhir di `}`, tanpa `;` setelahnya.
3. `;` berlebih (`;;`, `};`) adalah `E001`.

```dim
container api "API" {
  role service;          // ✅
  tech kotlin            // ❌ E001: ; hilang
}
```

### 4.2 Elemen

```dim
<kind> <id> "<nama>" [{ ... }]
```

- `id` dipakai untuk rujukan (path). `nama` adalah prosa untuk manusia.
- Nama **wajib** untuk setiap elemen (`E203`).
- Elemen yang punya properti wajib (misalnya `role` di container) harus ditulis dengan blok.

### 4.3 Membedakan statement

Setiap statement bisa dikenali dari token pertamanya:

| Token pertama | Statement |
|---|---|
| kind elemen | elemen ([§6](/referensi/spesifikasi/model/#6-elemen), [§7](/referensi/spesifikasi/level-kode/#7-level-kode), [§13](/referensi/spesifikasi/deployment/#13-deployment)) |
| keyword member | member ([§7.4](/referensi/spesifikasi/level-kode/#74-member)) |
| keyword properti atau baris protokol | properti |
| keyword komposisi, flow, atau konfigurasi | statement itu |
| `IDENT` | relasi; token kedua harus `:` |

Karena semua nama properti adalah keyword, tidak ada statement yang ambigu.

### 4.4 Relasi

```dim
<id>: <path> -> <path> ["<label>"] { op <op>; ... }
<id>: <path> -> <path> ["<label>"] { op <op>; }
```

Id relasi dan `op` wajib. Detailnya ada di [§9](/referensi/spesifikasi/relasi/#9-relasi).

### 4.5 Properti

```dim
<properti> <nilai> ...;
<properti> { ... }
```

Properti adalah keyword dengan nol atau lebih nilai. Properti tanpa nilai disebut *flag* (misalnya `external`). Properti `source` dan `meta` memakai blok.

- Setiap properti hanya berlaku untuk kind tertentu. Properti yang tidak berlaku di tempat itu adalah `E204`.
- Setiap properti paling banyak muncul sekali per elemen, kecuali yang disebut boleh berulang. Duplikat adalah `E206`.
- Jumlah atau jenis nilai yang salah adalah `E207`.
- Properti di top-level file adalah `E001`.

### 4.6 Deklarasi versi

```dim
dim "0.6";
```

- **Wajib** sebagai statement pertama di setiap file `.dim` dan di `dim.config`, tepat sekali, di top-level (`E006`).
- Nilainya `"<MAJOR>.<MINOR>"`. Versi yang tidak didukung parser adalah `E006`; pesannya menyebut versi yang didukung.
- Semua file dalam satu proyek harus menulis versi yang sama (`E006`).
