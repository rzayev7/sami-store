"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "../../../../../components/admin/ProductForm";
import api from "../../../../../lib/api";
import { getAdminAuthHeaders } from "../../../../../lib/adminAuth";
import { t } from "../../../../../lib/admin-i18n";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = String(params?.id || "");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setErrorMessage(t.productIdMissing);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const { data } = await api.get(`/api/products/${productId}`, {
          headers: getAdminAuthHeaders(),
        });
        setProduct(data || null);
      } catch {
        setErrorMessage(t.failedLoadProduct);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return (
    <section className="py-4">
      <div className="sami-section w-full max-w-6xl p-6 sm:p-8">
        <h1 className="sami-title">{t.editProduct}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t.updateProductInfo}</p>

        {loading ? (
          <p className="mt-6 text-sm text-black/70">{t.loadingProduct}</p>
        ) : errorMessage ? (
          <p className="mt-6 text-sm text-red-600">{errorMessage}</p>
        ) : (
          <ProductForm
            mode="edit"
            initialProduct={product}
            onSuccess={() => {
              router.push("/admin/products");
            }}
          />
        )}
      </div>
    </section>
  );
}
