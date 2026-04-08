"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, Search, User, ShoppingBag, X, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CurrencySelector from "./CurrencySelector";
import api from "../lib/api";

export default function Navbar() {
  const { cartItems, openCart } = useCart();
  const { user: customerUser, openAuthModal } = useAuth();
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

  const isHome = pathname === "/";
  const isTransparent = pathname === "/" && !isScrolled;
  const iconColor = isTransparent ? "text-white" : "text-[var(--color-black)]";

  // Hide the public navbar entirely on admin routes; admin pages use their
  // own layout and navigation.
  if (pathname?.startsWith("/admin")) {
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
              aria-label="Open menu"
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
            {/* Hide currency selector in the top bar on very small screens to prevent wrapping under the logo */}
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>

            <Link
              href="/products"
              aria-label="Search products"
              className={`rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <Search size={21} strokeWidth={1.8} />
            </Link>

            <button
              type="button"
              aria-label="Account"
              onClick={() => {
                if (customerUser) {
                  router.push("/account");
                } else {
                  openAuthModal();
                }
              }}
              className={`relative rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <User size={21} strokeWidth={1.8} />
              {customerUser && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--color-green)]" />
              )}
            </button>

            <button
              type="button"
              aria-label="Open cart"
              onClick={openCart}
              className={`relative rounded-full p-2 transition-opacity hover:opacity-60 ${iconColor}`}
            >
              <ShoppingBag size={21} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-green)] px-1 text-[10px] font-bold leading-none text-white">
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
        className={`fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white text-[var(--color-black)] shadow-2xl transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[var(--color-line)] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="sami-brand text-2xl leading-none">SAMÍ</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeSidebar}
              className="rounded-full p-1.5 text-black/60 transition hover:bg-black/5 hover:text-black"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>

          {/* Mobile currency selector lives in the header area of the sidebar for quick access */}
          <div className="mt-4 flex items-center justify-between gap-3 sm:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Currency
            </p>
            <div className="min-w-[130px]">
              <CurrencySelector />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Shop
            </p>
          </div>
          <div className="flex flex-col">
            <Link
              href="/products"
              onClick={closeSidebar}
              className="px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] transition-colors hover:bg-[var(--color-cream)]"
            >
              All Products
            </Link>
          </div>

          <div className="mx-6 my-3 border-t border-[var(--color-line)]" />

          <div className="px-6 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Categories
            </p>
          </div>
          <div className="flex flex-col">
            {[
              { label: "Sets", slug: "Sets" },
              { label: "Dresses", slug: "Dresses" },
              { label: "Shirts & Blouses", slug: "Shirts & Blouses" },
              { label: "Pants & Skirts", slug: "Pants & Skirts" },
            ].map(({ label, slug }) => (
              <Link
                key={slug}
                href={`/products?category=${encodeURIComponent(slug)}`}
                onClick={closeSidebar}
                className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mx-6 my-3 border-t border-[var(--color-line)]" />

          <div className="px-6 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Account
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
                  My Account
                </Link>
                <Link
                  href="/account?tab=orders"
                  onClick={closeSidebar}
                  className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
                >
                  My Orders
                </Link>
                <Link
                  href="/account?tab=wishlist"
                  onClick={closeSidebar}
                  className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
                >
                  Wishlist
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeSidebar();
                  openAuthModal();
                }}
                className="px-6 py-3.5 text-left text-[14px] font-medium tracking-[0.02em] transition-colors hover:bg-[var(--color-cream)]"
              >
                Sign In / Create Account
              </button>
            )}
          </div>

          <div className="mx-6 my-3 border-t border-[var(--color-line)]" />

          <div className="px-6 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
              Help
            </p>
          </div>
          <div className="flex flex-col">
            <Link
              href="/track-order"
              onClick={closeSidebar}
              className="px-6 py-3.5 text-[14px] tracking-[0.02em] text-black/80 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
            >
              Track Order
            </Link>
          </div>

        </nav>

        <div className="border-t border-[var(--color-line)] px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-black/40">
            Worldwide Shipping
          </p>
        </div>
      </aside>

    </>
  );
}
