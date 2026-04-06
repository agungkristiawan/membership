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
| File uploads | Multer + Cloudinary (`multer-storage-cloudinary`) — photos stored in Cloudinary, URLs stored in DB |
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

Photos are uploaded to Cloudinary (`membership-photos` folder) via `multer-storage-cloudinary`. The `photo_url` field stores the full Cloudinary URL (e.g., `https://res.cloudinary.com/...`) directly in the database. The `resolvePhotoUrl` helper also handles legacy `/uploads/...` paths by prepending `BACKEND_URL`.

---

## Deployment

| Concern | Decision |
|---|---|
| Frontend hosting | Vercel (free tier) |
| Backend hosting | Render (free web service) |
| Database | MongoDB Atlas M0 (free, 512MB) |
| Photo storage | Cloudinary (free, 25 credits/mo) |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Secret key for signing JWTs |
| `JWT_ACCESS_EXPIRATION` | `3600` | Access token expiry in seconds |
| `JWT_REFRESH_EXPIRATION_DAYS` | `7` | Refresh token expiry in days |
| `BACKEND_URL` | `http://localhost:3000` | Used to resolve legacy photo URLs |
| `FRONTEND_URL` | `http://localhost:5173` | Used for CORS and building invitation/reset links |
| `SEED_ADMIN_PASSWORD` | `admin123` | Initial admin password set by seed script |
| `PORT` | `3000` | Backend server port |
| `CLOUDINARY_CLOUD_NAME` | — | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | Cloudinary API secret |
