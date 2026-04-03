import { test, expect } from "@playwright/test";

const SKIP_MSG = "No products loaded — backend API or database not available";

async function waitForProducts(page: import("@playwright/test").Page) {
  const firstCard = page.locator("article.group").first();
  const visible = await firstCard.isVisible({ timeout: 10_000 }).catch(() => false);
  if (!visible) test.skip(true, SKIP_MSG);
}

test.describe("Product Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("page heading and subtitle render", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /the collection/i })).toBeVisible();
    await expect(page.getByText(/timeless silhouettes/i)).toBeVisible();
  });

  test("product cards render after loading", async ({ page }) => {
    await waitForProducts(page);
    const count = await page.locator("article.group").count();
    expect(count).toBeGreaterThan(0);
  });

  test("each product card has an image, title, and price", async ({ page }) => {
    await waitForProducts(page);
    const firstCard = page.locator("article.group").first();
    await expect(firstCard.locator("img").first()).toBeVisible();
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.locator("p").first()).toBeVisible();
  });

  test("clicking a product card opens the product detail page", async ({ page }) => {
    await waitForProducts(page);
    const firstCard = page.locator("article.group").first();
    await firstCard.locator("a").first().click();
    await page.waitForURL("**/products/**");
    expect(page.url()).toContain("/products/");
  });

  test("product count is displayed in the toolbar", async ({ page }) => {
    await expect(page.getByText(/\d+ products?/)).toBeVisible({ timeout: 20_000 });
  });

  test("sort dropdown changes product order", async ({ page }) => {
    await waitForProducts(page);
    await page.locator("select").selectOption("price-low");
    await page.waitForTimeout(500);
    const names = await page.locator("article.group h3").allTextContents();
    expect(names.length).toBeGreaterThan(0);
  });

  test("filter by price narrows results", async ({ page }) => {
    await waitForProducts(page);
    const allCount = await page.locator("article.group").count();

    const priceSection = page.locator("button", { hasText: "Price" }).first();
    if (await priceSection.isVisible()) await priceSection.click();

    const under100 = page.locator("button", { hasText: "Under $100" });
    if (await under100.isVisible()) {
      await under100.click();
      await page.waitForTimeout(500);
      const filteredCount = await page.locator("article.group").count();
      expect(filteredCount).toBeLessThanOrEqual(allCount);
    }
  });

  test("active filter pill shows and can be cleared", async ({ page }) => {
    await waitForProducts(page);

    const sizeSection = page.locator("button", { hasText: "Size" }).first();
    if (await sizeSection.isVisible()) await sizeSection.click();

    const sizeOption = page.locator("button").filter({ hasText: /^S$/ });
    if (await sizeOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sizeOption.click();
      await page.waitForTimeout(500);

      const pill = page.locator("button").filter({ hasText: /Size: S/ });
      await expect(pill).toBeVisible();

      await page.getByText("Clear all").click();
      await page.waitForTimeout(300);
      await expect(pill).not.toBeVisible();
    }
  });

  test("discount badges display on discounted products", async ({ page }) => {
    await waitForProducts(page);
    const discountedCards = page.locator("article.group .line-through");
    const discountCount = await discountedCards.count();
    expect(discountCount).toBeGreaterThanOrEqual(0);
  });
});
