"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../lib/api";
import { getCustomerAuthHeaders } from "../lib/customerAuth";
import { productToItem } from "../lib/gtag";
import { trackTikTokAddToWishlist } from "../lib/tiktok-pixel";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState([]); // populated product objects

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const { data } = await api.get("/api/customers/wishlist", {
        headers: getCustomerAuthHeaders(),
      });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      /* silently fail */
    }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isWishlisted = useCallback(
    (productId) => items.some((p) => String(p._id) === String(productId)),
    [items]
  );

  const toggle = useCallback(
    async (productId) => {
      if (!user) { openAuthModal(); return; }
      const prevHad = items.some((p) => String(p._id) === String(productId));
      try {
        const { data } = await api.post(
          "/api/customers/wishlist",
          { productId },
          { headers: getCustomerAuthHeaders() }
        );
        const nextList = Array.isArray(data) ? data : [];
        setItems(nextList);
        if (!prevHad) {
          const added = nextList.find((p) => String(p._id) === String(productId));
          if (added) {
            trackTikTokAddToWishlist(productToItem(added, { quantity: 1 }));
          }
        }
      } catch {
        /* silently fail */
      }
    },
    [user, openAuthModal, items]
  );

  const count = items.length;

  const value = useMemo(
    () => ({ items, count, isWishlisted, toggle, fetchWishlist }),
    [items, count, isWishlisted, toggle, fetchWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
