import { test, expect } from "@playwright/test";

function sidebar(page: import("@playwright/test").Page) {
  return page.locator("aside").filter({ has: page.getByLabel("Close menu") });
}

test.describe("Navigation", () => {
  test("sidebar menu opens and closes", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Open menu").click();
    const side = sidebar(page);
    await expect(side).toBeVisible();

    await page.getByLabel("Close menu").click();
    await page.waitForTimeout(400);
    await expect(side).toHaveAttribute("class", /-translate-x-full/);
  });

  test("sidebar contains shop navigation links", async ({ page }) => {
    await page.goto("/products");
    await page.getByLabel("Open menu").click();

    const side = sidebar(page);
    await expect(side.getByText("All Products")).toBeVisible();
  });

  test("sidebar contains category links", async ({ page }) => {
    await page.goto("/products");
    await page.getByLabel("Open menu").click();

    const side = sidebar(page);
    await expect(side.getByText("New In")).toBeVisible();
    await expect(side.getByText("Dresses")).toBeVisible();
    await expect(side.getByText("Sets")).toBeVisible();
    await expect(side.getByText("Tops")).toBeVisible();
    await expect(side.getByText("Bottoms")).toBeVisible();
    await expect(side.getByText("Blazers")).toBeVisible();
    await expect(side.getByText("Sale")).toBeVisible();
  });

  test("clicking 'New In' navigates to products", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Open menu").click();
    await sidebar(page).getByText("New In").click();
    await page.waitForURL("**/products");
    expect(page.url()).toContain("/products");
  });

  test("clicking 'All Products' navigates to /products", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Open menu").click();
    await sidebar(page).getByText("All Products").click();
    await page.waitForURL("**/products");
    expect(page.url()).toContain("/products");
  });

  test("browser back button works after navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /shop collection/i }).click();
    await page.waitForURL("**/products");

    await page.goBack();
    await page.waitForURL("/");
    expect(page.url()).toMatch(/\/$/);
  });

  test("breadcrumb on product page links back to collection", async ({ page }) => {
    await page.goto("/products");

    const firstProduct = page.locator("article.group a").first();
    const visible = await firstProduct.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!visible) {
      test.skip(true, "No products loaded — backend API or database not available");
      return;
    }

    await firstProduct.click();
    await page.waitForURL("**/products/**");

    const breadcrumb = page.getByRole("link", { name: /collection/i });
    await expect(breadcrumb).toBeVisible();
    await breadcrumb.click();
    await page.waitForURL("**/products");
  });

  test("sidebar closes on route change", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Open menu").click();

    const side = sidebar(page);
    await expect(side).toBeVisible();

    await side.getByText("All Products").click();
    await page.waitForURL("**/products");
    await page.waitForTimeout(400);
    await expect(side).toHaveAttribute("class", /-translate-x-full/);
  });

  test("'Shop Collection' CTA on homepage leads to products", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /shop collection/i }).click();
    await page.waitForURL("**/products");
    await expect(page.getByText(/the collection/i)).toBeVisible();
  });
});
