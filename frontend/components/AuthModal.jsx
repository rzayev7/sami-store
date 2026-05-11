"use client";

import { useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { trackTikTokCompleteRegistration } from "../lib/tiktok-pixel";
import { trackMetaCompleteRegistration } from "../lib/meta-pixel";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, login, signup, loginWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authModalOpen) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) {
      setError("");
      setIsLoading(false);
    }
  }, [authModalOpen]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setRememberMe(false);
    setError("");
  };

  const switchMode = (next) => {
    resetForm();
    setMode(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError(t("auth.passwordsMismatch"));
        return;
      }
      if (password.length < 6) {
        setError(t("auth.passwordTooShort"));
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
        trackTikTokCompleteRegistration();
        trackMetaCompleteRegistration();
      }
      resetForm();
      closeAuthModal();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("auth.genericError"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setIsLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        resetForm();
        closeAuthModal();
      } catch (err) {
        setError(err?.response?.data?.message || t("auth.genericError"));
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError(t("auth.genericError")),
  });

  const isLogin = mode === "login";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4 transition-opacity duration-300 ${
        authModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={closeAuthModal}
      aria-hidden={!authModalOpen}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[420px] overflow-hidden rounded-[32px] bg-white shadow-2xl transition-all duration-300 ${
          authModalOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="relative border-b border-[var(--color-line)] px-8 pb-6 pt-7">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={closeAuthModal}
            className="absolute end-5 top-5 rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div className="flex flex-col items-center text-center">
            <h2 className="text-[20px] font-semibold tracking-[0.18em] text-black">
              {t("auth.welcome")}
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              {isLogin
                ? t("auth.signInSubtitle")
                : t("auth.signUpSubtitle")}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-6 text-[13px]">
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-1 block text-xs font-medium text-black/70"
                >
                  {t("auth.fullName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sami-input"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1 block text-xs font-medium text-black/70"
              >
                {t("auth.email")} <span className="text-red-500">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sami-input"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                className="mb-1 block text-xs font-medium text-black/70"
              >
                {t("auth.password")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder={isLogin ? t("auth.passwordPlaceholderLogin") : t("auth.passwordPlaceholderSignup")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="sami-input !pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-black/30 transition-colors hover:text-black/60"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.6} />
                  ) : (
                    <Eye size={16} strokeWidth={1.6} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password (signup only) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="auth-confirm"
                  className="mb-1 block text-xs font-medium text-black/70"
                >
                  {t("auth.confirmPassword")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="auth-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="sami-input"
                />
              </div>
            )}
          </div>

          {/* Remember + Forgot (login only) */}
          {isLogin && (
            <div className="mt-4 flex items-center justify-between text-[11px] text-black/65">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border border-[var(--color-line)]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t("auth.rememberMe")}</span>
              </label>
              <button
                type="button"
                className="text-[11px] font-medium text-black/70 underline underline-offset-2 hover:text-black"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-center text-[12px] font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t("common.processing") : isLogin ? t("auth.login") : t("auth.signUp")}
          </button>

          {/* Google login — only shown when client ID is configured */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="mt-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--color-line)]" />
                <span className="text-[11px] uppercase tracking-[0.12em] text-black/35">or</span>
                <span className="h-px flex-1 bg-[var(--color-line)]" />
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => triggerGoogleLogin()}
                className="mt-3 flex w-full items-center justify-center gap-3 rounded-full border border-[var(--color-line)] bg-white px-4 py-2.5 text-[12px] font-medium text-black/80 transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Footer toggle */}
          <p className="mt-6 text-center text-[11px] text-black/60">
            {isLogin ? (
              <>
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-black underline underline-offset-2"
                >
                  {t("auth.signUp")}
                </button>
              </>
            ) : (
              <>
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-black underline underline-offset-2"
                >
                  {t("auth.login")}
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
