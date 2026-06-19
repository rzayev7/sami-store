function isVariantPopulated(cv) {
  const peer = cv?.productId;
  return (
    peer &&
    typeof peer === "object" &&
    Array.isArray(peer.colors) &&
    peer.colors.length > 0
  );
}

/**
 * Production API may return colorVariants.productId as a bare id string.
 * Fetch linked products so swatches can use their `colors` field (e.g. "Navy Blue").
 */
export async function enrichProductColorVariants(product, fetchById) {
  if (!product?.colorVariants?.length || typeof fetchById !== "function") {
    return product;
  }

  const needsWork = product.colorVariants.some((cv) => !isVariantPopulated(cv));
  if (!needsWork) return product;

  const colorVariants = await Promise.all(
    product.colorVariants.map(async (cv) => {
      if (isVariantPopulated(cv)) return cv;

      const rawId = cv?.productId?._id || cv?.productId;
      if (!rawId) return cv;

      try {
        const peer = await fetchById(String(rawId));
        if (!peer) return cv;

        return {
          ...cv,
          productId: {
            _id: peer._id,
            name: peer.name,
            images: peer.images,
            colors: Array.isArray(peer.colors) ? peer.colors : [],
          },
        };
      } catch {
        return cv;
      }
    }),
  );

  return { ...product, colorVariants };
}
