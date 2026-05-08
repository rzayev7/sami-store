"use client";

import { useEffect, useState } from "react";
import { t } from "../../../lib/admin-i18n";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";

export default function ShippingPage() {
  const [shippingFeeUsd, setShippingFeeUsd] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        const { data } = await api.get("/api/store-settings");
        if (!ignore) {
          const value = Number(data?.shippingFeeUsd);
          setShippingFeeUsd(Number.isFinite(value) ? String(value) : "18");
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t.failedLoadSettings);
          setShippingFeeUsd("18");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const parsed = Number(shippingFeeUsd);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setErrorMessage(t.invalidDeliveryFee);
      return;
    }

    try {
      setIsSaving(true);
      const { data } = await api.put(
        "/api/store-settings",
        { shippingFeeUsd: parsed },
        { headers: getAdminAuthHeaders() }
      );
      setShippingFeeUsd(String(Number(data?.shippingFeeUsd ?? parsed)));
      setSuccessMessage(t.settingsSaved);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || t.failedSaveSettings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <h1 className="sami-title">{t.shipping}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t.deliverySettingsHint}
        </p>
      </div>

      <form onSubmit={handleSave} className="sami-section space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black/75">
            {t.deliveryFeeUsd}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={shippingFeeUsd}
            onChange={(event) => setShippingFeeUsd(event.target.value)}
            className="sami-input max-w-xs"
            disabled={isLoading || isSaving}
          />
        </label>

        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="text-sm text-green-600">{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || isSaving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? t.saving : t.saveSettings}
        </button>
      </form>
    </section>
  );
}
