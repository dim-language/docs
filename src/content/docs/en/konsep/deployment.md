---
title: Map where software runs
description: Write environments, nodes, infra, and container placements, then read relations in the deployment view.
---

The platform team wants to know which containers run on the same cluster before upgrading Kubernetes. Write the production environment, place every container on its node, and read the relations that cross nodes.

The software model answers **what the software is made of**. Deployment answers **where it runs**. Its hierarchy is different (environment → region → cluster → machine), and one container can run in many places. So deployment is a second hierarchy that refers to the software model, not part of its nesting.

```dim
environment production "Production" {
  description "One AWS region, with a managed database.";

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

    node legacy "Reports VM" {
      deploy reportsVm shop.reports { replicas 1; }
    }
  }

  serveWeb: aws.cdn -> aws.cluster.webPods { op use; }
}
```

## Four kinds of element

| Element | What it holds |
|---|---|
| `environment` | one environment: production, staging, one region |
| `node` | something that runs things: a region, a cluster, a machine; can nest |
| `infra` | an element that exists only in the infrastructure: `loadBalancer`, `cdn`, `dns`, `firewall`, `apiGateway` |
| `deploy` | one container placed on a node, with its number of `replicas` |

## Every container must be accounted for

In every environment, every container we own must be `deploy`ed at least once, or declared absent with `omit`:

```dim
environment staging "Staging" {
  node vm "One VM" {
    deploy web shop.web { replicas 1; }
    deploy api shop.api { replicas 1; }
    deploy db shop.db { replicas 1; }
  }

  omit shop.reports;
}
```

A container that isn't accounted for is `E701`. This rule makes every environment state its content completely, so a new container without a place is caught right away. External containers, such as the payment gateway, aren't deployed and are always drawn outside the nodes.

## Relations aren't written again

Relations from the software model aren't written again in an environment. The deployment view derives them: if something in `shop.api` relates to `shop.db`, the production view draws `apiPods → primary`, then lifts it to `EKS → RDS` when both nodes are closed.

Relations written in an environment are only for `infra` elements, which don't exist in the software model, such as `serveWeb` in the first example.

## With `amends`

A *to-be* model that adds containers must place them too. Use `extend` to add nodes to an existing environment:

```dim
extend production.aws {
  node managed "Managed services" {
    deploy analyticsDb shop.analytics { replicas 1; }
    deploy eventsQueue shop.events { replicas 1; }
  }
}
```

`remove` on a container also removes all of its `deploy`s and `omit`s.

The full rules are in [specification §13](/en/referensi/spesifikasi/deployment/#13-deployment).

## Check the result

Add a new container to `shop.dim`, then run `dim check main.dim`. The message is `E701` and names the environment that doesn't account for it yet. Add a `deploy` or `omit` for the container, and confirm the check passes.
