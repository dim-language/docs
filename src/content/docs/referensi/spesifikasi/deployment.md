---
title: Deployment
description: Environment, node, infra, dan penempatan container, serta cara relasi digambar di view deployment.
---

## 13. Deployment

Model software menjawab **software-nya terdiri dari apa**. Deployment menjawab pertanyaan lain: **di mana software itu berjalan**. Hierarkinya berbeda (environment → region → cluster → mesin), dan hubungannya banyak-ke-banyak: satu container bisa berjalan di beberapa tempat, dan satu node menjalankan banyak container. Karena itu deployment adalah **hierarki kedua** yang merujuk ke model software, bukan bagian dari nesting-nya.

```dim
environment production "Production" {
  description "Region Jakarta, dua availability zone.";

  node jakarta "AWS Jakarta" {
    tech aws;

    infra cdn "CloudFront" { role cdn; tech cloudfront; }
    infra lb "Load Balancer" { role loadBalancer; tech alb; }

    node cluster "EKS" {
      tech kubernetes;
      deploy webPods shop.web { replicas 2; }
      deploy apiPods shop.api { replicas 3; }
    }

    node rds "RDS" {
      tech postgres;
      deploy primary shop.db { replicas 1; }
    }
  }

  omit shop.reports;

  edge: jakarta.cdn -> jakarta.lb { op use; }
  route: jakarta.lb -> jakarta.cluster.webPods { op use; }
}
```

### 13.1 `environment`

```dim
environment <id> "<nama>" { ... }
```

- Hanya di top-level (`E603`). Id environment unik di seluruh model dan punya namespace sendiri (`E705`).
- Isinya `description`, `tags`, `meta`, `node`, `omit`, dan relasi infra ([§13.5](#135-relasi-di-environment)).
- **Setiap container harus tercatat** di setiap environment: di-`deploy` minimal sekali, atau dinyatakan tidak ada dengan `omit <path-container>;`. Container yang tidak tercatat, atau yang di-`deploy` sekaligus di-`omit`, adalah `E701`. Aturan ini memaksa setiap environment menyatakan isinya dengan lengkap.
- Container eksternal ([§6.4](/referensi/spesifikasi/model/#64-external)) tidak di-deploy dan tidak di-omit (`E701`). Container eksternal selalu digambar di luar node.

### 13.2 `node`

```dim
node <id> "<nama>" { ... }
```

Node adalah tempat yang menjalankan sesuatu: region, data center, cluster, mesin virtual, atau runtime.

- Boleh di dalam `environment` atau `node` lain, tanpa batas kedalaman.
- Properti: `description`, `tech`, `tags`, `meta`.
- Isinya: `node`, `infra`, dan `deploy`.

### 13.3 `infra`

```dim
infra <id> "<nama>" { role <peran>; ... }
```

Elemen yang hanya ada di level infrastruktur dan bukan bagian dari model software.

| `role` | Arti |
|---|---|
| `loadBalancer` | membagi traffic ke beberapa instance |
| `cdn` | cache konten di tepi jaringan |
| `dns` | resolusi nama domain |
| `firewall` | menyaring traffic jaringan |
| `apiGateway` | pintu masuk API: routing, auth, rate limit |

- Boleh di dalam `node`. `role` wajib (`E205`).
- Properti: `role`, `description`, `tech`, `tags`, `meta`.

### 13.4 `deploy`

```dim
deploy <id> <path-container> { replicas <INT>; }
```

- Menempatkan sebuah container ke node. Path yang tidak menunjuk container adalah `E702`.
- `replicas` wajib dan minimal `1` (`E703`).
- Satu container boleh di-deploy berkali-kali, di node yang sama maupun berbeda, misalnya di dua region.
- Properti lain: `description`, `tags`, `meta`.

### 13.5 Relasi di environment

Relasi di model software **tidak ditulis ulang**. View deployment menurunkannya sendiri ([§14.5](/referensi/spesifikasi/semantik-zoom/#145-view-deployment)).

Relasi yang ditulis di dalam environment hanya untuk elemen infra, yang tidak ada di model software:

- Ujungnya harus `infra` atau `deploy` di environment yang sama, dan minimal satu ujung harus `infra` (`E704`).
- `op`-nya hanya `use` atau `call` (`E704`).
- Relasi infra boleh ditulis di blok `environment` atau `node`. Path-nya di-resolve dengan aturan [§6.9](/referensi/spesifikasi/model/#69-resolusi-path) di dalam hierarki environment itu.

### 13.6 Hubungan dengan `amends`

`amends` dan `environment` menjawab pertanyaan yang berbeda dan dipakai bersama:

- `amends` membuat **varian arsitektur**, misalnya *as-is* dan *to-be*.
- `environment` menyatakan **tempat software berjalan** untuk satu varian arsitektur.

File `amends` boleh menambah environment, mengubahnya lewat `extend`, atau menghapusnya lewat `remove`. Target `extend` boleh berupa environment atau node di dalamnya, misalnya `extend production.jakarta { … }`: segmen pertama path dicari sebagai id environment kalau tidak ada elemen top-level dengan id itu. Kalau keduanya ada, `E607`.
