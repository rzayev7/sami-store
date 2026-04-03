"use client";

import { t } from "../../../lib/admin-i18n";

export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <h1 className="sami-title">{t.settings}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t.configureStore}
        </p>
      </div>
      <div className="sami-section p-5 text-sm text-black/70">
        {t.settingsPlaceholder}
      </div>
    </section>
  );
}
