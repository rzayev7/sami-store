import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page not found",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function RegionBlockGhostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
