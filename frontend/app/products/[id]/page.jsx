"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Minus,
  Plus,
  Check,
  Share2,
  Play,
  Pause,
  Heart,
} from "lucide-react";
import api, { getApiBaseURL } from "../../../lib/api";
import { SUPPORT_EMAIL } from "../../../lib/sitePublic";
import { getCustomerAuthHeaders } from "../../../lib/customerAuth";
import { useAuth } from "../../../context/AuthContext";
import SizeGuide from "../../../components/SizeGuide";
import { useCart } from "../../../context/CartContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { cloudinaryOptimizedUrl, isCloudinaryUrl } from "../../../lib/image";
import { formatSizeLabel } from "../../../lib/sizeDisplay";
import { videoFilterStyle } from "../../../lib/videoAdjustments";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;
  const { addToCart, cartItems } = useCart();
  const { formatPrice } = useCurrency();
  const { user, requireAuth } = useAuth();
  const resolvedProductId = Array.isArray(productId) ? productId[0] : productId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedTopSize, setSelectedTopSize] = useState("");
  const [selectedBottomSize, setSelectedBottomSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedBundle, setSelectedBundle] = useState("full_set");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [sizeError, setSizeError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const thumbnailContainerRef = useRef(null);
  const videoRefs = useRef({});
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [fabricCareOpen, setFabricCareOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!resolvedProductId) return;

    const fetchProduct = async () => {
      const base = getApiBaseURL();
      try {
        const { data } = await api.get(`/api/products/${resolvedProductId}`);
        console.log("[ProductDetail] product OK", { baseUrl: base, id: resolvedProductId });
        setProduct(data);
        setSelectedSize("");
        setSelectedTopSize("");
        setSelectedBottomSize("");
        setSelectedColor("");
        setSelectedBundle("full_set");
      } catch (err) {
        console.error("[ProductDetail] product fetch failed", {
          baseUrl: base,
          requestUrl: `${base}/api/products/${resolvedProductId}`,
          message: err?.message,
          status: err?.response?.status,
          responseData: err?.response?.data,
        });
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedProductId]);

  useEffect(() => {
    if (!product?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/products");
        const list = Array.isArray(data) ? data : [];
        const cat = product.category;
        const sameCat = list.filter(
          (p) => p._id !== product._id && (!cat || p.category === cat),
        );
        const fallback = list.filter((p) => p._id !== product._id);
        const pick = sameCat.length >= 3 ? sameCat : fallback;
        if (!cancelled) setRelatedProducts(pick.slice(0, 3));
      } catch (err) {
        console.error("[ProductDetail] related products failed", err);
        if (!cancelled) setRelatedProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product?._id, product?.category]);

  /** Images plus optional product video (after first photo) for the same strip as admin "card" video. */
  const galleryItems = useMemo(() => {
    const imgs =
      Array.isArray(product?.images) && product.images.length > 0
        ? product.images
        : ["https://placehold.co/800x1000?text=Sami"];
    const videoUrl = product?.cardVideoUrl;
    if (!videoUrl) {
      return imgs.map((url) => ({ type: "image", url }));
    }
    const out = [];
    for (let i = 0; i < imgs.length; i++) {
      out.push({ type: "image", url: imgs[i] });
      if (i === 0) {
        out.push({ type: "video", url: videoUrl });
      }
    }
    return out;
  }, [product]);

  useEffect(() => {
    setSizeError("");
    setQuantity(1);
    setActiveMediaIndex(0);
    setPlayingVideoIndex(null);
    setDescriptionOpen(false);
    setFabricCareOpen(false);
    setSupportOpen(false);
  }, [product]);

  useEffect(() => {
    if (!user || !product?._id) {
      setWishlisted(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/customers/wishlist", {
          headers: getCustomerAuthHeaders(),
        });
        const list = Array.isArray(data) ? data : [];
        const on = list.some((p) => String(p?._id || p) === String(product._id));
        if (!cancelled) setWishlisted(on);
      } catch {
        if (!cancelled) setWishlisted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, product?._id]);

  useEffect(() => {
    if (!galleryItems.length) return;
    const elements = galleryItems
      .map((_, index) => document.getElementById(`media-item-${index}`))
      .filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (best?.target?.id) {
          const idx = Number(best.target.id.replace("media-item-", ""));
          if (!Number.isNaN(idx)) setActiveMediaIndex(idx);
        }
      },
      { threshold: [0.25, 0.45, 0.65, 0.85] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [galleryItems]);

  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (!container) return;
    const activeThumb = container.querySelector('[data-testid="image-thumbnail-active"]');
    if (!activeThumb) return;
    activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeMediaIndex]);

  const toggleVideoPlayback = (index) => {
    const currentVideo = videoRefs.current[index];
    if (!currentVideo) return;
    if (!currentVideo.paused) {
      currentVideo.pause();
      setPlayingVideoIndex(null);
      return;
    }
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (Number(key) !== index && video && !video.paused) {
        video.pause();
      }
    });
    currentVideo.play().catch(() => {});
    setPlayingVideoIndex(index);
  };

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} | SAMÍ`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        product.description || "SAMÍ womenswear"
      );
    }
  }, [product]);

  const handleAddToCart = () => {
    const activeBundle = isBundleProduct ? selectedBundle : "single";
    const hasSizes = Array.isArray(product?.sizes) && product.sizes.length > 0;
    if (hasSizes) {
      if (activeBundle === "full_set" && (!selectedTopSize || !selectedBottomSize)) {
        setSizeError("Please select both top and bottom sizes");
        return;
      }
      if (activeBundle === "top_only" && !selectedTopSize) {
        setSizeError("Please select a top size");
        return;
      }
      if (activeBundle === "bottom_only" && !selectedBottomSize) {
        setSizeError("Please select a bottom size");
        return;
      }
      if (activeBundle === "single" && !selectedSize) {
        setSizeError("Please select a size");
        return;
      }
    }
    setSizeError("");
    const toAdd = Math.min(quantity, remainingStock);
    if (toAdd <= 0) return;
    const sizeForCart =
      activeBundle === "full_set"
        ? `Top: ${selectedTopSize} / Bottom: ${selectedBottomSize}`
        : activeBundle === "top_only"
          ? `Top: ${selectedTopSize}`
          : activeBundle === "bottom_only"
            ? `Bottom: ${selectedBottomSize}`
            : selectedSize;
    const bundleLabelForCart =
      activeBundle === "full_set"
        ? "Full Set"
        : activeBundle === "top_only"
          ? "Top Only"
          : activeBundle === "bottom_only"
            ? "Bottom Only"
            : "Single";
    const cartProduct = {
      ...product,
      priceUSD: selectedBundlePrice,
      discountPriceUSD: null,
      originalPriceUSD: product?.priceUSD,
    };
    for (let i = 0; i < toAdd; i++) {
      addToCart(cartProduct, sizeForCart, selectedColor, { bundle: bundleLabelForCart });
    }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const handleWishlistToggle = async () => {
    if (!requireAuth()) return;
    if (!product?._id) return;
    try {
      const { data } = await api.post(
        "/api/customers/wishlist",
        { productId: product._id },
        { headers: getCustomerAuthHeaders() },
      );
      const list = Array.isArray(data) ? data : [];
      setWishlisted(list.some((p) => String(p?._id) === String(product._id)));
    } catch {
      /* keep state */
    }
  };

  const totalInCart = useMemo(() => {
    if (!product?._id || !Array.isArray(cartItems)) return 0;
    return cartItems
      .filter((item) => item.productId === product._id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cartItems, product?._id]);

  /** Units left to sell in catalog (not reduced by this session’s cart). */
  const productStock = Number(product?.stock || 0);
  /** How many more units the shopper can add (respects cart). */
  const remainingStock = Math.max(0, productStock - Number(totalInCart || 0));

  const isOutOfStock = productStock <= 0;
  const isAtCartLimit = productStock > 0 && remainingStock <= 0;
  const hasDiscount =
    product?.discountPriceUSD != null &&
    Number(product.discountPriceUSD) > 0 &&
    Number(product.discountPriceUSD) < Number(product.priceUSD);
  const displayPrice = hasDiscount ? product.discountPriceUSD : product?.priceUSD;
  const hasBundlePresetPrices =
    Number(product?.bundleFullSetPriceUSD) > 0 ||
    Number(product?.bundleTopPriceUSD) > 0 ||
    Number(product?.bundleBottomPriceUSD) > 0;
  const isBundleProduct = Boolean(product?.allowSeparatePurchase);
  const bundlePrices = useMemo(() => {
    const fullPrice = Number(displayPrice || 0);
    if (!fullPrice) {
      return { full_set: 0, top_only: 0, bottom_only: 0 };
    }
    const fullSet = Number(product?.bundleFullSetPriceUSD) > 0
      ? Number(product.bundleFullSetPriceUSD)
      : fullPrice;
    const topOnly = Number(product?.bundleTopPriceUSD) > 0
      ? Number(product.bundleTopPriceUSD)
      : Math.round(fullSet * 0.58);
    const bottomOnly = Number(product?.bundleBottomPriceUSD) > 0
      ? Number(product.bundleBottomPriceUSD)
      : Math.round(fullSet * 0.5);
    return {
      full_set: fullSet,
      top_only: Math.min(topOnly, fullSet),
      bottom_only: Math.min(bottomOnly, fullSet),
    };
  }, [displayPrice, product]);
  const selectedBundlePrice = isBundleProduct
    ? bundlePrices[selectedBundle] ?? displayPrice
    : displayPrice;

  const descriptionText = useMemo(() => {
    const raw = product?.description?.trim();
    return raw || "";
  }, [product?.description]);

  const deliveryEstimateLabel = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() + 7);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const fmt = (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(from)} – ${fmt(to)}`;
  }, []);

  if (loading) {
    return (
      <div className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 h-3 w-32 rounded bg-[var(--color-sand)]/50" />
          <div className="grid animate-pulse gap-8 lg:grid-cols-[1fr_440px] lg:gap-16">
            <div className="space-y-3">
              <div className="bg-[var(--color-sand)]/50" style={{ width: 500, height: 650 }} />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-14 rounded-lg bg-[var(--color-sand)]/50" />
                ))}
              </div>
            </div>
            <div className="space-y-5 py-2">
              <div className="h-3 w-20 rounded bg-[var(--color-sand)]/50" />
              <div className="h-7 w-3/4 rounded bg-[var(--color-sand)]/50" />
              <div className="h-5 w-1/4 rounded bg-[var(--color-sand)]/50" />
              <div className="h-px bg-[var(--color-sand)]/30" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-[var(--color-sand)]/40" />
                <div className="h-3 w-5/6 rounded bg-[var(--color-sand)]/40" />
                <div className="h-3 w-2/3 rounded bg-[var(--color-sand)]/40" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-12 rounded-lg bg-[var(--color-sand)]/50" />
                ))}
              </div>
              <div className="h-14 rounded-xl bg-[var(--color-sand)]/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-sand)]/50">
          <span className="font-serif text-2xl text-black/20">?</span>
        </div>
        <p className="mt-5 text-[15px] font-medium text-black/60">
          Product not found
        </p>
        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] text-[var(--color-gold)] transition-colors hover:text-[var(--color-gold-soft)]"
        >
          <ChevronLeft size={14} />
          Back to collection
        </Link>
      </div>
    );
  }

  return (
    <section className="pb-20 pt-2 sm:pt-6">
      {/* Breadcrumb */}
      <nav className="mb-6 sm:mb-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-black/35 transition-colors hover:text-black/60"
          >
            <ChevronLeft size={13} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
            Collection
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">

          {/* ─── Product media feed (stacked vertically) ─── */}
          <div className="flex gap-3 lg:gap-5">
            {galleryItems.length > 1 && (
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div
                  ref={thumbnailContainerRef}
                  className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1 lg:w-[90px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0"
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                  data-testid="image-thumbnails"
                >
                  {galleryItems.map((item, index) => {
                    const isActive = index === activeMediaIndex;
                    const label =
                      item.type === "video"
                        ? `Video ${index + 1}`
                        : `Image ${index + 1}`;
                    return (
                      <button
                        key={`thumb-${item.type}-${item.url}-${index}`}
                        type="button"
                        onClick={() => {
                          setActiveMediaIndex(index);
                          document
                            .getElementById(`media-item-${index}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`relative shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                          isActive
                            ? "border-[var(--color-gold)]"
                            : "border-transparent opacity-50 hover:opacity-85"
                        }`}
                        style={{ width: 86, height: 112 }}
                        aria-label={label}
                        data-testid={isActive ? "image-thumbnail-active" : "image-thumbnail"}
                      >
                        {item.type === "video" ? (
                          <div className="group relative h-full w-full bg-black">
                            <video
                              src={item.url}
                              className="h-full w-full object-cover"
                              style={videoFilterStyle(product?.cardVideoAdjustments)}
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/25 transition-opacity duration-200 group-hover:opacity-90" />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/55 bg-black/45 shadow-lg shadow-black/40 backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
                                <Play
                                  size={16}
                                  strokeWidth={2.2}
                                  className="ml-[1px] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                                />
                              </span>
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={cloudinaryOptimizedUrl(item.url, { preset: "thumb" })}
                            alt={`${product.name} ${index + 1}`}
                            fill
                            sizes="86px"
                            className="object-cover"
                            unoptimized={isCloudinaryUrl(item.url)}
                            quality={90}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="w-full space-y-4">
              {galleryItems.map((item, index) => (
                <div
                  id={`media-item-${index}`}
                  key={`${item.type}-${item.url}-${index}`}
                  className="relative w-full overflow-hidden bg-[var(--color-sand)]/20"
                  style={{ maxWidth: 500, height: 650 }}
                  data-testid={index === 0 ? "main-product-image" : "product-gallery-item"}
                >
                  {item.type === "video" ? (
                    <div className="group absolute inset-0">
                      <video
                        src={item.url}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={videoFilterStyle(product?.cardVideoAdjustments)}
                        ref={(el) => {
                          if (el) videoRefs.current[index] = el;
                          else delete videoRefs.current[index];
                        }}
                        muted
                        playsInline
                        preload="metadata"
                        onPlay={() => setPlayingVideoIndex(index)}
                        onPause={() =>
                          setPlayingVideoIndex((prev) => (prev === index ? null : prev))
                        }
                        onEnded={() =>
                          setPlayingVideoIndex((prev) => (prev === index ? null : prev))
                        }
                        onClick={() => toggleVideoPlayback(index)}
                      />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
                      <button
                        type="button"
                        onClick={() => toggleVideoPlayback(index)}
                        className={`absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-cream)]/95 text-[var(--color-black)] shadow-lg shadow-black/25 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-[var(--color-cream)] ${
                          playingVideoIndex === index
                            ? "opacity-0 group-hover:opacity-100"
                            : "opacity-100"
                        }`}
                        aria-label={playingVideoIndex === index ? "Pause video" : "Play video"}
                      >
                        {playingVideoIndex === index ? (
                          <Pause size={24} strokeWidth={2.1} />
                        ) : (
                          <Play size={24} strokeWidth={2.1} className="ml-0.5" />
                        )}
                      </button>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                    </div>
                  ) : (
                    <Image
                      src={cloudinaryOptimizedUrl(item.url, { preset: "product" })}
                      alt={`${product.name || "Product image"} ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 500px"
                      unoptimized={isCloudinaryUrl(item.url)}
                      quality={95}
                      className="object-cover object-center"
                    />
                  )}

                  {isOutOfStock && index === 0 && (
                    <div className="absolute left-4 top-4 rounded-full bg-black/75 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                      Sold Out
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Product info — left-aligned, tight rhythm ─── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="w-full max-w-[400px] space-y-4 text-left">

              <div>
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <h1 className="min-w-0 flex-1 font-serif text-[1.45rem] font-light leading-[1.25] tracking-[0.01em] text-black/[0.88] sm:text-[1.55rem]">
                    {product.name}
                  </h1>
                  <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      className={`p-1.5 transition-colors ${
                        wishlisted
                          ? "text-[#9a7c52]"
                          : "text-black/30 hover:text-black/55"
                      }`}
                      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={handleWishlistToggle}
                    >
                      <Heart
                        size={17}
                        strokeWidth={1.4}
                        fill={wishlisted ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-black/30 transition-colors hover:text-black/55"
                      aria-label="Share"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: product.name, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                    >
                      <Share2 size={17} strokeWidth={1.4} />
                    </button>
                  </div>
                </div>
                <div
                  className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
                  data-testid="product-price"
                >
                  <span className="font-serif text-[1.2rem] font-normal tabular-nums tracking-tight text-black/[0.78]">
                    {formatPrice(selectedBundlePrice)}
                  </span>
                  {(!isBundleProduct || selectedBundle === "full_set") && hasDiscount && (
                    <span className="font-serif text-[0.95rem] tabular-nums text-black/28 line-through">
                      {formatPrice(product.priceUSD)}
                    </span>
                  )}
                </div>
              </div>

              {/* Color selector */}
              {Array.isArray(product.colors) && product.colors.length > 0 && (
                <div data-testid="color-selector">
                  <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-black/38">
                    Colour
                    {selectedColor && (
                      <span className="ml-2 font-serif text-[13px] font-normal normal-case tracking-normal text-black/58">
                        {selectedColor}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap justify-start gap-2.5">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor === color;
                      const cssColor = color?.toLowerCase?.() || "black";
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`group relative h-8 w-8 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-[var(--color-black)] ring-2 ring-[#C8A96E]/35"
                              : "border-black/18 hover:border-black/35"
                          }`}
                          style={{ backgroundColor: cssColor }}
                          data-testid="color-option"
                          aria-label={`Select color ${color}`}
                          title={color}
                        >
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="h-2 w-2 rounded-full bg-white/90 ring-1 ring-black/20" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {typeof product.stock === "number" &&
                product.stock > 0 &&
                product.stock <= 22 && (
                  <p className="font-serif text-[12px] italic leading-snug text-[#9a7c52]">
                    <span
                      className="mr-1.5 inline-block h-[5px] w-[5px] rounded-full align-middle"
                      style={{ backgroundColor: "#C8A96E" }}
                    />
                    Selling fast — {product.stock} left in stock
                  </p>
                )}

              {/* Bundle selector */}
              {isBundleProduct && (
                <div data-testid="bundle-selector">
                <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-black/38">
                  Configuration
                </p>
                <div className="space-y-2 rounded-lg border border-black/[0.08] bg-white/60 p-3">
                  {[
                    { value: "full_set", label: "Full set", price: bundlePrices.full_set },
                    { value: "top_only", label: "Top only", price: bundlePrices.top_only },
                    { value: "bottom_only", label: "Bottom only", price: bundlePrices.bottom_only },
                  ].map((option) => {
                    const active = selectedBundle === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                          active
                            ? "border-black/45 bg-transparent"
                            : "border-transparent hover:border-black/12"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 text-[12px] tracking-[0.03em] text-black/80">
                          <span
                            className={`h-3.5 w-3.5 rounded-full border ${
                              active
                                ? "border-[var(--color-black)] bg-[var(--color-black)]"
                                : "border-black/30"
                            }`}
                          />
                          {option.label}
                        </span>
                        <span className="text-[12px] font-semibold text-black/85">
                          {formatPrice(option.price)}
                        </span>
                        <input
                          type="radio"
                          name="bundle"
                          value={option.value}
                          checked={active}
                          onChange={(event) => setSelectedBundle(event.target.value)}
                          className="sr-only"
                        />
                      </label>
                    );
                  })}
                </div>
                {!hasBundlePresetPrices && (
                  <p className="mt-2 text-[10px] tracking-[0.02em] text-black/40">
                    Bundle prices are automatically calculated from the set price.
                  </p>
                )}
              </div>
              )}

              {/* Size selector */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <div className="space-y-2" data-testid="size-selector">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-black/38">
                      {isBundleProduct && selectedBundle === "full_set"
                        ? "Top & bottom"
                        : isBundleProduct && selectedBundle === "top_only"
                          ? "Top"
                          : isBundleProduct && selectedBundle === "bottom_only"
                            ? "Bottom"
                            : "Size"}
                    </span>
                    <SizeGuide />
                  </div>
                  {(selectedBundle !== "bottom_only" || !isBundleProduct) && (
                    <div>
                      {isBundleProduct && selectedBundle === "full_set" && (
                        <p className="mb-1.5 font-sans text-[9px] uppercase tracking-[0.12em] text-black/32">Top</p>
                      )}
                      <div
                        className={`flex flex-wrap justify-start gap-2 ${
                          product.sizes.length === 1 ? "w-full" : ""
                        }`}
                      >
                        {product.sizes.map((size) => {
                          const isSelected = !isBundleProduct
                            ? selectedSize === size
                            : selectedTopSize === size;
                          const oneSize = product.sizes.length === 1;
                          return (
                            <button
                              key={`top-${size}`}
                              type="button"
                              onClick={() => {
                                if (!isBundleProduct) setSelectedSize(size);
                                else setSelectedTopSize(size);
                                setSizeError("");
                              }}
                              className={`flex items-center justify-center border transition-all duration-200 ${
                                oneSize
                                  ? `w-full rounded-sm border-black/[0.12] px-2.5 py-1 font-sans text-[9px] font-medium uppercase tracking-[0.18em] ${
                                      isSelected
                                        ? "border-black/40 bg-black/[0.04] text-black/70"
                                        : "border-black/[0.1] bg-transparent text-black/38 hover:border-black/18 hover:text-black/48"
                                    }`
                                  : `min-w-[40px] rounded-sm px-2 py-1.5 font-serif font-normal text-[13px] uppercase tracking-[0.04em] ${
                                      isSelected
                                        ? "border-black/70 bg-black/[0.05] text-black/90"
                                        : "border-black/15 bg-transparent text-black/45 hover:border-black/35 hover:text-black/70"
                                    }`
                              }`}
                              data-testid="size-option"
                            aria-label={`Select size ${formatSizeLabel(size)}`}
                            >
                              {formatSizeLabel(size)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isBundleProduct && selectedBundle !== "top_only" && (
                    <div>
                      <p className="mb-1.5 font-sans text-[9px] uppercase tracking-[0.12em] text-black/32">Bottom</p>
                      <div
                        className={`flex flex-wrap justify-start gap-2 ${
                          product.sizes.length === 1 ? "w-full" : ""
                        }`}
                      >
                        {product.sizes.map((size) => {
                          const isSelected = selectedBottomSize === size;
                          const oneSize = product.sizes.length === 1;
                          return (
                            <button
                              key={`bottom-${size}`}
                              type="button"
                              onClick={() => { setSelectedBottomSize(size); setSizeError(""); }}
                              className={`flex items-center justify-center border transition-all duration-200 ${
                                oneSize
                                  ? `w-full rounded-sm border-black/[0.12] px-2.5 py-1 font-sans text-[9px] font-medium uppercase tracking-[0.18em] ${
                                      isSelected
                                        ? "border-black/40 bg-black/[0.04] text-black/70"
                                        : "border-black/[0.1] bg-transparent text-black/38 hover:border-black/18 hover:text-black/48"
                                    }`
                                  : `min-w-[40px] rounded-sm px-2 py-1.5 font-serif font-normal text-[13px] uppercase tracking-[0.04em] ${
                                      isSelected
                                        ? "border-black/70 bg-black/[0.05] text-black/90"
                                        : "border-black/15 bg-transparent text-black/45 hover:border-black/35 hover:text-black/70"
                                    }`
                              }`}
                              data-testid="size-option"
                              aria-label={`Select bottom size ${formatSizeLabel(size)}`}
                            >
                              {formatSizeLabel(size)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {sizeError && (
                    <p className="text-[11px] font-medium text-red-500">
                      {sizeError}
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-1.5" data-testid="quantity-section">
                <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-black/38">
                  Quantity
                </p>
                <div className="inline-flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-0.5 text-black/40 transition-colors hover:text-black/65 disabled:opacity-25"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} strokeWidth={1.75} />
                  </button>
                  <span className="min-w-[1.25rem] text-center font-serif text-[16px] font-medium tabular-nums text-black/[0.82]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(q + 1, Number(remainingStock || 99)),
                      )
                    }
                    disabled={quantity >= Number(remainingStock || 99)}
                    className="p-0.5 text-black/40 transition-colors hover:text-black/65 disabled:opacity-25"
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {/* Delivery estimate — plain text */}
              <p className="font-sans text-[11.5px] leading-snug text-black/45 sm:text-[12px]">
                <span className="text-black/48">Est. delivery </span>
                <span className="border-b border-black/20 font-medium text-black/[0.62]">
                  {deliveryEstimateLabel}
                </span>
                <span className="text-black/40"> · 7–14 business days</span>
              </p>

              {/* Add to bag */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={remainingStock <= 0 || addedFeedback}
                className={`w-full rounded-sm px-4 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:cursor-not-allowed ${
                  addedFeedback
                    ? "bg-emerald-800 text-white"
                    : remainingStock <= 0
                      ? "bg-black/[0.06] text-black/30"
                      : "bg-[#2a2520] text-[#faf8f5] hover:bg-[#1f1b18]"
                }`}
                data-testid="add-to-bag-button"
              >
                {addedFeedback ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Check size={15} strokeWidth={2.5} />
                    Added
                  </span>
                ) : isOutOfStock ? (
                  "Sold out"
                ) : isAtCartLimit ? (
                  "Maximum in bag"
                ) : (
                  "Add to bag"
                )}
              </button>

              <p className="text-[11px] leading-relaxed tracking-[0.04em] text-black/32">
                Tax included · Complimentary shipping on orders over {formatPrice(150)}
              </p>

              {/* Description & Fabric & care — borderless, hairline dividers */}
              <div className="border-t border-black/[0.08] pt-0" data-testid="product-accordions">
                <button
                  type="button"
                  onClick={() => setDescriptionOpen((v) => !v)}
                  className="flex w-full items-center border-b border-black/[0.07] py-2.5 text-left"
                >
                  <span className="flex-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-black/55">
                    Description
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.5}
                    className={`shrink-0 text-black/28 transition-transform duration-200 ${
                      descriptionOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {descriptionOpen && (
                  <div className="border-b border-black/[0.07] py-3 font-sans text-[12px] leading-[1.65] text-black/48">
                    {descriptionText ||
                      "Thoughtfully cut for everyday ease. Natural fibres and clean lines."}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setFabricCareOpen((v) => !v)}
                  className="flex w-full items-center py-2.5 text-left"
                >
                  <span className="flex-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-black/55">
                    Fabric &amp; care
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.5}
                    className={`shrink-0 text-black/28 transition-transform duration-200 ${
                      fabricCareOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {fabricCareOpen && (
                  <div className="pb-1 pt-0 font-sans text-[12px] leading-[1.65] text-black/48">
                    <p>
                      Fabrics are chosen for drape and longevity; exact composition is on the care
                      label.
                    </p>
                    <p className="mt-2">
                      Dry clean or gentle hand wash. Cool iron on the reverse. Store folded away
                      from direct sunlight.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSupportOpen((v) => !v)}
                  className="flex w-full items-center border-t border-black/[0.07] py-2.5 text-left"
                >
                  <span className="flex-1 font-sans text-[11px] font-medium text-black/55">
                    24/7 Customer Support
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.5}
                    className={`shrink-0 text-black/28 transition-transform duration-200 ${
                      supportOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {supportOpen && (
                  <div className="border-b border-black/[0.07] py-3 font-sans text-[12px] leading-[1.65] text-black/48">
                    <p>Expect a response within 8 working hours.</p>
                    <p className="mt-2">
                      Reach out to us via email at{" "}
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="border-b border-black/20 font-medium text-black/60 transition-opacity hover:opacity-80"
                      >
                        {SUPPORT_EMAIL}
                      </a>{" "}
                      or slide into our DMs on{" "}
                      <a
                        href="https://www.instagram.com/sami_boutique_baku/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-black/20 font-medium text-black/60 transition-opacity hover:opacity-80"
                      >
                        Instagram
                      </a>{" "}
                      (@sami_boutique_baku).
                    </p>
                    <p className="mt-2">Your satisfaction is our commitment!</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16 border-t border-[var(--color-line)] pt-14">
              <h2 className="font-serif text-xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-2xl">
                You may also like
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {relatedProducts.map((p) => {
                  const img =
                    Array.isArray(p.images) && p.images[0]
                      ? p.images[0]
                      : "https://placehold.co/600x800?text=SAM%C3%8D";
                  const price =
                    p.discountPriceUSD != null &&
                    Number(p.discountPriceUSD) > 0 &&
                    Number(p.discountPriceUSD) < Number(p.priceUSD)
                      ? p.discountPriceUSD
                      : p.priceUSD;
                  return (
                    <Link
                      key={p._id}
                      href={`/products/${p._id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-sand)]/30">
                        <Image
                          src={cloudinaryOptimizedUrl(img, { preset: "product" })}
                          alt={p.name || "Product"}
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                          unoptimized={isCloudinaryUrl(img)}
                        />
                      </div>
                      <p className="mt-3 text-[12px] font-medium tracking-[0.02em] text-[var(--color-black)] line-clamp-2 group-hover:opacity-80">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[12px] tabular-nums text-black/60">{formatPrice(price)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
