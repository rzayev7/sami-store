"use client";

import { useCallback } from "react";
import ProductListing from "../../../components/ProductListing";

export default function NewArrivalsPage() {
  const filterNewArrivals = useCallback(
    (product) => product.isNewArrival === true,
    []
  );

  return (
    <ProductListing
      accentLabel="Just Dropped"
      title="New Arrivals"
      subtitle="The latest additions to our collection — fresh silhouettes and refined details."
      productFilter={filterNewArrivals}
    />
  );
}
