"use client";

import ProductListing from "../../../components/ProductListing";
import { useLanguage } from "../../../context/LanguageContext";

export default function NewArrivalsPage() {
  const { t } = useLanguage();

  return (
    <ProductListing
      accentLabel={t("products.justDroppedEyebrow")}
      title={t("products.newArrivalsTitle")}
      subtitle={t("products.newArrivalsDesc")}
      initialSort="newest"
    />
  );
}
