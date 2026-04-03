"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Grid3x3,
  Users,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { checkAdminAuth, clearAdminAuth } from "../../lib/adminAuth";
import { t } from "../../lib/admin-i18n";

const navLinks = [
  { href: "/admin/dashboard", label: t.dashboard, icon: LayoutDashboard },
  { href: "/admin/orders", label: t.orders, icon: ShoppingBag },
  { href: "/admin/products", label: t.products, icon: Package },
  { href: "/admin/categories", label: t.categories, icon: Grid3x3 },
  { href: "/admin/customers", label: t.customers, icon: Users },
  { href: "/admin/coupons", label: t.coupons, icon: Ticket },
  { href: "/admin/analytics", label: t.analytics, icon: BarChart3 },
];

const bottomLinks = [
  { href: "/admin/settings", label: t.settings, icon: Settings },
];

function getPageTitle(pathname) {
  const all = [...navLinks, ...bottomLinks];
  const match = all.find((l) => pathname?.startsWith(l.href));
  if (pathname?.includes("/products/new")) return t.addProduct;
  if (pathname?.includes("/products/edit")) return t.editProduct;
  return match?.label || t.admin;
}

function NavItem({ href, label, icon: Icon, isActive, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
        isActive
          ? "bg-[var(--color-green)]/10 text-[var(--color-green)]"
          : "text-black/55 hover:bg-black/[0.04] hover:text-black/80"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-green)]" />
      )}
      <Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
      {label}
    </Link>
  );
}

function SidebarContent({ activePath, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="px-4 pb-5 pt-2">
        <Link href="/admin/dashboard" className="block" onClick={onNavigate}>
          <h2 className="font-serif text-xl font-light tracking-[0.12em] text-[var(--color-green)]">
            SAM&Iacute;
          </h2>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
            {t.adminPanel}
          </p>
        </Link>
      </div>

      <div className="mx-4 mb-4 h-px bg-[var(--color-line)]" />

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navLinks.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            isActive={activePath.startsWith(link.href)}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto px-3 pb-4">
        <div className="mx-1 mb-3 h-px bg-[var(--color-line)]" />
        {bottomLinks.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            isActive={activePath.startsWith(link.href)}
            onClick={onNavigate}
          />
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-black/45 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} strokeWidth={1.6} />
          {t.logOut}
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const isAuthorized = isClient ? checkAdminAuth() : false;
  const activePath = pathname || "";
  const pageTitle = getPageTitle(pathname);

  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!isLoginPage && !isAuthorized) {
      router.replace(
        `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }, [isAuthorized, isLoginPage, router]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    clearAdminAuth();
    router.replace(
      `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`,
    );
  };

  if (!isClient) return null;
  if (isLoginPage) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-12">
        {children}
      </div>
    );
  }
  if (!isAuthorized) return null;

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* ---- Desktop sidebar ---- */}
        <aside className="hidden lg:block">
          <div className="sticky top-0 h-screen border-r border-[var(--color-line)] bg-white py-6">
            <SidebarContent
              activePath={activePath}
              onNavigate={undefined}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        {/* ---- Mobile sidebar overlay ---- */}
        <div
          className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
            mobileOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={closeMobile}
          aria-hidden="true"
        />

        {/* ---- Mobile sidebar drawer ---- */}
        <aside
          className={`fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-end px-4 pt-4">
            <button
              type="button"
              onClick={closeMobile}
              aria-label={t.closeMenu}
              className="rounded-lg p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>
          <SidebarContent
            activePath={activePath}
            onNavigate={closeMobile}
            onLogout={handleLogout}
          />
        </aside>

        {/* ---- Content area (dashboard only, no top navbar) ---- */}
        <div className="min-w-0">
          <section className="p-4 sm:p-6 lg:p-8">{children}</section>
        </div>
      </div>
    </div>
  );
}
