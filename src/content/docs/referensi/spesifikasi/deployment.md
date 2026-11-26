---
title: Deployment
description: Environments, nodes, infra, and container placement, and how relations are drawn in the deployment view.
---

## 13. Deployment

The software model answers **what the software is made of**. Deployment answers a different question: **where it runs**. Its hierarchy is different (environment → region → cluster → machine), and the relationship is many-to-many: one container can run in several places, and one node runs many containers. So deployment is a **second hierarchy** that refers to the software model, not part of its nesting.

```dim
environment production "Production" {
  description "Jakarta region, two availability zones.";

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
environment <id> "<name>" { ... }
```

- Only at the top level (`E603`). Environment ids are unique across the model and have their own namespace (`E705`).
- It contains `description`, `tags`, `meta`, `node`, `omit`, and infra relations ([§13.5](#135-relations-in-an-environment)).
- **Every container must be accounted for** in every environment: `deploy`ed at least once, or declared absent with `omit <container-path>;`. A container that isn't accounted for, or one that's both deployed and omitted, is `E701`. This rule makes every environment state its content completely.
- External containers ([§6.4](/referensi/spesifikasi/model/#64-external)) are neither deployed nor omitted (`E701`). They're always drawn outside nodes.

### 13.2 `node`

```dim
node <id> "<name>" { ... }
```

A node is something that runs things: a region, a data center, a cluster, a virtual machine, or a runtime.

- Allowed inside an `environment` or another `node`, nested to any depth.
- Properties: `description`, `tech`, `tags`, `meta`.
- Contents: `node`, `infra`, and `deploy`.

### 13.3 `infra`

```dim
infra <id> "<name>" { role <role>; ... }
```

An element that exists only at the infrastructure level and isn't part of the software model.

| `role` | Meaning |
|---|---|
| `loadBalancer` | spreads traffic across instances |
| `cdn` | caches content at the edge of the network |
| `dns` | resolves domain names |
| `firewall` | filters network traffic |
| `apiGateway` | the entry point for APIs: routing, auth, rate limiting |

- Allowed inside a `node`. `role` is required (`E205`).
- Properties: `role`, `description`, `tech`, `tags`, `meta`.

### 13.4 `deploy`

```dim
deploy <id> <container-path> { replicas <INT>; }
```

- Places a container on a node. A path that doesn't point to a container is `E702`.
- `replicas` is required and at least `1` (`E703`).
- A container can be deployed many times, on the same node or different ones, for example in two regions.
- Other properties: `description`, `tags`, `meta`.

### 13.5 Relations in an environment

Relations from the software model are **not written again**. The deployment view derives them itself ([§14.5](/referensi/spesifikasi/semantik-zoom/#145-deployment-view)).

Relations written inside an environment are only for infra elements, which don't exist in the software model:

- Their ends must be `infra` or `deploy` in the same environment, and at least one end must be `infra` (`E704`).
- Their `op` can only be `use` or `call` (`E704`).
- Infra relations can be written in an `environment` or `node` block. Their paths resolve with the rules in [§6.9](/referensi/spesifikasi/model/#69-path-resolution) within that environment's hierarchy.

### 13.6 Relationship to `amends`

`amends` and `environment` answer different questions and are used together:

- `amends` creates **architecture variants**, such as *as-is* and *to-be*.
- `environment` states **where the software runs** for one architecture variant.

An `amends` file can add environments, change them with `extend`, or remove them with `remove`. An `extend` target can be an environment or a node inside one, for example `extend production.jakarta { … }`: the first segment of the path is looked up as an environment id if no top-level element has that id. If both exist, `E607`.
