# Membership App — Requirements

## Overview
A generic web-based membership management application, adaptable for communities such as alumni associations or church member management.

---

## Roles & Permissions

| Feature | Admin | Editor | Member |
|---|---|---|---|
| User management (create/delete users, assign roles) | ✅ | ❌ | ❌ |
| Add / remove members | ✅ | ✅ | ❌ |
| Edit any member profile | ✅ | ✅ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Search & view other member profiles | ✅ | ✅ | ✅ |

---

## Member Profile Fields

| Field | Details |
|---|---|
| Full name | |
| Photo | JPG/PNG only, max 2MB |
| Gender | male / female |
| Birthdate | |
| Email | |
| Phone | |
| Address | |
| Join date | |
| Membership status | active / inactive / pending |
| Hobbies | free-text, multiple values |
| Notes | max 500 characters |

---

## Member Directory & Search

- All roles can access the member list page
- Displays 25 members per page (pagination)
- First 25 members shown on initial load
- Searchable by: name, email, status

---

## Role Management

- Only Admin can grant or revoke roles
- Maximum of 4 Admins at any time
- A regular member can be promoted to Editor or Admin
- A member can also be demoted back to a lower role

---

## Authentication

- Login via username and password

---

## Member Registration / Onboarding

- Admin or Editor generates an invitation link
- Link is shared with the invitee (email or manually)
- Invitee clicks the link and completes their profile
- Upon completion, membership status is set to **active** immediately
- Invitation link expires after **1 month**

---

## User Acceptance Criteria (Gherkin)

### Authentication

```gherkin
Feature: Login

  Scenario: Successful login
    Given a registered user with a valid username and password
    When they submit the login form
    Then they are redirected to the dashboard

  Scenario: Failed login with wrong credentials
    Given a registered user
    When they submit the login form with an incorrect password
    Then they see an error message "Invalid username or password"

  Scenario: Login with inactive account
    Given a member whose status is inactive
    When they attempt to log in
    Then they see an error message "Your account is inactive"
```

---

### Password Reset

```gherkin
Feature: Password Reset

  Scenario: Member requests a password reset
    Given I am on the login page
    When I request a password reset with my email
    Then I receive a password reset link via email
    And the link expires after 1 hour

  Scenario: Admin or Editor triggers a password reset on behalf of a member
    Given I am logged in as an Admin or Editor
    When I trigger a password reset for a member
    Then the member receives a password reset link via email

  Scenario: Member resets password with a valid link
    Given I have received a valid password reset link
    When I submit a new password
    Then my password is updated successfully
    And the reset link is invalidated

  Scenario: Member uses an expired reset link
    Given a password reset link older than 1 hour
    When I attempt to reset my password
    Then I see an error "Invalid or expired reset token"

  Scenario: Member changes password while logged in
    Given I am logged in
    When I submit my current password and a new password
    Then my password is updated successfully

  Scenario: Member enters incorrect current password
    Given I am logged in
    When I submit an incorrect current password
    Then I see an error "Current password is incorrect"
```

---

### Member Registration / Onboarding

```gherkin
Feature: Invitation-based Registration

  Scenario: Admin generates an invitation link
    Given I am logged in as an Admin or Editor
    When I generate an invitation link for a new member
    Then a unique single-use invitation link is created
    And the link expires after 1 month

  Scenario: Invitee completes registration via valid link
    Given I have received a valid invitation link
    When I open the link and complete my profile
    Then my membership status is set to active
    And I can log in to the app

  Scenario: Invitee uses an expired invitation link
    Given an invitation link that is older than 1 month
    When I open the link
    Then I see an error message "This invitation link has expired"

  Scenario: Invitee uses an already used invitation link
    Given an invitation link that has already been used
    When I open the link
    Then I see an error message "This invitation link is no longer valid"
```

---

### Member Profile

```gherkin
Feature: View Own Profile

  Scenario: Member views their own profile
    Given I am logged in as a Member, Editor, or Admin
    When I navigate to my profile page
    Then I can see all my profile fields

Feature: Edit Own Profile

  Scenario: Member edits their own profile
    Given I am logged in as any role
    When I update my profile fields and save
    Then my profile is updated successfully

  Scenario: Member uploads a valid profile photo
    Given I am editing my profile
    When I upload a JPG or PNG file under 2MB
    Then my profile photo is updated successfully

  Scenario: Member uploads a photo exceeding 2MB
    Given I am editing my profile
    When I upload a photo larger than 2MB
    Then I see an error "Photo must not exceed 2MB"

  Scenario: Member uploads an unsupported photo format
    Given I am editing my profile
    When I upload a file that is not JPG or PNG
    Then I see an error "Only JPG and PNG formats are allowed"

  Scenario: Member submits notes exceeding 500 characters
    Given I am editing my profile
    When I enter more than 500 characters in the Notes field
    Then I see an error "Notes cannot exceed 500 characters"

Feature: Edit Any Member Profile

  Scenario: Editor edits another member's profile
    Given I am logged in as an Editor or Admin
    When I open another member's profile and make changes
    Then the member's profile is updated successfully

  Scenario: Member attempts to edit another member's profile
    Given I am logged in as a Member
    When I attempt to access another member's profile edit page
    Then I am denied access
```

---

### Member Directory & Search

```gherkin
Feature: Member Directory

  Scenario: User accesses the member list
    Given I am logged in as any role
    When I navigate to the member directory
    Then I see the first 25 members displayed
    And pagination controls are visible

  Scenario: User navigates to the next page
    Given I am on the member directory page
    When I click the next page button
    Then the next 25 members are displayed

Feature: Member Search

  Scenario: Search by name
    Given I am on the member directory page
    When I search by a member's name
    Then only members matching that name are displayed

  Scenario: Search by email
    Given I am on the member directory page
    When I search by a member's email
    Then only members matching that email are displayed

  Scenario: Search by status
    Given I am on the member directory page
    When I filter by membership status
    Then only members with that status are displayed

  Scenario: No search results found
    Given I am on the member directory page
    When I search for a term that matches no members
    Then I see a message "No members found"
```

---

### Role Management

```gherkin
Feature: Role Assignment

  Scenario: Admin promotes a member to Editor
    Given I am logged in as an Admin
    When I change a member's role to Editor
    Then the member's role is updated to Editor
    And they gain Editor permissions immediately

  Scenario: Admin promotes a member to Admin
    Given I am logged in as an Admin
    And there are currently fewer than 4 Admins
    When I change a member's role to Admin
    Then the member's role is updated to Admin

  Scenario: Admin attempts to promote when Admin limit is reached
    Given I am logged in as an Admin
    And there are already 4 Admins
    When I attempt to promote another member to Admin
    Then I see an error "Maximum number of Admins (4) has been reached"

  Scenario: Admin demotes an Editor back to Member
    Given I am logged in as an Admin
    When I change an Editor's role back to Member
    Then the Editor's role is updated to Member
    And they lose Editor permissions immediately

  Scenario: Editor attempts to change a member's role
    Given I am logged in as an Editor
    When I attempt to access role management
    Then I am denied access

  Scenario: Member attempts to change a member's role
    Given I am logged in as a Member
    When I attempt to access role management
    Then I am denied access
```

---

### Member Management (Add / Remove)

```gherkin
Feature: Add Member

  Scenario: Editor adds a new member via invitation
    Given I am logged in as an Editor or Admin
    When I generate an invitation link and share it
    Then the invitee can register and become an active member

Feature: Remove Member

  Scenario: Editor removes a member
    Given I am logged in as an Editor or Admin
    When I remove a member
    Then the member is soft deleted and can no longer log in
    And their data is retained in the system

  Scenario: Member attempts to remove another member
    Given I am logged in as a Member
    When I attempt to remove a member
    Then I am denied access
```
