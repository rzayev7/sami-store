import { test, expect, Page } from "@playwright/test";

const SKIP_MSG = "No products loaded — backend API or database not available";

async function addProductAndGoToCheckout(page: Page) {
  await page.goto("/products");
  const firstCard = page.locator("article.group").first();
  const visible = await firstCard.isVisible({ timeout: 10_000 }).catch(() => false);
  if (!visible) {
    test.skip(true, SKIP_MSG);
    return;
  }

  await firstCard.locator("a").first().click();
  await page.waitForURL("**/products/**");

  const addBtn = page.getByRole("button", { name: /add to bag/i });
  await expect(addBtn).toBeVisible({ timeout: 20_000 });

  const sizeBtn = page.locator("button").filter({ hasText: /^(XS|S|M|L|XL|XXL)$/ }).first();
  if (await sizeBtn.isVisible().catch(() => false)) {
    await sizeBtn.click();
  }

  await addBtn.click();
  await expect(page.getByText(/added to bag/i)).toBeVisible({ timeout: 5_000 });

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible({ timeout: 10_000 });
}

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await addProductAndGoToCheckout(page);
  });

  test("checkout page loads with form and order summary", async ({ page }) => {
    await expect(page.getByText(/contact information/i)).toBeVisible();
    await expect(page.getByText(/order summary/i)).toBeVisible();
  });

  test("contact information fields are present", async ({ page }) => {
    await expect(page.locator("input[name='firstName']")).toBeVisible();
    await expect(page.locator("input[name='lastName']")).toBeVisible();
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='mobile']")).toBeVisible();
  });

  test("shipping address fields are present", async ({ page }) => {
    await expect(page.locator("input[name='address']")).toBeVisible();
    await expect(page.locator("input[name='city']")).toBeVisible();
    await expect(page.locator("select[name='country']")).toBeVisible();
  });

  test("country dropdown has options", async ({ page }) => {
    const countrySelect = page.locator("select[name='country']");
    const options = await countrySelect.locator("option").count();
    expect(options).toBeGreaterThan(10);
  });

  test("required field validation prevents empty submission", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: /place order/i });
    await submitBtn.click();
    expect(page.url()).toContain("/checkout");
  });

  test("user can fill in all required fields", async ({ page }) => {
    await page.locator("input[name='firstName']").fill("John");
    await page.locator("input[name='lastName']").fill("Doe");
    await page.locator("input[name='email']").fill("john@example.com");
    await page.locator("input[name='mobile']").fill("+1234567890");
    await page.locator("select[name='country']").selectOption("Azerbaijan");
    await page.locator("input[name='address']").fill("28 May Street");
    await page.locator("input[name='city']").fill("Baku");

    await expect(page.locator("input[name='firstName']")).toHaveValue("John");
    await expect(page.locator("input[name='city']")).toHaveValue("Baku");
  });

  test("order summary shows cart items", async ({ page }) => {
    const summary = page.getByText(/order summary/i).locator("..");
    await expect(summary.locator("article").first()).toBeVisible();
  });

  test("order summary shows subtotal and total", async ({ page }) => {
    await expect(page.getByText(/subtotal/i)).toBeVisible();
    await expect(page.getByText(/total/i).last()).toBeVisible();
  });

  test("coupon code input field exists", async ({ page }) => {
    await expect(page.locator("input[placeholder*='iscount']")).toBeVisible();
  });

  test("applying an invalid coupon shows error", async ({ page }) => {
    const couponInput = page.locator("input[placeholder*='iscount']");
    await couponInput.fill("INVALIDCODE");

    const applyBtn = page.getByRole("button", { name: /apply/i });
    await applyBtn.click();
    await expect(
      page.getByText(/invalid|could not validate/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("'Place Order' button is present and labeled correctly", async ({ page }) => {
    await expect(page.getByRole("button", { name: /place order/i })).toBeVisible();
  });

  test("visiting checkout with empty cart redirects to products", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("sami_cart_items"));
    await page.goto("/checkout");
    await page.waitForURL("**/products", { timeout: 10_000 });
    expect(page.url()).toContain("/products");
  });
});
