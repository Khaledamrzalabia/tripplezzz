"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    if (newPassword.length < 12) {
      setErrorMsg("كلمة المرور الجديدة يجب أن تكون 12 حرفاً على الأقل.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("كلمة المرور الجديدة وتأكيدها غير متطابقين.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || "تم تغيير كلمة المرور بنجاح!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          handleClose();
        }, 2200);
      } else {
        setErrorMsg(data.error || "فشل تغيير كلمة المرور. تأكد من صحة البيانات.");
      }
    } catch (err) {
      console.error("Change password request error:", err);
      setErrorMsg("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="تغيير كلمة المرور"
    >
      <div
        className="admin-modal-box"
        style={{ maxWidth: "480px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div>
            <h3 className="admin-modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🔑</span>
              <span>تغيير كلمة المرور</span>
            </h3>
            <p className="admin-modal-subtitle" style={{ marginTop: "0.3rem" }}>
              يمكنك استخدام الباسورد الحالي أو باسورد الماستر (Master) لتعيين باسورد جديد.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="admin-modal-close-btn"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="admin-alert-banner error" style={{ margin: "1rem 1.5rem 0" }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="admin-alert-banner success" style={{ margin: "1rem 1.5rem 0" }}>
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form" style={{ padding: "1.5rem" }}>
          {/* Current / Master Password */}
          <div className="admin-form-group">
            <label className="admin-form-label">
              كلمة المرور الحالية أو الماستر (Current / Master)
            </label>
            <div className="admin-password-input-wrap">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية أو الماستر"
                className="admin-form-input"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="admin-password-toggle-btn"
                aria-label="إظهار أو إخفاء كلمة المرور"
              >
                {showCurrent ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="admin-form-group">
            <label className="admin-form-label">كلمة المرور الجديدة (New Password)</label>
            <div className="admin-password-input-wrap">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (12 حرفاً على الأقل)"
                className="admin-form-input"
                required
                minLength={12}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="admin-password-toggle-btn"
                aria-label="إظهار أو إخفاء كلمة المرور"
              >
                {showNew ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="admin-form-group">
            <label className="admin-form-label">تأكيد كلمة المرور الجديدة (Confirm)</label>
            <div className="admin-password-input-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                className="admin-form-input"
                required
                minLength={12}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="admin-password-toggle-btn"
                aria-label="إظهار أو إخفاء كلمة المرور"
              >
                {showConfirm ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div className="admin-modal-footer" style={{ marginTop: "1.5rem", padding: "0" }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn btn-outline"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ minWidth: "140px" }}
            >
              {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
