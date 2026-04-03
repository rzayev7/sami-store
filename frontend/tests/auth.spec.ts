import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:5000";
const TEST_PASSWORD = "Test123456";
const TEST_NAME = "E2E Tester";

function authModal(page: import("@playwright/test").Page) {
  return page.locator("div[role='dialog']").filter({ has: page.locator("#auth-email") });
}

function authOverlay(page: import("@playwright/test").Page) {
  return page.locator(".fixed.inset-0").filter({ has: page.locator("#auth-email") });
}

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("sami_customer_token"));
    await page.reload();
  });

  test("clicking Account icon when logged out opens auth modal", async ({ page }) => {
    await page.getByLabel("Account").click();
    await expect(authModal(page)).toBeVisible();
  });

  test("auth modal has Sign In / Create Account toggle", async ({ page }) => {
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    await expect(modal.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
    await expect(modal.getByRole("button", { name: /create account/i }).first()).toBeVisible();
  });

  test("switching to Create Account mode shows name and confirm password fields", async ({ page }) => {
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    await modal.getByRole("button", { name: /create account/i }).first().click();

    await expect(modal.locator("#auth-name")).toBeVisible();
    await expect(modal.locator("#auth-confirm")).toBeVisible();
  });

  test("signup with mismatched passwords shows error", async ({ page }) => {
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    await modal.getByRole("button", { name: /create account/i }).first().click();

    await modal.locator("#auth-name").fill(TEST_NAME);
    await modal.locator("#auth-email").fill("mismatch@test.com");
    await modal.locator("#auth-password").fill("password123");
    await modal.locator("#auth-confirm").fill("different456");

    await modal.getByRole("button", { name: /create account/i }).last().click();
    await expect(modal.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("signup with short password shows error", async ({ page }) => {
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    await modal.getByRole("button", { name: /create account/i }).first().click();

    await modal.locator("#auth-name").fill(TEST_NAME);
    await modal.locator("#auth-email").fill("short@test.com");
    await modal.locator("#auth-password").fill("123");
    await modal.locator("#auth-confirm").fill("123");

    await modal.getByRole("button", { name: /create account/i }).last().click();
    await expect(modal.getByText(/at least 6 characters/i)).toBeVisible();
  });

  test("login with wrong credentials shows error", async ({ page }) => {
    // This test requires the backend API + database to be available
    const apiOk = await page.request.get(`${API_URL}/api/products`).then(r => r.ok()).catch(() => false);
    if (!apiOk) { test.skip(true, "Backend API or database not available"); return; }

    await page.getByLabel("Account").click();
    const modal = authModal(page);

    await modal.locator("#auth-email").fill("nonexistent@fake.com");
    await modal.locator("#auth-password").fill("wrongpassword");

    await modal.getByRole("button", { name: /sign in/i }).last().click();
    await expect(modal.getByText(/invalid|wrong|something went wrong/i)).toBeVisible({ timeout: 15_000 });
  });

  test("successful signup closes modal and shows green dot indicator", async ({ page }) => {
    const apiOk = await page.request.get(`${API_URL}/api/products`).then(r => r.ok()).catch(() => false);
    if (!apiOk) { test.skip(true, "Backend API or database not available"); return; }

    const email = `signup_${Date.now()}@sami-e2e.com`;
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    await modal.getByRole("button", { name: /create account/i }).first().click();

    await modal.locator("#auth-name").fill(TEST_NAME);
    await modal.locator("#auth-email").fill(email);
    await modal.locator("#auth-password").fill(TEST_PASSWORD);
    await modal.locator("#auth-confirm").fill(TEST_PASSWORD);

    await modal.getByRole("button", { name: /create account/i }).last().click();
    await expect(authOverlay(page)).toHaveAttribute("class", /pointer-events-none/, { timeout: 15_000 });

    const greenDot = page.getByLabel("Account").locator("span.rounded-full");
    await expect(greenDot).toBeVisible();
  });

  test("successful login closes modal", async ({ page }) => {
    const apiOk = await page.request.get(`${API_URL}/api/products`).then(r => r.ok()).catch(() => false);
    if (!apiOk) { test.skip(true, "Backend API or database not available"); return; }

    const email = `login_${Date.now()}@sami-e2e.com`;

    // Sign up first
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    await modal.getByRole("button", { name: /create account/i }).first().click();
    await modal.locator("#auth-name").fill("Login Tester");
    await modal.locator("#auth-email").fill(email);
    await modal.locator("#auth-password").fill(TEST_PASSWORD);
    await modal.locator("#auth-confirm").fill(TEST_PASSWORD);
    await modal.getByRole("button", { name: /create account/i }).last().click();
    await expect(authOverlay(page)).toHaveAttribute("class", /pointer-events-none/, { timeout: 15_000 });

    // Logout
    await page.evaluate(() => localStorage.removeItem("sami_customer_token"));
    await page.reload();

    // Login
    await page.getByLabel("Account").click();
    const loginModal = authModal(page);
    await loginModal.locator("#auth-email").fill(email);
    await loginModal.locator("#auth-password").fill(TEST_PASSWORD);
    await loginModal.getByRole("button", { name: /sign in/i }).last().click();
    await expect(authOverlay(page)).toHaveAttribute("class", /pointer-events-none/, { timeout: 15_000 });
  });

  test("auth modal can be closed with X button", async ({ page }) => {
    await page.getByLabel("Account").click();
    await expect(authModal(page)).toBeVisible();

    await authModal(page).getByLabel("Close").click();
    await expect(authOverlay(page)).toHaveAttribute("class", /pointer-events-none/);
  });

  test("auth modal can be closed by clicking backdrop", async ({ page }) => {
    await page.getByLabel("Account").click();
    await expect(authModal(page)).toBeVisible();

    // Click the backdrop (the overlay div itself, outside the dialog)
    await authOverlay(page).click({ position: { x: 5, y: 5 } });
    await expect(authOverlay(page)).toHaveAttribute("class", /pointer-events-none/);
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.getByLabel("Account").click();
    const modal = authModal(page);
    const passwordInput = modal.locator("#auth-password");

    await expect(passwordInput).toHaveAttribute("type", "password");

    await modal.getByLabel("Show password").click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await modal.getByLabel("Hide password").click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("sidebar shows 'Sign In / Create Account' when logged out", async ({ page }) => {
    await page.getByLabel("Open menu").click();
    const sidebar = page.locator("aside").filter({ has: page.getByLabel("Close menu") });
    await expect(sidebar.getByText("Sign In / Create Account")).toBeVisible();
  });
});
