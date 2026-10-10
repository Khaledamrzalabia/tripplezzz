"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";

export type CurrencyCode = "USD" | "EGP" | "EUR" | "SAR" | "AED" | "GBP";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromUSD: number; // exchange rate relative to 1 USD
  prefix: boolean; // whether symbol goes before or after
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", name: "USD — US Dollar", rateFromUSD: 1.0, prefix: true },
  EGP: { code: "EGP", symbol: " EGP", name: "EGP — Egyptian Pound", rateFromUSD: 50.0, prefix: false },
  EUR: { code: "EUR", symbol: "€", name: "EUR — Euro", rateFromUSD: 0.92, prefix: true },
  SAR: { code: "SAR", symbol: " SAR", name: "SAR — Saudi Riyal", rateFromUSD: 3.75, prefix: false },
  AED: { code: "AED", symbol: " AED", name: "AED — UAE Dirham", rateFromUSD: 3.67, prefix: false },
  GBP: { code: "GBP", symbol: "£", name: "GBP — British Pound", rateFromUSD: 0.79, prefix: true },
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInUSD?: number) => string;
  config: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "tz_currency_v1";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
        if (stored && CURRENCIES[stored]) {
          return stored;
        }
      } catch {
        // ignore
      }
    }
    return "USD";
  });

  const setCurrency = (code: CurrencyCode) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  };

  const config = CURRENCIES[currency] || CURRENCIES.USD;

  const formatPrice = (amountInUSD?: number): string => {
    if (amountInUSD === undefined || amountInUSD === null || isNaN(amountInUSD)) {
      return "—";
    }
    const converted = amountInUSD * config.rateFromUSD;
    // Format nicely without decimal if whole or rounded
    const formatted = config.rateFromUSD > 10 
      ? Math.round(converted).toLocaleString() 
      : converted.toFixed(2);

    return config.prefix ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, config }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // fallback if used outside provider
    return {
      currency: "USD",
      setCurrency: () => {},
      formatPrice: (amt) => (amt !== undefined ? `$${amt}` : "—"),
      config: CURRENCIES.USD,
    };
  }
  return ctx;
}
