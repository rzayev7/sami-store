export function isProductsPublicEnabled() {
  return String(process.env.NEXT_PUBLIC_PRODUCTS_ENABLED ?? "true").toLowerCase() !== "false";
}

export const EMPTY_PRODUCTS_PAGE = {
  products: [],
  page: 1,
  totalPages: 0,
  totalProducts: 0,
};
