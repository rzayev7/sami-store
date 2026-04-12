"use client";

import Link from "../../../components/LocaleLink";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { getCustomerAuthHeaders } from "../../../lib/customerAuth";
import { SUPPORT_EMAIL } from "../../../lib/sitePublic";
import { WesternUnionMark } from "../../../components/CardBrandLogos";

const WHATSAPP_E164 = "994554737996";
const IBAN = "AZ28AIIB38817944006860051100";
const SWIFT = "AIIBAZ2X";
const ACCOUNT_NAME = "Samira Rzayeva";
const WU_LOCATION = "Baku, Azerbaijan";

function shortOrderRef(orderId) {
  const s = String(orderId || "").trim();
  if (!s) return "";
  return s.slice(-8).toUpperCase();
}

function BankTransferInner() {
  const searchParams = useSearchParams();
  const orderId = (searchParams.get("orderId") || "").trim();
  const emailFromQuery = (searchParams.get("email") || "").trim();

  const { user: customerUser } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const headers = customerUser ? getCustomerAuthHeaders() : {};
        const q = emailFromQuery ? `?email=${encodeURIComponent(emailFromQuery)}` : "";
        const { data } = await api.get(`/api/orders/${encodeURIComponent(orderId)}${q}`, { headers });
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, emailFromQuery, customerUser]);

  const ref = shortOrderRef(orderId);
  const orderHash = ref ? `#${ref}` : "";

  const totalAzn = Number(order?.totalPriceUSD ?? 0);
  const hasAmount = order && Number.isFinite(totalAzn);

  const waBody = t("bankTransfer.whatsappMessage", { ref: orderHash || "" });
  const waUrl = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(waBody)}`;

  const totalLine = (() => {
    if (loading && orderId) return "…";
    if (!hasAmount) return "—";
    const manat =
      Number.isInteger(totalAzn) && totalAzn === Math.round(totalAzn)
        ? String(Math.round(totalAzn))
        : totalAzn.toFixed(2);
    const approx = formatPrice(totalAzn);
    return `₼${manat} (≈ ${approx})`;
  })();

  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-[0.02em] sm:text-2xl">{t("bankTransfer.title")}</h1>

        <div className="mt-6 space-y-1 text-[15px] leading-relaxed text-black/90">
          <p>
            <span className="text-black/55">{t("bankTransfer.order")}</span>{" "}
            <span className="font-mono font-semibold">{orderHash || "—"}</span>
          </p>
          <p>
            <span className="text-black/55">{t("bankTransfer.total")}</span>{" "}
            <span className="font-semibold tabular-nums">{totalLine}</span>
          </p>
        </div>

        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45">{t("bankTransfer.bankTransfer")}</p>
          <div className="mt-3 space-y-2.5 text-sm text-black/90">
            <p>
              <span className="text-black/50">{t("bankTransfer.iban")}</span>{" "}
              <span className="break-all font-mono text-sm font-medium">{IBAN}</span>
            </p>
            <p>
              <span className="text-black/50">{t("bankTransfer.name")}</span> {ACCOUNT_NAME}
            </p>
            <p>
              <span className="text-black/50">{t("bankTransfer.swift")}</span>{" "}
              <span className="font-mono text-sm font-medium tracking-wide">{SWIFT}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <WesternUnionMark className="h-8 w-auto max-w-[11rem] shrink-0" />
            <p className="min-w-0 text-sm font-semibold leading-snug text-black/90">{t("checkout.westernUnion")}</p>
          </div>
          <div className="mt-3 space-y-2.5 text-sm text-black/90">
            <p>
              <span className="text-black/50">{t("bankTransfer.name")}</span> {ACCOUNT_NAME}
            </p>
            <p>
              <span className="text-black/50">{t("bankTransfer.recipientLocation")}</span> {WU_LOCATION}
            </p>
          </div>
        </div>

        {orderHash && (
          <p className="mt-5 text-sm text-black/75">
            {t("bankTransfer.useReference", { ref: orderHash })}
          </p>
        )}

        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45">{t("bankTransfer.afterPayment")}</p>
          <p className="mt-2 text-sm text-black/70">{t("bankTransfer.sendReceipt")}</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sami-btn-dark mt-4 flex w-full items-center justify-center rounded-full px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.12em]"
          >
            {t("bankTransfer.sendViaWhatsApp")}
          </a>
          <p className="mt-4 text-center text-sm text-black/65">
            {t("bankTransfer.orEmail")}{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-black underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-[var(--color-muted)]">
          {t("bankTransfer.confirmNote")}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-black/45">
          <Link href="/account?tab=orders" className="underline underline-offset-2 hover:text-black/70">
            {t("bankTransfer.myOrders")}
          </Link>
          <Link href="/products" className="underline underline-offset-2 hover:text-black/70">
            {t("bankTransfer.continueShopping")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function BankTransferFallback() {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-sm text-[var(--color-muted)]">
        Loading…
      </div>
    </section>
  );
}

export default function BankTransferPage() {
  return (
    <Suspense fallback={<BankTransferFallback />}>
      <BankTransferInner />
    </Suspense>
  );
}
