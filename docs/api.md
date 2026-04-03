# Membership App — API Reference

Documents the endpoints that are currently implemented and live.

**Base URL:** `http://localhost:3000/api/v1`
**Format:** `application/json`
**Auth:** `Authorization: Bearer <access_token>` (where required)

---

## Status

| Module | Status |
|---|---|
| Authentication | ✅ Implemented |
| Invitations | ✅ Implemented |
| Members | ⏳ Pending |
| Role Management | ⏳ Pending |

---

## Authentication

### Login

```
POST /auth/login
```

Public endpoint. Authenticates a user and returns JWT tokens.

**Request body**

| Field | Type | Required |
|---|---|---|
| username | string | Yes |
| password | string | Yes |

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response `200 OK`**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "a3f9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "64a1...",
    "full_name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "photo_url": null
  }
}
```

**Error responses**

| Status | Message |
|---|---|
| `401` | `Invalid username or password` |
| `401` | `Your account is inactive` |

---

### Refresh Token

```
POST /auth/refresh
```

Public endpoint. Issues a new access token using a valid refresh token. The old refresh token is immediately revoked (rotation).

**Request body**

| Field | Type | Required |
|---|---|---|
| refresh_token | string | Yes |

```json
{
  "refresh_token": "a3f9..."
}
```

**Response `200 OK`** — same shape as login response (new tokens + user).

**Error responses**

| Status | Message |
|---|---|
| `401` | `Invalid or expired refresh token` |

---

### Logout

```
POST /auth/logout
```

Authenticated. Revokes the provided refresh token.

**Headers:** `Authorization: Bearer <access_token>`

**Request body**

| Field | Type | Required |
|---|---|---|
| refresh_token | string | Yes |

```json
{
  "refresh_token": "a3f9..."
}
```

**Response `200 OK`**

```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User

```
GET /auth/me
```

Authenticated. Returns the profile of the currently logged-in user.

**Headers:** `Authorization: Bearer <access_token>`

**Response `200 OK`**

```json
{
  "id": "64a1...",
  "full_name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "photo_url": null
}
```

---

## Token Details

| Token | Expiry | Storage |
|---|---|---|
| Access token | 1 hour | `Authorization` header |
| Refresh token | 7 days | Rotated on every use; old token revoked immediately |

---

## Invitations

### Generate Invitation Link

```
POST /invitations
```

Authenticated. Admin or Editor only. Creates a single-use invitation link valid for 1 month.

**Headers:** `Authorization: Bearer <access_token>`

**Request body**

| Field | Type | Required |
|---|---|---|
| full_name | string | Yes |
| email | string | Yes |

```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com"
}
```

**Response `200 OK`**

```json
{
  "invitation_link": "http://localhost:5173/register/7da257...",
  "expires_at": "2026-05-03T09:15:35.935Z"
}
```

**Error responses**

| Status | Message |
|---|---|
| `401` | Unauthenticated |
| `403` | `You do not have permission to generate invitation links` |

---

### Validate Invitation Token

```
GET /invitations/:token/validate
```

Public endpoint. Checks whether an invitation token is valid before showing the registration form.

**Response `200 OK`**

```json
{
  "valid": true,
  "email": "jane@example.com",
  "full_name": "Jane Smith"
}
```

**Error responses**

| Status | Message |
|---|---|
| `400` | `This invitation link has expired` |
| `400` | `This invitation link is no longer valid` |

---

### Register via Invitation

```
POST /invitations/:token/register
```

Public endpoint. Completes registration using a valid invitation token. On success, the token is permanently invalidated and the new member is set to `active` status. Returns login tokens so the user is immediately authenticated.

**Request body**

| Field | Type | Required |
|---|---|---|
| full_name | string | Yes |
| username | string | Yes |
| password | string | Yes |
| gender | `male` \| `female` | Yes |
| birthdate | `YYYY-MM-DD` | Yes |
| phone | string | No |
| address | string | No |
| hobbies | string[] | No |
| notes | string (max 500) | No |

```json
{
  "full_name": "Jane Smith",
  "username": "janesmith",
  "password": "securepass",
  "gender": "female",
  "birthdate": "1992-06-20",
  "phone": "+1 555 0100",
  "address": "123 Main St",
  "hobbies": ["reading", "hiking"],
  "notes": "Referred by admin."
}
```

**Response `201 Created`**

```json
{
  "message": "Registration successful",
  "access_token": "eyJ...",
  "refresh_token": "b5c2...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "64b2...",
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "role": "member",
    "photo_url": null
  }
}
```

**Error responses**

| Status | Message |
|---|---|
| `400` | `This invitation link has expired` |
| `400` | `This invitation link is no longer valid` |
| `422` | `{ "message": "Validation error", "errors": { "username": "Username already taken" } }` |
