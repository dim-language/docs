---
title: Petakan tempat software berjalan
description: Menulis environment, node, infra, dan penempatan container, lalu membaca relasi di view deployment.
---

Tim platform ingin tahu container mana yang berjalan di cluster yang sama sebelum mengganti versi Kubernetes. Tulis environment produksi, tempatkan setiap container ke node-nya, dan baca relasi yang melintasi node.

Model software menjawab **software-nya terdiri dari apa**. Deployment menjawab **di mana software itu berjalan**. Hierarkinya berbeda (environment → region → cluster → mesin), dan satu container bisa berjalan di banyak tempat. Karena itu deployment adalah hierarki kedua yang merujuk ke model software, bukan bagian dari nesting-nya.

```dim
environment production "Production" {
  description "Satu region AWS, dengan database terkelola.";

  node aws "AWS Jakarta" {
    tech aws;

    infra cdn "CloudFront" { role cdn; tech cloudfront; }

    node cluster "EKS" {
      tech kubernetes;
      deploy webPods shop.web { replicas 2; }
      deploy apiPods shop.api { replicas 3; }
    }

    node rds "RDS" {
      tech postgres;
      deploy primary shop.db { replicas 1; }
    }

    node legacy "VM laporan" {
      deploy reportsVm shop.reports { replicas 1; }
    }
  }

  serveWeb: aws.cdn -> aws.cluster.webPods { op use; }
}
```

## Empat jenis elemen

| Elemen | Isinya |
|---|---|
| `environment` | satu lingkungan: production, staging, satu region |
| `node` | tempat yang menjalankan sesuatu: region, cluster, mesin; boleh bersarang |
| `infra` | elemen yang hanya ada di infrastruktur: `loadBalancer`, `cdn`, `dns`, `firewall`, `apiGateway` |
| `deploy` | penempatan satu container ke node, dengan jumlah `replicas` |

## Setiap container harus tercatat

Di setiap environment, setiap container milik kita harus di-`deploy` minimal sekali, atau dinyatakan tidak ada dengan `omit`:

```dim
environment staging "Staging" {
  node vm "Satu VM" {
    deploy web shop.web { replicas 1; }
    deploy api shop.api { replicas 1; }
    deploy db shop.db { replicas 1; }
  }

  omit shop.reports;
}
```

Container yang lupa dicatat adalah error `E701`. Aturan ini membuat setiap environment menyatakan isinya dengan lengkap, jadi container baru yang belum punya tempat langsung ketahuan. Container eksternal, seperti payment gateway, tidak di-deploy dan selalu digambar di luar node.

## Relasi tidak ditulis ulang

Relasi di model software tidak ditulis lagi di environment. View deployment menurunkannya: kalau ada relasi dari sesuatu di `shop.api` ke `shop.db`, view production menggambar `apiPods → primary`, lalu me-lift-nya ke `EKS → RDS` saat kedua node itu tertutup.

Relasi yang ditulis di environment hanya untuk elemen `infra`, yang memang tidak ada di model software, seperti `serveWeb` di contoh pertama.

## Dengan `amends`

Model *to-be* yang menambah container juga harus menempatkannya. Pakai `extend` untuk menambah node ke environment yang sudah ada:

```dim
extend production.aws {
  node managed "Layanan terkelola" {
    deploy analyticsDb shop.analytics { replicas 1; }
    deploy eventsQueue shop.events { replicas 1; }
  }
}
```

`remove` pada sebuah container ikut menghapus semua `deploy` dan `omit`-nya.

Aturan lengkapnya ada di [spesifikasi §13](/referensi/spesifikasi/deployment/#13-deployment).

## Cek hasilnya

Tambahkan container baru ke `shop.dim`, lalu jalankan `dim check main.dim`. Pesannya `E701` dan menyebut environment yang belum mencatatnya. Tambahkan `deploy` atau `omit` untuk container itu, dan pastikan pemeriksaannya lolos.
