"use client";

import Image from "next/image";

interface Props {
  proofUrl: string | null;
  onClose: () => void;
}

export default function PaymentProofModal({ proofUrl, onClose }: Props) {
  if (!proofUrl) return null;

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="إثبات التحويل"
    >
      <div
        className="admin-proof-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-proof-modal-header">
          <div>
            <h3 className="admin-proof-modal-title">إثبات التحويل (Payment Proof)</h3>
            <p className="admin-proof-modal-sub">صورة إيصال التحويل البنكي أو المحفظة الإلكترونية</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-modal-close"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="admin-proof-modal-body">
          <div className="admin-proof-image-wrap">
            <Image
              src={proofUrl}
              alt="إثبات التحويل"
              fill
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div>
        </div>

        <div className="admin-proof-modal-footer">
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline admin-proof-link-btn"
          >
            فتح الصورة الأصلية ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-pill-white admin-proof-close-btn"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
