"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { formatPrice as fmt, detectCurrency, CURRENCIES } from "../lib/currency";

const STORAGE_KEY = "sami_currency";
const DEFAULT_AZN_PER_USD = 1.70;

const CurrencyContext = createContext({
  currency: "USD",
  setCurrency: () => {},
  rates: {},
  aznPerUsd: DEFAULT_AZN_PER_USD,
  formatPrice: () => "",
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState("USD");
  const [rates, setRates] = useState({});
  const [aznPerUsd, setAznPerUsd] = useState(DEFAULT_AZN_PER_USD);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const valid = saved && CURRENCIES.some((c) => c.code === saved);
    if (valid) {
      setCurrencyState(saved);
      return;
    }
    if (saved) localStorage.removeItem(STORAGE_KEY);
    const raw = detectCurrency();
    const detected = CURRENCIES.some((c) => c.code === raw) ? raw : "USD";
    setCurrencyState(detected);
    localStorage.setItem(STORAGE_KEY, detected);
  }, []);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => {
        if (data.rates) setRates(data.rates);
        if (data.aznPerUsd) setAznPerUsd(data.aznPerUsd);
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((code) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const formatPrice = useCallback(
    (amountAZN) => fmt(amountAZN, currency, rates, aznPerUsd),
    [currency, rates, aznPerUsd]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, aznPerUsd, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
