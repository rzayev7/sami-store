"use client";

import ProductListing from "../../components/ProductListing";
import { useLanguage } from "../../context/LanguageContext";

export default function ProductsPageClient({
  initialType = "",
  initialData = null,
  initialRequestParams = null,
}) {
  const { t } = useLanguage();

  return (
    <ProductListing
      accentLabel={t("products.curatedSelection")}
      title={t("products.theCollection")}
      subtitle={t("products.collectionDesc")}
      initialType={initialType}
      initialData={initialData}
      initialRequestParams={initialRequestParams}
    />
  );
}
