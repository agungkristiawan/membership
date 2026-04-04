const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:5173';

async function login(page, username = 'admin', password = 'beruk123') {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/members`);
}

test('login - wrong password shows error', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'wrongpass');
  await page.click('button[type="submit"]');
  await expect(page.locator('p.text-red-500')).toBeVisible();
  await expect(page.locator('p.text-red-500')).toContainText('Invalid username or password');
});

test('login - success redirects to members', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(`${BASE}/members`);
  await expect(page.locator('h2')).toContainText('Members');
});

test('member directory - loads list with pagination', async ({ page }) => {
  await login(page);
  await expect(page.locator('table')).toBeVisible();
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});

test('member directory - search works', async ({ page }) => {
  await login(page);
  await page.fill('input[placeholder*="Search"]', 'admin');
  await page.click('button[type="submit"]');
  await expect(page.locator('table tbody tr')).toHaveCount(1);
});

test('member profile - loads full profile', async ({ page }) => {
  await login(page);
  await page.locator('table tbody tr').first().locator('a').click();
  await page.waitForURL(/\/members\/.+/);
  await expect(page.locator('h2').first()).toBeVisible();
  await expect(page.locator('text=Email')).toBeVisible();
  await expect(page.locator('span.text-gray-500:has-text("Role")')).toBeVisible();
});

test('member profile - own profile has no remove button', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/profile`);
  await expect(page.locator('text=Remove Member')).not.toBeVisible();
});

test('edit profile - navigates to profile on success', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/profile/edit`);
  // Wait for form to be populated from API
  await page.waitForFunction(() => {
    const selects = document.querySelectorAll('select');
    return selects.length > 0 && selects[0].value !== '';
  });
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/members\/.+/);
  await expect(page.locator('h2').first()).toBeVisible();
});

test('change password - passwords do not match', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/profile/change-password`);
  const inputs = page.locator('input[type="password"]');
  await inputs.nth(0).fill('admin123');
  await inputs.nth(1).fill('newpass123');
  await inputs.nth(2).fill('different');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Passwords do not match')).toBeVisible();
});

test('change password - wrong current password shows error', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/profile/change-password`);
  const inputs = page.locator('input[type="password"]');
  await inputs.nth(0).fill('wrongpass');
  await inputs.nth(1).fill('newpass123');
  await inputs.nth(2).fill('newpass123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Current password is incorrect')).toBeVisible();
});

test('invite member - generates copyable link', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/members/invite`);
  await page.fill('input[type="email"]', `invite-${Date.now()}@test.com`);
  await page.fill('input[type="text"]', 'Invite Test');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Invitation link generated!')).toBeVisible();
  const linkInput = page.locator('input[readonly]');
  await expect(linkInput).toBeVisible();
  const value = await linkInput.inputValue();
  expect(value).toContain('/register/');
});

test('user management - loads with role dropdowns', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/admin/users`);
  await expect(page.locator('text=User Management')).toBeVisible();
  await expect(page.locator('table tbody select').first()).toBeVisible();
});

test('user management - own row is read-only with (you) badge', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/admin/users`);
  await expect(page.locator('text=(you)')).toBeVisible();
  const selfRow = page.locator('tbody tr:has-text("(you)")');
  await expect(selfRow.locator('select')).not.toBeVisible();
  await expect(selfRow.locator('text=Reset Password')).not.toBeVisible();
});

test('user management - reset password shows modal with link', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/admin/users`);
  const otherRow = page.locator('tbody tr:not(:has-text("(you)"))').first();
  await otherRow.locator('text=Reset Password').click();
  await expect(page.locator('text=Password Reset Link')).toBeVisible();
  const linkInput = page.locator('input[readonly]');
  const value = await linkInput.inputValue();
  expect(value).toContain('/reset-password/');
});

test('forgot password - shows contact admin message, no form', async ({ page }) => {
  await page.goto(`${BASE}/forgot-password`);
  await expect(page.locator('text=contact an admin')).toBeVisible();
  await expect(page.locator('input')).not.toBeVisible();
});

test('reset password - invalid token shows error', async ({ page }) => {
  await page.goto(`${BASE}/reset-password/invalid-token-123`);
  const inputs = page.locator('input[type="password"]');
  await inputs.nth(0).fill('newpass123');
  await inputs.nth(1).fill('newpass123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Invalid or expired reset token')).toBeVisible();
});

test('protected route - redirects unauthenticated to login', async ({ page }) => {
  await page.goto(`${BASE}/members`);
  await expect(page).toHaveURL(`${BASE}/login`);
});
