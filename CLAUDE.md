# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A membership management web app (e.g., alumni associations, church groups) with role-based access (Admin, Editor, Member). Frontend-only at this stage — backend/database/file storage are TBD. Auth is currently mocked in `AuthContext` for UI testing.

## Commands

All commands run from the `src/frontend/` directory:

```bash
cd src/frontend
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Architecture

### Frontend (`src/frontend/`)

- **Framework**: React 18 + Vite, JSX (not TypeScript)
- **Styling**: Tailwind CSS 3
- **Routing**: react-router-dom v7 with role-based `ProtectedRoute` wrapper
- **HTTP**: Axios with auto token refresh interceptor (`src/api/client.js`)

### Key Structure

- `src/api/` — API modules (`auth.js`, `members.js`, `invitations.js`) built on a shared Axios `client.js`. `mockData.js` provides fake data for UI development.
- `src/context/AuthContext.jsx` — Auth state via React Context. Login is currently mocked (hardcoded admin user). Tokens stored in `localStorage`.
- `src/layouts/` — `AppLayout` (sidebar + topbar for authenticated pages), `AuthLayout` (centered card for public pages).
- `src/pages/` — One component per route. Pages use `AppLayout` internally.
- `src/components/` — Shared UI: `Avatar`, `Toast`, `TagInput`, `Pagination`.
- `src/utils/ProtectedRoute.jsx` — Redirects unauthenticated users to `/login`, unauthorized roles to `/members`.

### Routing & Roles

Routes are defined in `App.jsx`. Role gating uses the `roles` prop on `ProtectedRoute`:
- No `roles` prop = any authenticated user
- `roles={['admin', 'editor']}` = Admin/Editor only
- `roles={['admin']}` = Admin only

### API Base URL

Configured via `VITE_API_URL` env var, defaults to `http://localhost:3000/api/v1`.

## Design Specifications

Detailed requirements, API contracts, UI wireframes, and sitemap are in `docs/`:
- `docs/requirements.md` — Roles, fields, acceptance criteria (Gherkin)
- `docs/api-contracts.md` — Full REST API spec (auth, members, invitations, roles)
- `docs/sitemap.md` — Route map with role permissions
- `docs/ui-design.md` — Wireframes and interaction specs per page

Always consult these docs before implementing new features or modifying existing behavior.
