"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api, { getApiBaseURL } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import { cloudinaryLoader, getCloudinaryVideoUrl, isCloudinaryUrl } from "../lib/image";
import { formatSizeLabel, normalizeSizeForFilter } from "../lib/sizeDisplay";
import PortraitCoverVideo from "./PortraitCoverVideo";
import { productToItem, trackSelectItem, trackViewItemList, trackSearch, trackAddToCart } from "../lib/gtag";
import { trackTikTokAddToCart, trackTikTokSearch } from "../lib/tiktok-pixel";
import { trackMetaAddToCart, trackMetaSearch } from "../lib/meta-pixel";

const PAGE_SIZE = 20;
const serializeQueryParams = (params = {}) => {
  const normalized = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      normalized[key] = params[key];
    });
  return JSON.stringify(normalized);
};

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] w-full rounded-lg bg-[var(--color-sand)]/70" />
      <div className="mt-4 space-y-2.5 px-1">
        <div className="mx-auto h-3 w-3/4 rounded bg-[var(--color-sand)]/70" />
        <div className="mx-auto h-3 w-1/3 rounded bg-[var(--color-sand)]/70" />
      </div>
    </div>
  );
}

function ActiveFilterPill({ label, onClear }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-[11px] tracking-[0.04em] text-black/60 transition-colors hover:border-black/30 hover:text-black"
    >
      {label}
      <X size={12} strokeWidth={2} />
    </button>
  );
}

function FilterSection({ label, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-[var(--color-line)] py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-start"
      >
        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-black/70">
          {label}
        </span>
        {isOpen ? (
          <ChevronUp size={14} strokeWidth={2} className="text-black/30" />
        ) : (
          <ChevronDown size={14} strokeWidth={2} className="text-black/30" />
        )}
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${
          isOpen
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const videoLoadedRef = useRef(false);
  const hasVideo = Boolean(product.cardVideoUrl);
  const cardVideoUrl = product?.cardVideoUrl
    ? getCloudinaryVideoUrl(product.cardVideoUrl, { width: 640 })
    : "";
  const isOutOfStock = Number(product.stock || 0) <= 0;
  const primaryImage = product.images?.[0] || "https://placehold.co/600x800?text=Sami";
  const secondaryImage = product.images?.[1] || "";
  const primaryIsCloudinary = isCloudinaryUrl(primaryImage);
  const secondaryIsCloudinary = isCloudinaryUrl(secondaryImage);
  const preferredSize =
    Array.isArray(product?.sizes) && product.sizes.length > 0
      ? product.sizes[0]
      : "";

  useEffect(() => {
    videoLoadedRef.current = false;
  }, [product?._id, product?.cardVideoUrl]);

  const loadAndPlay = () => {
    const v = videoRef.current;
    if (!v || !cardVideoUrl) return;

    if (!videoLoadedRef.current) {
      videoLoadedRef.current = true;
      v.src = cardVideoUrl;
      v.load();
    }

    void v.play().catch(() => {});
  };

  const cardHoverMedia = hasVideo
    ? {
        onMouseEnter: loadAndPlay,
        onMouseLeave: () => {
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        },
        onTouchStart: loadAndPlay,
      }
    : {};

  return (
    <article className="group">
      <Link
        href={`/products/${product._id}`}
        className="block"
        onClick={() => trackSelectItem(productToItem(product))}
      >
        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[var(--color-sand)]/40"
          {...cardHoverMedia}
        >
          <Image
            src={primaryImage}
            alt={product.name || "Product"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={
              hasVideo
                ? "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-0"
                : "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            }
            loader={primaryIsCloudinary ? cloudinaryLoader : undefined}
            unoptimized={!primaryIsCloudinary}
          />

          {hasVideo ? (
            <PortraitCoverVideo
              ref={videoRef}
              src={undefined}
              wrapperClassName="absolute inset-0 overflow-hidden"
              videoClassName="opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              videoAdjustments={product?.cardVideoAdjustments}
              disablePortraitFix={product?.cardVideoLandscape === true}
              muted
              loop
              playsInline
              preload="none"
            />
          ) : (
            product.images?.[1] && (
              <Image
                src={secondaryImage}
                alt={`${product.name} alternate`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                loader={secondaryIsCloudinary ? cloudinaryLoader : undefined}
                unoptimized={!secondaryIsCloudinary}
              />
            )
          )}

          {isOutOfStock && (
            <span className="absolute start-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white backdrop-blur-sm">
              {t("product.soldOut")}
            </span>
          )}

          {!isOutOfStock && (
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center px-3 pb-3 transition-transform duration-300 ease-out group-hover:translate-y-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const line = productToItem(product, { quantity: 1 });
                  trackAddToCart(line);
                  trackTikTokAddToCart(line);
                  trackMetaAddToCart(line);
                  addToCart(product, preferredSize);
                }}
                className="max-w-[min(10.5rem,calc(100%-0.5rem))] rounded-full bg-white/95 px-3 py-1.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-[0.1em] text-black shadow-md backdrop-blur-sm transition-all hover:bg-black hover:text-white"
              >
                {t("product.quickAdd")}
              </button>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3.5 space-y-1 text-center">
        <Link href={`/products/${product._id}`}>
          <h3 className="line-clamp-1 text-[13px] font-medium tracking-[0.01em] text-[var(--color-black)] transition-colors group-hover:text-[var(--color-gold)]">
            {product.name}
          </h3>
        </Link>
        {product.discountPriceUSD != null &&
          Number(product.discountPriceUSD) > 0 &&
          Number(product.discountPriceUSD) < Number(product.priceUSD) ? (
          <p className="flex items-center justify-center gap-2 text-[13px]">
            <span className="font-medium tracking-[0.02em] text-[var(--color-black)]">{formatPrice(product.discountPriceUSD)}</span>
            <span className="text-[11px] tracking-[0.02em] text-black/30 line-through">{formatPrice(product.priceUSD)}</span>
          </p>
        ) : (
          <p className="text-[13px] tracking-[0.02em] text-[var(--color-black)]">
            {formatPrice(product.priceUSD)}
          </p>
        )}

        {Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <p className="text-[10px] tracking-[0.06em] text-black/30">
            {product.sizes.map(formatSizeLabel).join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Reusable product listing with filters and sorting.
 *
 * @param {object}   props
 * @param {string}   props.accentLabel  - Small gold label above the title
 * @param {string}   props.title        - Page heading
 * @param {string}   props.subtitle     - Paragraph below the heading
 * @param {object}   [props.queryPreset]   - Optional fixed query params sent to backend
 * @param {string}   [props.initialSort]     - Default sort: featured | newest | price-low | ...
 * @param {string}   [props.initialType]     - Pre-select a category/type filter on mount
 * @param {object}   [props.initialData]      - Optional SSR first-page payload
 * @param {object}   [props.initialRequestParams] - Params used to build initialData
 */
export default function ProductListing({
  accentLabel = "Curated Selection",
  title = "The Collection",
  subtitle = "Timeless silhouettes crafted with intention. Find your next signature piece.",
  queryPreset = {},
  initialSort = "featured",
  initialType = "",
  initialData = null,
  initialRequestParams = null,
}) {
  const { t } = useLanguage();
  const queryPresetKey = useMemo(
    () => serializeQueryParams(queryPreset && typeof queryPreset === "object" ? queryPreset : {}),
    [queryPreset]
  );
  const initialRequestKey = useMemo(
    () =>
      serializeQueryParams(
        initialRequestParams && typeof initialRequestParams === "object"
          ? initialRequestParams
          : {}
      ),
    [initialRequestParams]
  );
  const stableQueryPreset = useMemo(() => JSON.parse(queryPresetKey), [queryPresetKey]);
  const initialProducts = Array.isArray(initialData?.products) ? initialData.products : [];
  const initialPage = Number(initialData?.page || 1);
  const initialTotalPages = Number(initialData?.totalPages || 0);
  const initialTotalProducts = Number(initialData?.totalProducts || 0);
  const hasInitialData = initialProducts.length > 0 || initialTotalProducts > 0;
  const [products, setProducts] = useState(() => (hasInitialData ? initialProducts : []));
  const [loading, setLoading] = useState(() => !hasInitialData);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(() => (hasInitialData ? initialPage : 1));
  const [hasMore, setHasMore] = useState(() =>
    hasInitialData ? initialPage < initialTotalPages : true
  );
  const [totalProducts, setTotalProducts] = useState(() =>
    hasInitialData ? initialTotalProducts : 0
  );
  const loadMoreRef = useRef(null);
  const [filters, setFilters] = useState({
    price: "all",
    size: "all",
    cut: "all",
    fabric: "all",
    piece: "all",
    type: initialType || "all",
    season: "all",
  });
  const [sortBy, setSortBy] = useState(initialSort);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    price: true,
    size: true,
    cut: false,
    fabric: false,
    piece: false,
    type: Boolean(initialType),
    season: false,
  });

  const buildProductsQuery = useCallback(
    (targetPage) => ({
      page: targetPage,
      limit: PAGE_SIZE,
      sortBy,
      price: filters.price,
      size: filters.size,
      cut: filters.cut,
      fabric: filters.fabric,
      piece: filters.piece,
      type: filters.type,
      season: filters.season,
      lite: stableQueryPreset?.lite ?? "true",
      ...stableQueryPreset,
    }),
    [
      filters.cut,
      filters.fabric,
      filters.piece,
      filters.price,
      filters.season,
      filters.size,
      filters.type,
      stableQueryPreset,
      sortBy,
    ]
  );

  const hasBootstrappedInitialRef = useRef(false);
  const activeRequestIdRef = useRef(0);

  const fetchProductsPage = useCallback(
    async (targetPage) => {
      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;
      const base = getApiBaseURL();
      try {
        if (targetPage === 1) {
          setLoading(true);
        } else {
          setIsFetchingMore(true);
        }

        const { data } = await api.get("/api/products", {
          params: buildProductsQuery(targetPage),
        });
        const list = Array.isArray(data?.products) ? data.products : [];
        const responsePage = Number(data?.page || targetPage);
        const responseTotalPages = Number(data?.totalPages || 0);
        const responseTotalProducts = Number(data?.totalProducts || 0);
        if (activeRequestIdRef.current !== requestId) return;

        setProducts((prev) => (targetPage === 1 ? list : [...prev, ...list]));
        setPage(responsePage);
        setTotalProducts(responseTotalProducts);
        setHasMore(responsePage < responseTotalPages);
      } catch (err) {
        if (activeRequestIdRef.current !== requestId) return;
        console.error("[ProductListing] /api/products failed", {
          baseUrl: base,
          requestUrl: `${base}/api/products`,
          message: err?.message,
          status: err?.response?.status,
          responseData: err?.response?.data,
        });
        if (targetPage === 1) {
          setProducts([]);
          setTotalProducts(0);
          setHasMore(false);
        }
      } finally {
        if (activeRequestIdRef.current !== requestId) return;
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [buildProductsQuery]
  );

  useEffect(() => {
    if (!hasBootstrappedInitialRef.current) {
      hasBootstrappedInitialRef.current = true;
      if (
        hasInitialData &&
        serializeQueryParams(buildProductsQuery(1)) === initialRequestKey
      ) {
        return;
      }
    }
    fetchProductsPage(1);
  }, [buildProductsQuery, fetchProductsPage, hasInitialData, initialRequestKey]);

  useEffect(() => {
    if (loading || isFetchingMore || !hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        fetchProductsPage(page + 1);
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchProductsPage, hasMore, isFetchingMore, loading, page]);

  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileFiltersOpen]);

  const baseProducts = useMemo(() => products, [products]);

  // Fire view_item_list whenever the visible product list changes
  useEffect(() => {
    if (loading || baseProducts.length === 0) return;
    const items = baseProducts.slice(0, 20).map((p, index) =>
      productToItem(p, { index })
    );
    trackViewItemList(items, title, title.toLowerCase().replace(/\s+/g, "_"));
  }, [baseProducts, loading, title]);

  // Fire search event when any filter (other than "all") is applied
  useEffect(() => {
    const activeFilters = Object.entries(filters)
      .filter(([, v]) => v !== "all")
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
    if (!activeFilters) return;
    trackSearch(activeFilters);
    if (loading || baseProducts.length === 0) return;
    const gaItems = baseProducts.slice(0, 20).map((p, index) =>
      productToItem(p, { index }),
    );
    trackTikTokSearch(activeFilters, { items: gaItems });
    trackMetaSearch(activeFilters);
  }, [filters, baseProducts, loading]);

  const allSizes = useMemo(() => {
    const sizeSet = new Set();
    baseProducts.forEach((product) => {
      if (Array.isArray(product.sizes)) {
        product.sizes.forEach((size) => {
          const key = normalizeSizeForFilter(size);
          if (key) sizeSet.add(key);
        });
      }
    });
    const preferredOrder = ["XS", "S", "M", "L", "XL", "XXL"];
    return [...sizeSet].sort((a, b) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [baseProducts]);

  const allTypes = useMemo(() => {
    const typeSet = new Set();
    baseProducts.forEach((product) => {
      if (product?.category) {
        typeSet.add(product.category);
      }
    });
    return [...typeSet].sort((a, b) => a.localeCompare(b));
  }, [baseProducts]);

  const filterSections = useMemo(
    () => [
      {
        key: "price",
        label: t("products.filterPrice"),
        options: [
          { value: "all", label: t("products.allPrices") },
          { value: "0-100", label: t("products.under100") },
          { value: "100-200", label: t("products.range100to200") },
          { value: "200-400", label: t("products.range200to400") },
        ],
      },
      {
        key: "size",
        label: t("products.filterSize"),
        options: [
          { value: "all", label: t("products.allSizes") },
          ...allSizes.map((size) => ({ value: size, label: formatSizeLabel(size) })),
        ],
      },
      {
        key: "cut",
        label: t("products.filterCut"),
        options: [
          { value: "all", label: t("products.all") },
          { value: "straight", label: t("products.cutStraight") },
          { value: "flowy", label: t("products.cutFlowy") },
          { value: "tailored", label: t("products.cutTailored") },
        ],
      },
      {
        key: "fabric",
        label: t("products.filterFabric"),
        options: [
          { value: "all", label: t("products.all") },
          { value: "satin", label: t("products.fabricSatin") },
          { value: "linen", label: t("products.fabricLinen") },
          { value: "chiffon", label: t("products.fabricChiffon") },
          { value: "cotton", label: t("products.fabricCotton") },
        ],
      },
      {
        key: "piece",
        label: t("products.filterPiece"),
        options: [
          { value: "all", label: t("products.all") },
          { value: "1pc", label: t("products.piece1") },
          { value: "2pc", label: t("products.piece2") },
          { value: "3pc", label: t("products.piece3") },
        ],
      },
      {
        key: "type",
        label: t("products.filterType"),
        options: [
          { value: "all", label: t("products.all") },
          ...allTypes.map((type) => ({ value: type, label: type })),
        ],
      },
      {
        key: "season",
        label: t("products.filterSeason"),
        options: [
          { value: "all", label: t("products.all") },
          { value: "spring", label: t("products.seasonSpring") },
          { value: "summer", label: t("products.seasonSummer") },
          { value: "ramadan", label: t("products.seasonRamadan") },
        ],
      },
    ],
    [allSizes, allTypes, t]
  );

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleFilterSection = useCallback((key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== "all").length,
    [filters]
  );

  const clearAllFilters = useCallback(() => {
    setFilters({
      price: "all",
      size: "all",
      cut: "all",
      fabric: "all",
      piece: "all",
      type: "all",
      season: "all",
    });
  }, []);

  const filteredProducts = baseProducts;

  const renderFilterOptions = (section) => (
    <div className="space-y-1">
      {section.options.map((option) => {
        const isActive = filters[section.key] === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => updateFilter(section.key, option.value)}
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-[13px] transition-colors ${
              isActive
                ? "bg-[var(--color-sand)]/50 font-medium text-black"
                : "text-black/50 hover:bg-[var(--color-sand)]/30 hover:text-black/70"
            }`}
          >
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isActive
                  ? "border-[var(--color-green)] bg-[var(--color-green)]"
                  : "border-black/20"
              }`}
            >
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const renderFilters = () => (
    <div>
      {filterSections.map((section) => (
        <FilterSection
          key={section.key}
          label={section.label}
          isOpen={openSections[section.key]}
          onToggle={() => toggleFilterSection(section.key)}
        >
          {renderFilterOptions(section)}
        </FilterSection>
      ))}
    </div>
  );

  return (
    <section className="pb-16 pt-6 sm:pt-10">
      {/* Page header */}
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
          {accentLabel}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-light tracking-[0.04em] text-[var(--color-black)] sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed tracking-[0.02em] text-[var(--color-muted)]">
          {subtitle}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60 shadow-sm transition-colors hover:border-black/30 hover:text-black lg:hidden"
          >
            <SlidersHorizontal size={13} strokeWidth={2} />
            {t("products.filters")}
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-green)] text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <p className="text-[12px] tracking-[0.04em] text-black/40">
            {totalProducts}{" "}
            {totalProducts === 1 ? t("products.product") : t("products.productPlural")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.1em] text-black/35">
            {t("products.sort")}
          </span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-[12px] tracking-[0.02em] text-black/70 outline-none transition-colors focus:border-[var(--color-gold)]"
          >
            <option value="featured">{t("products.sortFeatured")}</option>
            <option value="newest">{t("products.sortNewest")}</option>
            <option value="price-low">{t("products.sortPriceLow")}</option>
            <option value="price-high">{t("products.sortPriceHigh")}</option>
            <option value="name-asc">{t("products.sortNameAsc")}</option>
            <option value="name-desc">{t("products.sortNameDesc")}</option>
          </select>
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value === "all") return null;
            const section = filterSections.find((s) => s.key === key);
            const option = section?.options.find((o) => o.value === value);
            return (
              <ActiveFilterPill
                key={key}
                label={`${section?.label}: ${option?.label || value}`}
                onClear={() => updateFilter(key, "all")}
              />
            );
          })}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] tracking-[0.04em] text-black/40 underline underline-offset-2 transition-colors hover:text-black/70"
          >
            {t("products.clearAll")}
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="mt-8 grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50">
                {t("products.filters")}
              </h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] tracking-[0.04em] text-[var(--color-gold)] transition-colors hover:text-[var(--color-gold-soft)]"
                >
                  {t("products.reset")}
                </button>
              )}
            </div>
            {renderFilters()}
          </div>
        </aside>

        {/* Product grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-sand)]/50">
                <Search
                  size={24}
                  strokeWidth={1.2}
                  className="text-black/20"
                />
              </div>
              <p className="mt-4 text-[14px] font-medium text-black/60">
                {t("products.noProducts")}
              </p>
              <p className="mt-1 text-[12px] text-black/35">
                {t("products.adjustFilters")}
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 rounded-full border border-[var(--color-line)] px-5 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60 transition-colors hover:border-black/40 hover:text-black"
                >
                  {t("products.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {isFetchingMore && (
            <div className="mt-6 grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={`more-${i}`} />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-1 w-full" />
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          isMobileFiltersOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileFiltersOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 z-50 flex h-full w-full max-w-[360px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ltr:right-0 rtl:left-0 ${
          isMobileFiltersOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal
              size={16}
              strokeWidth={1.6}
              className="text-black/50"
            />
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em]">
              {t("products.filters")}
              {activeFilterCount > 0 && (
                <span className="ms-1.5 font-normal text-black/40">
                  ({activeFilterCount})
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label={t("common.close")}
            className="rounded-full p-1.5 text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">{renderFilters()}</div>

        <div className="border-t border-[var(--color-line)] px-6 py-4">
          <div className="flex gap-3">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 rounded-full border border-[var(--color-line)] py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60 transition-colors hover:border-black/30"
              >
                {t("products.reset")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="sami-btn-dark flex-1 rounded-full py-3 text-[11px] tracking-[0.12em]"
            >
              {t("products.showResults", { count: totalProducts })}
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}
