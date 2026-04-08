"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProductListing from "../../components/ProductListing";

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";

  return (
    <ProductListing
      accentLabel="Curated Selection"
      title="The Collection"
      subtitle="Timeless silhouettes crafted with intention. Find your next signature piece."
      initialType={category}
    />
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
