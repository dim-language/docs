# DESIGN.md: situs dokumentasi dim

Arah visual untuk `apps/docs`. Ditetapkan bersama pemilik project; jadi acuan setiap perubahan UI.

## Design Read

Reading this as: situs dokumentasi bahasa diagram, untuk software engineer dan arsitek, dalam bahasa visual **kartografi** (peta cetak), dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

- **ENERGY 2**: punya karakter yang jelas (kertas, tinta, rute), tapi halaman referensi tetap harus tenang dibaca lama.
- **RHYTHM 2**: halaman docs konsisten; landing punya beberapa jeda komposisi (peta lebar, lalu blok teks + kode asimetris).
- **MOTION 1**: peta mengikuti gerakan zoom dan geser tanpa animasi tambahan.

## Identitas

dim adalah peta arsitektur yang bisa di-zoom. Situsnya dibuat seperti peta cetak:

| Keputusan | Alasan |
|---|---|
| Latar kertas peta hangat (`#F5F1E6`), teks tinta biru-hitam (`#15232B`) | Meniru kertas dan tinta peta cetak; hangat tapi kontrasnya tinggi untuk bacaan panjang. |
| Mode gelap "peta malam" (`#10181D`) dengan teks kertas | Banyak pembaca docs developer memakai tema gelap; toggle bawaan Starlight dipertahankan dan kedua mode diverifikasi. |
| Satu aksen: **vermilion rute** (`#B23A16` terang, `#F0997A` gelap) | Di peta, rute yang sedang dilihat ditandai merah. Dipakai untuk link, item aktif, dan rute yang di-highlight di peta zoom. Tidak dipakai untuk dekorasi. |
| Batas wilayah (elemen yang sedang dibuka) digambar **garis putus-putus**; tempat (elemen tertutup) digambar **kotak solid** | Konvensi peta: batas administratif putus-putus, tempat solid. Ini membedakan "wilayah yang sedang kamu masuki" dari "tempat yang bisa dibuka". |
| Label jenis elemen (`system`, `container`, ...) ditulis small caps dengan tracking ringan | Konvensi label kelas fitur di peta. Hanya dipakai di label jenis pada peta zoom, tidak di heading. |

**Logo** (`public/favicon.svg`, `public/apple-touch-icon.png`) memakai tiga siku tinta dan satu kotak vermilion untuk menggambarkan empat level zoom, dari sistem sampai kode. Favicon SVG mengikuti `prefers-color-scheme`. Header memakai logo transparan (`src/assets/logo-light.svg` / `logo-dark.svg`) sesuai tema situs, di samping teks "dim" berwarna tinta.

**Motif identitas:** peta membuka detail saat diperbesar. Kontrol menampilkan skala dalam persen dan tombol untuk memperbesar, memperkecil, dan menampilkan seluruh peta.

## Tipografi

| Peran | Font | Alasan |
|---|---|---|
| Teks | Source Sans 3 | Humanist sans keturunan tradisi label peta (Frutiger/Myriad); jelas di ukuran kecil dan bacaan panjang. |
| Heading | Source Serif 4 (600) | Judul peta cetak tradisional memakai serif; satu keluarga desain dengan Source Sans 3 jadi tetap serasi. |
| Kode | IBM Plex Mono | Mono yang tegas dan mudah dibedakan (`0`/`O`, `1`/`l`), terasa teknis tanpa jadi gaya "terminal". |

Semua font di-host sendiri lewat `@fontsource` (tidak ada request ke pihak ketiga yang memblokir render).

## Palet

Inti: kertas, tinta, vermilion. Abu-abu adalah turunan tinta di atas kertas. Tidak ada gradien, glow, atau glass.

| Token | Terang | Gelap |
|---|---|---|
| Latar | `#F5F1E6` | `#10181D` |
| Permukaan nav | `#FAF7EF` | `#18232A` |
| Teks kuat | `#15232B` | `#F7F3E8` |
| Teks | `#2C3A41` | `#CFCBBE` |
| Teks redup | `#4F5A5E` | `#8E9893` |
| Aksen (rute) | `#B23A16` | `#F0997A` |

Semua pasangan teks/latar, termasuk warna token di blok kode, lolos WCAG AA. Dicek dengan skrip; rasio terendah 5.15:1 (abu-abu level 4 di mode terang).

## Yang sengaja tidak dipakai

Gradien, glow, glassmorphism, background grid, ilustrasi generik, statistik, testimoni, dan bingkai jendela terminal palsu di blok kode.
