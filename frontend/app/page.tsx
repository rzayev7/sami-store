import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

/** Distinct title in GA4 “Page title” reports (root layout default alone is just “SAMÍ”). */
export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return <HomePageClient />;
}
