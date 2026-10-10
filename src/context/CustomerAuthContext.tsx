"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Customer } from "../types/order";

interface CustomerAuthContextType {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    whatsapp?: string;
    governorate?: string;
    city?: string;
    address?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const SESSION_FLAG_KEY = "tz_has_session";

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    // Skip roundtrip HTTP fetch on anonymous visits unless session flag exists or on auth-related pages
    if (typeof window !== "undefined") {
      const hasSession = localStorage.getItem(SESSION_FLAG_KEY) === "1";
      const isAuthPage = window.location.pathname.startsWith("/account") || window.location.pathname.startsWith("/checkout");
      if (!hasSession && !isAuthPage) {
        setLoading(false);
        setCustomer(null);
        return;
      }
    }

    try {
      const res = await fetch("/api/customer/auth");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_FLAG_KEY, "1");
          }
        } else {
          setCustomer(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_FLAG_KEY);
          }
        }
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "خطأ في تسجيل الدخول" };
      }
      setCustomer(data.customer);
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_FLAG_KEY, "1");
      }
      return { success: true };
    } catch {
      return { success: false, error: "فشل الاتصال بالخادم" };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", ...formData }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "خطأ في إنشاء الحساب" };
      }
      setCustomer(data.customer);
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_FLAG_KEY, "1");
      }
      return { success: true };
    } catch {
      return { success: false, error: "فشل الاتصال بالخادم" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setCustomer(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_FLAG_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        login,
        register,
        logout,
        refresh: checkAuth,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
