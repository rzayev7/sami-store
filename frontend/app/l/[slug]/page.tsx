import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { inferDefaultLocaleFromSignals } from "../../../lib/localeInference";

const LOCALES = new Set(["en", "ar", "ru", "uz", "fr"]);

const SLUG_UTM: Record<string, { utm_source: string; utm_medium: string; utm_campaign: string }> = {
  instagram: { utm_source: "instagram", utm_medium: "social", utm_campaign: "instagram_bio" },
  ig: { utm_source: "instagram", utm_medium: "social", utm_campaign: "instagram_bio" },
  tiktok: { utm_source: "tiktok", utm_medium: "social", utm_campaign: "tiktok_bio" },
  tt: { utm_source: "tiktok", utm_medium: "social", utm_campaign: "tiktok_bio" },
};

function mergeUtms(slugRaw: string, incoming: URLSearchParams): URLSearchParams {
  const slug = String(slugRaw || "")
    .toLowerCase()
    .trim();
  const out = new URLSearchParams(incoming.toString());
  const defaults = SLUG_UTM[slug];
  if (defaults) {
    for (const [k, v] of Object.entries(defaults)) {
      if (v && !out.has(k)) out.set(k, v);
    }
    return out;
  }
  if (slug) {
    if (!out.has("utm_source")) out.set("utm_source", slug);
    if (!out.has("utm_medium")) out.set("utm_medium", "social");
  }
  return out;
}

function toURLSearchParams(
  resolved: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const u = new URLSearchParams();
  for (const [key, val] of Object.entries(resolved)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) for (const v of val) u.append(key, String(v));
    else u.set(key, String(val));
  }
  return u;
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SocialLandingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolved = await searchParams;
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("sami_lang")?.value;

  const h = await headers();
  const countryCode =
    h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || h.get("cloudfront-viewer-country") || "";
  const inferred = inferDefaultLocaleFromSignals({
    countryCode,
    acceptLanguage: h.get("accept-language"),
  });
  const locale = fromCookie && LOCALES.has(fromCookie) ? fromCookie : inferred;

  const merged = mergeUtms(slug, toURLSearchParams(resolved));
  const q = merged.toString();
  redirect(q ? `/${locale}?${q}` : `/${locale}`);
}
