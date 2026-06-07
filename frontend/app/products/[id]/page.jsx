import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

const getApiBaseURL = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  return "https://sami-store.onrender.com";
};

async function fetchProductById(productId) {
  if (!productId) return null;
  try {
    const response = await fetch(`${getApiBaseURL()}/api/products/${productId}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

async function fetchRelatedProducts(product) {
  if (!product?._id) return [];

  const pickRelated = (items) => {
    const list = Array.isArray(items) ? items : [];
    const category = product.category;
    const sameCategory = list.filter(
      (item) =>
        String(item?._id) !== String(product._id) &&
        (!category || item?.category === category),
    );
    const fallback = list.filter((item) => String(item?._id) !== String(product._id));
    return (sameCategory.length >= 3 ? sameCategory : fallback).slice(0, 3);
  };

  try {
    const categoryParams = new URLSearchParams({
      page: "1",
      limit: "8",
      sortBy: "featured",
      lite: "true",
      type: product.category || "all",
    });
    const categoryResponse = await fetch(
      `${getApiBaseURL()}/api/products?${categoryParams.toString()}`,
      {
        cache: "no-store",
      },
    );
    if (!categoryResponse.ok) return [];

    const categoryData = await categoryResponse.json();
    const initialList = Array.isArray(categoryData?.products)
      ? categoryData.products
      : Array.isArray(categoryData)
        ? categoryData
        : [];
    const initialPick = pickRelated(initialList);
    if (initialPick.length >= 3) return initialPick;

    const fallbackParams = new URLSearchParams({
      page: "1",
      limit: "12",
      sortBy: "featured",
      lite: "true",
    });
    const fallbackResponse = await fetch(
      `${getApiBaseURL()}/api/products?${fallbackParams.toString()}`,
      {
        cache: "no-store",
      },
    );
    if (!fallbackResponse.ok) return initialPick;

    const fallbackData = await fallbackResponse.json();
    const fallbackList = Array.isArray(fallbackData?.products)
      ? fallbackData.products
      : Array.isArray(fallbackData)
        ? fallbackData
        : [];
    return pickRelated(fallbackList);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const productId = Array.isArray(resolvedParams?.id)
    ? resolvedParams.id[0]
    : resolvedParams?.id;
  const product = await fetchProductById(productId);

  if (!product) {
    return {
      title: { absolute: "Product not found | SAMÍ" },
      description: "Browse our latest womenswear collection.",
      robots: { index: false, follow: true },
    };
  }

  const titleAbsolute = `${product.name} | SAMÍ`;
  const description =
    product.description?.trim() || "Discover premium womenswear from SAMÍ.";
  const image = Array.isArray(product.images) ? product.images[0] : null;
  const canonicalPath = `/products/${productId}`;

  return {
    title: { absolute: titleAbsolute },
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: titleAbsolute,
      description,
      type: "website",
      url: canonicalPath,
      images: image
        ? [
            {
              url: image,
              alt: product.name || "SAMI product",
            },
          ]
        : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: titleAbsolute,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const productId = Array.isArray(resolvedParams?.id)
    ? resolvedParams.id[0]
    : resolvedParams?.id;

  const product = await fetchProductById(productId);
  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product);

  return (
    <ProductDetailClient
      productId={productId}
      initialProduct={product}
      initialRelatedProducts={relatedProducts}
    />
  );
}
