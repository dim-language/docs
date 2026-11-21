---
title: Spesifikasi bahasa
description: Spesifikasi normatif bahasa dim v0.5, dari struktur leksikal sampai semantik zoom, level kode, komposisi file, flow, endpoint HTTP, dan bentuk kanonik.
---

**Versi 0.5** · Ekstensi file `.dim`

Compiler SDK dan editor mendukung DIM v0.5. Fungsi `compileProject` menghasilkan model JSON v0.5. Viewer juga dapat membuka model JSON v0.4.

:::note[Perubahan dari 0.4]
- Deklarasi versi `dim "0.5";` di awal file ([§4.6](/referensi/spesifikasi/sintaks/#46-deklarasi-versi)).
- `this` sebagai awal path, merujuk elemen yang bloknya sedang ditulis ([§7.1](/referensi/spesifikasi/model/#71-this)).
- Atribut `source`: lokasi implementasi elemen, berupa path atau URL ([§6.5](/referensi/spesifikasi/model/#65-lokasi-implementasi-source)).
- Rujukan tipe: nama di string tipe (`data`, `param`, `returns`, dst.) dihubungkan ke elemen `code` berform tipe, dan nama elemen tipe wajib unik di seluruh model ([§6.6](/referensi/spesifikasi/model/#66-rujukan-tipe)).
- `unset` di file `amends` untuk menghapus atribut, termasuk mematikan flag ([§11.3](/referensi/spesifikasi/komposisi-dan-flow/#113-amends-dan-remove)).
- Bentuk kanonik teks `.dim`, yang wajib dihasilkan formatter dan editor ([§14](/referensi/spesifikasi/bentuk-kanonik/#14-bentuk-kanonik)).
- `dim`, `this`, dan `unset` menjadi keyword, jadi tidak bisa lagi dipakai sebagai id elemen.
- Output JSON: `source` di node, `refs` di setiap tempat yang memuat tipe, dan `code.typeRefs` ([§9](/referensi/spesifikasi/output/#9-format-output-json)).
:::

### Migrasi model v0.4

Jalankan `compileProject` pada file utama dan pada setiap model turunan yang dipakai sendiri. Jika sebuah ID memakai keyword seperti `dim` atau `unset`, ubah ID beserta path yang merujuknya. Untuk `E025`, beri nama berbeda pada tipe yang mewakili konsep berbeda, misalnya `ShopConfig` dan `PaymentConfig`, lalu perbarui string tipe yang sesuai. Jika keduanya mewakili satu kontrak, definisikan tipenya sekali dan pakai nama yang sama pada setiap rujukan.

File tanpa deklarasi versi mengikuti aturan terbaru. Deklarasi versi berlaku per file sehingga menambahkan `dim "0.5";` pada file utama hanya menyatakan versi file itu.

`dim` adalah bahasa untuk mendeskripsikan arsitektur software sebagai **satu model hierarkis** yang bisa di-zoom. Konsepnya diambil dari [C4 model](https://c4model.com), dengan dua perbedaan utama:

1. Semua level (system, container, component, code) ada di **satu model**, bukan diagram terpisah.
2. Relasi boleh menghubungkan elemen di **level mana pun**. Relasi di level yang lebih tinggi tidak ditulis, tapi **diturunkan** dari relasi yang lebih detail (lihat [§10 Semantik zoom](/referensi/spesifikasi/semantik-zoom/#10-semantik-zoom-lifting)).

---

## Bab spesifikasi

- [§3 Struktur leksikal](/referensi/spesifikasi/sintaks/#3-struktur-leksikal)
- [§4 Grammar](/referensi/spesifikasi/sintaks/#4-grammar)
- [§5 Model elemen](/referensi/spesifikasi/model/#5-model-elemen)
- [§6 Atribut yang dikenal](/referensi/spesifikasi/model/#6-atribut-yang-dikenal)
- [§7 Resolusi path](/referensi/spesifikasi/model/#7-resolusi-path)
- [§8 Validasi](/referensi/spesifikasi/validasi/#8-validasi)
- [§9 Format output (JSON)](/referensi/spesifikasi/output/#9-format-output-json)
- [§10 Semantik zoom (lifting)](/referensi/spesifikasi/semantik-zoom/#10-semantik-zoom-lifting)
- [§11 Komposisi file](/referensi/spesifikasi/komposisi-dan-flow/#11-komposisi-file)
- [§12 Flow](/referensi/spesifikasi/komposisi-dan-flow/#12-flow)
- [§13 Endpoint HTTP](/referensi/spesifikasi/endpoint-http/#13-endpoint-http)
- [§14 Bentuk kanonik](/referensi/spesifikasi/bentuk-kanonik/#14-bentuk-kanonik)
- [§15 Rencana versi berikutnya](/referensi/spesifikasi/bentuk-kanonik/#15-rencana-versi-berikutnya)

---

## 1. Prinsip desain

1. **Tulis relasi di level paling detail yang kamu tahu.** Kalau tahu fungsinya, tulis dari fungsi. Kalau cuma tahu container-nya, tulis dari container. Keduanya valid.
2. **Level tinggi itu turunan, bukan tulisan.** `system → system` muncul otomatis dari relasi di bawahnya, jadi diagram level tinggi tidak bisa basi atau bertentangan dengan detailnya.
3. **Zoom out meringkas, tidak membuang.** Relasi hasil lifting tetap membawa daftar relasi asalnya.
4. **Parser tidak tahu soal tampilan.** Parser hanya menghasilkan model (node + edge). Zoom, lifting, aggregasi, dan layout dikerjakan konsumen (frontend).

---

## 2. Contoh singkat

```dim
person customer "Customer" {
  description "Belanja online";
}

system shop "Online Shop" {
  container web "Web App" {
    tech "Next.js";
    ui;
    component checkout "Checkout Page" {
      code button "CheckoutButton.onClick()";
    }
  }

  container api "API" {
    tech "Rust/axum";
    component checkout "Checkout" {
      code handler "handle_checkout()";
    }
    component orders "Orders" {
      code repo "OrderRepository" {
        code find "find_by_id()";
        code save "save()";
      }
    }
  }

  container db "Postgres" {
    tech "PostgreSQL";
    shape database;
  }
}

system payment "Payment Gateway" {
  external;
  container gateway "Gateway API";
}

customer -> shop.web.checkout.button "Klik checkout";
shop.web.checkout.button -> shop.api.checkout.handler "POST /checkout" {
  op call;
  tech "HTTPS/JSON";
  data push "CheckoutRequest";
  data pull "OrderId";
}
shop.api.checkout.handler -> shop.api.orders.repo.save "Simpan order" { op call; data push "Order" }
shop.api.orders.repo.save -> shop.db "INSERT orders" { op write; data "Order" }
shop.api.orders.repo.find -> shop.db "SELECT orders" { op read; data "Order" }
shop.api.checkout.handler -> payment.gateway "Charge" {
  op call;
  tech "HTTPS";
  data push "ChargeRequest";
  data pull "ChargeResult";
}
```
