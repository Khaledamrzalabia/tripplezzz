"use client";

import { useState } from "react";
import Image from "next/image";
import { useSiteMedia } from "../../../context/SiteMediaContext";

interface Props {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: Props) {
  const { logo } = useSiteMedia();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة.");
      }
    } catch {
      setError("فشل الاتصال بالخادم، يرجى إعادة المحاولة.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        {/* Brand Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo-wrap">
            <Image
              src={logo}
              alt="Triple Z"
              width={140}
              height={46}
              style={{ height: 38, width: "auto", objectFit: "contain" }}
              priority
            />
          </div>

          <div className="admin-login-badge">
            <span className="admin-login-dot" />
            <span>STUDIO SECURITY GATE</span>
          </div>

          <h1 className="admin-login-title">لوحة تحكم الأدمن</h1>
          <p className="admin-login-subtitle">
            إدارة الطلبات، متابعة العملاء، وتحديث المخزون من هاتفك
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-username" className="admin-login-label">
              اسم المستخدم (Username)
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              required
              autoComplete="username"
              className="admin-login-input"
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password" className="admin-login-label">
              كلمة المرور (Password)
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="admin-login-input"
            />
          </div>

          {error && (
            <div className="admin-login-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary admin-login-btn"
          >
            {submitting ? "جاري الدخول..." : "دخول الاستوديو (Sign In) →"}
          </button>
        </form>

        <div className="admin-login-footer">
          <span>Triple Z Studios • Cairo, EG</span>
        </div>
      </div>
    </div>
  );
}
