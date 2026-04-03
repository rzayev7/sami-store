"use client";

import { useRouter } from "next/navigation";
import ProductForm from "../../../../components/admin/ProductForm";
import { t } from "../../../../lib/admin-i18n";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <section className="py-4">
      <div className="sami-section w-full max-w-6xl p-6 sm:p-8">
        <h1 className="sami-title">{t.addProduct}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t.createNewProduct}
        </p>
        <ProductForm mode="create" onSuccess={() => router.push("/admin/products")} />
      </div>
    </section>
  );
}
