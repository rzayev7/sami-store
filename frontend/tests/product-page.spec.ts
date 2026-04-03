import { test, expect, Page } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:5000";
const SKIP_MSG = "No products loaded — backend API or database not available";

interface Product {
  _id: string;
  stock?: number | string;
  sizes?: string[];
  images?: string[];
  discountPriceUSD?: number;
  priceUSD?: number;
}

async function navigateToFirstProduct(page: Page) {
  // Check backend/API state and product availability first so we only skip
  // when there are truly no products available from the API.
  const res = await page.request
    .get(`${API_URL}/api/products`)
    .catch(() => null);
  if (!res || !res.ok()) {
    test.skip(true, SKIP_MSG);
    return;
  }

  const data = (await res.json().catch(() => null as unknown)) as
    | Product[]
    | null;
  if (!Array.isArray(data) || data.length === 0) {
    test.skip(true, SKIP_MSG);
    return;
  }

  // Prefer a product that has room to increase quantity (stock > 1) so that
  // cart/quantity interactions behave consistently across environments.
  const products = data as Product[];
  const inStock =
    products.find((p) => Number(p?.stock ?? 0) > 1) ??
    products.find((p) => Number(p?.stock ?? 0) > 0) ??
    products[0];
  const productId = inStock?._id;
  if (!productId) {
    test.skip(true, SKIP_MSG);
    return;
  }

  await page.goto("/products");
  await page.waitForLoadState("domcontentloaded");

  // Target a product detail link for the chosen product. We don't scope to
  // specific card markup to keep this robust to layout changes.
  const productLink = page
    .locator(`a[href="/products/${productId}"]`)
    .first();
  await expect(productLink).toBeVisible({ timeout: 15_000 });

  await productLink.scrollIntoViewIfNeeded();
  await productLink.click();
  // Wait for the product detail page to render by checking for the title.
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 20_000 });
}

async function selectFirstAvailableSize(page: Page) {
  const sizeBtn = page
    .locator('[data-testid="size-option"]')
    .first();
  if (await sizeBtn.isVisible().catch(() => false)) {
    await sizeBtn.click();
  }
}

test.describe("Product Detail Page", () => {
  test.afterEach(async ({ page }) => {
    // Ensure cart state does not leak between tests
    await page.evaluate(() => {
      localStorage.removeItem("sami_cart_items");
    });
  });

  test.beforeEach(async ({ page }) => {
    await navigateToFirstProduct(page);
  });

  test.describe("Basics", () => {
    test("product page loads with title and price", async ({ page }) => {
      const title = page.locator("h1").first();
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText?.length).toBeGreaterThan(0);

      // Scope the price assertion to the primary price span rather than
      // matching any currency symbol on the page.
      await expect(
        page.locator("span.font-medium.tracking-\\[0\\.02em\\]").first(),
      ).toBeVisible();
    });

    test("product description is visible", async ({ page }) => {
      const description = page
        .locator("section p")
        .filter({ hasText: /.{20,}/ })
        .first();
      if (await description.isVisible().catch(() => false)) {
        const text = await description.textContent();
        expect(text?.length).toBeGreaterThan(10);
      }
    });

    test("delivery promises section is visible", async ({ page }) => {
      await expect(
        page.getByTestId("delivery-promises"),
      ).toBeVisible();
    });
  });

  test.describe("Images", () => {
    test("main product image is rendered", async ({ page }) => {
      const mainImage = page.locator("section img").first();
      await expect(mainImage).toBeVisible();
    });

    test("image gallery thumbnails work when multiple images exist", async ({ page }) => {
      const thumbnails = page
        .getByTestId("image-thumbnails")
        .locator("button");
      const count = await thumbnails.count();
      if (count > 1) {
        const mainImage = page
          .getByTestId("main-product-image")
          .locator("img")
          .first();
        const initialSrc = await mainImage.getAttribute("src");

        await thumbnails.nth(1).click();
        if (await mainImage.isVisible().catch(() => false)) {
          await expect(mainImage).not.toHaveAttribute(
            "src",
            initialSrc ?? "",
          );
        }
      }
    });

    test("image navigation arrows work", async ({ page }) => {
      const nextBtn = page.getByLabel("Next image");
      if (await nextBtn.isVisible().catch(() => false)) {
        const imageContainer = page
          .getByTestId("main-product-image")
          .first();
        const mainImage = imageContainer.locator("img").first();
        const initialSrc = await mainImage.getAttribute("src");

        await imageContainer.hover();
        await nextBtn.click();

        if (await mainImage.isVisible().catch(() => false)) {
          await expect(mainImage).not.toHaveAttribute(
            "src",
            initialSrc ?? "",
          );
        }
      }
    });
  });

  test.describe("Product options", () => {
    test("size selector buttons are clickable", async ({ page }) => {
      const firstSize = page.getByTestId("size-option").first();
      if (await firstSize.isVisible().catch(() => false)) {
        await firstSize.click();
        await expect(firstSize).toHaveClass(
          /bg-\[var\(--color-sand\)\]\/50/,
        );
      }
    });

    test("color selector buttons are clickable", async ({ page }) => {
      const firstColor = page.getByTestId("color-option").first();
      if (await firstColor.isVisible().catch(() => false)) {
        await firstColor.click();
        await expect(firstColor).toBeVisible();
      }
    });
  });

  test.describe("Cart interactions", () => {
    test("quantity can be increased and decreased", async ({ page }) => {
      await selectFirstAvailableSize(page);

      const quantitySection = page.getByTestId("quantity-section");
      const quantityDisplay = quantitySection.locator("span.tabular-nums");
      await expect(quantityDisplay).toHaveText("1");

      const increaseBtn = quantitySection.getByLabel("Increase quantity");
      await expect(increaseBtn).toBeEnabled();
      await increaseBtn.click();
      await expect(quantityDisplay).toHaveText("2");

      const decreaseBtn = quantitySection.getByLabel("Decrease quantity");
      await expect(decreaseBtn).toBeEnabled();
      await decreaseBtn.click();
      await expect(quantityDisplay).toHaveText("1");
    });

    test("'Add to Bag' button opens cart drawer", async ({ page }) => {
      await selectFirstAvailableSize(page);

      const addBtn = page.getByTestId("add-to-bag-button");
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toBeEnabled();
      await addBtn.click();

      // After adding to bag, the cart drawer should open as the cart context
      // sets isCartOpen=true. Assert on that instead of brittle toast text.
      const cartDrawer = page.getByRole("dialog", { name: /shopping cart/i });
      await expect(cartDrawer).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Navigation", () => {
    test("breadcrumb 'Collection' link navigates back", async ({ page }) => {
      const breadcrumb = page.getByRole("link", { name: /collection/i });
      await expect(breadcrumb).toBeVisible();
      await breadcrumb.click();
      // Rely on the products page heading rather than URL navigation events.
      await expect(
        page.getByRole("heading", { name: /the collection/i }),
      ).toBeVisible({ timeout: 20_000 });
    });
  });
});
