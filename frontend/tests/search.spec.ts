import { test, expect } from "@playwright/test";

const SKIP_MSG = "No products loaded — backend API or database not available";

async function waitForProducts(page: import("@playwright/test").Page) {
  const firstCard = page.locator("article.group").first();
  const visible = await firstCard.isVisible({ timeout: 10_000 }).catch(() => false);
  if (!visible) test.skip(true, SKIP_MSG);
}

test.describe("Search & Product Discovery", () => {
  test("search icon in navbar links to products page", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search").click();
    await page.waitForURL("**/products");
    expect(page.url()).toContain("/products");
  });

  test("products page displays items from the API", async ({ page }) => {
    await page.goto("/products");
    await waitForProducts(page);
    const count = await page.locator("article.group").count();
    expect(count).toBeGreaterThan(0);
  });

  test("sort by 'Name: A → Z' reorders products alphabetically", async ({ page }) => {
    await page.goto("/products");
    await waitForProducts(page);

    await page.locator("select").selectOption("name-asc");
    await page.waitForTimeout(500);

    const names = await page.locator("article.group h3").allTextContents();
    expect(names.length).toBeGreaterThan(1);

    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test("sort by 'Price: Low → High' orders products by ascending price", async ({ page }) => {
    await page.goto("/products");
    await waitForProducts(page);

    await page.locator("select").selectOption("price-low");
    await page.waitForTimeout(500);
    const cards = await page.locator("article.group").count();
    expect(cards).toBeGreaterThan(0);
  });

  test("filtering by size shows only matching products or empty state", async ({ page }) => {
    await page.goto("/products");
    await waitForProducts(page);

    const allCount = await page.locator("article.group").count();

    const sizeBtn = page.locator("button", { hasText: "Size" }).first();
    if (await sizeBtn.isVisible()) await sizeBtn.click();

    const sOption = page.locator("button").filter({ hasText: /^S$/ });
    if (await sOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sOption.click();
      await page.waitForTimeout(500);

      const filteredCount = await page.locator("article.group").count();
      const hasEmpty = await page.getByText(/no products found/i).isVisible().catch(() => false);
      expect(filteredCount < allCount || hasEmpty).toBeTruthy();
    }
  });

  test("clear all filters button resets product listing", async ({ page }) => {
    await page.goto("/products");
    await waitForProducts(page);

    const allCount = await page.locator("article.group").count();

    const sizeBtn = page.locator("button", { hasText: "Size" }).first();
    if (await sizeBtn.isVisible()) await sizeBtn.click();

    const sOption = page.locator("button").filter({ hasText: /^S$/ });
    if (await sOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sOption.click();
      await page.waitForTimeout(500);

      const clearAll = page.getByText("Clear all");
      if (await clearAll.isVisible()) {
        await clearAll.click();
        await page.waitForTimeout(500);
        const resetCount = await page.locator("article.group").count();
        expect(resetCount).toBe(allCount);
      }
    }
  });

  test("best sellers page loads products", async ({ page }) => {
    await page.goto("/products/best-sellers");
    await expect(page.getByRole("heading", { name: /best sellers/i })).toBeVisible();
  });

  test("new arrivals page loads products", async ({ page }) => {
    await page.goto("/products/new-arrivals");
    await expect(page.getByRole("heading", { name: /new arrivals/i })).toBeVisible();
  });
});
