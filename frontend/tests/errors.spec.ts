import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test("invalid product ID shows 'Product not found'", async ({ page }) => {
    await page.goto("/products/000000000000000000000000");
    await expect(page.getByText(/product not found/i)).toBeVisible({ timeout: 20_000 });
  });

  test("product not found page has a link back to collection", async ({ page }) => {
    await page.goto("/products/000000000000000000000000");
    await expect(page.getByText(/product not found/i)).toBeVisible({ timeout: 20_000 });

    const backLink = page.getByRole("link", { name: /back to collection/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL("**/products");
  });

  test("unknown URL shows Next.js 404 page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-at-all");
    expect(response?.status()).toBe(404);
  });

  test("website does not crash on deeply nested invalid route", async ({ page }) => {
    const response = await page.goto("/a/b/c/d/e/f/g");
    expect(response?.status()).toBe(404);
  });

  test("accessing /admin/login does not crash", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("checkout with empty cart redirects to products", async ({ page }) => {
    // Navigate first to establish page context, then clear cart
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("sami_cart_items"));
    await page.goto("/checkout");
    await page.waitForURL("**/products", { timeout: 10_000 });
    expect(page.url()).toContain("/products");
  });

  test("API failure on product listing shows empty state gracefully", async ({ page }) => {
    await page.route("**/api/products", (route) => route.abort());
    await page.goto("/products");

    await expect(
      page.getByText(/no products found/i).or(page.getByText(/the collection/i))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("API failure on product detail shows 'Product not found'", async ({ page }) => {
    await page.route("**/api/products/**", (route) => route.abort());
    await page.goto("/products/507f1f77bcf86cd799439011");

    await expect(page.getByText(/product not found/i)).toBeVisible({ timeout: 15_000 });
  });
});
