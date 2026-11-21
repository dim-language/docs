---
title: Endpoint HTTP
description: Menulis route HTTP sebagai elemen code, lengkap dengan auth, rate limit, input, dan respons, lalu membiarkan relasi dari client mengambil kontraknya.
---

Route HTTP ditulis sebagai elemen `code` dengan `form endpoint`. Isinya adalah kontrak route itu: method dan path, siapa yang boleh memanggil, batas lajunya, input yang diterima, dan respons yang mungkin. Kontrak ini cukup ditulis sekali, di endpoint-nya. Relasi dari client mengambil label dan datanya dari sana.

```dim
system app "App" {
  container web "Web App" {
    ui;
    component login "Login Page" {
      code submit "LoginForm.submit()" {
        form function;
        description "Mengirim email dan password ke API.";
      }
    }
  }

  container api "API" {
    tech "NestJS";
    prefix "/v1";
    auth bearer;
    rate ip "100/1m";

    component auth "AuthController" {
      prefix "/auth";

      code login "login()" {
        form endpoint;
        http POST "/login";
        auth none;
        rate ip "5/1m";
        description "Masuk dengan email dan password.";
        body "LoginRequest" "email dan password";
        returns "AuthSession" "access token dan masa berlakunya";
        sets cookie "refreshToken" "httpOnly";
        throws 401 "Email atau password salah";
      }
    }
  }

  login_post: web.login.submit -> api.auth.login;
}
```

## Kontrak endpoint

| Atribut | Isi |
|---|---|
| `http` | wajib: method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`) dan path |
| `param` | parameter path, mis. `param id "UUID"` untuk `"/{id}"` |
| `query`, `header`, `cookie` | input lain: nama, tipe, keterangan |
| `body` | tipe body request |
| `status` | status sukses, default `200` |
| `returns` | tipe body respons sukses |
| `throws` | status error dan kapan terjadi, mis. `throws 404 "Order tidak ditemukan"` |
| `sets` | cookie atau header yang di-set di respons |

Setiap placeholder di path (`{id}`) harus punya `param` dengan nama yang sama, dan sebaliknya. Tipe ditulis sebagai nama saja (`"LoginRequest"`). Skema field dan contoh request tetap di dokumen API seperti OpenAPI, bukan di dim.

## Diwariskan dari atas

`prefix`, `auth`, dan `rate` boleh ditulis di container, component, atau class controller. Nilainya berlaku untuk semua endpoint di bawahnya:

- **Path lengkap** adalah semua `prefix` dari atas ke bawah, disambung dengan path `http`. Di contoh di atas: `/v1` + `/auth` + `/login`.
- **`auth`** diambil dari elemen terdekat yang menulisnya. `login` menulis `auth none`, jadi ia publik walaupun container-nya `auth bearer`.
- **`rate`** diambil per kunci. `login` menulis `rate ip "5/1m"`, yang menggantikan `ip` dari container. Kunci lain dari container tetap berlaku.

| Endpoint | Route | `auth` | `rate` |
|---|---|---|---|
| `login` | `POST /v1/auth/login` | `none` | ip 5/1m |

Skema `auth` yang dikenal: `none`, `bearer`, `cookie`, `basic`, `apikey`. Syarat tambahan ditulis setelahnya, mis. `auth bearer "members:manage"`. Kunci `rate` yang dikenal: `ip`, `session`, `user`, `account`, `key`, dengan format `"<jumlah>/<jendela>"` seperti `"5/1m"` atau `"1000/1d"`.

## Relasi ke endpoint

Relasi `login_post` di contoh di atas tidak menulis `op`, label, maupun `data`. Semuanya diambil dari endpoint:

| Bagian | Diambil dari endpoint |
|---|---|
| `op` | `call` |
| label | `"POST /v1/auth/login"` |
| `data` | `push "LoginRequest"` dari `body`, dan `pull "AuthSession"` dari `returns` |

Yang ditulis di relasi selalu menang. Karena kontraknya hanya ada di endpoint, relasi dari beberapa client ke endpoint yang sama tidak perlu mengulang method, path, dan tipe datanya, dan tidak bisa basi saat endpoint berubah.

Aturan lengkapnya ada di [spesifikasi §13](/referensi/spesifikasi/endpoint-http/#13-endpoint-http).
