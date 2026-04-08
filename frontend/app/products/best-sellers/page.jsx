"use client";

import { useCallback } from "react";
import ProductListing from "../../../components/ProductListing";
import { useLanguage } from "../../../context/LanguageContext";

export default function BestSellersPage() {
  const { t } = useLanguage();
  const filterBestSellers = useCallback(
    (product) => product.isBestSeller === true,
    []
  );

  return (
    <ProductListing
      accentLabel={t("products.mostLovedEyebrow")}
      title={t("products.bestSellersTitle")}
      subtitle={t("products.bestSellersDesc")}
      productFilter={filterBestSellers}
    />
  );
}
