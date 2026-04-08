"use client";

import { useCallback } from "react";
import ProductListing from "../../../components/ProductListing";
import { useLanguage } from "../../../context/LanguageContext";

export default function FeaturedProductsPage() {
  const { t } = useLanguage();
  const filterFeatured = useCallback((product) => product.featured === true, []);

  return (
    <ProductListing
      accentLabel={t("products.editorsPicksEyebrow")}
      title={t("products.featuredTitle")}
      subtitle={t("products.featuredDesc")}
      productFilter={filterFeatured}
      initialSort="featured"
    />
  );
}
