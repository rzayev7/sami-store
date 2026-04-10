"use client";

import Link from "./LocaleLink";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalePath, stripLocale } from "../context/LanguageContext";
import { Menu, Search, User, ShoppingBag, X, ChevronDown } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LANGUAGES } from "../i18n";
import CurrencySelector from "./CurrencySelector";
import api from "../lib/api";

function LanguageSwitcher({ className = "", inverted = false }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buttonClassName = inverted
    ? "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-white/90 transition-colors hover:text-white"
    : "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-black/70 transition-colors hover:text-[var(--color-black)]";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
      >
        <span>{language.toUpperCase()}</span>
        <ChevronDown size={12} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-1.5 min-w-[160px] overflow-y-auto rounded-lg border border-[var(--color-line)] bg-white py-1 shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-start text-[12px] transition-colors hover:bg-[var(--color-cream)]/60 ${
                l.code === language
                  ? "font-semibold text-[var(--color-black)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              <span className="w-6 text-[11px] font-semibold uppercase text-black/40">{l.code}</span>
              <span className="flex-1">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { cartItems, openCart } = useCart();
  const { user: customerUser, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const localePath = useLocalePath();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const cleanPath = stripLocale(pathname);
  const isHome = cleanPath === "/";
  const isTransparent = cleanPath === "/" && !isScrolled;
  const iconColor = isTransparent ? "text-white" : "text-[var(--color-black)]";

  if (cleanPath?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header
        className={`${isHome ? "fixed" : "sticky"} top-0 z-30 w-full transition-all duration-300 ${
          isTransparent
            ? "bg-transparent text-white"
            : "bg-white/95 text-[var(--color-black)] backdrop-blur"
        }`}
      >
        <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-3 items-center px-4 py-4 sm:px-6 sm:py-5 lg:px-12">
          <div className="flex items-center justify-start">
            <button
              type="button"
              aria-label={t("nav.openMenu")}
              onClick={() => setIsSidebarOpen(true)}
              className={`rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <Menu size={22} strokeWidth={1.8} />
            </button>
          </div>

          <Link href="/" className="justify-self-center transition-opacity hover:opacity-80">
            <span
              className={`sami-brand text-4xl leading-none sm:text-5xl transition-all duration-300 ${
                isTransparent
                  ? "!text-[#C8A96A] drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
                  : ""
              }`}
            >
              SAMÍ
            </span>
          </Link>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher inverted={isTransparent} />
            </div>

            <div className="hidden sm:block">
              <CurrencySelector inverted={isTransparent} />
            </div>

            <Link
              href="/products"
              aria-label={t("nav.searchProducts")}
              className={`rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <Search size={21} strokeWidth={1.8} />
            </Link>

            <button
              type="button"
              aria-label={t("nav.account")}
              onClick={() => {
                if (customerUser) {
                  router.push(localePath("/account"));
                } else {
                  openAuthModal();
                }
              }}
              className={`relative rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <User size={21} strokeWidth={1.8} />
              {customerUser && (
                <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--color-green)]" />
              )}
            </button>

            <button
              type="button"
              aria-label={t("nav.openCart")}
              onClick={openCart}
              className={`relative rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <ShoppingBag size={21} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-green)] px-1 text-[10px] font-bold leading-none text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Left sidebar drawer */}
      <aside
        className={`fixed top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white text-[var(--color-black)] shadow-2xl transition-transform duration-300 ease-in-out ltr:left-0 rtl:right-0 ${
          isSidebarOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="border-b border-[var(--color-line)] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="sami-brand text-2xl leading-none">SAMÍ</span>
            <button
              type="button"
              aria-label={t("nav.closeMenu")}
              onClick={closeSidebar}
              className="rounded-full p-1.5 text-black/60 transition hover:bg-black/5 hover:text-black"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 sm:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {t("nav.currency")}
            </p>
            <div className="min-w-[130px]">
              <CurrencySelector />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {t("nav.language")}
            </p>
            <div className="min-w-[130px]">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              {t("nav.shop")}
            </p>
          </div>
          <div className="flex flex-col">
            <Link
              href="/products"
              onClick={closeSidebar}
              className="px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] transition-colors hover:bg-[var(--color-cream)]"
            >
              {t("nav.allProducts")}
            </Link>
          </div>

          <div className="mx-6 my-3 border-t border-[var(--color-line)]" />

          <div className="px-6 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              {t("nav.categories")}
            </p>
          </div>
          <div className="flex flex-col">
            {[
              { key: "nav.sets", slug: "Sets" },
              { key: "nav.dresses", slug: "Dresses" },
              { key: "nav.shirtsBlouses", slug: "Shirts & Blouses" },
              { key: "nav.pantsSkirts", slug: "Pants & Skirts" },
              { key: "nav.jumpsuits", slug: "Jumpsuits" },
            ].map(({ key, slug }) => (
              <Link
                key={slug}
                href={`/products?category=${encodeURIComponent(slug)}`}
                onClick={closeSidebar}
                className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
              >
                {t(key)}
              </Link>
            ))}
          </div>

          <div className="mx-6 my-3 border-t border-[var(--color-line)]" />

          <div className="px-6 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              {t("nav.account")}
            </p>
          </div>
          <div className="flex flex-col">
            {customerUser ? (
              <>
                <Link
                  href="/account"
                  onClick={closeSidebar}
                  className="px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] transition-colors hover:bg-[var(--color-cream)]"
                >
                  {t("nav.myAccount")}
                </Link>
                <Link
                  href="/account?tab=orders"
                  onClick={closeSidebar}
                  className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
                >
                  {t("nav.myOrders")}
                </Link>
                <Link
                  href="/account?tab=wishlist"
                  onClick={closeSidebar}
                  className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
                >
                  {t("nav.wishlist")}
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeSidebar();
                  openAuthModal();
                }}
                className="px-6 py-3.5 text-start text-[14px] font-medium tracking-[0.02em] transition-colors hover:bg-[var(--color-cream)]"
              >
                {t("nav.signInCreate")}
              </button>
            )}
          </div>

          <div className="mx-6 my-3 border-t border-[var(--color-line)]" />

          <div className="px-6 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              {t("nav.help")}
            </p>
          </div>
          <div className="flex flex-col">
            <Link
              href="/track-order"
              onClick={closeSidebar}
              className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
            >
              {t("nav.trackOrder")}
            </Link>
          </div>

        </nav>

        <div className="border-t border-[var(--color-line)] px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-black/40">
            {t("nav.worldwideShipping")}
          </p>
        </div>
      </aside>

    </>
  );
}
