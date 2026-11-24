---
title: Dokumentasikan endpoint
description: Menulis kontrak HTTP, gRPC, GraphQL, atau event sebagai endpoint, lengkap dengan auth, rate limit, input, dan respons, lalu membiarkan relasi dari pemanggil memakai kontraknya.
---

Tim login menambah route untuk menukar email dan password dengan sesi. Tulis kontraknya sebagai endpoint di component yang menanganinya, supaya setiap pemanggil merujuk route yang sama.

Endpoint adalah **antarmuka** sebuah component. Endpoint berdiri sendiri, terpisah dari kode yang menanganinya, jadi kontrak API bisa ditulis sebelum kodenya ada, atau tanpa memodelkan level kode sama sekali. Kontrak ini cukup ditulis sekali. Relasi dari pemanggil mengambil label dan datanya dari sana.

```dim
system app "App" {
  container web "Web App" {
    role app;
    paradigm functional;

    component login "Login Page" {
      description "Formulir masuk.";

      function submit "LoginForm.submit()" {
        description "Mengirim email dan password ke API.";
        async;
        effects;
      }
    }
  }

  container api "API" {
    role service;
    tech nestjs;
    prefix "/v1";
    auth bearer;
    rate ip 100 per 1m;

    component accounts "AuthController" {
      description "Login dan refresh token.";
      prefix "/auth";

      record credentials "LoginRequest" {
        description "Email dan password.";
        field email: string;
        field password: string;
      }

      record session "AuthSession" {
        description "Access token dan masa berlakunya.";
        field accessToken: string;
        field expiresAt: datetime;
      }

      record invalidCredentials "InvalidCredentials" {
        description "Email atau password salah.";
        field attemptsLeft: int;
      }

      endpoint login "Masuk" {
        description "Masuk dengan email dan password.";
        http post "/login";
        auth none;
        rate ip 5 per 1m;
        body credentials;
        returns 200 session;
        throws 401 invalidCredentials;
        sets cookie "refreshToken" "httpOnly";
      }
    }
  }

  loginPost: web.login.submit -> api.accounts.login { op call; }
}
```

## Baris protokol

Setiap endpoint punya **tepat satu baris protokol** yang menyatakan protokol dan alamatnya, sama seperti route ditulis di kode:

| Protokol | Baris protokol |
|---|---|
| HTTP | `http post "/orders";` |
| gRPC | `grpc "OrderService" "GetOrder";` |
| GraphQL | `graphql query "order";` |
| Event | `event "OrderPlaced" on ::shop.events;` |

Isi kontraknya mengikuti protokol:

| Protokol | Isi |
|---|---|
| HTTP | `param` (path), `query`, `header`, `cookie`, `body`, `returns <status> [<tipe>]` (wajib), `throws <status> <tipe>`, `sets` |
| gRPC | `request`, `returns` (wajib keduanya), `stream`, `throws <kode> <tipe>` |
| GraphQL | `param` (argumen), `returns` (wajib), `throws <tipe>` |
| Event | `payload` (wajib) |

Setiap placeholder di path HTTP (`{id}`) harus punya `param` dengan id yang sama, dan sebaliknya. Tipe ditulis sebagai ekspresi tipe dim, sama seperti di [level kode](/konsep/level-kode/). Skema per field dan contoh request tetap di dokumen API seperti OpenAPI.

## Diwariskan dari atas

`prefix`, `auth`, dan `rate` boleh ditulis di container atau component. Nilainya berlaku untuk semua endpoint di bawahnya:

- **Path lengkap** adalah semua `prefix` dari luar ke dalam, disambung dengan path endpoint. Di contoh di atas: `/v1` + `/auth` + `/login`.
- **`auth`** diambil dari elemen terdekat yang menulisnya. `login` menulis `auth none`, jadi ia publik walaupun container-nya `auth bearer`.
- **`rate`** diambil per kunci. `login` menulis `rate ip 5 per 1m`, yang menggantikan `ip` dari container.

| Endpoint | Route | `auth` | `rate` |
|---|---|---|---|
| `login` | `POST /v1/auth/login` | `none` | ip 5 per 1m |

Skema `auth` yang dikenal: `none`, `bearer`, `cookie`, `basic`, `apiKey`. Scope yang diminta dirujuk dari deklarasi `scope` di [dim.config](/menulis/konfigurasi/), misalnya `auth bearer ordersWrite;`. Kunci `rate` yang dikenal: `ip`, `user`, `session`, `apiKey`.

## Siapa yang menangani

`handler` menunjuk `function` atau `method` yang mengimplementasikan endpoint, di container yang sama:

```dim
endpoint post "Checkout" {
  description "Menerima keranjang dari web dan mengembalikan id order baru.";
  http post "/checkout";
  handler route;
  body orders.cart;
  returns 201 orders.orderId;
}
```

`handler` opsional. Endpoint tetap valid tanpa level kode.

## Relasi ke endpoint

Relasi `loginPost` di contoh pertama tidak menulis label maupun `data`. Semuanya diambil dari endpoint:

| Bagian | Diambil dari endpoint |
|---|---|
| label | `POST /v1/auth/login` |
| `data` | `push LoginRequest` dari `body`, dan `pull AuthSession` dari `returns` |

Relasi ke endpoint HTTP, gRPC, dan GraphQL memakai `op call`. Relasi ke endpoint event memakai `op publish` (pengirim) atau `op subscribe` (penerima). Menulis `data` di relasi ke endpoint adalah error, karena kontraknya hanya boleh ada di satu tempat. Dengan begitu relasi dari beberapa pemanggil tidak perlu mengulang method, path, dan tipe datanya, dan tidak bisa basi saat endpoint berubah.

Aturan lengkapnya ada di [spesifikasi §10](/referensi/spesifikasi/endpoint/#10-endpoint).

## Cek hasilnya

Ikuti `loginPost` sampai endpoint. Gabungkan prefix dan path, lalu cocokkan `POST /v1/auth/login`, body `LoginRequest`, dan respons `AuthSession` dengan test route. Lalu ubah path menjadi `"/login/{attempt}"` tanpa menambah `param`, dan jalankan `dim check`: pesannya `E503`.
