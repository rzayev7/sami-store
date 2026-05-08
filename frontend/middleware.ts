import { NextRequest, NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";

const LOCALES = ["en", "ar", "ru", "uz"];
const LEGACY_LOCALES = ["az", "fr", "tr", "kk"];
const DEFAULT_LOCALE = "en";
const BLOCKED_COUNTRY_CODES = new Set(["AZ"]);
const ACCESS_RESTRICTED_PATH = "/access-restricted";

type CountryHeaderSource =
  | "cf-ipcountry"
  | "x-vercel-ip-country"
  | "cloudfront-viewer-country"
  | "x-country-code"
  | "request.geo";

function getLocaleFromPath(pathname: string): string | null {
  const first = pathname.split("/")[1];
  return LOCALES.includes(first) ? first : null;
}

function normalizeCountryCode(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
}

function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "";

  return "";
}

function getBypassIpAllowlist(): Set<string> {
  // Comma-separated exact IP list, e.g.
  // COUNTRY_BLOCK_BYPASS_IPS=203.0.113.10,198.51.100.25
  const raw = String(process.env.COUNTRY_BLOCK_BYPASS_IPS || "");
  const values = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return new Set(values);
}

function isBypassIp(request: NextRequest): boolean {
  const clientIp = getClientIp(request);
  if (!clientIp) return false;
  return getBypassIpAllowlist().has(clientIp);
}

function isAccessRestrictedPath(pathname: string): boolean {
  if (pathname === ACCESS_RESTRICTED_PATH) return true;
  return LOCALES.some((locale) => pathname === `/${locale}${ACCESS_RESTRICTED_PATH}`);
}

function getCountryFromTrustedHeaders(
  request: NextRequest,
): { countryCode: string; source: CountryHeaderSource | "none" } {
  // Priority order:
  // 1) @vercel/functions geolocation() — official Vercel API for Next.js 15/16 (request.geo removed)
  // 2) Cloudflare: cf-ipcountry
  // 3) Vercel header fallback: x-vercel-ip-country
  // 4) AWS CloudFront: cloudfront-viewer-country
  // 5) Optional custom edge header: x-country-code
  const vercelGeo = geolocation(request);
  if (vercelGeo?.country) {
    return { countryCode: normalizeCountryCode(vercelGeo.country), source: "x-vercel-ip-country" };
  }

  const candidates: Array<{ source: CountryHeaderSource; value: string | null }> = [
    { source: "cf-ipcountry", value: request.headers.get("cf-ipcountry") },
    { source: "x-vercel-ip-country", value: request.headers.get("x-vercel-ip-country") },
    { source: "cloudfront-viewer-country", value: request.headers.get("cloudfront-viewer-country") },
    { source: "x-country-code", value: request.headers.get("x-country-code") },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCountryCode(candidate.value);
    if (normalized) return { countryCode: normalized, source: candidate.source };
  }

  return { countryCode: "", source: "none" };
}

function shouldBlockRequest(countryCode: string): boolean {
  return BLOCKED_COUNTRY_CODES.has(countryCode);
}

function buildBlockedResponse(request: NextRequest) {
  // Rewrite (not redirect) so the visitor's URL stays unchanged.
  // They see the coming soon page but the address bar shows the page they requested.
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = ACCESS_RESTRICTED_PATH;
  rewriteUrl.search = "";
  return NextResponse.rewrite(rewriteUrl, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];
  const { countryCode, source } = getCountryFromTrustedHeaders(request);
  const clientIp = getClientIp(request);
  const bypassedByIp = isBypassIp(request);

  // Country block check is done before locale/admin logic for full-site protection.
  // Access-restricted page itself is allowlisted to avoid redirect loops.
  if (!isAccessRestrictedPath(pathname) && shouldBlockRequest(countryCode) && !bypassedByIp) {
    console.warn(
      JSON.stringify({
        event: "country_access_blocked",
        countryCode,
        source,
        method: request.method,
        pathname,
        ip: clientIp || "unknown",
        ua: request.headers.get("user-agent") || "unknown",
        at: new Date().toISOString(),
      }),
    );
    return buildBlockedResponse(request);
  }

  if (shouldBlockRequest(countryCode) && bypassedByIp) {
    console.info(
      JSON.stringify({
        event: "country_access_bypassed_by_ip_allowlist",
        countryCode,
        source,
        method: request.method,
        pathname,
        ip: clientIp || "unknown",
        ua: request.headers.get("user-agent") || "unknown",
        at: new Date().toISOString(),
      }),
    );
  }

  // --- Admin routes are intentionally NOT localized ---
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // --- Legacy locale cleanup (removed language prefixes) ---
  if (LEGACY_LOCALES.includes(firstSegment)) {
    const stripped = "/" + pathname.split("/").slice(2).join("/");
    const normalizedPath = stripped === "/" ? "" : stripped;
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${normalizedPath}`;
    return NextResponse.redirect(url);
  }

  // --- Locale routing ---
  const locale = getLocaleFromPath(pathname);

  if (locale) {
    const stripped = "/" + pathname.split("/").slice(2).join("/") || "/";

    if (stripped.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = stripped;
      return NextResponse.redirect(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = stripped;
    const response = NextResponse.rewrite(url);
    response.cookies.set("sami_lang", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const saved = request.cookies.get("sami_lang")?.value;
  const lang = saved && LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/((?!_next|api|favicon\\.ico|.*\\.).*)",
  ],
};
