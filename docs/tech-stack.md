# Membership App — Tech Stack

## Frontend

| Concern | Decision |
|---|---|
| Framework | React 18 + Vite |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS 3 |
| Routing | react-router-dom v7 |
| HTTP | Axios with auto token refresh interceptor |
| Auth state | React Context (`AuthContext`) |

---

## Backend

| Concern | Decision |
|---|---|
| Framework | NestJS 10 (TypeScript) |
| Architecture | Clean Architecture — domain / application / infrastructure / presentation |
| Auth | JWT access tokens (1h) + rotating refresh tokens (7d, SHA-256 hashed) |
| Password hashing | bcrypt |
| Validation | class-validator + class-transformer (global ValidationPipe) |
| File uploads | Multer (disk storage, `uploads/` directory, served as static files) |
| API Documentation | Swagger UI via `@nestjs/swagger` — available at `http://localhost:3000/api/docs` |

---

## Database

| Concern | Decision |
|---|---|
| Database | MongoDB 7 |
| ODM | Mongoose (`@nestjs/mongoose`) |
| Local setup | Docker Compose (port 27018) |

---

## File Storage (profile photos)

Photos are stored on local disk in the `backend/uploads/` directory and served as static files at `/uploads/<filename>`. The `photo_url` field is stored as a relative path in the database and resolved to an absolute URL (prefixed with `BACKEND_URL`) in all API responses.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Secret key for signing JWTs |
| `JWT_ACCESS_EXPIRATION` | `3600` | Access token expiry in seconds |
| `JWT_REFRESH_EXPIRATION_DAYS` | `7` | Refresh token expiry in days |
| `BACKEND_URL` | `http://localhost:3000` | Used to resolve absolute photo URLs |
| `FRONTEND_URL` | `http://localhost:5173` | Used to build invitation and reset links |
| `SEED_ADMIN_PASSWORD` | `admin123` | Initial admin password set by seed script |
| `PORT` | `3000` | Backend server port |
