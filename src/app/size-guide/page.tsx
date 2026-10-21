import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Size & Fit Guide",
  description: "Accurate garment measurements and fit advice for all Triple Z collections.",
};

export default function SizeGuidePage() {
  return (
    <div className="page-padding">
      <div className="site-container" style={{ maxWidth: "860px" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
            <span className="mockup-gold-dash" />
            <span>AUTHENTIC MEASUREMENTS</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "clamp(1.85rem, 6vw, 3.8rem)", wordBreak: "break-word" }}>
            SIZE & FIT GUIDE
          </h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "1rem", marginTop: "1rem", maxWidth: "600px", marginInline: "auto" }}>
            Every Triple Z garment is developed with custom streetwear proportions. Use the tables below to choose your ideal fit.
          </p>
        </div>

        {/* Tops Chart */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.35rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}>
            HOODIES & TEES (CM)
          </h2>
          {/* Desktop Table View */}
          <div className="tz-table-wrap">
            <table className="tz-size-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>CHEST (CM)</th>
                  <th>LENGTH (CM)</th>
                  <th>SHOULDER (CM)</th>
                  <th>RECOMMENDED HEIGHT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="tz-size-col-bold">S</td>
                  <td>116</td>
                  <td>70</td>
                  <td>58</td>
                  <td>165 – 173 cm</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">M</td>
                  <td>122</td>
                  <td>72</td>
                  <td>60</td>
                  <td>172 – 180 cm</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">L</td>
                  <td>128</td>
                  <td>74</td>
                  <td>62</td>
                  <td>178 – 186 cm</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">XL</td>
                  <td>134</td>
                  <td>76</td>
                  <td>64</td>
                  <td>184 – 192 cm</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">XXL</td>
                  <td>140</td>
                  <td>78</td>
                  <td>66</td>
                  <td>190+ cm</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="tz-size-cards-mobile">
            {[
              { size: "S", chest: 116, length: 70, shoulder: 58, height: "165 – 173 cm" },
              { size: "M", chest: 122, length: 72, shoulder: 60, height: "172 – 180 cm" },
              { size: "L", chest: 128, length: 74, shoulder: 62, height: "178 – 186 cm" },
              { size: "XL", chest: 134, length: 76, shoulder: 64, height: "184 – 192 cm" },
              { size: "XXL", chest: 140, length: 78, shoulder: 66, height: "190+ cm" },
            ].map((s) => (
              <div key={s.size} className="tz-size-card">
                <div className="tz-size-card-header">
                  <span className="tz-size-card-badge">SIZE {s.size}</span>
                  <span className="tz-size-card-highlight">Height: {s.height}</span>
                </div>
                <div className="tz-size-card-grid">
                  <div className="tz-size-card-stat">
                    <span>Chest</span>
                    <span>{s.chest} cm</span>
                  </div>
                  <div className="tz-size-card-stat">
                    <span>Length</span>
                    <span>{s.length} cm</span>
                  </div>
                  <div className="tz-size-card-stat">
                    <span>Shoulder</span>
                    <span>{s.shoulder} cm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Outerwear Chart */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.35rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}>
            STADIUM TRACK JACKETS (CM)
          </h2>
          {/* Desktop Table View */}
          <div className="tz-table-wrap">
            <table className="tz-size-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>CHEST (CM)</th>
                  <th>LENGTH (CM)</th>
                  <th>SLEEVE (CM)</th>
                  <th>FIT PROFILE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="tz-size-col-bold">S</td>
                  <td>118</td>
                  <td>68</td>
                  <td>64</td>
                  <td>Regular Streetwear</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">M</td>
                  <td>124</td>
                  <td>70</td>
                  <td>65.5</td>
                  <td>Relaxed Pitch Fit</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">L</td>
                  <td>130</td>
                  <td>72</td>
                  <td>67</td>
                  <td>Boxy Dropped Shoulder</td>
                </tr>
                <tr>
                  <td className="tz-size-col-bold">XL</td>
                  <td>136</td>
                  <td>74</td>
                  <td>68.5</td>
                  <td>Oversized Layering</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="tz-size-cards-mobile">
            {[
              { size: "S", chest: 118, length: 68, sleeve: 64, profile: "Regular Streetwear" },
              { size: "M", chest: 124, length: 70, sleeve: 65.5, profile: "Relaxed Pitch Fit" },
              { size: "L", chest: 130, length: 72, sleeve: 67, profile: "Boxy Dropped Shoulder" },
              { size: "XL", chest: 136, length: 74, sleeve: 68.5, profile: "Oversized Layering" },
            ].map((s) => (
              <div key={s.size} className="tz-size-card">
                <div className="tz-size-card-header">
                  <span className="tz-size-card-badge">SIZE {s.size}</span>
                  <span className="tz-size-card-highlight">{s.profile}</span>
                </div>
                <div className="tz-size-card-grid">
                  <div className="tz-size-card-stat">
                    <span>Chest</span>
                    <span>{s.chest} cm</span>
                  </div>
                  <div className="tz-size-card-stat">
                    <span>Length</span>
                    <span>{s.length} cm</span>
                  </div>
                  <div className="tz-size-card-stat">
                    <span>Sleeve</span>
                    <span>{s.sleeve} cm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fit Philosophy */}
        <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-lg)", padding: "2.5rem", marginBottom: "4rem" }}>
          <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            THE TRIPLE Z SILHOUETTE
          </h3>
          <p style={{ color: "var(--clr-text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            Our garments are engineered with custom 500gsm heavyweight fleece and drop-shoulder patterns. This provides a structural silhouette that maintains its architectural shape whether worn zipped, relaxed, or layered over pitch essentials.
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/shop" className="btn btn-pill-white">
              SHOP ALL PIECES →
            </Link>
            <Link href="/contact" className="btn btn-pill-outline">
              CONTACT STYLING SUPPORT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
