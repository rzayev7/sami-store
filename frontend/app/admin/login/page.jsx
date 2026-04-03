"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../../lib/api";
import { checkAdminAuth } from "../../../lib/adminAuth";
import { t } from "../../../lib/admin-i18n";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirect =
    redirectParam && redirectParam.startsWith("/admin")
      ? redirectParam
      : "/admin/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    if (checkAdminAuth()) {
      router.replace(redirect);
    } else {
      setChecking(false);
    }
  }, [router, redirect]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      setIsLoading(true);

      const { data } = await api.post("/api/admin/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", data.token);
      router.replace(redirect);
    } catch {
      setErrorMessage(t.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) return null;

  return (
    <section className="flex min-h-[70vh] w-full items-center justify-center py-12 sm:py-16">
      <div className="sami-section w-full max-w-md p-6 sm:p-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-black/60">
          {t.samiAdmin}
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold tracking-wide">
          {t.login}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs uppercase tracking-[0.14em] text-black/70"
            >
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="sami-input"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs uppercase tracking-[0.14em] text-black/70"
            >
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="sami-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="sami-btn-dark w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t.signingIn : t.loginButton}
          </button>

          {errorMessage && (
            <p className="text-center text-sm text-red-600">{errorMessage}</p>
          )}
        </form>
      </div>
    </section>
  );
}
