# Product Requirements Document
## Raw Node.js HTTP Server — In-Memory User API

| Field | Value |
|---|---|
| Document Version | 1.0.0 |
| Status | Draft |
| Date | June 16, 2026 |
| Owner | Engineering Team |
| Stack | Node.js built-in `http` module — zero dependencies |
| Storage | In-memory array (runtime only, non-persistent) |

---

## 1. Overview

### 1.1 Purpose

This document defines the requirements for a lightweight RESTful HTTP server built exclusively with Node.js's native `http` module. The server exposes three routes to manage a collection of users whose data is stored entirely in an in-memory array — no database, no ORM, no third-party framework.

### 1.2 Goals

- Demonstrate raw Node.js HTTP handling without Express, Fastify, or any framework.
- Provide CRUD-like user management (list, create, fetch by ID) via clean REST conventions.
- Keep the implementation minimal, readable, and free of external npm dependencies.
- Serve as a learning reference or lightweight prototype foundation.

### 1.3 Non-Goals

- **Persistence** — data is lost on server restart.
- Authentication or authorization.
- PATCH / PUT / DELETE endpoints (out of scope for v1).
- Database integration of any kind.
- Production hardening (rate limiting, HTTPS, etc.).

---

## 2. Technical Context

### 2.1 Runtime Requirements

- Node.js v18 or later (LTS recommended).
- No npm packages required — stdlib only.
- Single-file implementation preferred (`server.js`).

### 2.2 Architecture Overview

The server is a single Node.js process with a manual routing layer implemented via URL pattern matching and HTTP method inspection. All application state (the users array) lives in module scope.

**Request lifecycle:**

1. Incoming request hits the `http.createServer` callback.
   - `req.method` + `req.url` are read to determine routing.
2. Router matches against three registered patterns (exact and parameterized).
   - Unmatched routes return `404` JSON.
3. Handler processes the request, reads/mutates the in-memory array, and writes a JSON response.

---

## 3. API Routes

### 3.1 Route Summary

| Method | Path | Description | Status Codes |
|---|---|---|---|
| `GET` | `/users` | Return all users in the store | 200 |
| `POST` | `/users` | Create a new user | 201, 400 |
| `GET` | `/users/:id` | Return a single user by ID | 200, 404 |

---

### 3.2 `GET /users`

**Behaviour**

- Responds with the full users array serialised as JSON.
- Returns an empty array `[]` if no users have been created yet.
- Never returns 404 — an empty collection is a valid 200 response.

**Response — 200 OK**

```json
[
  { "id": 1, "name": "Alice", "email": "alice@example.com" },
  { "id": 2, "name": "Bob",   "email": "bob@example.com" }
]
```

---

### 3.3 `POST /users`

**Behaviour**

- Reads the request body as a JSON string (buffered via `data` / `end` events).
- Validates that `name` and `email` are present and non-empty strings.
- Assigns a monotonically incrementing integer `id` (next = max existing id + 1, starting at 1).
- Pushes the new user object into the in-memory array.
- Returns the created user with status `201`.

**Request Body Schema**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Full display name of the user. |
| `email` | string | Yes | Email address. No format validation in v1. |

**Response — 201 Created**

```json
{ "id": 3, "name": "Carol", "email": "carol@example.com" }
```

**Response — 400 Bad Request**

Returned when `name` or `email` is missing or blank.

```json
{ "error": "name and email are required" }
```

---

### 3.4 `GET /users/:id`

**Behaviour**

- Extracts the `:id` segment from the URL path.
- Coerces `:id` to an integer via `parseInt`; treats `NaN` or non-numeric values as a 404.
- Searches the in-memory array for a user whose `id` matches.
- Returns the user object on match, or a 404 JSON error if no match is found.

**Response — 200 OK**

```json
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```

**Response — 404 Not Found**

```json
{ "error": "User not found" }
```

---

## 4. Data Model

### 4.1 User Object

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Auto | Auto-assigned, starts at 1, always unique. |
| `name` | string | Yes | Provided by the caller in the POST body. |
| `email` | string | Yes | Provided by the caller in the POST body. |

### 4.2 In-Memory Store

- Implemented as a plain JavaScript array: `const users = [];`
- ID counter is a module-level variable initialised to `0`, incremented on each successful POST.
- No persistence layer — data is lost on process exit or restart.
- All mutations happen synchronously; no concurrency concerns for a single-threaded Node.js process.

---

## 5. Error Handling

### 5.1 Error Response Shape

All error responses use a consistent JSON envelope:

```json
{ "error": "<human-readable message>" }
```

### 5.2 Error Catalogue

| HTTP Status | Scenario | Error Message |
|---|---|---|
| 400 | POST body missing `name` or `email` | `"name and email are required"` |
| 400 | POST body is not valid JSON | `"Invalid JSON body"` |
| 404 | `GET /users/:id` with no match | `"User not found"` |
| 404 | Request to any unknown route | `"Not found"` |
| 405 | Unsupported HTTP method on known path | `"Method not allowed"` |

---

## 6. Implementation Notes

### 6.1 Routing Strategy

- Use a simple conditional chain (`if/else if`) — no regex routing library.
- Split `req.url` on `'/'` to extract path segments.
- Match `/users/:id` by checking that path segments length equals 3 and `segments[1] === 'users'`.

### 6.2 Body Parsing

- Accumulate chunks via the request's `'data'` event into a buffer array.
- Parse JSON on the `'end'` event inside a `try/catch` to handle malformed input.
- Never use `req.body` — it does not exist in the native `http` module.

### 6.3 Response Helpers

- Centralise JSON writing in a helper: `sendJSON(res, statusCode, payload)`.
- Always set `Content-Type: application/json` before writing the body.
- Use `res.writeHead(status, headers)` then `res.end(JSON.stringify(payload))`.

### 6.4 Port Configuration

- Default port: `3000`.
- Read from environment variable if set: `process.env.PORT || 3000`.

---

## 7. Acceptance Criteria

### 7.1 Functional

- `GET /users` returns `[]` on a fresh server start.
- `POST /users` with valid body returns `201` and the created object with an integer `id`.
- Consecutive POSTs produce unique, incrementing ids (1, 2, 3 …).
- `GET /users` after two POSTs returns an array of exactly two objects.
- `GET /users/1` after one POST returns that user.
- `GET /users/999` returns `404` when no user with id `999` exists.
- `POST /users` with missing `name` or `email` returns `400`.
- `GET /unknown` returns `404`.

### 7.2 Non-Functional

- Server starts in under 200 ms.
- No npm packages are installed (`package.json` may exist but `dependencies` must be empty).
- All responses include `Content-Type: application/json`.
- Code fits in a single file under 150 lines.

---

## 8. Appendix

### 8.1 Sample curl Commands

**List all users**
```bash
curl http://localhost:3000/users
```

**Create a user**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

**Fetch a user by ID**
```bash
curl http://localhost:3000/users/1
```

### 8.2 Suggested File Structure

```
project/
├── server.js      # Entry point — all logic lives here
└── README.md      # Optional usage notes
```
