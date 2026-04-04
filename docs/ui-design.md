# Membership App — UI Design

## Design Decisions

- **Layout**: Sidebar navigation (scales better, common for management apps)
- **Sidebar**: Collapsible, shows icons + labels
- **Top bar**: App name/logo on the left, user avatar + name + logout on the right
- **Responsive**: Sidebar collapses to icon-only on smaller screens
- **Color scheme**: Indigo/slate theme
  - Sidebar: dark gradient `from-slate-900 to-indigo-900`, white text, `bg-white/20` active state
  - Top bar: periwinkle wash `rgb(224,231,255)`
  - Auth pages: diagonal gradient `from-indigo-600 via-purple-500 to-pink-500`
  - Cards: `bg-slate-100` with `border-t-4 border-indigo-500` accent
  - Table headers: `bg-indigo-600` with `text-slate-200`
  - Primary buttons: `bg-indigo-600 hover:bg-indigo-700`
  - Status badges: solid — active `bg-emerald-500`, inactive `bg-slate-400`, pending `bg-amber-500`
  - Avatars: color-coded by name hash across 8 distinct colors (indigo, emerald, rose, amber, violet, teal, orange, sky)

---

## Global Layout (Authenticated Pages)

```
+--------------------------------------------------+
| LOGO / APP NAME          [Avatar] John Doe  [v]  |
+------------+-------------------------------------+
|            |                                     |
| [Members]  |   PAGE CONTENT                      |
|            |                                     |
| [Profile]  |                                     |
|            |                                     |
| [Admin]    |                                     |
| (admin     |                                     |
|  only)     |                                     |
|            |                                     |
+------------+-------------------------------------+
```

**Sidebar Menu Items by Role**

| Menu Item | Admin | Editor | Member |
|---|---|---|---|
| Members | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ |
| Admin | ✅ | ❌ | ❌ |

---

## Public Pages

---

### Login Page `/login`

```
+--------------------------------------------------+
|                                                  |
|              [APP LOGO / NAME]                   |
|                                                  |
|         +----------------------------+           |
|         |  Username                  |           |
|         |  [________________________]|           |
|         |                            |           |
|         |  Password                  |           |
|         |  [________________________]|           |
|         |                            |           |
|         |  [       Login            ]|           |
|         |                            |           |
|         |  Forgot password?          |           |
|         +----------------------------+           |
|                                                  |
+--------------------------------------------------+
```

**Interactions**
- Submit → calls `POST /api/v1/auth/login`
- On success → redirect to `/members`
- On failure → show inline error "Invalid username or password"
- "Forgot password?" → navigate to `/forgot-password`

---

### Forgot Password Page `/forgot-password`

```
+--------------------------------------------------+
|                                                  |
|              [APP LOGO / NAME]                   |
|                                                  |
|         +----------------------------+           |
|         |  Enter your email address  |           |
|         |  to receive a reset link   |           |
|         |                            |           |
|         |  Email                     |           |
|         |  [________________________]|           |
|         |                            |           |
|         |  [   Send Reset Link      ]|           |
|         |                            |           |
|         |  <- Back to Login          |           |
|         +----------------------------+           |
|                                                  |
+--------------------------------------------------+
```

**Interactions**
- Submit → calls `POST /api/v1/auth/password-reset/request`
- On success → show message "If this email exists, a reset link has been sent"
- "Back to Login" → navigate to `/login`

---

### Reset Password Page `/reset-password/:token`

```
+--------------------------------------------------+
|                                                  |
|              [APP LOGO / NAME]                   |
|                                                  |
|         +----------------------------+           |
|         |  Set New Password          |           |
|         |                            |           |
|         |  New Password              |           |
|         |  [________________________]|           |
|         |                            |           |
|         |  Confirm Password          |           |
|         |  [________________________]|           |
|         |                            |           |
|         |  [   Reset Password       ]|           |
|         +----------------------------+           |
|                                                  |
+--------------------------------------------------+
```

**Interactions**
- On page load → calls `GET /api/v1/invitations/:token/validate`
  - If invalid/expired → show error page "This link is invalid or has expired"
- Submit → calls `POST /api/v1/auth/password-reset/confirm`
- On success → show message "Password reset successfully" + redirect to `/login`
- Passwords must match, validated client-side before submit

---

### Register Page `/register/:token`

```
+--------------------------------------------------+
|                                                  |
|              [APP LOGO / NAME]                   |
|    Welcome! Complete your profile to join.       |
|                                                  |
|  +--------------------------------------------+  |
|  | PERSONAL INFO                              |  |
|  |  Full Name *        Gender *               |  |
|  |  [______________]   [Male / Female    [v]] |  |
|  |                                            |  |
|  |  Birthdate *        Phone                  |  |
|  |  [______________]   [__________________]   |  |
|  |                                            |  |
|  |  Address                                   |  |
|  |  [________________________________________]|  |
|  |                                            |  |
|  |  Hobbies (press Enter to add)              |  |
|  |  [__________________] [tag1 x] [tag2 x]   |  |
|  |                                            |  |
|  |  Notes (max 500 chars)                     |  |
|  |  [________________________________________]|  |
|  |  [________________________________________]|  |
|  |                                            |  |
|  | ACCOUNT                                    |  |
|  |  Username *         Email (pre-filled)     |  |
|  |  [______________]   [__________________]   |  |
|  |                                            |  |
|  |  Password *         Confirm Password *     |  |
|  |  [______________]   [__________________]   |  |
|  |                                            |  |
|  |  [          Complete Registration         ]|  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

**Interactions**
- On page load → calls `GET /api/v1/invitations/:token/validate`
  - If invalid/expired → show error page "This invitation has expired or is no longer valid"
  - If valid → pre-fill email and full name fields
- Hobbies → tag input, free text, press Enter to add, click X to remove
- Notes → character counter shown below (e.g., "120 / 500")
- Submit → calls `POST /api/v1/invitations/:token/register`
- On success → redirect to `/members` (auto logged in)

---

## Authenticated Pages

---

### Member Directory `/members`

```
+------------+-------------------------------------+
| LOGO       |  [Avatar] John Doe            [v]  |
+------------+-------------------------------------+
|            |  Members                            |
| [Members]  |                                     |
| [Profile]  |  [Search by name or email...]  [Status v]  [Search] |
| [Admin]    |                                     |
|            |  +---+ Full Name    Email    Status  Actions |
|            |  |   | Jane Doe    j@x.com  Active  [View]  |
|            |  +---+                                       |
|            |  |   | John Smith  s@x.com  Pending [View]  |
|            |  +---+                                       |
|            |  |   | ...                                   |
|            |                                     |
|            |  [< Prev]  Page 1 of 4  [Next >]   |
|            |                                     |
|            |  [+ Invite Member]  (admin/editor)  |
+------------+-------------------------------------+
```

**Interactions**
- On load → calls `GET /api/v1/members?page=1`
- Search/filter → calls `GET /api/v1/members?search=...&status=...&page=1`
- Pagination → calls `GET /api/v1/members?page=N`
- "View" → navigate to `/members/:id`
- "+ Invite Member" → navigate to `/members/invite` (Admin/Editor only, hidden for Member)
- Member photo shown as small avatar in list

---

### Member Profile `/members/:id`

```
+------------+-------------------------------------+
| LOGO       |  [Avatar] John Doe            [v]  |
+------------+-------------------------------------+
|            |  <- Back to Members                 |
| [Members]  |                                     |
| [Profile]  |  [  Photo  ]  Jane Doe              |
| [Admin]    |              Active                 |
|            |              Member since Jan 2025  |
|            |                                     |
|            |  PERSONAL INFO                      |
|            |  Gender:    Female                  |
|            |  Birthdate: 12 Mar 1990             |
|            |  Email:     jane@example.com        |
|            |  Phone:     +1 234 567 890          |
|            |  Address:   123 Main St, NY         |
|            |  Hobbies:   [Reading] [Hiking]      |
|            |  Notes:     Lorem ipsum...          |
|            |                                     |
|            |  [Edit Profile]  (admin/editor)     |
+------------+-------------------------------------+
```

**Interactions**
- On load → calls `GET /api/v1/members/:id`
- "Edit Profile" → navigate to `/members/:id/edit` (Admin/Editor only, hidden for Member)
- "Back to Members" → navigate to `/members`

---

### Edit Member Profile `/members/:id/edit`

```
+------------+-------------------------------------+
| LOGO       |  [Avatar] John Doe            [v]  |
+------------+-------------------------------------+
|            |  <- Back to Profile                 |
| [Members]  |                                     |
| [Profile]  |  Edit Profile — Jane Doe            |
| [Admin]    |                                     |
|            |  [  Photo  ]  [Change Photo]        |
|            |                                     |
|            |  Full Name *        Gender *        |
|            |  [______________]   [Male/Female v] |
|            |                                     |
|            |  Birthdate *        Phone           |
|            |  [______________]   [_____________] |
|            |                                     |
|            |  Address                            |
|            |  [___________________________________]|
|            |                                     |
|            |  Status *                           |
|            |  [Active / Inactive / Pending   [v]]|
|            |                                     |
|            |  Hobbies                            |
|            |  [______________] [tag1 x] [tag2 x] |
|            |                                     |
|            |  Notes (max 500 chars)              |
|            |  [___________________________________]|
|            |  [___________________________________]|
|            |  120 / 500                          |
|            |                                     |
|            |  [Save Changes]  [Cancel]           |
+------------+-------------------------------------+
```

**Interactions**
- On load → calls `GET /api/v1/members/:id` to pre-fill form
- "Change Photo" → opens file picker, validates JPG/PNG and max 2MB client-side → calls `POST /api/v1/members/:id/photo`
- Notes → live character counter
- "Save Changes" → calls `PUT /api/v1/members/:id`
- On success → redirect to `/members/:id` with success toast
- "Cancel" → navigate back to `/members/:id`
- Status field visible to Admin/Editor only

---

### My Profile `/profile`

> Same layout as `/members/:id` but always shows the logged-in user's profile.
> "Edit Profile" button navigates to `/profile/edit`.

---

### Edit My Profile `/profile/edit`

> Same layout as `/members/:id/edit` but:
> - Status field is hidden (members cannot change their own status)
> - "Save Changes" calls `PUT /api/v1/members/:id` with logged-in user's ID

---

### Change Password `/profile/change-password`

```
+------------+-------------------------------------+
| LOGO       |  [Avatar] John Doe            [v]  |
+------------+-------------------------------------+
|            |  <- Back to Profile                 |
| [Members]  |                                     |
| [Profile]  |  Change Password                    |
| [Admin]    |                                     |
|            |  Current Password                   |
|            |  [___________________________________]|
|            |                                     |
|            |  New Password                       |
|            |  [___________________________________]|
|            |                                     |
|            |  Confirm New Password               |
|            |  [___________________________________]|
|            |                                     |
|            |  [Save Password]  [Cancel]          |
+------------+-------------------------------------+
```

**Interactions**
- Submit → calls `POST /api/v1/auth/password-change`
- On success → show toast "Password changed successfully", redirect to `/profile`
- On failure → show inline error "Current password is incorrect"
- Passwords must match, validated client-side

---

### Invite Member `/members/invite`

```
+------------+-------------------------------------+
| LOGO       |  [Avatar] John Doe            [v]  |
+------------+-------------------------------------+
|            |  <- Back to Members                 |
| [Members]  |                                     |
| [Profile]  |  Invite New Member                  |
| [Admin]    |                                     |
|            |  Full Name *                        |
|            |  [___________________________________]|
|            |                                     |
|            |  Email *                            |
|            |  [___________________________________]|
|            |                                     |
|            |  [Generate Invitation Link]         |
|            |                                     |
|            |  - - - - - - - - - - - - - - - - -  |
|            |  (after generation)                 |
|            |                                     |
|            |  Invitation link generated!         |
|            |  Expires: 12 Apr 2026               |
|            |  [https://app.com/register/xxx...]  |
|            |  [Copy Link]                        |
+------------+-------------------------------------+
```

**Interactions**
- Submit → calls `POST /api/v1/invitations`
- On success → display the generated link with a "Copy Link" button
- "Copy Link" → copies link to clipboard, shows "Copied!" confirmation
- Link shows expiry date

---

### User Management `/admin/users`

```
+------------+-------------------------------------+
| LOGO       |  [Avatar] John Doe            [v]  |
+------------+-------------------------------------+
|            |  User Management                    |
| [Members]  |                                     |
| [Profile]  |  [Search by name or email...]  [Search] |
| [Admin]    |                                     |
|            |  Full Name    Email    Role    Actions          |
|            |  Jane Doe     j@x.com  Admin   [Change Role v] [Reset Password] |
|            |  John Smith   s@x.com  Editor  [Change Role v] [Reset Password] |
|            |  Bob Lee      b@x.com  Member  [Change Role v] [Reset Password] |
|            |  ...                                |
|            |                                     |
|            |  [< Prev]  Page 1 of 4  [Next >]   |
+------------+-------------------------------------+
```

**Interactions**
- On load → calls `GET /api/v1/members?page=1`
- "Change Role" dropdown → shows available roles, on select calls `PUT /api/v1/members/:id/role`
  - If promoting to Admin and limit reached → show error toast "Maximum number of Admins (4) has been reached"
- "Reset Password" → calls `POST /api/v1/auth/password-reset/request` on behalf of member, shows toast "Reset link sent"
- Search → filters list by name or email
