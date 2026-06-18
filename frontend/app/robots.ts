import type { MetadataRoute } from "next";

const SITE_URL = "https://wearsamiofficial.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / transactional routes out of the index (incl. locale-prefixed variants).
        disallow: [
          "/admin",
          "/account",
          "/checkout",
          "/order-success",
          "/payment",
          "/api/",
          "/*/admin",
          "/*/account",
          "/*/checkout",
          "/*/order-success",
          "/*/payment",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
