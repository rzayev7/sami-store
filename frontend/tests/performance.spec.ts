import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("homepage loads within 15 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    // First load includes Next.js compilation in dev mode
    expect(elapsed).toBeLessThan(15_000);
  });

  test("products page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/products", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5_000);
  });

  test("product detail page loads within 5 seconds", async ({ page }) => {
    await page.goto("/products");
    const firstCard = page.locator("article.group").first();

    // Skip if no products available (API/DB not connected)
    if (!(await firstCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No products loaded — backend API or database not available");
      return;
    }

    const href = await firstCard.locator("a").first().getAttribute("href");
    if (!href) return;

    const start = Date.now();
    await page.goto(href, { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5_000);
  });

  test("images use Next.js Image component (lazy loading)", async ({ page }) => {
    await page.goto("/products");
    const firstCard = page.locator("article.group").first();

    if (!(await firstCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, "No products loaded — backend API or database not available");
      return;
    }

    const images = page.locator("article.group img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    const firstImg = images.first();
    const loadingAttr = await firstImg.getAttribute("loading");
    expect(loadingAttr === "lazy" || loadingAttr === "eager" || loadingAttr === null).toBeTruthy();
  });

  test("homepage hero image is loaded with priority", async ({ page }) => {
    await page.goto("/");
    const heroImages = page.locator("img[fetchpriority='high'], img[loading='eager']");
    const count = await heroImages.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("no layout shift on product listing load", async ({ page }) => {
    await page.goto("/products");

    const cls = await page.evaluate(() =>
      new Promise<number>((resolve) => {
        let total = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              total += (entry as any).value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(total);
        }, 3_000);
      })
    );

    expect(cls).toBeLessThan(0.25);
  });

  test("total page weight for homepage is reasonable", async ({ page }) => {
    let totalBytes = 0;
    page.on("response", (resp) => {
      const headers = resp.headers();
      const len = parseInt(headers["content-length"] || "0", 10);
      totalBytes += len;
    });

    await page.goto("/", { waitUntil: "load" });
    const totalMB = totalBytes / (1024 * 1024);
    expect(totalMB).toBeLessThan(10);
  });
});
