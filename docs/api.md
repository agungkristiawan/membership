# Membership App — API Reference

Documents the endpoints that are currently implemented and live.

**Base URL:** `http://localhost:3000/api/v1`
**Format:** `application/json`
**Auth:** `Authorization: Bearer <access_token>` (where required)
**Interactive docs:** `http://localhost:3000/api/docs` (Swagger UI)

---

## Status

| Module | Status |
|---|---|
| Authentication | ✅ Implemented |
| Invitations | ✅ Implemented |
| Members | ✅ Implemented |
| Role Management | ✅ Implemented |

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

### Change Password

```
POST /auth/password-change
```

Authenticated. Changes the password for the currently logged-in user.

**Headers:** `Authorization: Bearer <access_token>`

**Request body**

| Field | Type | Required |
|---|---|---|
| current_password | string | Yes |
| new_password | string (min 6) | Yes |

**Response `200 OK`**

```json
{
  "message": "Password changed successfully"
}
```

**Error responses**

| Status | Message |
|---|---|
| `401` | `Current password is incorrect` |

---

### Request Password Reset (Admin only)

```
POST /auth/password-reset/request
```

Authenticated. Admin only. Generates a password reset link for a given user email and returns the link directly (no email is sent — admin shares it manually).

**Headers:** `Authorization: Bearer <access_token>`

**Request body**

| Field | Type | Required |
|---|---|---|
| email | string | Yes |

**Response `200 OK`**

```json
{
  "reset_url": "http://localhost:5173/reset-password/<token>"
}
```

**Error responses**

| Status | Message |
|---|---|
| `403` | `Only admins can generate reset links` |
| `404` | `No user found with this email` |

---

### Confirm Password Reset

```
POST /auth/password-reset/confirm
```

Public endpoint. Sets a new password using a valid reset token.

**Request body**

| Field | Type | Required |
|---|---|---|
| token | string | Yes |
| new_password | string (min 6) | Yes |

**Response `200 OK`**

```json
{
  "message": "Password reset successfully"
}
```

**Error responses**

| Status | Message |
|---|---|
| `400` | `Invalid or expired reset token` |

---

## Token Details

| Token | Expiry | Storage |
|---|---|---|
| Access token | 1 hour | `Authorization` header |
| Refresh token | 7 days | Rotated on every use; old token revoked immediately |
| Password reset token | 1 hour | Single-use; cleared after successful reset |

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

**Response `201 Created`**

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

---

## Members

### List Members

```
GET /members?page=1&search=john&status=active
```

Authenticated. All roles.

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| page | integer | No | Page number, defaults to 1 |
| search | string | No | Search by name or email |
| status | string | No | Filter: `active` / `inactive` / `pending` |

**Response `200 OK`**

```json
{
  "data": [
    {
      "id": "string",
      "full_name": "string",
      "photo_url": "string | null",
      "gender": "male | female",
      "email": "string",
      "phone": "string",
      "role": "admin | editor | member",
      "status": "active | inactive | pending"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 100,
    "total_pages": 4
  }
}
```

---

### Get Member

```
GET /members/:id
```

Authenticated. All roles.

**Response `200 OK`**

```json
{
  "id": "string",
  "full_name": "string",
  "photo_url": "string | null",
  "gender": "male | female",
  "birthdate": "YYYY-MM-DD",
  "email": "string",
  "phone": "string",
  "address": "string",
  "join_date": "YYYY-MM-DD",
  "role": "admin | editor | member",
  "status": "active | inactive | pending",
  "hobbies": ["string"],
  "notes": "string"
}
```

**Error responses**

| Status | Message |
|---|---|
| `404` | `Member not found` |

---

### Update Member

```
PUT /members/:id
```

Authenticated. Members can only update their own profile. Admin/Editor can update any profile.

**Request body** — all fields optional

| Field | Type |
|---|---|
| full_name | string |
| gender | `male` \| `female` |
| birthdate | `YYYY-MM-DD` |
| phone | string |
| address | string |
| hobbies | string[] |
| notes | string (max 500) |
| status | `active` \| `inactive` \| `pending` |

**Response `200 OK`** — updated member object

**Error responses**

| Status | Message |
|---|---|
| `403` | `You do not have permission to edit this profile` |

---

### Delete Member (Soft Delete)

```
DELETE /members/:id
```

Authenticated. Admin/Editor only. Sets `deleted_at` — member can no longer log in but data is retained.

**Response `200 OK`**

```json
{
  "message": "Member removed successfully"
}
```

**Error responses**

| Status | Message |
|---|---|
| `403` | `You cannot remove yourself` |
| `403` | `You do not have permission to remove members` |
| `404` | `Member not found` |

---

### Upload Profile Photo

```
POST /members/:id/photo
```

Authenticated. `Content-Type: multipart/form-data`. Field name: `photo`. Accepted: JPG, PNG. Max: 2MB.

**Response `201 Created`**

```json
{
  "photo_url": "http://localhost:3000/uploads/filename.jpg"
}
```

---

## Role Management

### Update Member Role

```
PUT /members/:id/role
```

Authenticated. Admin only. Maximum of 4 admins enforced.

**Request body**

| Field | Type | Required |
|---|---|---|
| role | `admin` \| `editor` \| `member` | Yes |

**Response `200 OK`**

```json
{
  "message": "Role updated successfully"
}
```

**Error responses**

| Status | Message |
|---|---|
| `400` | `Maximum number of Admins (4) has been reached` |
| `403` | `Only admins can change roles` |
| `404` | `Member not found` |
