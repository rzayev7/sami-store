"use client";

import ProductListing from "../../../components/ProductListing";
import { useLanguage } from "../../../context/LanguageContext";

export default function FeaturedProductsPage() {
  const { t } = useLanguage();

  return (
    <ProductListing
      accentLabel={t("products.editorsPicksEyebrow")}
      title={t("products.featuredTitle")}
      subtitle={t("products.featuredDesc")}
      queryPreset={{ featured: "true" }}
      initialSort="featured"
    />
  );
}
