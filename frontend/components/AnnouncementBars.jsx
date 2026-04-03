"use client";

import { usePathname } from "next/navigation";

export default function AnnouncementBars() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="w-full bg-[var(--color-green)] py-2 text-center text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--color-gold-soft)]">
      Complimentary Worldwide Shipping
    </div>
  );
}
