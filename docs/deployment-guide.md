# Deployment Guide

## Architecture

```
Vercel (free)          Render (free)           MongoDB Atlas (M0 free)
 Frontend SPA  ──→  NestJS Backend API  ──→  Database (512MB)
                         │
                         ▼
                    Cloudinary (free)
                    Profile photos
```

All services are on free tiers. Total monthly cost: **$0**.

---

## Code Changes Required

### 1. Fix CORS (hardcoded to localhost)

**File**: `backend/src/main.ts` (line 20)

```diff
- origin: 'http://localhost:5173',
+ origin: process.env.FRONTEND_URL || 'http://localhost:5173',
```

### 2. Migrate file uploads from local disk to Cloudinary

**Install packages**:

```bash
cd backend && npm install cloudinary multer-storage-cloudinary
```

**Create** `backend/src/infrastructure/cloudinary/cloudinary.provider.ts`

- Configure Cloudinary SDK using env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Create** `backend/src/infrastructure/cloudinary/cloudinary.module.ts`

- NestJS module exporting the Cloudinary provider

**Modify** `backend/src/presentation/members/members.controller.ts`

- Replace `diskStorage` (multer) with `CloudinaryStorage` from `multer-storage-cloudinary`
- Configure: folder `membership-photos`, formats `jpg/png`, resize `400x400` limit
- Change `uploadPhoto` method: use `file.path` (Cloudinary URL) instead of `/uploads/${file.filename}`

**Modify** `backend/src/presentation/members/members.module.ts`

- Import `CloudinaryModule`

### 3. Remove local uploads serving

**File**: `backend/src/main.ts`

- Remove `join`, `existsSync`, `mkdirSync` imports
- Remove uploads directory creation and `useStaticAssets` call (lines 13-15)

### 4. Add health check endpoint

**Create** `backend/src/presentation/health/health.controller.ts`

- `GET /api/v1/health` returns `{ status: "ok", timestamp: "..." }` (no auth required)

**Create** `backend/src/presentation/health/health.module.ts`

**Modify** `backend/src/app.module.ts`

- Add `HealthModule` and `CloudinaryModule` to imports

### 5. Update `.env.example`

Add Cloudinary env vars:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 6. Create `frontend/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Ensures SPA routing works (e.g., direct navigation to `/members/123`).

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `backend/src/main.ts` |
| Modify | `backend/src/app.module.ts` |
| Modify | `backend/src/presentation/members/members.controller.ts` |
| Modify | `backend/src/presentation/members/members.module.ts` |
| Modify | `backend/.env.example` |
| Modify | `backend/package.json` (via npm install) |
| Create | `backend/src/infrastructure/cloudinary/cloudinary.provider.ts` |
| Create | `backend/src/infrastructure/cloudinary/cloudinary.module.ts` |
| Create | `backend/src/presentation/health/health.controller.ts` |
| Create | `backend/src/presentation/health/health.module.ts` |
| Create | `frontend/vercel.json` |

---

## Part 1: Backend & Database Deployment

### Step 1: MongoDB Atlas (database)

**What**: Free managed MongoDB cluster (512MB, shared tier).

**Account setup**:
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign up with email or Google account
3. Choose the **Free** (M0) tier during onboarding

**Create cluster**:
1. Click **Build a Database** (or **Create** if you already have an account)
2. Select **M0 Free** tier
3. Choose a cloud provider and region:
   - **Provider**: AWS (recommended — matches Render)
   - **Region**: `us-east-1` (or closest to where your users are)
4. **Cluster Name**: `membership-cluster` (or keep the default `Cluster0`)
5. Click **Create Deployment**

**Configure database access**:
1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Authentication method: **Password**
4. Username: `membership-app` (or your choice)
5. Password: click **Autogenerate Secure Password** — **copy and save this password**
6. Built-in Role: **Read and write to any database**
7. Click **Add User**

**Configure network access**:
1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - This is required because Render free tier uses dynamic IPs with no static outbound IP
4. Click **Confirm**

**Get connection string**:
1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Choose **Drivers**
4. Copy the connection string. It looks like:
   ```
   mongodb+srv://membership-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved earlier
6. Add the database name `membership` before the `?`:
   ```
   mongodb+srv://membership-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/membership?retryWrites=true&w=majority
   ```
7. **Save this connection string** — you'll need it for Render

**Verify connection** (optional, from your local machine):
```bash
cd backend
MONGODB_URI="mongodb+srv://membership-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/membership?retryWrites=true&w=majority" npm run start:dev
```
If the server starts without MongoDB errors, the connection works.

---

### Step 2: Cloudinary (photo storage)

**What**: Free image hosting for member profile photos (25 credits/mo).

1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. On the **Dashboard**, copy these three values:
   - **Cloud Name** (e.g., `dxyz1234`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcDEF-ghiJKL_mnoPQR`)
3. **Save these values** — you'll need them for Render
4. No other configuration needed — the `membership-photos` folder is auto-created on first upload

---

### Step 3: Render (backend hosting)

**What**: Free Node.js web service hosting with git-push deploys.

**Account setup**:
1. Go to [render.com](https://render.com)
2. Sign up with your **GitHub account** (this connects your repos automatically)

**Create web service**:
1. Click **New** → **Web Service**
2. Connect your `membership` repository from GitHub
3. Fill in the configuration:

| Setting | Value |
|---------|-------|
| **Name** | `membership-api` |
| **Region** | Same as your Atlas cluster (e.g., `US East`) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | `Free` |

4. Scroll down to **Advanced** and set **Health Check Path**: `/api/v1/health`

**Set environment variables**:

Click **Add Environment Variable** for each:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | Full Atlas connection string from Step 1 |
| `JWT_SECRET` | *(generate below)* | Used to sign auth tokens |
| `FRONTEND_URL` | `http://localhost:5173` | Update later when Vercel is set up |
| `BACKEND_URL` | `https://membership-api.onrender.com` | Your Render URL (shown at top of page) |
| `MEMBER_MIN_AGE` | `17` | Minimum age for member registration |
| `CLOUDINARY_CLOUD_NAME` | *(from Step 2)* | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | *(from Step 2)* | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | *(from Step 2)* | Cloudinary dashboard |
| `NODE_ENV` | `production` | Enables production optimizations |

**Generate JWT_SECRET** — run this in your terminal:
```bash
openssl rand -hex 32
```
Copy the output and use it as the `JWT_SECRET` value.

5. Click **Create Web Service**
6. Wait for the first deploy to complete (typically 2-5 minutes)
7. Note your service URL: `https://membership-api.onrender.com`

---

### Step 4: Seed admin user

After the backend is deployed and connected to Atlas, seed the initial admin account from your local machine:

```bash
cd backend
MONGODB_URI="mongodb+srv://membership-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/membership?retryWrites=true&w=majority" npm run seed
```

This creates an admin user with the credentials defined in the seed script (`SEED_ADMIN_PASSWORD` defaults to `admin123`).

To use a custom password:
```bash
MONGODB_URI="mongodb+srv://..." SEED_ADMIN_PASSWORD="your-secure-password" npm run seed
```

---

### Step 5: Verify backend deployment

Run through this checklist after deploy + seed:

- [ ] **Health check**: Visit `https://<your-render-url>/api/v1/health`
  - Expected: `{ "status": "ok", "timestamp": "..." }`
- [ ] **Swagger docs**: Visit `https://<your-render-url>/api/docs`
  - Expected: Swagger UI loads with all endpoints listed
- [ ] **Auth works**: Use Swagger UI to call `POST /api/v1/auth/login` with seeded admin credentials
  - Expected: Returns `access_token` and `refresh_token`
- [ ] **Database connected**: Use the access token to call `GET /api/v1/members`
  - Expected: Returns member list (at least the seeded admin)

**Troubleshooting**:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Deploy fails at build | TypeScript compilation error | Check Render build logs |
| Health check returns 502 | App crashed on startup | Check Render logs for errors |
| `ECONNREFUSED` or timeout | MongoDB connection failed | Verify `MONGODB_URI` and Atlas network access (`0.0.0.0/0`) |
| Login returns 401 | Seed didn't run or wrong credentials | Re-run seed command with correct Atlas URI |
| Cold start (~30s delay) | Normal on Render free tier | First request after 15min idle spins up the service |

---

## Part 2: Frontend Deployment (Vercel)

*To be completed after backend is verified.*

### Step 6: Vercel (frontend)

1. Create account at [vercel.com](https://vercel.com), connect GitHub
2. Import your repository
3. Configure:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
4. Set environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://<render-service>.onrender.com/api/v1` |

5. Deploy
6. Copy the Vercel URL (e.g., `https://membership-app.vercel.app`)
7. Go back to Render and update `FRONTEND_URL` to the Vercel URL (Render auto-redeploys)

> **Note**: `VITE_API_URL` is baked into the frontend bundle at build time. If you change it, you must redeploy the frontend.

### Step 7: Seed admin user (if not done in Step 4)

Run locally pointing to Atlas:

```bash
cd backend
MONGODB_URI="mongodb+srv://..." npm run seed
```

---

## Full Verification Checklist

- [ ] Health check: `GET https://<render>.onrender.com/api/v1/health` returns `{ status: "ok" }`
- [ ] Swagger: `https://<render>.onrender.com/api/docs` loads
- [ ] Frontend: Vercel URL shows login page
- [ ] Login: Seeded admin can log in (confirms Atlas + JWT)
- [ ] CORS: No errors in browser console
- [ ] Photo upload: Uploaded image URL starts with `https://res.cloudinary.com/`

---

## Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Render free tier cold starts | ~30s delay after 15min inactivity | Add "loading" UX on frontend |
| Atlas M0 storage | 512MB max | Sufficient for small orgs |
| Cloudinary free | 25 credits/mo | Plenty for profile photos |
| Existing `/uploads/` photos | Old local paths become inaccessible | `resolvePhotoUrl` handles both formats; users re-upload |
