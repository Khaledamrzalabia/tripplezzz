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
          <h1 className="section-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
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
        </section>

        {/* Outerwear Chart */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.35rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}>
            STADIUM TRACK JACKETS (CM)
          </h2>
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
