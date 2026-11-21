---
title: HTTP endpoints
description: Describe an HTTP route with its authentication, rate limits, inputs, and responses so client relations can inherit the contract.
---

Write an HTTP route as a `code` element with `form endpoint`. Its contract records the method and path, who can call it, its rate limits, the input it accepts, and its possible responses. Write that contract once on the endpoint. Client relations can derive their labels and data from it.

```dim
system app "App" {
  container web "Web App" {
    ui;
    component login "Login Page" {
      code submit "LoginForm.submit()" {
        form function;
        description "Mengirim email dan password ke API.";
      }
    }
  }

  container api "API" {
    tech "NestJS";
    prefix "/v1";
    auth bearer;
    rate ip "100/1m";

    component auth "AuthController" {
      prefix "/auth";

      code login "login()" {
        form endpoint;
        http POST "/login";
        auth none;
        rate ip "5/1m";
        description "Masuk dengan email dan password.";
        body "LoginRequest" "email dan password";
        returns "AuthSession" "access token dan masa berlakunya";
        sets cookie "refreshToken" "httpOnly";
        throws 401 "Email atau password salah";
      }
    }
  }

  login_post: web.login.submit -> api.auth.login;
}
```

## The endpoint contract

| Attribute | Value |
|---|---|
| `http` | Required method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`) and path |
| `param` | Path parameter, such as `param id "UUID"` for `"/{id}"` |
| `query`, `header`, `cookie` | Name, type, and description of another request input |
| `body` | Request body type |
| `status` | Success status, with `200` as the default |
| `returns` | Success response body type |
| `throws` | Error status and when it occurs, as in `throws 404 "Order tidak ditemukan"` |
| `sets` | Cookie or header set in the response |

Each placeholder in the path, such as `{id}`, needs a `param` with the same name, and each `param` needs a corresponding placeholder. Write a type as a name such as `"LoginRequest"`. Keep field schemas and request examples in API documentation such as OpenAPI.

## Inherited settings

Set `prefix`, `auth`, and `rate` on a container, component, or controller class to apply them to the endpoints inside it.

- **Full path.** Join each `prefix` from the outside in, then append the `http` path. The example joins `/v1`, `/auth`, and `/login`.
- **`auth`.** The nearest declaration wins. `login` sets `auth none` to allow unauthenticated access even though its container sets `auth bearer`.
- **`rate`.** The nearest declaration wins for each key. `rate ip "5/1m"` on `login` overrides the container's `ip` limit. Limits under other keys still apply.

| Endpoint | Route | `auth` | `rate` |
|---|---|---|---|
| `login` | `POST /v1/auth/login` | `none` | ip 5/1m |

Supported authentication schemes are `none`, `bearer`, `cookie`, `basic`, and `apikey`. Put extra requirements after the scheme, as in `auth bearer "members:manage"`. Supported rate keys are `ip`, `session`, `user`, `account`, and `key`. A limit uses the format `"<count>/<window>"`, as in `"5/1m"` or `"1000/1d"`.

## Relations to an endpoint

The `login_post` relation gets its omitted attributes from the endpoint.

| Part | Derived value |
|---|---|
| `op` | `call` |
| Label | `"POST /v1/auth/login"` |
| `data` | `push "LoginRequest"` from `body` and `pull "AuthSession"` from `returns` |

Values written on the relation take precedence. When several clients call the same endpoint, keep the method, path, and data types on the endpoint so the relations pick up changes to the contract.

See [specification §13](/en/referensi/spesifikasi/endpoint-http/#13-http-endpoints) for the full rules.
