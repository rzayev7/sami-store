import type { MetadataRoute } from "next";

const SITE_URL = "https://wearsamiofficial.com";

const getApiBaseURL = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  return "https://sami-store.onrender.com";
};

// Regenerate at most once an hour so new products appear without rebuilding.
export const revalidate = 3600;

async function fetchProducts(): Promise<Array<{ _id?: string; updatedAt?: string }>> {
  try {
    const res = await fetch(
      `${getApiBaseURL()}/api/products?page=1&limit=1000&lite=true`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/products/new-arrivals`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/products/best-sellers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/products/featured`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const products = await fetchProducts();
  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p && p._id)
    .map((p) => ({
      url: `${SITE_URL}/products/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...productEntries];
}
