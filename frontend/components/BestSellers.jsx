"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { useEffect, useState } from "react";
import api from "../lib/api";
import ProductCarousel from "./ProductCarousel";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import { cloudinaryLoader, isCloudinaryUrl } from "../lib/image";
import PortraitCoverVideo from "./PortraitCoverVideo";
import { useLazyCloudinaryCardVideo } from "../hooks/useLazyCloudinaryCardVideo";
import { isProductsPublicEnabled } from "../lib/productsEnabled";

function BestSellerCard({ item, formatPrice }) {
  const hasVideo = Boolean(item.cardVideoUrl);
  const { videoRef, containerRef, posterUrl, hoverHandlers } = useLazyCloudinaryCardVideo(
    item.cardVideoUrl,
    [item?._id, item?.cardVideoUrl],
  );
  const rawImage = item.images?.[0] || "https://placehold.co/700x900?text=SAMI";
  const rawSecondaryImage = item.images?.[1] || rawImage;
  const isCloudinary = isCloudinaryUrl(rawImage);
  const isSecondaryCloudinary = isCloudinaryUrl(rawSecondaryImage);

  const hover = hasVideo ? hoverHandlers : {};

  return (
    <Link
      href={`/products/${item._id}`}
      className="group block w-full min-w-0"
    >
      <div
        ref={hasVideo ? containerRef : undefined}
        className="relative aspect-[2/3] overflow-hidden bg-[var(--color-sand)]/40"
        {...hover}
      >
        <Image
          src={rawImage}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={
            hasVideo
              ? "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-0"
              : "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          }
          loader={isCloudinary ? cloudinaryLoader : undefined}
          unoptimized={!isCloudinary}
        />
        {hasVideo ? (
          <PortraitCoverVideo
            ref={videoRef}
            src={undefined}
            poster={posterUrl || undefined}
            wrapperClassName="absolute inset-0 overflow-hidden"
            videoClassName="opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            videoAdjustments={item?.cardVideoAdjustments}
            disablePortraitFix={item?.cardVideoLandscape === true}
            muted
            loop
            playsInline
            preload="none"
          />
        ) : (
          <Image
            src={rawSecondaryImage}
            alt={`${item.name} alternate`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            loader={isSecondaryCloudinary ? cloudinaryLoader : undefined}
            unoptimized={!isSecondaryCloudinary}
          />
        )}
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-[12px] font-medium tracking-[0.04em] text-[var(--color-black)]">
          {item.name}
        </h3>
        {item.discountPriceUSD != null &&
        Number(item.discountPriceUSD) > 0 &&
        Number(item.discountPriceUSD) < Number(item.priceUSD) ? (
          <p className="mt-1 flex items-center justify-center gap-2 text-[12px]">
            <span className="font-medium tracking-[0.02em] text-[var(--color-black)]">
              {formatPrice(item.discountPriceUSD)}
            </span>
            <span className="text-[11px] tracking-[0.02em] text-black/30 line-through">
              {formatPrice(item.priceUSD)}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-[12px] font-medium tracking-[0.02em] text-[var(--color-black)]">
            {formatPrice(item.priceUSD)}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function BestSellers() {
  const productsEnabled = isProductsPublicEnabled();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(productsEnabled);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  useEffect(() => {
    if (!productsEnabled) return;

    const fetchBestSellers = async () => {
      try {
        const { data } = await api.get("/api/products", {
          params: {
            page: 1,
            limit: 12,
            bestSeller: "true",
            sortBy: "featured",
            lite: "true",
          },
        });
        const products = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data)
            ? data.filter((p) => p.isBestSeller)
            : [];
        setItems(products);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [productsEnabled]);

  if (!productsEnabled || (!loading && items.length === 0)) return null;

  return (
    <section className="pt-10 pb-20 sm:pt-14 sm:pb-28">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
          {t("home.mostLoved")}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-light tracking-[0.04em] text-[var(--color-black)] sm:text-4xl">
          {t("home.bestSellers")}
        </h2>
      </div>

      {loading && (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mx-auto w-full max-w-[280px] animate-pulse lg:max-w-[250px]">
              <div className="aspect-[2/3] rounded-lg bg-[var(--color-sand)]/60" />
              <div className="mt-4 space-y-2 text-center">
                <div className="mx-auto h-3 w-3/4 rounded bg-[var(--color-sand)]/60" />
                <div className="mx-auto h-3 w-1/3 rounded bg-[var(--color-sand)]/60" />
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && items.length > 0 && (
        <div className="mt-14">
          <ProductCarousel itemCount={items.length} intervalMs={5500}>
            {items.map((item) => (
              <BestSellerCard key={item._id} item={item} formatPrice={formatPrice} />
            ))}
          </ProductCarousel>
        </div>
      )}

      <div className="mt-14 text-center">
        <Link
          href="/products/best-sellers"
          className="inline-flex border-b border-[var(--color-black)] pb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-black)] transition-all hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
        >
          {t("home.viewAllBestSellers")}
        </Link>
      </div>
    </section>
  );
}
