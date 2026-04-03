"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCallback } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "sami_cart_items";

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [hasHydratedCart, setHasHydratedCart] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!storedCart) {
        setHasHydratedCart(true);
        return;
      }

      const parsed = JSON.parse(storedCart);
      if (Array.isArray(parsed)) {
        setCartItems(parsed);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    } finally {
      setHasHydratedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedCart) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems, hasHydratedCart]);

  const addToCart = (product, size, color = "", options = {}) => {
    if (!product?._id) return;
    if (Number(product.stock || 0) <= 0) return;
    setIsCartOpen(true);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product._id &&
          item.size === size &&
          (item.color || "") === (color || "") &&
          (item.bundle || "") === (options.bundle || "")
      );

      if (existingIndex >= 0) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      const hasDiscount =
        product.discountPriceUSD != null &&
        Number(product.discountPriceUSD) > 0 &&
        Number(product.discountPriceUSD) < Number(product.priceUSD);

      return [
        ...prev,
        {
          productId: product._id,
          code: product.code || "",
          name: product.name,
          priceUSD: hasDiscount ? product.discountPriceUSD : product.priceUSD,
          originalPriceUSD: product.priceUSD,
          image: product.images?.[0] || "",
          size: size || "",
          color: color || "",
          bundle: options.bundle || "",
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId, size, color = "", bundle = "") => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.size === size &&
            (item.color || "") === (color || "") &&
            (item.bundle || "") === (bundle || "")
          )
      )
    );
  };

  const updateQuantity = (productId, size, quantity, color = "", bundle = "") => {
    const nextQuantity = Number(quantity);

    if (!Number.isFinite(nextQuantity)) return;
    if (nextQuantity <= 0) {
      removeFromCart(productId, size, color, bundle);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        item.size === size &&
        (item.color || "") === (color || "") &&
        (item.bundle || "") === (bundle || "")
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
