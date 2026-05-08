import ProductsPageClient from "./ProductsPageClient";

const PAGE_SIZE = 20;

const getApiBaseURL = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  return "https://sami-store.onrender.com";
};

const normalizeSearchParam = (value) => {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
};

async function fetchInitialProducts(initialType) {
  const params = {
    page: 1,
    limit: PAGE_SIZE,
    sortBy: "featured",
    price: "all",
    size: "all",
    cut: "all",
    fabric: "all",
    piece: "all",
    type: initialType || "all",
    season: "all",
    lite: "true",
  };

  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      query.set(key, String(value));
    });

    const response = await fetch(`${getApiBaseURL()}/api/products?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return { initialData: null, initialRequestParams: params };
    }
    const data = await response.json();
    return {
      initialData:
        data && typeof data === "object"
          ? data
          : null,
      initialRequestParams: params,
    };
  } catch {
    return { initialData: null, initialRequestParams: params };
  }
}

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialType = normalizeSearchParam(resolvedSearchParams?.category);
  const { initialData, initialRequestParams } = await fetchInitialProducts(initialType);

  return (
    <ProductsPageClient
      initialType={initialType}
      initialData={initialData}
      initialRequestParams={initialRequestParams}
    />
  );
}
