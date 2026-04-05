"use client";

import Image from "next/image";
import Link from "next/link";
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
import { cloudinaryOptimizedUrl, isCloudinaryUrl } from "../lib/image";
import { formatSizeLabel, normalizeSizeForFilter } from "../lib/sizeDisplay";
import { videoFilterStyle } from "../lib/videoAdjustments";

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
        className="flex w-full items-center justify-between text-left"
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
  const videoRef = useRef(null);
  const hasVideo = Boolean(product.cardVideoUrl);
  const isOutOfStock = Number(product.stock || 0) <= 0;
  const primaryImage = product.images?.[0] || "https://placehold.co/600x800?text=Sami";
  const secondaryImage = product.images?.[1] || "";
  const primarySrc = cloudinaryOptimizedUrl(primaryImage, { preset: "listing" });
  const secondarySrc = cloudinaryOptimizedUrl(secondaryImage, { preset: "listing" });
  const primaryIsCloudinary = isCloudinaryUrl(primaryImage);
  const secondaryIsCloudinary = isCloudinaryUrl(secondaryImage);
  const preferredSize =
    Array.isArray(product?.sizes) && product.sizes.length > 0
      ? product.sizes[0]
      : "";

  const cardHoverMedia = hasVideo
    ? {
        onMouseEnter: () => {
          const v = videoRef.current;
          if (v) void v.play().catch(() => {});
        },
        onMouseLeave: () => {
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        },
      }
    : {};

  return (
    <article className="group">
      <Link href={`/products/${product._id}`} className="block">
        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[var(--color-sand)]/40"
          {...cardHoverMedia}
        >
          <Image
            src={primarySrc}
            alt={product.name || "Product"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={
              hasVideo
                ? "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-0"
                : "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            }
            unoptimized={primaryIsCloudinary}
            quality={92}
          />

          {hasVideo ? (
            <video
              ref={videoRef}
              src={product.cardVideoUrl}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={videoFilterStyle(product?.cardVideoAdjustments)}
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            product.images?.[1] && (
              <Image
                src={secondarySrc}
                alt={`${product.name} alternate`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                unoptimized={secondaryIsCloudinary}
                quality={92}
              />
            )
          )}

          {isOutOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white backdrop-blur-sm">
              Sold Out
            </span>
          )}

          {!isOutOfStock && (
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center pb-4 transition-transform duration-300 ease-out group-hover:translate-y-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, preferredSize);
                }}
                className="rounded-full bg-white/95 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black shadow-lg backdrop-blur-sm transition-all hover:bg-black hover:text-white"
              >
                Quick Add
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
 * @param {function} [props.productFilter] - Optional predicate applied after
 *                                           fetching to narrow the product set
 * @param {string}   [props.initialSort]     - Default sort: featured | newest | price-low | ...
 */
export default function ProductListing({
  accentLabel = "Curated Selection",
  title = "The Collection",
  subtitle = "Timeless silhouettes crafted with intention. Find your next signature piece.",
  productFilter,
  initialSort = "featured",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    price: "all",
    size: "all",
    cut: "all",
    fabric: "all",
    piece: "all",
    type: "all",
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
    type: false,
    season: false,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      const base = getApiBaseURL();
      try {
        const { data } = await api.get("/api/products");
        const list = Array.isArray(data) ? data : [];
        console.log("[ProductListing] /api/products OK", {
          baseUrl: base,
          count: list.length,
          sampleId: list[0]?._id,
        });
        setProducts(list);
      } catch (err) {
        console.error("[ProductListing] /api/products failed", {
          baseUrl: base,
          requestUrl: `${base}/api/products`,
          message: err?.message,
          status: err?.response?.status,
          responseData: err?.response?.data,
        });
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileFiltersOpen]);

  const baseProducts = useMemo(() => {
    return productFilter ? products.filter(productFilter) : products;
  }, [products, productFilter]);

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
        label: "Price",
        options: [
          { value: "all", label: "All Prices" },
          { value: "0-100", label: "Under $100" },
          { value: "100-200", label: "$100 – $200" },
          { value: "200-400", label: "$200 – $400" },
        ],
      },
      {
        key: "size",
        label: "Size",
        options: [
          { value: "all", label: "All Sizes" },
          ...allSizes.map((size) => ({ value: size, label: formatSizeLabel(size) })),
        ],
      },
      {
        key: "cut",
        label: "Cut",
        options: [
          { value: "all", label: "All" },
          { value: "straight", label: "Straight" },
          { value: "flowy", label: "Flowy" },
          { value: "tailored", label: "Tailored" },
        ],
      },
      {
        key: "fabric",
        label: "Fabric",
        options: [
          { value: "all", label: "All" },
          { value: "satin", label: "Satin" },
          { value: "linen", label: "Linen" },
          { value: "chiffon", label: "Chiffon" },
          { value: "cotton", label: "Cotton" },
        ],
      },
      {
        key: "piece",
        label: "Piece",
        options: [
          { value: "all", label: "All" },
          { value: "1pc", label: "1 Piece" },
          { value: "2pc", label: "2 Piece" },
          { value: "3pc", label: "3 Piece" },
        ],
      },
      {
        key: "type",
        label: "Type",
        options: [
          { value: "all", label: "All" },
          ...allTypes.map((type) => ({ value: type, label: type })),
        ],
      },
      {
        key: "season",
        label: "Season",
        options: [
          { value: "all", label: "All" },
          { value: "spring", label: "Spring" },
          { value: "summer", label: "Summer" },
          { value: "ramadan", label: "Ramadan" },
        ],
      },
    ],
    [allSizes, allTypes]
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

  const matchesOptionalField = (product, selectedValue, fields) => {
    if (selectedValue === "all") return true;
    const normalizedSelected = String(selectedValue).toLowerCase();

    for (const fieldName of fields) {
      const rawValue = product?.[fieldName];
      if (!rawValue) continue;
      if (Array.isArray(rawValue)) {
        const hasMatch = rawValue.some(
          (entry) => String(entry).toLowerCase() === normalizedSelected
        );
        if (hasMatch) return true;
      } else if (String(rawValue).toLowerCase() === normalizedSelected) {
        return true;
      }
    }

    return !fields.some((fieldName) => product?.[fieldName]);
  };

  const filteredProducts = useMemo(() => {
    let result = [...baseProducts];

    if (filters.size !== "all") {
      result = result.filter(
        (product) =>
          Array.isArray(product.sizes) &&
          product.sizes.some(
            (s) => normalizeSizeForFilter(s) === filters.size
          )
      );
    }

    if (filters.price !== "all") {
      result = result.filter((product) => {
        const price = Number(product.priceUSD || 0);
        if (filters.price === "0-100") return price >= 0 && price <= 100;
        if (filters.price === "100-200") return price > 100 && price <= 200;
        if (filters.price === "200-400") return price > 200 && price <= 400;
        return true;
      });
    }

    result = result.filter((product) =>
      matchesOptionalField(product, filters.cut, ["cut"])
    );
    result = result.filter((product) =>
      matchesOptionalField(product, filters.fabric, ["fabric"])
    );
    result = result.filter((product) =>
      matchesOptionalField(product, filters.piece, ["piece"])
    );
    result = result.filter((product) =>
      matchesOptionalField(product, filters.type, ["type", "category"])
    );
    result = result.filter((product) =>
      matchesOptionalField(product, filters.season, ["season"])
    );

    if (sortBy === "price-low") {
      result.sort(
        (a, b) => Number(a.priceUSD || 0) - Number(b.priceUSD || 0)
      );
    } else if (sortBy === "price-high") {
      result.sort(
        (a, b) => Number(b.priceUSD || 0) - Number(a.priceUSD || 0)
      );
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    return result;
  }, [baseProducts, filters, sortBy]);

  const renderFilterOptions = (section) => (
    <div className="space-y-1">
      {section.options.map((option) => {
        const isActive = filters[section.key] === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => updateFilter(section.key, option.value)}
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
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
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-green)] text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <p className="text-[12px] tracking-[0.04em] text-black/40">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.1em] text-black/35">
            Sort
          </span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-[12px] tracking-[0.02em] text-black/70 outline-none transition-colors focus:border-[var(--color-gold)]"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
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
            Clear all
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
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] tracking-[0.04em] text-[var(--color-gold)] transition-colors hover:text-[var(--color-gold-soft)]"
                >
                  Reset
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
                No products found
              </p>
              <p className="mt-1 text-[12px] text-black/35">
                Try adjusting your filters.
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 rounded-full border border-[var(--color-line)] px-5 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/60 transition-colors hover:border-black/40 hover:text-black"
                >
                  Clear Filters
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[360px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileFiltersOpen ? "translate-x-0" : "translate-x-full"
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
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 font-normal text-black/40">
                  ({activeFilterCount})
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label="Close filters"
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
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="sami-btn-dark flex-1 rounded-full py-3 text-[11px] tracking-[0.12em]"
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}
