import { test, expect, Page } from "@playwright/test";

const SKIP_MSG = "No products loaded — backend API or database not available";

async function addFirstProductToCart(page: Page) {
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
}

function cartDrawer(page: Page) {
  return page.locator("aside[aria-label='Shopping cart']");
}

test.describe("Cart Functionality", () => {
  test("adding a product updates the cart counter in navbar", async ({ page }) => {
    await addFirstProductToCart(page);
    const counter = page.locator("header").getByText(/^\d+$/).first();
    await expect(counter).toBeVisible({ timeout: 5_000 });
  });

  test("cart drawer opens and shows the added product", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    await expect(cartDrawer(page)).toBeVisible();
    await expect(cartDrawer(page).locator("article").first()).toBeVisible();
  });

  test("cart drawer shows 'Your Bag' header with item count", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    await expect(cartDrawer(page).getByText(/your bag/i)).toBeVisible();
    await expect(cartDrawer(page).getByText(/\(\d+\)/)).toBeVisible();
  });

  test("cart shows subtotal", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    await expect(cartDrawer(page).getByText(/subtotal/i)).toBeVisible();
  });

  test("increasing quantity updates the count", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    const drawer = cartDrawer(page);
    await drawer.getByLabel("Increase quantity").first().click();
    await expect(drawer.locator(".tabular-nums").first()).toHaveText("2", { timeout: 3_000 });
  });

  test("decreasing quantity updates the count", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    const drawer = cartDrawer(page);
    await drawer.getByLabel("Increase quantity").first().click();
    await page.waitForTimeout(300);
    await drawer.getByLabel("Decrease quantity").first().click();
    await expect(drawer.locator(".tabular-nums").first()).toHaveText("1", { timeout: 3_000 });
  });

  test("removing an item shows empty cart state", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    const drawer = cartDrawer(page);
    await drawer.locator("button[aria-label^='Remove']").first().click();
    await expect(drawer.getByText(/your bag is empty/i)).toBeVisible({ timeout: 5_000 });
  });

  test("empty cart shows 'Continue Shopping' link", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Open cart").click();
    await expect(cartDrawer(page).getByText(/continue shopping/i)).toBeVisible();
  });

  test("cart drawer can be closed with X button", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Open cart").click();
    await expect(cartDrawer(page)).toBeVisible();

    await cartDrawer(page).getByLabel("Close cart").click();
    await page.waitForTimeout(400);
    await expect(cartDrawer(page)).toHaveAttribute("class", /translate-x-full/);
  });

  test("free shipping progress bar is shown with items in cart", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    await expect(
      cartDrawer(page).getByText(/away from free shipping|unlocked free shipping/i)
    ).toBeVisible();
  });

  test("checkout button is visible when cart has items", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    await expect(cartDrawer(page).getByRole("link", { name: /checkout/i })).toBeVisible();
  });

  test("checkout link navigates to /checkout", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByLabel("Open cart").click();
    await cartDrawer(page).getByRole("link", { name: /checkout/i }).click();
    await page.waitForURL("**/checkout");
    expect(page.url()).toContain("/checkout");
  });
});
