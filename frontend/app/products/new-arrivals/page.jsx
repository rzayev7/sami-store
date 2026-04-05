"use client";

import ProductListing from "../../../components/ProductListing";

export default function NewArrivalsPage() {
  return (
    <ProductListing
      accentLabel="Just Dropped"
      title="New Arrivals"
      subtitle="The full collection, ordered with the newest pieces first."
      initialSort="newest"
    />
  );
}
