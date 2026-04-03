"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, login, signup } = useAuth();

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
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      resetForm();
      closeAuthModal();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            aria-label="Close"
            onClick={closeAuthModal}
            className="absolute right-5 top-5 rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div className="flex flex-col items-center text-center">
            <h2 className="text-[20px] font-semibold tracking-[0.18em] text-black">
              WELCOME
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              {isLogin
                ? "Sign in to your account"
                : "Create an account to continue"}
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
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your full name"
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
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
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
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder={isLogin ? "Enter your password" : "Min. 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="sami-input !pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-black/30 transition-colors hover:text-black/60"
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
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="auth-confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your password"
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
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-[11px] font-medium text-black/70 underline underline-offset-2 hover:text-black"
              >
                Forgot Password?
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
            {isLoading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>

          {/* Social login */}
          <div className="mt-6">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-black/35">
              <span className="h-px flex-1 bg-[var(--color-line)]" />
              <span>Or login with</span>
              <span className="h-px flex-1 bg-[var(--color-line)]" />
            </div>
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-white transition-colors hover:border-black/40"
              >
                <Image
                  src="/search.png"
                  alt="Google"
                  width={20}
                  height={20}
                />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-white transition-colors hover:border-black/40"
              >
                <Image
                  src="/facebook.png"
                  alt="Facebook"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </div>

          {/* Footer toggle */}
          <p className="mt-6 text-center text-[11px] text-black/60">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-black underline underline-offset-2"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-black underline underline-offset-2"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
