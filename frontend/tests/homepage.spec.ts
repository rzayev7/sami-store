import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads successfully with 200 status", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("SAMÍ logo is visible in the header", async ({ page }) => {
    const logo = page.locator("header").getByText("SAMÍ").first();
    await expect(logo).toBeVisible();
  });

  test("navigation header is rendered", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Hamburger menu button
    await expect(page.getByLabel("Open menu")).toBeVisible();
    // Cart button
    await expect(page.getByLabel("Open cart")).toBeVisible();
    // Account button
    await expect(page.getByLabel("Account")).toBeVisible();
  });

  test("hero section renders with slide content", async ({ page }) => {
    // Hero has slide titles and a CTA
    const shopBtn = page.getByRole("link", { name: /shop collection/i });
    await expect(shopBtn).toBeVisible();
  });

  test("brand statement section is visible", async ({ page }) => {
    const heading = page.getByText("Crafted for timeless elegance");
    await expect(heading).toBeVisible();
  });

  test("best sellers section loads products", async ({ page }) => {
    const bestSellersHeading = page.getByRole("heading", { name: /best sellers/i });
    await expect(bestSellersHeading).toBeVisible({ timeout: 10_000 });
  });

  test("'Designed in Baku' section is visible", async ({ page }) => {
    await expect(page.getByText("Designed in Baku")).toBeVisible();
    await expect(page.getByRole("link", { name: /explore collection/i })).toBeVisible();
  });

  test("clicking logo from another page returns to homepage", async ({ page }) => {
    await page.goto("/products");
    await page.locator("header").getByText("SAMÍ").click();
    await page.waitForURL("/");
    expect(page.url()).toMatch(/\/$/);
  });

  test("no console errors on homepage load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(2_000);

    // Filter out known noisy third-party errors
    const critical = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("third-party")
    );
    expect(critical).toHaveLength(0);
  });

  test("footer renders with correct copyright year", async ({ page }) => {
    const year = new Date().getFullYear().toString();
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(year);
    await expect(footer).toContainText("SAMÍ");
  });

  test("footer contains essential links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("New In")).toBeVisible();
    await expect(footer.getByText("Sale")).toBeVisible();
    await expect(footer.getByText("All Products")).toBeVisible();
    await expect(footer.getByText("Track Order")).toBeVisible();
  });

  test("no broken images on homepage", async ({ page }) => {
    await page.waitForLoadState("load");
    await page.waitForTimeout(2_000);

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.src);
    });

    expect(brokenImages).toHaveLength(0);
  });
});
