# Membership App — API Contracts

## General Conventions

- Base URL: `/api/v1`
- Request/Response format: `application/json`
- Authentication: Bearer token (JWT) in `Authorization` header
- HTTP Status Codes:
  - `200 OK` — success
  - `201 Created` — resource created
  - `400 Bad Request` — validation error
  - `401 Unauthorized` — missing or invalid token
  - `403 Forbidden` — insufficient permissions
  - `404 Not Found` — resource not found
  - `422 Unprocessable Entity` — business rule violation
  - `500 Internal Server Error` — server error

---

## Health Check

### Health Check
```
GET /api/v1/health
```

> Note: Public endpoint, no authentication required. Used by Render for uptime monitoring.

**Response `200 OK`**
```json
{
  "status": "ok",
  "timestamp": "ISO8601 datetime"
}
```

---

## Authentication

### Login
```
POST /api/v1/auth/login
```

**Request Body**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response `200 OK`**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "string",
    "full_name": "string",
    "email": "string",
    "role": "admin | editor | member",
    "photo_url": "string | null"
  }
}
```

**Response `401 Unauthorized`**
```json
{
  "message": "Invalid username or password"
}
```

---

### Refresh Token
```
POST /api/v1/auth/refresh
```

**Request Body**
```json
{
  "refresh_token": "string"
}
```

**Response `200 OK`**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "string",
    "full_name": "string",
    "email": "string",
    "role": "admin | editor | member",
    "photo_url": "string | null"
  }
}
```

**Response `401 Unauthorized`**
```json
{
  "message": "Invalid or expired refresh token"
}
```

---

### Get Current User

```
GET /api/v1/auth/me
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Response `200 OK`**
```json
{
  "id": "string",
  "full_name": "string",
  "email": "string",
  "role": "admin | editor | member",
  "photo_url": "string | null"
}
```

---

### Logout
```
POST /api/v1/auth/logout
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Request Body**
```json
{
  "refresh_token": "string"
}
```

**Response `200 OK`**
```json
{
  "message": "Logged out successfully"
}
```

---

### Request Password Reset
```
POST /api/v1/auth/password-reset/request
```

> Note: Admin only (authenticated). No email is sent — the reset link is returned directly for the admin to share manually.

**Headers**
```
Authorization: Bearer <access_token>
```

**Request Body**
```json
{
  "email": "string"
}
```

**Response `200 OK`**
```json
{
  "reset_url": "string"
}
```

**Response `403 Forbidden`**
```json
{
  "message": "Only admins can generate reset links"
}
```

**Response `404 Not Found`**
```json
{
  "message": "No user found with this email"
}
```

---

### Reset Password
```
POST /api/v1/auth/password-reset/confirm
```

**Request Body**
```json
{
  "token": "string",
  "new_password": "string"
}
```

**Response `200 OK`**
```json
{
  "message": "Password reset successfully"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "Invalid or expired reset token"
}
```

> Note: Reset token expires after 1 hour and is single-use.

---

### Change Password (Logged In)
```
POST /api/v1/auth/password-change
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Request Body**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

**Response `200 OK`**
```json
{
  "message": "Password changed successfully"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "Current password is incorrect"
}
```

---

## Token Details

| Token | Expiry | Notes |
|---|---|---|
| Access token | 1 hour | Sent in Authorization header |
| Refresh token | 7 days | Rotated on every use, old token invalidated |

---

## Members

### List & Search Members
```
GET /api/v1/members?page=1&search=john&status=active
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| page | integer | No | Page number, defaults to 1 |
| search | string | No | Search by name or email |
| status | string | No | Filter by status: active / pending |

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "string",
      "full_name": "string",
      "photo_url": "string",
      "gender": "male | female",
      "email": "string",
      "phone": "string",
      "status": "active | pending"
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
GET /api/v1/members/:id
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Response `200 OK`**
```json
{
  "id": "string",
  "full_name": "string",
  "photo_url": "string",
  "gender": "male | female",
  "birthdate": "YYYY-MM-DD",
  "email": "string",
  "phone": "string",
  "address": "string",
  "join_date": "YYYY-MM-DD",
  "status": "active | pending",
  "hobbies": ["string"],
  "notes": "string"
}
```

**Response `404 Not Found`**
```json
{
  "message": "Member not found"
}
```

---

### Update Member
```
PUT /api/v1/members/:id
```

**Headers**
```
Authorization: Bearer <access_token>
```

> Note: Members can only update their own profile. Editors and Admins can update any member's profile.

**Request Body**
```json
{
  "full_name": "string",
  "gender": "male | female",
  "birthdate": "YYYY-MM-DD",
  "email": "string",
  "phone": "string",
  "address": "string",
  "hobbies": ["string"],
  "notes": "string"
}
```

**Response `200 OK`**
```json
{
  "message": "Member updated successfully"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "Validation error",
  "errors": {
    "notes": "Notes cannot exceed 500 characters"
  }
}
```

**Response `422 Unprocessable Entity`**
```json
{
  "message": "Validation error",
  "errors": {
    "birthdate": "Member must be at least 17 years old"
  }
}
```

**Response `403 Forbidden`**
```json
{
  "message": "You do not have permission to edit this profile"
}
```

---

### Remove Member
```
DELETE /api/v1/members/:id
```

**Headers**
```
Authorization: Bearer <access_token>
```

> Note: Only Admins and Editors can remove members.

**Response `200 OK`**
```json
{
  "message": "Member removed successfully"
}
```

**Response `403 Forbidden`**
```json
{
  "message": "You do not have permission to remove members"
}
```

**Response `404 Not Found`**
```json
{
  "message": "Member not found"
}
```

---

### Upload Profile Photo
```
POST /api/v1/members/:id/photo
```

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**
```
photo: <file>
```

> Note: Accepted formats: JPG, PNG. Max size: 2MB.

**Response `200 OK`**
```json
{
  "message": "Photo uploaded successfully",
  "photo_url": "string"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "Only JPG and PNG formats are allowed"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "Photo must not exceed 2MB"
}
```

---

## Invitations

### Generate Invitation Link
```
POST /api/v1/invitations
```

**Headers**
```
Authorization: Bearer <access_token>
```

> Note: Only Admins and Editors can generate invitation links.

**Request Body**
```json
{
  "email": "string",
  "full_name": "string"
}
```

**Response `201 Created`**
```json
{
  "invitation_link": "string",
  "expires_at": "ISO8601 datetime"
}
```

**Response `422 Unprocessable Entity`**
```json
{
  "message": "Validation error",
  "errors": {
    "email": "A member with this email already exists"
  }
}
```

**Response `403 Forbidden`**
```json
{
  "message": "You do not have permission to generate invitation links"
}
```

---

### Validate Invitation Token
```
GET /api/v1/invitations/:token/validate
```

> Note: Public endpoint, no authentication required.

**Response `200 OK`**
```json
{
  "valid": true,
  "email": "string",
  "full_name": "string"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "This invitation link has expired"
}
```

**Response `400 Bad Request`**
```json
{
  "message": "This invitation link is no longer valid"
}
```

---

### Register via Invitation
```
POST /api/v1/invitations/:token/register
```

> Note: Public endpoint, no authentication required.

**Request Body**
```json
{
  "full_name": "string",
  "username": "string",
  "password": "string",
  "gender": "male | female",
  "birthdate": "YYYY-MM-DD",
  "phone": "string",
  "address": "string",
  "hobbies": ["string"],
  "notes": "string"
}
```

**Response `201 Created`**
```json
{
  "message": "Registration successful",
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Response `400 Bad Request`**
```json
{
  "message": "This invitation link has expired"
}
```

**Response `422 Unprocessable Entity`**
```json
{
  "message": "Validation error",
  "errors": {
    "username": "Username already taken"
  }
}
```

**Response `422 Unprocessable Entity`**
```json
{
  "message": "Validation error",
  "errors": {
    "birthdate": "Member must be at least 17 years old"
  }
}
```

**Response `422 Unprocessable Entity`**
```json
{
  "message": "Validation error",
  "errors": {
    "email": "A member with this email already exists"
  }
}
```

---

## Role Management

### Update Member Role
```
PUT /api/v1/members/:id/role
```

**Headers**
```
Authorization: Bearer <access_token>
```

> Note: Only Admins can assign or revoke roles.

**Request Body**
```json
{
  "role": "admin | editor | member"
}
```

**Response `200 OK`**
```json
{
  "message": "Role updated successfully"
}
```

**Response `403 Forbidden`**
```json
{
  "message": "You do not have permission to manage roles"
}
```

**Response `422 Unprocessable Entity`**
```json
{
  "message": "Maximum number of Admins (4) has been reached"
}
```

**Response `404 Not Found`**
```json
{
  "message": "Member not found"
}
```
