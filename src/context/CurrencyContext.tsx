"use client";

import React, { createContext, useContext, type ReactNode } from "react";

export type CurrencyCode = "EGP";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromUSD: number;
  prefix: boolean;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EGP: { code: "EGP", symbol: " ج.م", name: "EGP — الجنيه المصري", rateFromUSD: 1.0, prefix: false },
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amount?: number) => string;
  config: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency: CurrencyCode = "EGP";
  const config = CURRENCIES.EGP;

  // Format price directly in Egyptian Pounds (all stored prices are native EGP)
  const formatPrice = (amount?: number): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "—";
    }
    return `${Math.round(amount).toLocaleString("ar-EG")} ج.م`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: () => {}, formatPrice, config }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "EGP",
      setCurrency: () => {},
      formatPrice: (amt) => (amt !== undefined ? `${Math.round(amt).toLocaleString("ar-EG")} ج.م` : "—"),
      config: CURRENCIES.EGP,
    };
  }
  return ctx;
}
