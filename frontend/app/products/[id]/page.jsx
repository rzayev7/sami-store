"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Truck,
  RotateCcw,
  ShieldCheck,
  Minus,
  Plus,
  Check,
  Heart,
  Share2,
  Play,
  Pause,
} from "lucide-react";
import api from "../../../lib/api";
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

  useEffect(() => {
    if (!resolvedProductId) return;

    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/api/products/${resolvedProductId}`);
        setProduct(data);
        setSelectedSize("");
        setSelectedTopSize("");
        setSelectedBottomSize("");
        setSelectedColor("");
        setSelectedBundle("full_set");
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedProductId]);

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
  }, [product]);

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
    document.title = `${product.name} | Sami`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        product.description || "Sami fashion product"
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

  const totalInCart = useMemo(() => {
    if (!product?._id || !Array.isArray(cartItems)) return 0;
    return cartItems
      .filter((item) => item.productId === product._id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cartItems, product?._id]);

  const remainingStock = Math.max(
    0,
    Number(product?.stock || 0) - Number(totalInCart || 0),
  );

  const isOutOfStock = remainingStock <= 0;
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
  const discountPercent = hasDiscount
    ? Math.round((1 - product.discountPriceUSD / product.priceUSD) * 100)
    : 0;

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

          {/* ─── Product info ─── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5">

              {/* Brand + Title */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">
                  Samí Collection
                </p>
                <h1 className="mt-2 font-serif text-[22px] font-light leading-snug tracking-[0.02em] text-[var(--color-black)] sm:text-[26px]">
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3" data-testid="product-price">
                <span className="text-[20px] font-semibold tracking-[0.01em] text-[var(--color-black)]">
                  {formatPrice(selectedBundlePrice)}
                </span>
                {(!isBundleProduct || selectedBundle === "full_set") && hasDiscount && (
                  <span className="text-[14px] tracking-[0.02em] text-black/30 line-through">
                    {formatPrice(product.priceUSD)}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--color-line)]" />

              {/* Description */}
              {product.description && (
                <p className="text-[13px] leading-[1.9] tracking-[0.01em] text-[var(--color-muted)]">
                  {product.description}
                </p>
              )}

              {/* Color selector */}
              {Array.isArray(product.colors) && product.colors.length > 0 && (
                <div data-testid="color-selector">
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                    Color
                    {selectedColor && (
                      <span className="ml-2 font-medium text-[var(--color-gold)]">
                        {selectedColor}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor === color;
                      const cssColor = color?.toLowerCase?.() || "black";
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`group relative h-7 w-7 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-[var(--color-black)]"
                              : "border-black/20 hover:border-black/40"
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

              {/* Bundle selector */}
              {isBundleProduct && (
                <div data-testid="bundle-selector">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  Configuration
                </p>
                <div className="space-y-2.5 rounded-xl border border-[var(--color-line)] p-3.5">
                  {[
                    { value: "full_set", label: "Full set", price: bundlePrices.full_set },
                    { value: "top_only", label: "Top only", price: bundlePrices.top_only },
                    { value: "bottom_only", label: "Bottom only", price: bundlePrices.bottom_only },
                  ].map((option) => {
                    const active = selectedBundle === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                          active
                            ? "border-[var(--color-black)] bg-[var(--color-sand)]/50"
                            : "border-[var(--color-line)] hover:border-black/30"
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
                <div data-testid="size-selector">
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                      {isBundleProduct && selectedBundle === "full_set"
                        ? "Top & Bottom Size"
                        : isBundleProduct && selectedBundle === "top_only"
                          ? "Top Size"
                          : isBundleProduct && selectedBundle === "bottom_only"
                            ? "Bottom Size"
                            : "Size"}
                    </p>
                  </div>
                  {(selectedBundle !== "bottom_only" || !isBundleProduct) && (
                    <div className="mb-3">
                      {isBundleProduct && selectedBundle === "full_set" && (
                        <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-black/45">Top</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => {
                          const isSelected =
                            selectedBundle === "single"
                              ? selectedSize === size
                              : selectedTopSize === size;
                          return (
                            <button
                              key={`top-${size}`}
                              type="button"
                              onClick={() => {
                                if (!isBundleProduct) setSelectedSize(size);
                                else setSelectedTopSize(size);
                                setSizeError("");
                              }}
                              className={`flex min-w-[46px] items-center justify-center rounded-lg border px-3.5 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-all duration-200 ${
                                isSelected
                                  ? "border-[var(--color-black)] bg-[var(--color-sand)]/50 text-[var(--color-black)] shadow-sm"
                                  : "border-[var(--color-line)] bg-white text-black/55 hover:border-black/30 hover:text-black"
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
                      <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-black/45">Bottom</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => {
                          const isSelected = selectedBottomSize === size;
                          return (
                            <button
                              key={`bottom-${size}`}
                              type="button"
                              onClick={() => { setSelectedBottomSize(size); setSizeError(""); }}
                              className={`flex min-w-[46px] items-center justify-center rounded-lg border px-3.5 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-all duration-200 ${
                                isSelected
                                  ? "border-[var(--color-black)] bg-[var(--color-sand)]/50 text-[var(--color-black)] shadow-sm"
                                  : "border-[var(--color-line)] bg-white text-black/55 hover:border-black/30 hover:text-black"
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
                    <p className="mt-2 text-[11px] font-medium text-red-500">
                      {sizeError}
                    </p>
                  )}
                </div>
              )}

              {/* Quantity + Actions row */}
              <div className="flex items-end gap-3" data-testid="quantity-section">
                <div>
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                    Quantity
                  </p>
                  <div className="inline-flex items-center rounded-lg border border-[var(--color-line)] bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="flex h-11 w-11 items-center justify-center text-black/35 transition-colors hover:text-black disabled:opacity-25"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} strokeWidth={2} />
                    </button>
                    <span className="flex h-11 min-w-[40px] items-center justify-center border-x border-[var(--color-line)] text-[13px] font-semibold tabular-nums">
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
                      className="flex h-11 w-11 items-center justify-center text-black/35 transition-colors hover:text-black disabled:opacity-25"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Wishlist + Share */}
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white text-black/30 transition-all hover:border-black/20 hover:text-red-400"
                    aria-label="Add to wishlist"
                  >
                    <Heart size={17} strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white text-black/30 transition-all hover:border-black/20 hover:text-black/60"
                    aria-label="Share"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: product.name, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                  >
                    <Share2 size={16} strokeWidth={1.6} />
                  </button>
                </div>
              </div>

              {/* Low stock warning */}
              {typeof product.stock === "number" &&
                product.stock > 0 &&
                product.stock < 5 && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/70 px-4 py-2.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    <p className="text-[11px] font-medium tracking-[0.02em] text-amber-700">
                      Only {product.stock} left in stock — order soon
                    </p>
                  </div>
                )}

              {/* Add to cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addedFeedback}
                className={`relative w-full overflow-hidden rounded-xl px-4 py-[15px] text-[12px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 disabled:cursor-not-allowed ${
                  addedFeedback
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : isOutOfStock
                      ? "bg-black/[0.07] text-black/25"
                      : "bg-[var(--color-black)] text-white shadow-md shadow-black/10 hover:shadow-lg hover:shadow-black/15 active:scale-[0.99]"
                }`}
                data-testid="add-to-bag-button"
              >
                {addedFeedback ? (
                  <span className="inline-flex items-center gap-2">
                    <Check size={16} strokeWidth={2.5} />
                    Added to Bag
                  </span>
                ) : isOutOfStock ? (
                  "Sold Out"
                ) : (
                  "Add to Bag"
                )}
              </button>

              {/* Tax note */}
              <p className="text-center text-[10px] tracking-[0.04em] text-black/30">
                Tax included · Free shipping on orders over {formatPrice(150)}
              </p>

              {/* Delivery promises */}
              <div
                className="mt-1 space-y-0 rounded-xl border border-[var(--color-line)] bg-white"
                data-testid="delivery-promises"
              >
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)]">
                    <Truck size={14} strokeWidth={1.6} className="text-[var(--color-gold)]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-black/70">Worldwide Delivery</p>
                    <p className="text-[10px] tracking-[0.02em] text-black/35">7–14 business days</p>
                  </div>
                </div>
                <div className="mx-4 h-px bg-[var(--color-line)]" />
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)]">
                    <RotateCcw size={14} strokeWidth={1.6} className="text-[var(--color-gold)]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-black/70">Easy Returns</p>
                    <p className="text-[10px] tracking-[0.02em] text-black/35">14-day return policy</p>
                  </div>
                </div>
                <div className="mx-4 h-px bg-[var(--color-line)]" />
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)]">
                    <ShieldCheck size={14} strokeWidth={1.6} className="text-[var(--color-gold)]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-black/70">Secure Checkout</p>
                    <p className="text-[10px] tracking-[0.02em] text-black/35">SSL encrypted payment</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
