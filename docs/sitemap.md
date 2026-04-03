# Membership App — Sitemap

## Public Pages (no login required)

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Username & password login form |
| Forgot Password | `/forgot-password` | Enter email to receive reset link |
| Reset Password | `/reset-password/:token` | Set new password via reset link |
| Register | `/register/:token` | Complete profile via invitation link |

---

## Authenticated Pages (login required)

### All Roles (Admin, Editor, Member)

| Page | Route | Description |
|---|---|---|
| Member Directory | `/members` | Paginated list of members, search by name/email/status |
| Member Profile | `/members/:id` | View a member's full profile |
| My Profile | `/profile` | View own profile |
| Edit My Profile | `/profile/edit` | Edit own profile fields and photo |
| Change Password | `/profile/change-password` | Change password while logged in |

---

### Admin & Editor Only

| Page | Route | Description |
|---|---|---|
| Edit Member Profile | `/members/:id/edit` | Edit any member's profile fields and photo |
| Invite Member | `/members/invite` | Generate and share an invitation link |

---

### Admin Only

| Page | Route | Description |
|---|---|---|
| User Management | `/admin/users` | List all users, assign/revoke roles, trigger password resets |

---

## Page Hierarchy

```
/
├── login                        (public)
├── forgot-password              (public)
├── reset-password/:token        (public)
├── register/:token              (public)
│
├── members                      (all roles)
│   ├── invite                   (admin, editor)
│   ├── :id                      (all roles)
│   └── :id/edit                 (admin, editor)
│
├── profile                      (all roles)
│   ├── edit                     (all roles)
│   └── change-password          (all roles)
│
└── admin
    └── users                    (admin only)
```
