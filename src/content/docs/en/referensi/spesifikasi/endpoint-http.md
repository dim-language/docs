---
title: HTTP endpoints
description: Endpoint contracts, inherited HTTP attributes, and relations to endpoints.
---

## 13. HTTP endpoints

A `code` element with `form endpoint` represents one HTTP route. It describes the method and path, who can call it, how often they can call it, what input it accepts, and how it responds. Like other [code contracts](/en/referensi/spesifikasi/model/#64-code-details), the endpoint is readable from the model.

Keep request and response examples, field schemas, and field-level validation messages in your API reference, such as OpenAPI. In dim, a body type can be a name like `"LoginRequest"`, with a corresponding `code` element using `form struct` if you need to describe it.

### 13.1 Example

```dim
system app "App" {
  container web "Web App" {
    ui;
    component login "Login Page" {
      code submit "LoginForm.submit()" {
        form function;
        description "Mengirim email dan password ke API.";
        async;
      }
    }
  }

  container api "API" {
    tech "NestJS";
    prefix "/v1";
    auth bearer;
    rate ip "100/1m";
    rate session "200/1m";

    component auth "AuthController" {
      prefix "/auth";

      code login "login()" {
        form endpoint;
        http POST "/login";
        auth none;
        rate ip "5/1m";
        description "Masuk dengan email atau username dan password.";
        body "LoginRequest" "identifier dan password";
        returns "AuthSession" "access token, masa berlaku, dan langkah berikutnya";
        sets cookie "refreshToken" "httpOnly, hanya dikirim ke /v1/auth/refresh";
        throws 401 "Identifier atau password salah";
        throws 403 "Sudah login";
      }

      code refresh "refresh()" {
        form endpoint;
        http POST "/refresh";
        auth cookie;
        rate ip "10/1m";
        description "Menukar refresh token dengan access token baru. Refresh token ikut dirotasi.";
        header "X-Refresh-Request-Id" "UUID" "Mencegah dua tab me-refresh bersamaan";
        cookie "refreshToken" "string";
        returns "AuthSession";
        sets cookie "refreshToken" "Refresh token baru";
        throws 401 "Sesi kedaluwarsa atau token tidak valid";
        throws 403 "Origin tidak dipercaya";
      }
    }

    component memberships "MembershipsController" {
      prefix "/memberships";
      auth bearer "members:manage";
      rate session "5/1m";

      code suspend "suspend()" {
        form endpoint;
        http POST "/{id}/suspend";
        description "Menangguhkan anggota. Anggota yang ditangguhkan tidak bisa masuk ke akun ini sampai diaktifkan lagi.";
        param id "UUID" "Id membership";
        returns "MembershipStatus";
        throws 403 "Mengubah membership sendiri";
        throws 404 "Membership tidak ditemukan";
        throws 409 "Membership tidak aktif";
      }
    }
  }

  login_post: web.login.submit -> api.auth.login;
}
```

`login_post` omits `op`, the label, and `data`. The [endpoint contract](#135-relations-to-endpoints) provides `op call`, label `"POST /v1/auth/login"`, `data push "LoginRequest"`, and `data pull "AuthSession"`.

### 13.2 Endpoint attributes

| Attribute | Value | Meaning |
|---|---|---|
| `http` | METHOD STRING | Required method and path relative to inherited `prefix` values ([§13.4](#134-inheritance)) |
| `param` | IDENT STRING [STRING], repeatable | Path parameter name, type, and description |
| `query` | STRING STRING [STRING], repeatable | Query parameter name, type, and description |
| `header` | STRING STRING [STRING], repeatable | Request header name, type, and description |
| `cookie` | STRING STRING [STRING], repeatable | Request cookie name, type, and description |
| `body` | STRING [STRING] | Request body type and description |
| `status` | INT | Success response status, default `200` |
| `returns` | STRING [STRING] | Success response body type and description |
| `throws` | INT [STRING], repeatable | Error status and when it occurs |
| `sets` | `cookie`\|`header` STRING [STRING], repeatable | Kind, name, and description of a response cookie or header |
| `auth`, `rate` | | See [§13.3](#133-auth-rate-and-prefix) |

An endpoint accepts the attributes in this table plus `form`, `description`, `tags`, and `source`. Other attributes raise `E031`. `http`, `query`, `header`, `cookie`, `body`, `status`, and `sets` are valid only on endpoints (`E031`).

- An endpoint requires `http` (`E060`). Valid methods are uppercase `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`. Other values raise `E061`.
- A path starts with `/` and has no trailing slash except for `"/"` itself. Write a path parameter as `{name}`, where the name is an IDENT. An invalid path raises `E062`.
- Each placeholder in the full path, including inherited prefixes, must have exactly one matching `param`, and each `param` must have a placeholder (`E063`).
- `status` must be 200–399, and HTTP statuses in `throws` must be 400–599 (`E064`).
- You can repeat a `throws` status to record different reasons.
- `param`, `query`, and `cookie` names are unique within an endpoint, as are header names compared case-insensitively. A duplicate raises `E036`.
- `body` on a `GET` or `HEAD` endpoint produces `W042`.
- Endpoints need a `description` (`W020`) and follow [code placement rules](/en/referensi/spesifikasi/model/#64-code-details) (`W021`).

Consumers should display 401 as implicit when an endpoint has an authentication scheme other than `none`, and 429 when it has a `rate` limit. Authors can omit those conditions from `throws`.

### 13.3 `auth`, `rate`, and `prefix`

These attributes apply to `container`, `component`, and the `code` forms `module`, `class`, and `endpoint`. `prefix` is allowed on ancestors only. Outside an endpoint, these attributes supply [defaults](#134-inheritance) for descendants. If a non-endpoint declares one and has no endpoints beneath it, report `W043`.

**`auth <scheme> ["<requirement>" ...]`** describes how to call the endpoint.

| Scheme | Meaning |
|---|---|
| `none` | Public, with no credentials |
| `bearer` | `Authorization: Bearer <token>` header |
| `cookie` | Session from a cookie |
| `basic` | HTTP Basic |
| `apikey` | API key in the header or query |

An unknown scheme raises `W040` and passes through unchanged. Requirements are free-form strings, such as a role, permission, or session state (`"owner"`, `"members:manage"`, `"reauth"`). All requirements must hold. `none` cannot specify requirements (`E032`).

**`rate <key> "<n>/<window>"`** sets a limit per key.

| Key | Counted per |
|---|---|
| `ip` | Client IP address |
| `session` | Login session |
| `user` | User |
| `account` | Account or tenant |
| `key` | API key |

Other keys produce `W041`. `n` is an integer ≥ 1. `window` is an integer ≥ 1 followed by `s`, `m`, `h`, or `d`. `"5/60s"` and `"5/1m"` are equivalent. Invalid formats raise `E064`. Each key can appear once per element (`E036`), and distinct keys can apply together.

**`prefix "<path>"`** sets a path prefix for descendant endpoints. It follows the `http` path syntax (`E062`) and may include placeholders. Each endpoint defines its own `param` for placeholders inherited from a prefix.

### 13.4 Inheritance

Compute effective values from the endpoint and its ancestors.

1. **Full path.** Concatenate ancestor `prefix` values from the top down, then append the `http` path. A path of `"/"` leaves the prefix as-is. When there is also no prefix, the full path is `/`.
2. **`auth`.** Take the nearest declaration, starting with the endpoint and walking up. Keep its scheme and requirements together. If there is no declaration, authentication is unknown.
3. **`rate`.** Take the nearest declaration for each key. Different keys can come from different levels.

Apply inheritance to the final model after [`import`, `extend`, `amends`, and `remove`](/en/referensi/spesifikasi/komposisi-dan-flow/#114-application-order). `extend app.api { auth bearer }` supplies a default for all endpoints inside `app.api`.

Effective values for the [example](#131-example):

| Endpoint | Route | `auth` | `rate` |
|---|---|---|---|
| `login` | `POST /v1/auth/login` | `none` | ip 5/1m, session 200/1m |
| `refresh` | `POST /v1/auth/refresh` | `cookie` | ip 10/1m, session 200/1m |
| `suspend` | `POST /v1/memberships/{id}/suspend` | `bearer "members:manage"` | ip 100/1m, session 5/1m |

Two endpoints in one container must have distinct method and full path pairs (`E065`). Ignore placeholder names when comparing paths, so `/{id}` and `/{membershipId}` are equivalent. Different containers can expose matching routes because they are separate services.

### 13.5 Relations to endpoints

When an interaction relation targets an endpoint via `to`, fill omitted parts from that contract.

| Part | Default |
|---|---|
| `op` | `call` |
| Label | `"<METHOD> <full path>"`, such as `"POST /v1/auth/login"` |
| `data` | `push` with the `body` type and `pull` with the `returns` type, using only those that exist. If both are absent, use the [ordinary data rules](/en/referensi/spesifikasi/model/#63-data-flow). |

- Explicit values take precedence for each part. A single explicit `data` entry replaces all inferred `data` for that relation.
- [Lifted arrows](/en/referensi/spesifikasi/semantik-zoom/#103-aggregation) use the resulting labels and data.
- Outgoing relations from an endpoint, such as `login -> db`, follow the ordinary rules.

This follows the second [design principle](/en/referensi/spesifikasi/#1-design-principles). Several clients can share one description of the endpoint and pick up changes to its method, path, and data types.

### 13.6 Output

On `form endpoint`, `code.http` contains the effective contract. For `login` in the [example](#131-example):

```json
{
  "method": "POST",
  "path": "/v1/auth/login",
  "status": 200,
  "auth": { "scheme": "none", "requires": [], "from": "app.api.auth.login" },
  "rate": [
    { "key": "ip", "limit": 5, "window": 60, "from": "app.api.auth.login" },
    { "key": "session", "limit": 200, "window": 60, "from": "app.api" }
  ],
  "query": [],
  "headers": [],
  "cookies": [],
  "body": { "type": "LoginRequest", "description": "identifier dan password", "refs": [] },
  "sets": [
    { "kind": "cookie", "name": "refreshToken", "description": "httpOnly, hanya dikirim ke /v1/auth/refresh" }
  ]
}
```

- `path` is the [full path](#134-inheritance).
- `from` identifies the element that supplied the value so a consumer can trace its origin.
- `auth` is `null` if unknown. `body` is `null` if omitted.
- `window` is in seconds.
- Sort `rate` keys as `ip`, `session`, `user`, `account`, and `key`, then sort the remaining keys alphabetically.
- `query`, `headers`, and `cookies` entries contain `name`, `type`, `description`, and `refs` in declaration order.
- `param`, `returns`, and `throws` remain in `code.params`, `code.returns`, and `code.throws`. `throws[].type` records the status as a string such as `"401"`, so all code forms use the same object shape.

An element other than an endpoint that declares `prefix`, `auth`, or `rate` gets `httpDefaults` with only the values it declares. The [example](#131-example) produces this for `app.api`:

```json
{
  "prefix": "/v1",
  "auth": { "scheme": "bearer", "requires": [] },
  "rate": [
    { "key": "ip", "limit": 100, "window": 60 },
    { "key": "session", "limit": 200, "window": 60 }
  ]
}
```

Omitted fields are `null` for `prefix` and `auth`, or `[]` for `rate`.
