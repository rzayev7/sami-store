"use client";

import { useCallback } from "react";
import ProductListing from "../../../components/ProductListing";

export default function FeaturedProductsPage() {
  const filterFeatured = useCallback((product) => product.featured === true, []);

  return (
    <ProductListing
      accentLabel="Editor's Picks"
      title="Featured"
      subtitle="Our standout pieces — the same curated catalog, narrowed to the top picks."
      productFilter={filterFeatured}
      initialSort="featured"
    />
  );
}
