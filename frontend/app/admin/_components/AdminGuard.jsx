"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAdminAuth } from "../../../lib/adminAuth";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(() => checkAdminAuth()); // ✅ check immediately

  useEffect(() => {
    if (!checkAdminAuth()) {
      router.replace(
        `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    setIsAuthorized(true);

    const interval = setInterval(() => {
      if (!checkAdminAuth()) {
        router.replace(
          `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return children;
}