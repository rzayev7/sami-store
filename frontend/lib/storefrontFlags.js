/** Photos-only on product grids and PDP — flip to true to restore card/gallery videos. */
export const PRODUCT_VIDEOS_ENABLED = false;

export function productHasCardVideo(product) {
  return PRODUCT_VIDEOS_ENABLED && Boolean(product?.cardVideoUrl);
}
