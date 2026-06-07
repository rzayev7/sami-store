"use client";

import { useEffect, useRef, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage, stripLocale, useLocalePath } from "../context/LanguageContext";
import api from "../lib/api";

// Set this to match the coupon code you create in the admin panel.
const WELCOME_COUPON_CODE =
  process.env.NEXT_PUBLIC_WELCOME_COUPON_CODE || "WELCOME10";

const STORAGE_KEY = "sami_lead_capture_v1";
const DELAY_MS = 9_000;
const SCROLL_THRESHOLD = 0.25;

// Cloudinary portrait image with face-aware crop for the modal photo panel.
const MODEL_IMAGE_URL =
  "https://res.cloudinary.com/dft6gmqtn/image/upload/w_600,h_800,c_fill,g_face,q_auto,f_auto/products/q4yp2aq2v21ieyathjqy.jpg";

function isLeadDone() {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

function markLeadDone() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

export default function LeadCapture() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useLanguage();
  const localePath = useLocalePath();
  const cleanPath = stripLocale(pathname);

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const timerRef = useRef(null);
  const triggeredRef = useRef(false);

  const shouldSkip =
    cleanPath.startsWith("/admin") ||
    cleanPath.startsWith("/checkout") ||
    cleanPath.startsWith("/order-success") ||
    cleanPath.startsWith("/payment");

  const trigger = () => {
    if (triggeredRef.current) return;
    if (isLeadDone()) return;
    triggeredRef.current = true;
    setVisible(true);
  };

  useEffect(() => {
    if (shouldSkip || dismissed) return;
    if (isLeadDone()) return;

    timerRef.current = setTimeout(trigger, DELAY_MS);

    const handleScroll = () => {
      const scrolled =
        window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      if (scrolled >= SCROLL_THRESHOLD) trigger();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [shouldSkip, dismissed]);

  // Lock body scroll while open.
  useEffect(() => {
    if (visible && !dismissed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible, dismissed]);

  const handleDismiss = () => {
    markLeadDone();
    setDismissed(true);
    setVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim();
    const trimmedWa = whatsapp.trim();

    if (!trimmedEmail && !trimmedWa) {
      setErrorMsg(t("leadCapture.emailPlaceholder"));
      return;
    }

    setStatus("submitting");
    try {
      await api.post("/api/leads", {
        email: trimmedEmail,
        whatsapp: trimmedWa,
        website: honeypot,
        source: "popup",
        language,
        page: cleanPath,
      });
      setStatus("success");
      markLeadDone();
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (!visible || dismissed) return null;

  const isRtl = language === "ar";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px] animate-lead-backdrop"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("leadCapture.headline")}
        dir={isRtl ? "rtl" : "ltr"}
        className="fixed inset-0 z-[71] flex items-center justify-center p-4"
      >
        <div className="relative flex w-full max-w-[640px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] animate-lead-modal">

          {/* ── Left: model photo ── */}
          <div className="relative hidden w-[42%] shrink-0 sm:block">
            <img
              src={MODEL_IMAGE_URL}
              alt="SAMÍ womenswear"
              className="h-full w-full object-cover"
              loading="eager"
              draggable={false}
            />
            {/* Subtle gradient overlay so text would be legible if ever placed here */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          </div>

          {/* ── Right: form ── */}
          <div className="flex flex-1 flex-col justify-center px-7 py-8 sm:px-8">

            {status === "success" ? (
              <div className="text-center">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-green)]/15">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--color-green)]" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <p className="text-[18px] font-semibold tracking-[0.01em]">
                  {t("leadCapture.successTitle")}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-black/50">
                  {t("leadCapture.successBody")}
                </p>

                {/* Coupon code pill */}
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-[var(--color-gold)]/50 bg-[var(--color-sand)]/60 px-4 py-3">
                  <span className="font-mono text-[18px] font-bold tracking-[0.12em] text-black">
                    {WELCOME_COUPON_CODE}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(WELCOME_COUPON_CODE).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--color-black)] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-75"
                  >
                    {copied ? (
                      <><Check size={11} strokeWidth={2.5} /> {t("leadCapture.successCopied")}</>
                    ) : (
                      <><Copy size={11} strokeWidth={2} /> {t("leadCapture.successCopy")}</>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    router.push(localePath("/products"));
                  }}
                  className="mt-4 w-full rounded-full bg-[var(--color-black)] py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-80"
                >
                  {t("leadCapture.successCta")}
                </button>
              </div>
            ) : (
              <>
                {/* Brand mark */}
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/30">
                  SAMÍ
                </p>

                <h2 className="text-[20px] font-semibold leading-snug tracking-[0.01em] text-black sm:text-[22px]">
                  {t("leadCapture.headline")}
                </h2>

                <p className="mt-2 text-[12px] leading-relaxed text-black/50">
                  {t("leadCapture.body")}
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
                  {/* Honeypot — hidden from users, bots often fill this */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
                  />

                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("leadCapture.emailPlaceholder")}
                    className="w-full rounded-full border border-black/[0.14] bg-[#f6f4f0] px-4 py-3 text-[13px] placeholder-black/35 outline-none transition-colors focus:border-black/30 focus:bg-white"
                  />

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-black/[0.08]" />
                    <span className="text-[10px] uppercase tracking-[0.1em] text-black/30">
                      {t("leadCapture.orDivider")}
                    </span>
                    <div className="h-px flex-1 bg-black/[0.08]" />
                  </div>

                  <input
                    type="tel"
                    name="whatsapp"
                    autoComplete="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder={t("leadCapture.whatsappPlaceholder")}
                    className="w-full rounded-full border border-black/[0.14] bg-[#f6f4f0] px-4 py-3 text-[13px] placeholder-black/35 outline-none transition-colors focus:border-black/30 focus:bg-white"
                  />

                  {errorMsg && (
                    <p className="ps-1 text-[11px] text-red-500">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full rounded-full bg-[var(--color-black)] py-3.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    {status === "submitting"
                      ? t("leadCapture.submitting")
                      : t("leadCapture.submitButton")}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="mt-3 block w-full text-center text-[10.5px] text-black/28 transition-colors hover:text-black/50"
                >
                  {t("leadCapture.dismiss")}
                </button>
              </>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute end-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-black/40 shadow-sm backdrop-blur-sm transition-colors hover:text-black/80"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
}
