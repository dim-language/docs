---
title: Endpoint HTTP
description: Kontrak endpoint HTTP, pewarisan atribut, dan relasi ke endpoint.
---

## 13. Endpoint HTTP

Elemen `code` dengan `form endpoint` adalah satu route HTTP: method dan path, siapa yang boleh memanggilnya, batas lajunya, input yang diterima, dan respons yang mungkin. Tujuannya sama dengan [§6.4](/referensi/spesifikasi/model/#64-detail-kode): kontrak endpoint terbaca dari model tanpa membuka source.

dim tidak menggantikan OpenAPI. Contoh request/response, skema field, dan pesan validasi per field tetap di dokumen referensi API. Di dim, tipe body cukup ditulis sebagai nama (`"LoginRequest"`), dan kalau perlu dideskripsikan sebagai `code` berform `struct`.

### 13.1 Contoh

```dim
system app "App" {
  container web "Web App" {
    ui;
    component login "Login Page" {
      code submit "LoginForm.submit()" {
        form function;
        description "Mengirim email dan password ke API.";
        async;
      }
    }
  }

  container api "API" {
    tech "NestJS";
    prefix "/v1";
    auth bearer;
    rate ip "100/1m";
    rate session "200/1m";

    component auth "AuthController" {
      prefix "/auth";

      code login "login()" {
        form endpoint;
        http POST "/login";
        auth none;
        rate ip "5/1m";
        description "Masuk dengan email atau username dan password.";
        body "LoginRequest" "identifier dan password";
        returns "AuthSession" "access token, masa berlaku, dan langkah berikutnya";
        sets cookie "refreshToken" "httpOnly, hanya dikirim ke /v1/auth/refresh";
        throws 401 "Identifier atau password salah";
        throws 403 "Sudah login";
      }

      code refresh "refresh()" {
        form endpoint;
        http POST "/refresh";
        auth cookie;
        rate ip "10/1m";
        description "Menukar refresh token dengan access token baru. Refresh token ikut dirotasi.";
        header "X-Refresh-Request-Id" "UUID" "Mencegah dua tab me-refresh bersamaan";
        cookie "refreshToken" "string";
        returns "AuthSession";
        sets cookie "refreshToken" "Refresh token baru";
        throws 401 "Sesi kedaluwarsa atau token tidak valid";
        throws 403 "Origin tidak dipercaya";
      }
    }

    component memberships "MembershipsController" {
      prefix "/memberships";
      auth bearer "members:manage";
      rate session "5/1m";

      code suspend "suspend()" {
        form endpoint;
        http POST "/{id}/suspend";
        description "Menangguhkan anggota. Anggota yang ditangguhkan tidak bisa masuk ke akun ini sampai diaktifkan lagi.";
        param id "UUID" "Id membership";
        returns "MembershipStatus";
        throws 403 "Mengubah membership sendiri";
        throws 404 "Membership tidak ditemukan";
        throws 409 "Membership tidak aktif";
      }
    }
  }

  login_post: web.login.submit -> api.auth.login;
}
```

Relasi `login_post` tidak menulis `op`, label, maupun `data`. Semuanya diambil dari endpoint ([§13.5](#135-relasi-ke-endpoint)): `op call`, label `"POST /v1/auth/login"`, `data push "LoginRequest"`, dan `data pull "AuthSession"`.

### 13.2 Atribut endpoint

| Atribut | Nilai | Keterangan |
|---|---|---|
| `http` | METHOD STRING | wajib. Method dan path, relatif terhadap `prefix` leluhur ([§13.4](#134-pewarisan)) |
| `param` | IDENT STRING [STRING], boleh berulang | parameter path: nama, tipe, keterangan |
| `query` | STRING STRING [STRING], boleh berulang | parameter query: nama, tipe, keterangan |
| `header` | STRING STRING [STRING], boleh berulang | header request: nama, tipe, keterangan |
| `cookie` | STRING STRING [STRING], boleh berulang | cookie request: nama, tipe, keterangan |
| `body` | STRING [STRING] | tipe body request dan keterangannya |
| `status` | INT | status respons sukses. Default `200` |
| `returns` | STRING [STRING] | tipe body respons sukses dan keterangannya |
| `throws` | INT [STRING], boleh berulang | status error dan kapan terjadi |
| `sets` | `cookie`\|`header` STRING [STRING], boleh berulang | cookie atau header yang di-set di respons: jenis, nama, keterangan |
| `auth`, `rate` | | lihat [§13.3](#133-auth-rate-dan-prefix) |

Endpoint hanya boleh memakai atribut di tabel ini, ditambah `form`, `description`, `tags`, dan `source`; atribut lain adalah `E031`. Sebaliknya, `http`, `query`, `header`, `cookie`, `body`, `status`, dan `sets` hanya berlaku untuk endpoint (`E031`).

Aturan:
- `http` wajib (`E060`). Method yang dikenal: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, huruf besar semua. Selain itu `E061`.
- Path diawali `/` dan tidak diakhiri `/`, kecuali path `"/"` itu sendiri. Parameter path ditulis `{nama}`, dengan `nama` berupa IDENT. Pelanggaran adalah `E062`.
- Setiap placeholder di path lengkap (termasuk yang berasal dari `prefix`) harus punya tepat satu `param` dengan nama yang sama, dan setiap `param` harus punya placeholder-nya (`E063`).
- `status` harus 200–399. Status `throws` harus 400–599. Pelanggaran adalah `E064`.
- `throws` dengan status yang sama boleh ditulis berkali-kali untuk alasan yang berbeda.
- Nama `param`, `query`, dan `cookie` unik dalam satu endpoint. Nama `header` juga unik, tanpa membedakan huruf besar-kecil. Duplikat adalah `E036`.
- `body` pada `GET` atau `HEAD` mendapat warning `W042`.
- Endpoint wajib punya `description` (`W020`) dan aturan penempatannya ada di [§6.4](/referensi/spesifikasi/model/#64-detail-kode) (`W021`).

Respons 401 untuk endpoint yang `auth`-nya bukan `none`, dan 429 untuk endpoint yang punya `rate`, tidak perlu ditulis di `throws`. Konsumen disarankan menampilkannya sebagai respons tersirat.

### 13.3 `auth`, `rate`, dan `prefix`

Ketiga atribut ini boleh ditulis di `container`, `component`, dan `code` berform `module`, `class`, atau `endpoint` (`prefix` tidak di `endpoint`). Di luar endpoint, nilainya menjadi default untuk semua endpoint di bawahnya ([§13.4](#134-pewarisan)). Kalau elemen itu bukan endpoint dan tidak punya endpoint di bawahnya, warning `W043`.

**`auth <skema> ["<syarat>" ...]`** menyatakan cara memanggil endpoint.

| Skema | Arti |
|---|---|
| `none` | publik, tanpa kredensial |
| `bearer` | header `Authorization: Bearer <token>` |
| `cookie` | sesi dari cookie |
| `basic` | HTTP Basic |
| `apikey` | API key di header atau query |

Skema lain menghasilkan warning `W040` dan diteruskan apa adanya. `syarat` adalah string bebas yang semuanya harus terpenuhi, mis. role, permission, atau kondisi sesi (`"owner"`, `"members:manage"`, `"reauth"`). `none` tidak boleh punya syarat (`E032`).

**`rate <kunci> "<n>/<jendela>"`** menyatakan batas laju. `kunci` adalah dasar penghitungannya:

| Kunci | Dihitung per |
|---|---|
| `ip` | alamat IP client |
| `session` | sesi login |
| `user` | user |
| `account` | akun/tenant |
| `key` | API key |

Kunci lain menghasilkan warning `W041`. `n` adalah bilangan bulat ≥ 1, `jendela` adalah bilangan bulat ≥ 1 diikuti satuan `s`, `m`, `h`, atau `d`. Jadi `"5/60s"` dan `"5/1m"` sama artinya. Format lain adalah `E064`. Satu kunci paling banyak sekali per elemen (`E036`); kunci berbeda boleh ditulis bersamaan.

**`prefix "<path>"`** menyatakan awalan path untuk semua endpoint di bawahnya. Aturan penulisannya sama dengan path `http` (`E062`), termasuk boleh berisi placeholder. `param` untuk placeholder di `prefix` ditulis di setiap endpoint.

### 13.4 Pewarisan

Nilai efektif setiap endpoint dihitung dari endpoint itu dan leluhurnya:

1. **Path lengkap** adalah semua `prefix` leluhur, dari atas ke bawah, disambung dengan path `http`. Path `"/"` tidak menambah apa-apa ke prefix; kalau tidak ada prefix sama sekali, path lengkapnya `/`.
2. **`auth`** diambil dari elemen terdekat yang menulisnya: endpoint itu sendiri, lalu parent-nya, terus ke atas. Skema dan syaratnya diambil utuh, tidak digabung dengan level lain. Kalau tidak ada yang menulis, `auth` tidak diketahui.
3. **`rate`** diambil per kunci, dari elemen terdekat yang menulis kunci itu. Kunci yang berbeda dari level berbeda berlaku bersamaan.

Pewarisan dihitung dari model akhir, setelah semua `import`, `extend`, `amends`, dan `remove` diterapkan ([§11.4](/referensi/spesifikasi/komposisi-dan-flow/#114-urutan-penerapan)). Jadi `extend app.api { auth bearer }` berlaku untuk semua endpoint di dalam `app.api`.

Nilai efektif untuk contoh di [§13.1](#131-contoh):

| Endpoint | Route | `auth` | `rate` |
|---|---|---|---|
| `login` | `POST /v1/auth/login` | `none` | ip 5/1m, session 200/1m |
| `refresh` | `POST /v1/auth/refresh` | `cookie` | ip 10/1m, session 200/1m |
| `suspend` | `POST /v1/memberships/{id}/suspend` | `bearer "members:manage"` | ip 100/1m, session 5/1m |

Dua endpoint dalam satu container tidak boleh punya method dan path lengkap yang sama (`E065`). Nama placeholder diabaikan saat membandingkan, jadi `/{id}` dan `/{membershipId}` dianggap sama. Endpoint di container berbeda boleh sama, karena itu dua service yang berbeda.

### 13.5 Relasi ke endpoint

Untuk relasi interaksi yang targetnya (`to`) endpoint, bagian yang tidak ditulis diambil dari kontrak endpoint:

| Bagian | Kalau tidak ditulis |
|---|---|
| `op` | `call` |
| label | `"<METHOD> <path lengkap>"`, mis. `"POST /v1/auth/login"` |
| `data` | `push` tipe `body` dan `pull` tipe `returns`, yang ada saja. Kalau endpoint tidak punya keduanya, aturan biasa [§6.3](/referensi/spesifikasi/model/#63-aliran-data) berlaku. |

- Yang ditulis selalu menang, per bagian. Kalau `data` ditulis sekali saja, semua data relasi itu diambil dari tulisan.
- Panah hasil lifting ([§10.3](/referensi/spesifikasi/semantik-zoom/#103-aggregasi)) memakai label dan `data` hasil isian ini.
- Relasi yang berawal dari endpoint (mis. `login -> db`) tidak terpengaruh.

Alasannya sama dengan prinsip kedua di [§1](/referensi/spesifikasi/#1-prinsip-desain): kontrak endpoint cukup ditulis sekali. Relasi dari beberapa client ke endpoint yang sama tidak perlu mengulang method, path, dan tipe datanya, jadi tidak bisa basi saat endpoint berubah.

### 13.6 Output

Untuk `form endpoint`, `code.http` berisi kontrak yang sudah diwariskan. Untuk `login` di [§13.1](#131-contoh):

```json
{
  "method": "POST",
  "path": "/v1/auth/login",
  "status": 200,
  "auth": { "scheme": "none", "requires": [], "from": "app.api.auth.login" },
  "rate": [
    { "key": "ip", "limit": 5, "window": 60, "from": "app.api.auth.login" },
    { "key": "session", "limit": 200, "window": 60, "from": "app.api" }
  ],
  "query": [],
  "headers": [],
  "cookies": [],
  "body": { "type": "LoginRequest", "description": "identifier dan password", "refs": [] },
  "sets": [
    { "kind": "cookie", "name": "refreshToken", "description": "httpOnly, hanya dikirim ke /v1/auth/refresh" }
  ]
}
```

- `path` adalah path lengkap ([§13.4](#134-pewarisan)).
- `from` adalah id elemen yang menulis nilai itu, supaya konsumen bisa menunjukkan asal nilai warisan.
- `auth` bernilai `null` kalau tidak diketahui. `body` bernilai `null` kalau tidak ditulis.
- `window` dalam detik.
- `rate` urut berdasarkan kunci: `ip`, `session`, `user`, `account`, `key`, lalu kunci lain sesuai abjad.
- Entri `query`, `headers`, dan `cookies` berbentuk `{ "name", "type", "description", "refs" }`, urut sesuai tulisan.
- `param`, `returns`, dan `throws` tetap di `code.params`, `code.returns`, dan `code.throws`. `throws[].type` berisi status sebagai string (`"401"`), supaya bentuk `throws` sama untuk semua form.

Elemen lain yang menulis `prefix`, `auth`, atau `rate` mendapat `httpDefaults` berisi nilai yang ditulis di elemen itu saja, tanpa warisan. Untuk `app.api` di [§13.1](#131-contoh):

```json
{
  "prefix": "/v1",
  "auth": { "scheme": "bearer", "requires": [] },
  "rate": [
    { "key": "ip", "limit": 100, "window": 60 },
    { "key": "session", "limit": 200, "window": 60 }
  ]
}
```

Field yang tidak ditulis bernilai `null` (`prefix`, `auth`) atau `[]` (`rate`).
