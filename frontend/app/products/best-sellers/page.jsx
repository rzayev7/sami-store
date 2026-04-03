"use client";

import { useCallback } from "react";
import ProductListing from "../../../components/ProductListing";

export default function BestSellersPage() {
  const filterBestSellers = useCallback(
    (product) => product.isBestSeller === true,
    []
  );

  return (
    <ProductListing
      accentLabel="Most Loved"
      title="Best Sellers"
      subtitle="Our most popular pieces — chosen again and again by women around the world."
      productFilter={filterBestSellers}
    />
  );
}
