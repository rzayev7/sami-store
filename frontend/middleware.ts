import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "ar", "az", "fr", "ru"];
const DEFAULT_LOCALE = "en";

function getLocaleFromPath(pathname: string): string | null {
  const first = pathname.split("/")[1];
  return LOCALES.includes(first) ? first : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  const lang =
    saved && LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
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
