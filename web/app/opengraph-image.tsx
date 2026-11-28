import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "WaterQualityLens — public water system records and official reports.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card. Rendered at build time by Satori — no network, no raster assets.
 * Mirrors the hero's "service boundary over ZIP footprint" idea so the pre-click
 * impression matches the page it opens.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #112232 0%, #1a344b 55%, #1c4a6b 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Engineering grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Contour rings — concentric ellipses standing in for the hero plate */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              right: -160 + i * -18,
              top: 315 - (110 + i * 62),
              width: (110 + i * 62) * 2,
              height: (96 + i * 54) * 2,
              borderRadius: "50%",
              border: `1px solid rgba(124,182,216,${0.4 - i * 0.05})`,
              display: "flex",
            }}
          />
        ))}

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "68px 72px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="46" height="46" viewBox="0 0 28 28" fill="none">
              <circle cx="13" cy="13" r="8.5" stroke="#7cb6d8" strokeWidth="1.7" />
              <path
                d="M13 8.5c1.9 2.2 3 3.9 3 5.4a3 3 0 1 1-6 0c0-1.5 1.1-3.2 3-5.4Z"
                fill="#4fa17f"
              />
              <path
                d="m19.5 19.5 4 4"
                stroke="#7cb6d8"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>
              <span>WaterQuality</span>
              <span style={{ color: "#7cb6d8" }}>Lens</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: "-0.028em",
              }}
            >
              Find public water system records
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 34,
                fontWeight: 600,
                color: "#7cb6d8",
                letterSpacing: "-0.02em",
              }}
            >
              and official water quality reports.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 21,
              color: "#aed3e9",
              borderTop: "1px solid rgba(255,255,255,0.14)",
              paddingTop: 26,
            }}
          >
            <span>EPA SDWIS</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
            <span>Official utility records</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
            <span>NSF/ANSI certified filters</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
