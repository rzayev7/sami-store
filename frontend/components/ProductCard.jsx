"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import { useWishlist } from "../context/WishlistContext";
import { trackAddToCart, productToItem } from "../lib/gtag";
import { trackTikTokAddToCart } from "../lib/tiktok-pixel";
import { trackMetaAddToCart } from "../lib/meta-pixel";
import { cloudinaryLoader, isCloudinaryUrl } from "../lib/image";
import { useLazyCloudinaryCardVideo } from "../hooks/useLazyCloudinaryCardVideo";
import PortraitCoverVideo from "./PortraitCoverVideo";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product?._id);
  const hasVideo = Boolean(product?.cardVideoUrl);
  const { videoRef, hoverHandlers } = useLazyCloudinaryCardVideo(
    product?.cardVideoUrl,
    [product?._id, product?.cardVideoUrl],
  );

  const imagePrimary = product?.images?.[0] || "https://placehold.co/700x900?text=SAMI";
  const imageSecondary = product?.images?.[1] || imagePrimary;
  const primaryIsCloudinary = isCloudinaryUrl(imagePrimary);
  const secondaryIsCloudinary = isCloudinaryUrl(imageSecondary);
  const preferredSize = Array.isArray(product?.sizes) && product.sizes.length > 0 ? product.sizes[0] : "";

  const handleQuickAdd = () => {
    const line = productToItem(product, { quantity: 1 });
    trackAddToCart(line);
    trackTikTokAddToCart(line);
    trackMetaAddToCart(line);
    addToCart(product, preferredSize);
  };

  const cardHoverMedia = hasVideo ? hoverHandlers : {};

  return (
    <article className="group">
      <Link href={`/products/${product?._id}`} className="block">
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[var(--color-sand)]"
          {...cardHoverMedia}
        >
          <Image
            src={imagePrimary}
            alt={product?.name || "SAMI product"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
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
            <Image
              src={imageSecondary}
              alt={product?.name || "SAMI product alternate"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              loader={secondaryIsCloudinary ? cloudinaryLoader : undefined}
              unoptimized={!secondaryIsCloudinary}
            />
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(product?._id);
            }}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className={`absolute end-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-[2px] transition-all duration-200 hover:scale-110 hover:bg-white ${
              wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Heart
              size={15}
              strokeWidth={1.6}
              className={wishlisted ? "text-[var(--color-gold)]" : "text-black/50"}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </button>
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
          {t("product.quickAdd")}
        </button>
      </div>
    </article>
  );
}
