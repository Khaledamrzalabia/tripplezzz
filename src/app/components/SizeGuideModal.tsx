"use client";

import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export default function SizeGuideModal({ isOpen, onClose, category = "tops" }: Props) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  interface MeasurementRow {
    size: string;
    chestCm: string;
    chestIn: string;
    lengthCm: string;
    lengthIn: string;
    shoulderCm?: string;
    shoulderIn?: string;
    sleeveCm?: string;
    sleeveIn?: string;
  }

  // Measurement charts
  const topsMeasurements: MeasurementRow[] = [
    { size: "S", chestCm: "116", chestIn: "45.6", lengthCm: "70", lengthIn: "27.5", shoulderCm: "58", shoulderIn: "22.8" },
    { size: "M", chestCm: "122", chestIn: "48.0", lengthCm: "72", lengthIn: "28.3", shoulderCm: "60", shoulderIn: "23.6" },
    { size: "L", chestCm: "128", chestIn: "50.4", lengthCm: "74", lengthIn: "29.1", shoulderCm: "62", shoulderIn: "24.4" },
    { size: "XL", chestCm: "134", chestIn: "52.8", lengthCm: "76", lengthIn: "29.9", shoulderCm: "64", shoulderIn: "25.2" },
    { size: "XXL", chestCm: "140", chestIn: "55.1", lengthCm: "78", lengthIn: "30.7", shoulderCm: "66", shoulderIn: "26.0" },
  ];

  const jacketMeasurements: MeasurementRow[] = [
    { size: "S", chestCm: "118", chestIn: "46.4", lengthCm: "68", lengthIn: "26.7", sleeveCm: "64", sleeveIn: "25.2" },
    { size: "M", chestCm: "124", chestIn: "48.8", lengthCm: "70", lengthIn: "27.5", sleeveCm: "65.5", sleeveIn: "25.8" },
    { size: "L", chestCm: "130", chestIn: "51.2", lengthCm: "72", lengthIn: "28.3", sleeveCm: "67", sleeveIn: "26.4" },
    { size: "XL", chestCm: "136", chestIn: "53.5", lengthCm: "74", lengthIn: "29.1", sleeveCm: "68.5", sleeveIn: "27.0" },
  ];

  const isOuterwear = category === "outerwear";
  const rows = isOuterwear ? jacketMeasurements : topsMeasurements;

  return (
    <div className="tz-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
      <div className="tz-modal tz-size-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tz-modal-header">
          <div>
            <div className="mockup-eyebrow">
              <span className="mockup-gold-dash" />
              <span>SIZE & FIT GUIDE</span>
            </div>
            <h2 id="size-guide-title" className="tz-modal-title">
              {isOuterwear ? "OUTERWEAR MEASUREMENTS" : "HOODIE & TOP MEASUREMENTS"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="tz-modal-close" aria-label="Close size guide">
            ✕
          </button>
        </div>

        <div className="tz-modal-body">
          {/* Unit Toggle & Silhouette Note */}
          <div className="tz-size-top-bar">
            <p className="tz-size-note">
              <strong>FIT NOTE:</strong> Designed with a relaxed, dropped-shoulder streetwear fit. For a standard tailored look, take one size down.
            </p>
            <div className="tz-unit-toggle">
              <button
                type="button"
                className={`tz-unit-btn ${unit === "cm" ? "active" : ""}`}
                onClick={() => setUnit("cm")}
              >
                CM
              </button>
              <button
                type="button"
                className={`tz-unit-btn ${unit === "in" ? "active" : ""}`}
                onClick={() => setUnit("in")}
              >
                INCHES
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="tz-table-wrap">
            <table className="tz-size-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>CHEST ({unit.toUpperCase()})</th>
                  <th>LENGTH ({unit.toUpperCase()})</th>
                  <th>{isOuterwear ? `SLEEVE (${unit.toUpperCase()})` : `SHOULDER (${unit.toUpperCase()})`}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.size}>
                    <td className="tz-size-col-bold">{row.size}</td>
                    <td>{unit === "cm" ? row.chestCm : row.chestIn}</td>
                    <td>{unit === "cm" ? row.lengthCm : row.lengthIn}</td>
                    <td>
                      {isOuterwear
                        ? unit === "cm" ? row.sleeveCm : row.sleeveIn
                        : unit === "cm" ? row.shoulderCm : row.shoulderIn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Measuring Instructions */}
          <div className="tz-measuring-guide">
            <h4 className="tz-measuring-title">HOW TO MEASURE</h4>
            <div className="tz-measuring-grid">
              <div className="tz-measuring-item">
                <span className="tz-measuring-num">1</span>
                <div>
                  <strong>CHEST</strong>
                  <p>Measure across the fullest part of your chest, keeping the tape level under your arms.</p>
                </div>
              </div>
              <div className="tz-measuring-item">
                <span className="tz-measuring-num">2</span>
                <div>
                  <strong>LENGTH</strong>
                  <p>Measure from the highest point of the shoulder down to the bottom hem.</p>
                </div>
              </div>
              <div className="tz-measuring-item">
                <span className="tz-measuring-num">3</span>
                <div>
                  <strong>SHOULDER</strong>
                  <p>Measure across the back from the tip of one shoulder seam to the other.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tz-modal-footer">
          <p className="tz-footer-hint">Need personal sizing assistance? Contact concierge@triple-z.com</p>
          <button type="button" onClick={onClose} className="btn btn-pill-white-sm">
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
