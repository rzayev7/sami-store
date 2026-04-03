"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import {
  getCustomerToken,
  setCustomerToken,
  clearCustomerToken,
} from "../lib/customerAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    const token = getCustomerToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/api/customers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
    } catch {
      clearCustomerToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/customers/login", { email, password });
    setCustomerToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post("/api/customers/signup", { name, email, password });
    setCustomerToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearCustomerToken();
    setUser(null);
  }, []);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const requireAuth = useCallback(() => {
    if (user) return true;
    setAuthModalOpen(true);
    return false;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      fetchUser,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
      requireAuth,
    }),
    [user, loading, login, signup, logout, fetchUser, authModalOpen, openAuthModal, closeAuthModal, requireAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
