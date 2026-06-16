"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  getOrCreateTikTokAnonymousExternalId,
  identifyTikTokFromRaw,
  TIKTOK_PIXEL_ID,
} from "../lib/tiktok-pixel";

function isAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return true;
  return /^\/(en|az|ar|ru|uz|fr)\/admin(\/|$)/.test(pathname);
}

type IdentifyUser = {
  _id?: string;
  email?: string;
  phone?: string;
};

/** Sends hashed `ttq.identify` for logged-in customers; guests get a stable hashed anonymous `external_id`. */
export default function TikTokAuthIdentify() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!TIKTOK_PIXEL_ID || isAdminPath(pathname)) return;
    if (!user) {
      const anon = getOrCreateTikTokAnonymousExternalId();
      const key = `anon:${anon}`;
      if (lastKey.current !== key) {
        lastKey.current = key;
        void identifyTikTokFromRaw({});
      }
      return;
    }

    const u = user as IdentifyUser;
    const key = `${u._id ?? ""}|${u.email ?? ""}|${u.phone ?? ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    void identifyTikTokFromRaw({
      email: u.email,
      phone: u.phone,
      externalId: u._id != null ? String(u._id) : undefined,
    });
  }, [pathname, user]);

  return null;
}
