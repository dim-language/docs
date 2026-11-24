---
title: Endpoints
description: A component's interface over HTTP, gRPC, GraphQL, and events, with inherited prefix, auth, and rate.
---

## 10. Endpoints

An endpoint is a component's **interface**: how others call it or receive its messages. An endpoint isn't a code concept. One endpoint can be implemented by a `function` (in Express, for example) or a `method` (in Spring, for example), so endpoints stand on their own under a component and only **point** to the code that handles them.

This means an API contract can be written before its code exists, or without modeling the code level at all.

dim doesn't replace OpenAPI, protobuf, or GraphQL schemas. Example requests and responses and per-field validation rules stay there. dim records the contract at the architecture level: who calls what, with which types, and what can fail.

```dim
component orders "Orders" {
  description "Creates and reads orders.";
  prefix "/orders";

  endpoint createOrder "Create order" {
    description "Creates an order from a cart.";
    http post "/";
    handler controller.create;
    auth bearer ordersWrite;
    rate user 10 per 1m;
    body cart;
    returns 201 order;
    throws 409 outOfStock "An item is out of stock";
  }
}
```

### 10.1 Protocol line

Every endpoint has **exactly one protocol line**. It states the protocol and the endpoint's address in that protocol at once, the way routes are written in code (`@PostMapping("/orders")`, `app.post("/orders")`).

| Protocol | Protocol line | Example |
|---|---|---|
| HTTP | `http <method> "<path>";` | `http post "/orders";` |
| gRPC | `grpc "<service>" "<rpc>";` | `grpc "OrderService" "GetOrder";` |
| GraphQL | `graphql <operation> "<field>";` | `graphql query "order";` |
| Event | `event "<name>" on <queue-path>;` | `event "OrderPlaced" on ::shop.events;` |

An endpoint with no protocol line, or more than one, is `E501`. A property or member that doesn't apply to the protocol is `E502`.

### 10.2 Common properties

| Property | Value | Notes |
|---|---|---|
| `description` | prose | required |
| `handler` | a path to a `function` or `method` | the code that handles this endpoint |
| `auth` | a scheme + scopes | [§10.7](#107-prefix-auth-and-rate); not for events |
| `rate` | a key, a count, a duration; repeatable | [§10.7](#107-prefix-auth-and-rate); not for events |
| `source`, `tags`, `meta` | | [§6.3](/en/referensi/spesifikasi/model/#63-common-properties) |

`handler` must point to a `function` or `method` in the same container (`E506`). The parser doesn't compare the handler's parameters with the endpoint contract.

### 10.3 HTTP

```dim
endpoint suspendMember "Suspend member" {
  description "Suspends a member until they're reactivated.";
  http post "/{memberId}/suspend";
  param memberId: uuid "Membership id";
  header "X-Request-Id": uuid "Prevents duplicate requests";
  returns 200 membershipStatus;
  throws 403 forbidden "Changing your own membership";
  throws 404 notFound "Membership not found";
}
```

Protocol line: `http <method> "<path>";`

- `method`: `get`, `post`, `put`, `patch`, `delete`, `head`, or `options`.
- `path`: an `httpPath` literal ([§3.9](/en/referensi/spesifikasi/sintaks/#39-typed-literals)), relative to `prefix` ([§10.7](#107-prefix-auth-and-rate)).

| Member | Form | Notes |
|---|---|---|
| `param` | `<id>: <type> ["note"]`, repeatable | a path parameter |
| `query` | `<id>: <type> ["note"]`, repeatable | a query parameter |
| `header` | `"<name>": <type> ["note"]`, repeatable | a request header; the name is a `headerName` literal |
| `cookie` | `"<name>": <type> ["note"]`, repeatable | a request cookie; the name is a `cookieName` literal |
| `body` | `<type>` | the request body |
| `returns` | `<status> [<type>] ["note"]` | required; the success response, with or without a body |
| `throws` | `<status> <type> ["note"]`, repeatable | an error response |
| `sets` | `cookie`\|`header` `"<name>"` `["note"]`, repeatable | a cookie or header set by the response |

Rules:

- Every `{name}` in the full path (including from `prefix`) must have exactly one `param` with the same id, and every `param` must have its placeholder (`E503`).
- A `returns` status must be 200–399. A `throws` status must be 400–599 (`E504`). `throws` with the same status can repeat for different types.
- `param` and `query` ids are unique within an endpoint. `header` names are unique, ignoring case. `cookie` names are unique. A duplicate is `E303`.
- A `body` on `get` or `head` is `E509`.
- Two HTTP endpoints in one container with the same method and full path are `E505`.

A 401 response for an endpoint whose `auth` isn't `none`, and a 429 for an endpoint with a `rate`, don't need to be written in `throws`. Consumers show them as implied responses.

### 10.4 gRPC

```dim
endpoint getOrder "Get order" {
  description "Fetches one order by its id.";
  grpc "OrderService" "GetOrder";
  request orderId;
  returns order;
  throws notFound orderMissing;
}
```

Protocol line: `grpc "<service>" "<rpc>";`. Both are `externalName` literals.

| Member or property | Form | Notes |
|---|---|---|
| `request` | `<type>` | required |
| `returns` | `<type>` | required |
| `stream` | `client`, `server`, or `bidi` | for streaming RPCs |
| `throws` | `<code> <type> ["note"]`, repeatable | a gRPC status code in camelCase |

Known status codes: `cancelled`, `unknown`, `invalidArgument`, `deadlineExceeded`, `notFound`, `alreadyExists`, `permissionDenied`, `resourceExhausted`, `failedPrecondition`, `aborted`, `outOfRange`, `unimplemented`, `internal`, `unavailable`, `dataLoss`, `unauthenticated`. Any other code is `E504`. Two gRPC endpoints in one container with the same service and rpc are `E505`.

### 10.5 GraphQL

```dim
endpoint orderQuery "Order query" {
  description "Fetches an order owned by the signed-in user.";
  graphql query "order";
  param id: uuid;
  returns order?;
  throws orderMissing;
}
```

Protocol line: `graphql <operation> "<field>";`

- `operation`: `query`, `mutation`, or `subscription`.
- `field`: an `externalName` literal, the field name on the root type.

| Member | Form | Notes |
|---|---|---|
| `param` | `<id>: <type> ["note"]`, repeatable | a field argument |
| `returns` | `<type>` | required |
| `throws` | `<type> ["note"]`, repeatable | an error returned in `errors` |

Two GraphQL endpoints in one container with the same operation and field are `E505`.

### 10.6 Events

```dim
endpoint orderPlaced "Order placed" {
  description "Sent after an order is saved.";
  event "OrderPlaced" on ::shop.events;
  payload order;
}
```

Protocol line: `event "<name>" on <queue-path>;`

- `name`: an `externalName` literal, the event name.
- `queue-path`: a path to a container with the `queue` role (`E507`).

| Member | Form | Notes |
|---|---|---|
| `payload` | `<type>` | required |

An event endpoint lives in the component that **owns** the event, usually its sender. The sender writes `publish` to this endpoint, and receivers write `subscribe` to it. Two event endpoints with the same name and queue are `E505`.

### 10.7 `prefix`, `auth`, and `rate`

```dim
container api "API" {
  role service;
  prefix "/v1";
  auth bearer;
  rate ip 100 per 1m;

  component accounts "Auth" {
    description "Sign-in and token refresh.";
    prefix "/auth";

    endpoint login "Sign in" {
      description "Signs in with an email and password.";
      http post "/login";
      auth none;
      rate ip 5 per 1m;
      body credentials;
      returns 200 session;
      throws 401 invalidCredentials;
    }
  }
}
```

| Property | Value | Applies to |
|---|---|---|
| `prefix` | an `httpPath` literal | `container`, `component` |
| `auth` | `none`, or a scheme followed by ≥0 scope references | `container`, `component`, `endpoint` |
| `rate` | `<key> <INT> per <DURATION>`, repeatable | `container`, `component`, `endpoint` |

- `auth` schemes: `none`, `bearer`, `cookie`, `basic`, `apiKey`. `auth none` can't be followed by scopes (`E508`). Scopes refer to `scope` declarations in `dim.config` (`E104`).
- `rate` keys: `ip`, `user`, `session`, `apiKey`. The same key twice on one element is `E508`.
- **Inheritance.** An endpoint uses its own `auth`, or that of the nearest ancestor that writes one. `rate` is inherited per key: for each key, the value from the nearest element that writes that key applies. `prefix` from every ancestor is joined from the outside in, and the endpoint's path is appended.
- `prefix` applies only to HTTP endpoints. `prefix`, `auth`, or `rate` on an element without a matching endpoint below it is `E510`.

### 10.8 Relations to endpoints

```dim
placeOrder: web.checkout -> api.orders.createOrder { op call; }
announceOrder: api.orders.checkoutService -> api.orders.orderPlaced { op publish; }
reserveStock: warehouse.stock -> ::shop.api.orders.orderPlaced { op subscribe; }
```

- `call` to HTTP, gRPC, or GraphQL endpoints. `publish` and `subscribe` to event endpoints. Any other `op` to an endpoint is `E405`.
- Relations to endpoints **don't write `data`** (`E406`). The data comes from the endpoint: `push` from `body`, `request`, `param`, or `payload`, and `pull` from `returns`.
- Derived labels are described in [§9.6](/en/referensi/spesifikasi/relasi/#96-labels).
