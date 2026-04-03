"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { cloudinaryOptimizedUrl, isCloudinaryUrl } from "../lib/image";
import { videoFilterStyle } from "../lib/videoAdjustments";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const videoRef = useRef(null);
  const hasVideo = Boolean(product?.cardVideoUrl);

  const imagePrimary = product?.images?.[0] || "https://placehold.co/700x900?text=SAMI";
  const imageSecondary = product?.images?.[1] || imagePrimary;
  const primarySrc = cloudinaryOptimizedUrl(imagePrimary, { preset: "listing" });
  const secondarySrc = cloudinaryOptimizedUrl(imageSecondary, { preset: "listing" });
  const primaryIsCloudinary = isCloudinaryUrl(imagePrimary);
  const secondaryIsCloudinary = isCloudinaryUrl(imageSecondary);
  const preferredSize = Array.isArray(product?.sizes) && product.sizes.length > 0 ? product.sizes[0] : "";

  const handleQuickAdd = () => {
    addToCart(product, preferredSize);
  };

  const cardHoverMedia =
    hasVideo
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
      <Link href={`/products/${product?._id}`} className="block">
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[var(--color-sand)]"
          {...cardHoverMedia}
        >
          <Image
            src={primarySrc}
            alt={product?.name || "SAMI product"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
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
            <Image
              src={secondarySrc}
              alt={product?.name || "SAMI product alternate"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              unoptimized={secondaryIsCloudinary}
              quality={92}
            />
          )}
        </div>
      </Link>

      <div className="space-y-2 py-4">
        <Link href={`/products/${product?._id}`} className="block">
          <h3 className="line-clamp-2 text-sm font-medium leading-6 text-[#25211c]">{product?.name}</h3>
        </Link>
        {product?.discountPriceUSD != null &&
          Number(product.discountPriceUSD) > 0 &&
          Number(product.discountPriceUSD) < Number(product.priceUSD) ? (
          <p className="flex items-center gap-2 text-sm">
            <span className="font-medium text-[var(--color-black)]">{formatPrice(product.discountPriceUSD)}</span>
            <span className="text-xs text-black/30 line-through">{formatPrice(product.priceUSD)}</span>
          </p>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">{formatPrice(product?.priceUSD)}</p>
        )}
        <button
          type="button"
          onClick={handleQuickAdd}
          className="mt-1 inline-flex border border-[#1e1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e1b17] transition hover:bg-[#1e1b17] hover:text-[#f2e7d1]"
        >
          Quick Add
        </button>
      </div>
    </article>
  );
}
