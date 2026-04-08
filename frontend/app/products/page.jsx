"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProductListing from "../../components/ProductListing";
import { useLanguage } from "../../context/LanguageContext";

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const { t } = useLanguage();

  return (
    <ProductListing
      accentLabel={t("products.curatedSelection")}
      title={t("products.theCollection")}
      subtitle={t("products.collectionDesc")}
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
