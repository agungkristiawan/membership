# Membership Management App

A web-based membership management application for communities such as alumni associations or church groups. Role-based access: Admin, Editor, Member.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, react-router-dom v7 |
| Backend | NestJS + TypeScript, clean architecture |
| Database | MongoDB 7 (Docker) |

---

## Prerequisites

- Node.js 18+
- Docker + Docker Compose

---

## Local Development

### 1. Start the database

```bash
cd src/backend
docker-compose up -d
```

MongoDB will be available on port **27018** (intentionally offset to avoid conflicts with any local mongod on 27017).

### 2. Install dependencies

```bash
# Backend
cd src/backend
npm install

# Frontend
cd src/frontend
npm install
```

### 3. Configure environment

The backend ships with a ready-to-use `.env` for local development. No changes needed unless you want to customise the JWT secret or admin password.

```bash
# src/backend/.env (already created)
MONGODB_URI=mongodb://membership:membership123@localhost:27018/membership?authSource=admin
JWT_SECRET=dev-secret-key-do-not-use-in-production
JWT_ACCESS_EXPIRATION=3600
JWT_REFRESH_EXPIRATION_DAYS=7
SEED_ADMIN_PASSWORD=admin123
PORT=3000
```

### 4. Seed the database

Creates the initial admin user (`admin` / `admin123`).

```bash
cd src/backend
npm run seed
```

### 5. Start the backend

```bash
cd src/backend
npm run start:dev
```

Backend runs at `http://localhost:3000/api/v1`.

### 6. Start the frontend

```bash
cd src/frontend
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 7. Log in

Open `http://localhost:5173/login` and sign in with:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

---

## Project Structure

```
membership/
├── docs/                  # Requirements, API contracts, UI design, sitemap
├── src/
│   ├── frontend/          # React + Vite app
│   │   └── src/
│   │       ├── api/       # Axios client + API modules
│   │       ├── components/
│   │       ├── context/   # AuthContext
│   │       ├── layouts/
│   │       ├── pages/
│   │       └── utils/     # ProtectedRoute
│   └── backend/           # NestJS app
│       ├── docker-compose.yml
│       └── src/
│           ├── domain/        # Entities + repository interfaces
│           ├── application/   # Services + DTOs
│           ├── infrastructure/# Mongoose, JWT strategy, guards
│           └── presentation/  # Controllers + modules
└── README.md
```

---

## Backend Commands

All from `src/backend/`:

```bash
npm run start:dev   # Dev server with watch mode
npm run build       # Production build
npm run seed        # Seed admin user
```

## Frontend Commands

All from `src/frontend/`:

```bash
npm run dev         # Dev server
npm run build       # Production build
npm run lint        # ESLint
```
