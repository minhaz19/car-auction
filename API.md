# API.md

> REST API endpoint reference — documents all available routes, request/response shapes, and authentication requirements.

Base URL (dev): `http://localhost:5001`

---

## Health

### `GET /api/health`
No auth required.

**Response `200`**
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z", "uptime": 12.3 }
```

---

## Auth — `/api/auth`

All cookie operations use `refreshToken` as the httpOnly cookie name, scoped to `/api/auth`.

---

### `POST /api/auth/register`
Create a new account.

**Auth:** None

**Body**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password1!" }
```

- `password`: min 8 chars, must contain at least one number

**Response `201`**
```json
{
  "accessToken": "<jwt>",
  "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "buyer" }
}
```
Sets `refreshToken` httpOnly cookie.

**Errors**
| Status | Reason |
|---|---|
| 400 | Missing fields or weak password |
| 409 | Email already registered |

---

### `POST /api/auth/login`
Authenticate an existing user.

**Auth:** None

**Body**
```json
{ "email": "jane@example.com", "password": "Password1!" }
```

**Response `200`**
```json
{
  "accessToken": "<jwt>",
  "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "buyer" }
}
```
Sets/rotates `refreshToken` httpOnly cookie.

**Errors**
| Status | Reason |
|---|---|
| 400 | Missing fields |
| 401 | Invalid email or password |

---

### `POST /api/auth/refresh`
Exchange the refresh token cookie for a new access token. **Rotates** the refresh token on every call.

**Auth:** `refreshToken` httpOnly cookie (automatic)

**Body:** None

**Response `200`**
```json
{
  "accessToken": "<new-jwt>",
  "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "buyer" }
}
```
Sets new `refreshToken` cookie. Old token is invalidated.

**Errors**
| Status | Reason |
|---|---|
| 401 | No cookie, expired/invalid token, or reuse detected (all sessions revoked on reuse) |

---

### `POST /api/auth/logout`
Invalidate the current session's refresh token.

**Auth:** `Authorization: Bearer <accessToken>` + `refreshToken` cookie

**Body:** None

**Response `200`**
```json
{ "message": "Logged out successfully" }
```
Clears `refreshToken` cookie.

---

### `POST /api/auth/logout-all`
Revoke all refresh tokens for the user (all-device logout).

**Auth:** `Authorization: Bearer <accessToken>`

**Body:** None

**Response `200`**
```json
{ "message": "Logged out from all devices" }
```
Clears `refreshToken` cookie.

---

## Access Token Format

Access tokens are **HS256 JWTs** with a 15-minute expiry.

**Payload**
```json
{
  "sub": "<userId>",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "buyer",
  "iat": 1700000000,
  "exp": 1700000900
}
```

Send as: `Authorization: Bearer <token>`
