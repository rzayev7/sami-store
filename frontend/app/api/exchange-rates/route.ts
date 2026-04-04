import { NextResponse } from "next/server";

/** Display currencies (USD is derived; rates from open.er-api are per 1 USD). */
const TARGET_CURRENCIES = ["EUR", "AED", "AZN"];
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const DEFAULT_AZN_PER_USD = 1.7;

let cached: { rates: Record<string, number>; aznPerUsd: number; ts: number } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({
      base: "AZN",
      rates: cached.rates,
      aznPerUsd: cached.aznPerUsd,
    });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Exchange rate API ${res.status}`);

    const data = await res.json();
    if (data.result !== "success" || !data.rates) {
      throw new Error("Invalid API response");
    }

    const rates: Record<string, number> = {};
    for (const code of TARGET_CURRENCIES) {
      if (code !== "AZN" && data.rates[code]) {
        rates[code] = data.rates[code];
      }
    }

    const aznPerUsd = data.rates.AZN || DEFAULT_AZN_PER_USD;

    cached = { rates, aznPerUsd, ts: Date.now() };

    return NextResponse.json({
      base: "AZN",
      rates,
      aznPerUsd,
    });
  } catch (err: unknown) {
    if (cached) {
      return NextResponse.json({
        base: "AZN",
        rates: cached.rates,
        aznPerUsd: cached.aznPerUsd,
      });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch exchange rates", detail: message },
      { status: 502 }
    );
  }
}
