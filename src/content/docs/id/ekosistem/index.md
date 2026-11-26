---
title: Alat untuk bekerja dengan DIM
description: Pilih alat untuk menulis, memvalidasi, atau membagikan peta.
---

## SDK TypeScript

Untuk mengecek model di terminal atau CI, jalankan skrip dari [tutorial](/id/mulai/). Untuk beberapa file, kirim file utama dan isi setiap import ke [`compileProject`](/id/referensi/cli/). Kode keluar skrip bisa dipakai sebagai hasil pemeriksaan CI.

## Peta web

Kalau reviewer perlu menjelajahi model di browser, [pasang peta di halaman Astro](/id/ekosistem/peta-web/). Pembaca bisa memperbesar peta dan memilih relasi.

## Editor DIM

Coba cara membaca model langsung di [peta checkout](/id/konsep/alur/). Untuk menjalankan aplikasi editor dari source, gunakan checkout repo utama DIM yang sudah menyertakan submodule dan toolchain project.

Setel `EXACT` ke checkout [Exact](https://github.com/expo/exact) pada commit `87e54bef26a99e068ccb04cc82c9d2965fa39651`.

```sh
moon run editor:build
bun run --cwd apps/editor start --loopback
```

Buka alamat lokal yang dicetak di terminal. Pilih panah API ke Postgres untuk menelusuri asal penulisan pesanan.
