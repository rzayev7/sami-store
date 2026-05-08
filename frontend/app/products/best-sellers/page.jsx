"use client";

import ProductListing from "../../../components/ProductListing";
import { useLanguage } from "../../../context/LanguageContext";

export default function BestSellersPage() {
  const { t } = useLanguage();

  return (
    <ProductListing
      accentLabel={t("products.mostLovedEyebrow")}
      title={t("products.bestSellersTitle")}
      subtitle={t("products.bestSellersDesc")}
      queryPreset={{ bestSeller: "true" }}
    />
  );
}
