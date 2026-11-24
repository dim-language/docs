---
title: Document an endpoint
description: Write an HTTP, gRPC, GraphQL, or event contract as an endpoint, with auth, rate limits, inputs, and responses, and let relations from callers use it.
---

The sign-in team adds a route that exchanges an email and password for a session. Write its contract as an endpoint in the component that handles it, so every caller refers to the same route.

An endpoint is a component's **interface**. It stands on its own, separate from the code that handles it, so an API contract can be written before its code exists, or without modeling the code level at all. The contract is written once. Relations from callers take their label and data from it.

```dim
system app "App" {
  container web "Web App" {
    role app;
    paradigm functional;

    component login "Login Page" {
      description "The sign-in form.";

      function submit "LoginForm.submit()" {
        description "Sends the email and password to the API.";
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
      description "Sign-in and token refresh.";
      prefix "/auth";

      record credentials "LoginRequest" {
        description "An email and password.";
        field email: string;
        field password: string;
      }

      record session "AuthSession" {
        description "An access token and when it expires.";
        field accessToken: string;
        field expiresAt: datetime;
      }

      record invalidCredentials "InvalidCredentials" {
        description "The email or password is wrong.";
        field attemptsLeft: int;
      }

      endpoint login "Sign in" {
        description "Signs in with an email and password.";
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

## The protocol line

Every endpoint has **exactly one protocol line** that states its protocol and address, the way a route is written in code:

| Protocol | Protocol line |
|---|---|
| HTTP | `http post "/orders";` |
| gRPC | `grpc "OrderService" "GetOrder";` |
| GraphQL | `graphql query "order";` |
| Event | `event "OrderPlaced" on ::shop.events;` |

The rest of the contract depends on the protocol:

| Protocol | Contents |
|---|---|
| HTTP | `param` (path), `query`, `header`, `cookie`, `body`, `returns <status> [<type>]` (required), `throws <status> <type>`, `sets` |
| gRPC | `request`, `returns` (both required), `stream`, `throws <code> <type>` |
| GraphQL | `param` (arguments), `returns` (required), `throws <type>` |
| Event | `payload` (required) |

Every placeholder in an HTTP path (`{id}`) must have a `param` with the same id, and the other way around. Types are dim type expressions, as at the [code level](/en/konsep/level-kode/). Per-field schemas and example requests stay in API documents such as OpenAPI.

## Inherited from above

`prefix`, `auth`, and `rate` can be written on a container or component. They apply to every endpoint below:

- **The full path** is every `prefix` from the outside in, followed by the endpoint's path. In the example above: `/v1` + `/auth` + `/login`.
- **`auth`** comes from the nearest element that writes it. `login` writes `auth none`, so it's public even though its container is `auth bearer`.
- **`rate`** is taken per key. `login` writes `rate ip 5 per 1m`, which replaces the container's `ip` limit.

| Endpoint | Route | `auth` | `rate` |
|---|---|---|---|
| `login` | `POST /v1/auth/login` | `none` | ip 5 per 1m |

Known `auth` schemes: `none`, `bearer`, `cookie`, `basic`, `apiKey`. Requested scopes refer to `scope` declarations in [dim.config](/en/menulis/konfigurasi/), for example `auth bearer ordersWrite;`. Known `rate` keys: `ip`, `user`, `session`, `apiKey`.

## Who handles it

`handler` points to the `function` or `method` that implements the endpoint, in the same container:

```dim
endpoint post "Checkout" {
  description "Takes a cart from the web app and returns the new order's id.";
  http post "/checkout";
  handler route;
  body orders.cart;
  returns 201 orders.orderId;
}
```

`handler` is optional. An endpoint is valid without the code level.

## Relations to endpoints

The `loginPost` relation in the first example writes neither a label nor `data`. Both come from the endpoint:

| Part | Taken from the endpoint |
|---|---|
| label | `POST /v1/auth/login` |
| `data` | `push LoginRequest` from `body`, and `pull AuthSession` from `returns` |

Relations to HTTP, gRPC, and GraphQL endpoints use `op call`. Relations to event endpoints use `op publish` (the sender) or `op subscribe` (a receiver). Writing `data` on a relation to an endpoint is an error, because the contract must live in one place only. That way relations from several callers don't repeat the method, path, and data types, and can't go stale when the endpoint changes.

The full rules are in [specification §10](/en/referensi/spesifikasi/endpoint/#10-endpoints).

## Check the result

Follow `loginPost` to its endpoint. Join the prefixes and the path, then match `POST /v1/auth/login`, the `LoginRequest` body, and the `AuthSession` response against the route's test. Then change the path to `"/login/{attempt}"` without adding a `param`, and run `dim check`: the message is `E503`.
