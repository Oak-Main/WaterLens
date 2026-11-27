// -----------------------------------------------------------------------------
// The "Service-Boundary Plate" — the landing page's signature visual.
//
// It is not decoration. It draws the product's central claim in one image: a
// utility service boundary (solid, irregular) laid over the ZIP-code footprint
// (dashed rectangle) it does not agree with, with a single address pinned inside
// and resolved point-in-polygon. Everything is inline SVG on generated geometry —
// no raster assets, no network, no client JS. Motion is CSS-only and is disabled
// under prefers-reduced-motion (see globals.css).
//
// Palette is strictly the clinical ramp (DESIGN.md): brand blues, verdant teal
// for verified/sampled, ink for structure. No alarm colors.
// -----------------------------------------------------------------------------

/** Nested contour rings — one shared noise profile, offset outward. */
const CONTOURS: Array<{ d: string; o: number }> = [
  { d: "M379.1,300.0C379.4,306.6 378.6,313.9 375.9,320.1C373.1,326.2 368.0,332.3 362.5,336.9C357.0,341.5 349.9,345.0 342.8,347.8C335.7,350.5 327.8,352.9 320.0,353.3C312.2,353.7 303.4,352.8 296.0,350.3C288.6,347.9 281.2,343.6 275.4,338.7C269.7,333.8 264.7,327.4 261.7,321.0C258.7,314.5 257.4,307.0 257.2,300.0C257.1,293.0 258.0,285.3 260.9,278.8C263.8,272.2 268.7,265.3 274.6,260.6C280.4,255.8 288.6,252.5 296.2,250.0C303.7,247.5 312.0,245.8 320.0,245.6C328.0,245.4 337.2,246.2 344.3,249.1C351.4,251.9 357.9,257.6 362.8,262.9C367.7,268.1 371.0,274.5 373.7,280.7C376.5,286.9 378.7,293.4 379.1,300.0Z", o: 0.06 },
  { d: "M410.2,300.0C410.8,310.0 409.8,321.3 405.6,330.8C401.4,340.2 393.5,349.4 385.1,356.5C376.6,363.5 365.7,368.8 354.8,373.0C344.0,377.2 332.0,381.1 320.0,381.8C308.0,382.5 294.5,381.1 283.0,377.4C271.6,373.7 260.2,367.0 251.4,359.5C242.6,352.0 234.9,342.2 230.3,332.3C225.6,322.3 223.7,310.8 223.5,300.0C223.3,289.2 224.5,277.4 228.9,267.3C233.3,257.1 240.9,246.5 249.9,239.2C259.0,231.8 271.7,227.0 283.4,223.2C295.0,219.4 307.7,216.6 320.0,216.3C332.3,216.1 346.5,217.1 357.4,221.6C368.4,226.0 378.1,235.0 385.5,243.1C392.9,251.3 397.8,261.1 401.9,270.5C406.0,280.0 409.6,290.0 410.2,300.0Z", o: 0.077 },
  { d: "M441.1,300.0C442.0,313.5 440.7,328.7 435.1,341.4C429.5,354.1 418.9,366.5 407.5,376.0C396.1,385.4 381.4,392.3 366.8,398.0C352.2,403.8 336.1,409.2 320.0,410.3C303.9,411.4 285.5,409.6 270.1,404.6C254.6,399.7 239.2,390.6 227.3,380.5C215.4,370.3 204.9,357.0 198.6,343.6C192.4,330.2 189.9,314.7 189.6,300.0C189.2,285.3 190.7,269.4 196.7,255.7C202.6,241.9 212.7,227.5 225.0,217.6C237.4,207.7 254.7,201.4 270.5,196.3C286.3,191.2 303.3,187.4 320.0,186.9C336.7,186.5 356.0,187.7 370.7,193.8C385.4,199.9 398.3,212.4 408.2,223.5C418.0,234.6 424.2,247.8 429.7,260.6C435.2,273.3 440.2,286.5 441.1,300.0Z", o: 0.094 },
  { d: "M471.7,300.0C472.9,316.9 471.6,336.1 464.6,352.0C457.6,367.9 444.2,383.5 429.8,395.3C415.5,407.1 397.0,415.7 378.7,422.9C360.4,430.2 340.3,437.3 320.0,438.8C299.7,440.3 276.5,438.2 257.0,432.0C237.5,425.8 218.1,414.3 203.0,401.5C188.0,388.7 174.8,372.0 166.8,355.1C158.9,338.1 155.9,318.5 155.5,300.0C155.0,281.5 156.7,261.3 164.1,244.0C171.5,226.6 184.3,208.2 199.9,195.8C215.5,183.3 237.6,175.7 257.6,169.3C277.7,162.9 298.9,158.0 320.0,157.4C341.1,156.8 365.5,158.2 384.0,165.9C402.4,173.7 418.5,189.8 430.7,203.9C442.9,218.0 450.3,234.7 457.1,250.7C464.0,266.7 470.4,283.1 471.7,300.0Z", o: 0.111 },
  { d: "M501.9,300.0C503.5,320.3 502.3,343.4 493.9,362.5C485.6,381.6 469.3,400.4 452.0,414.6C434.8,428.8 412.4,438.8 390.4,447.6C368.4,456.4 344.4,465.3 320.0,467.2C295.6,469.2 267.5,466.9 243.9,459.5C220.3,452.1 196.8,438.2 178.6,422.7C160.4,407.2 144.4,387.0 134.8,366.6C125.3,346.1 121.8,322.4 121.2,300.0C120.6,277.6 122.4,253.2 131.2,232.1C140.1,211.1 155.6,188.7 174.5,173.7C193.4,158.8 220.5,149.9 244.7,142.3C269.0,134.6 294.6,128.5 320.0,127.8C345.4,127.0 375.2,128.4 397.4,137.8C419.6,147.2 438.8,167.2 453.2,184.4C467.7,201.6 476.1,221.7 484.2,241.0C492.3,260.3 500.3,279.7 501.9,300.0Z", o: 0.129 },
  { d: "M531.9,300.0C533.9,323.6 532.8,350.7 523.2,373.0C513.5,395.3 494.3,417.3 474.1,433.8C453.9,450.3 427.8,461.7 402.1,472.0C376.4,482.4 348.6,493.2 320.0,495.7C291.4,498.2 258.4,495.7 230.7,487.1C203.1,478.5 175.4,462.2 154.1,444.0C132.7,425.9 113.9,402.1 102.7,378.1C91.5,354.1 87.6,326.3 86.8,300.0C86.1,273.7 87.8,245.0 98.1,220.2C108.5,195.5 126.6,169.0 148.9,151.5C171.2,134.0 203.3,124.0 231.8,115.1C260.3,106.2 290.1,98.9 320.0,98.0C349.9,97.0 385.0,98.3 410.9,109.5C436.9,120.6 459.0,144.6 475.6,164.9C492.3,185.3 501.4,208.9 510.8,231.4C520.2,253.9 529.8,276.4 531.9,300.0Z", o: 0.146 },
  { d: "M561.5,300.0C564.1,326.9 563.2,358.0 552.3,383.5C541.4,409.0 519.2,434.0 496.1,452.8C473.0,471.6 443.0,484.4 413.7,496.3C384.4,508.2 352.7,521.1 320.0,524.2C287.3,527.3 249.2,524.6 217.5,514.8C185.7,505.0 153.9,486.3 129.4,465.4C104.9,444.6 83.2,417.3 70.3,389.8C57.4,362.2 53.2,330.3 52.3,300.0C51.3,269.7 52.9,236.7 64.7,208.2C76.5,179.7 97.4,149.1 123.0,129.1C148.7,109.0 185.9,98.1 218.8,87.9C251.6,77.7 285.7,69.2 320.0,68.1C354.3,66.9 394.9,68.0 424.6,80.9C454.2,93.8 479.2,122.1 497.9,145.6C516.7,169.1 526.5,196.2 537.1,222.0C547.7,247.7 559.0,273.1 561.5,300.0Z", o: 0.163 },
  { d: "M590.9,300.0C593.9,330.2 593.4,365.3 581.3,393.9C569.1,422.6 543.9,450.7 517.9,471.8C491.9,492.9 458.2,506.9 425.2,520.4C392.2,533.9 356.8,548.9 320.0,552.6C283.2,556.4 240.1,553.6 204.2,542.7C168.3,531.8 132.3,510.5 104.6,487.0C76.8,463.4 52.2,432.6 37.7,401.5C23.2,370.3 18.7,334.2 17.5,300.0C16.4,265.8 17.8,228.4 31.0,196.1C44.2,163.8 67.8,129.0 96.9,106.4C126.1,83.8 168.6,72.0 205.7,60.6C242.9,49.2 281.2,39.4 320.0,38.0C358.8,36.6 404.9,37.5 438.3,52.2C471.6,66.9 499.4,99.6 520.1,126.3C540.9,153.0 551.2,183.7 563.0,212.6C574.8,241.6 587.8,269.8 590.9,300.0Z", o: 0.18 },
];

/** Illustrative service-area outline. */
const SERVICE_POLYGON =
  "439.3,258.6 476.8,315.7 432.5,368.6 406.1,441.6 319.9,438.4 250.9,417.2 200.3,376.8 188.7,321.1 195.2,269.7 202.0,203.5 280.4,203.5 346.4,169.8 424.5,188.6";

/** Distribution mains. Each carries one slow travelling dash. */
const MAINS = [
  "222,232 268,268 300,300 352,318 414,300 452,268",
  "236,392 276,352 312,336 366,346 420,332 448,296",
  "300,196 306,252 300,300 292,356 282,414",
  "196,318 250,308 300,300 368,292 434,286 470,300",
  "214,244 246,300 268,352 316,392 380,410 406,428",
];

/** Compliance sampling points inside the boundary. */
const NODES = [
  { x: 256, y: 264, delay: "0s" },
  { x: 392, y: 240, delay: "0.8s" },
  { x: 300, y: 344, delay: "1.6s" },
  { x: 424, y: 330, delay: "2.4s" },
  { x: 240, y: 382, delay: "3.2s" },
];

function CornerTicks() {
  const L = 14;
  const inset = 10;
  const W = 640;
  const H = 620;
  const corners = [
    `M${inset},${inset + L} L${inset},${inset} L${inset + L},${inset}`,
    `M${W - inset - L},${inset} L${W - inset},${inset} L${W - inset},${inset + L}`,
    `M${W - inset},${H - inset - L} L${W - inset},${H - inset} L${W - inset - L},${H - inset}`,
    `M${inset + L},${H - inset} L${inset},${H - inset} L${inset},${H - inset - L}`,
  ];
  return (
    <g className="text-ink-300 dark:text-white/25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square">
      {corners.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

export function HeroPlate() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <svg
        viewBox="0 0 640 620"
        className="h-auto w-full"
        role="img"
        aria-label="Illustration of a water system boundary and a ZIP-code area."
      >
        <defs>
          <clipPath id="wql-plate-clip">
            <rect x="8" y="8" width="624" height="604" rx="22" />
          </clipPath>
          <pattern id="wql-grid-minor" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.07" />
          </pattern>
          <pattern id="wql-grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M120 0H0V120" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.11" />
          </pattern>
          <linearGradient id="wql-service-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2b76a6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#348465" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <g clipPath="url(#wql-plate-clip)">
          {/* 2 — engineering grid */}
          <g className="text-brand-800 dark:text-brand-200">
            <rect x="8" y="8" width="624" height="604" fill="url(#wql-grid-minor)" />
            <rect x="8" y="8" width="624" height="604" fill="url(#wql-grid-major)" />
          </g>

          {/* 1 — bathymetric contour field (the signature) */}
          <g
            className="text-brand-500 dark:text-brand-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            {CONTOURS.map((c) => (
              // The generated ramp is deliberately gentle; scale it so the
              // motif actually survives antialiasing at 1x.
              <path key={c.d.slice(0, 24)} d={c.d} opacity={Number((c.o * 2.1).toFixed(3))} />
            ))}
          </g>

          {/* 3a — the ZIP footprint the product argues against */}
          <rect
            x="168"
            y="152"
            width="330"
            height="316"
            rx="4"
            fill="none"
            className="text-ink-400 dark:text-white/30"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="2 6"
            opacity="0.7"
          />
          <text
            x="172"
            y="146"
            className="fill-ink-400 font-mono dark:fill-white/40"
            fontSize="10"
            letterSpacing="0.08em"
          >
            ZIP 48503
          </text>

          {/* 3b — the actual utility service boundary */}
          <polygon
            points={SERVICE_POLYGON}
            fill="url(#wql-service-fill)"
            stroke="#2b76a6"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="dark:stroke-brand-300"
          />

          {/* 4 — trunk mains, each with one slow travelling dash */}
          <g
            className="text-brand-500 dark:text-brand-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.5"
          >
            {MAINS.map((pts) => (
              <polyline key={pts.slice(0, 16)} points={pts} />
            ))}
          </g>
          <g
            className="wql-mains text-brand-600 dark:text-brand-200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            {MAINS.map((pts, i) => (
              <polyline
                key={pts.slice(0, 16)}
                points={pts}
                style={{ animationDelay: `${i * 1.4}s` }}
              />
            ))}
          </g>

          {/* 5 — compliance sampling nodes */}
          {NODES.map((n) => (
            <g key={`${n.x}-${n.y}`}>
              <circle
                className="wql-ping fill-verdant-500 dark:fill-verdant-300"
                cx={n.x}
                cy={n.y}
                r="3"
                style={{ animationDelay: n.delay }}
              />
              <circle cx={n.x} cy={n.y} r="3" className="fill-verdant-500 dark:fill-verdant-300" />
            </g>
          ))}

          {/* 6 — the resolved address */}
          <g>
            <circle
              cx="320"
              cy="300"
              r="26"
              fill="none"
              stroke="#4a93c1"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.45"
            />
            <circle
              cx="320"
              cy="300"
              r="44"
              fill="none"
              stroke="#4a93c1"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.45"
            />
            <g
              className="text-verdant-400 dark:text-verdant-300"
              stroke="currentColor"
              strokeWidth="1.25"
              opacity="0.9"
            >
              <path d="M320 268v8M320 324v8M288 300h8M344 300h8" strokeLinecap="round" />
            </g>
            {/* Map pin — same glyph as the address input, at 28px */}
            <g transform="translate(306, 284) scale(1.17)">
              <path
                d="M12 21s-6.5-5.7-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.3 12 21 12 21Z"
                className="fill-white stroke-brand-700 dark:fill-brand-950 dark:stroke-brand-200"
                strokeWidth="1.6"
              />
              <circle
                cx="12"
                cy="10.5"
                r="2.4"
                className="fill-verdant-500 stroke-none dark:fill-verdant-300"
              />
            </g>
            <text
              x="320"
              y="366"
              textAnchor="middle"
              className="fill-ink-400 font-mono dark:fill-white/45"
              fontSize="10"
              letterSpacing="0.08em"
            >
              ILLUSTRATIVE SERVICE AREA
            </text>
          </g>
        </g>

        {/* 7 — instrument frame */}
        <rect
          x="8"
          y="8"
          width="624"
          height="604"
          rx="22"
          fill="none"
          className="text-ink-200 dark:text-white/20"
          stroke="currentColor"
          strokeWidth="1"
        />
        <CornerTicks />
      </svg>

      {/* Public report availability shown alongside the illustration. */}
      <div className="pointer-events-none absolute -bottom-4 left-0 w-[15.5rem] rounded-xl border border-ink-200 bg-white/90 p-3 shadow-lift backdrop-blur sm:-left-4 dark:border-white/15 dark:bg-brand-950/85">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-500 dark:text-brand-200/70">
          Water report
        </p>
        <p className="mt-1 flex items-baseline justify-between gap-2 text-sm font-semibold text-ink-900 dark:text-white">
          Verified records unavailable
        </p>
        <p className="mt-2 border-t border-ink-100 pt-2 text-[0.625rem] text-ink-500 dark:border-white/10 dark:text-brand-200/70">
          See EPA and utility records
        </p>
      </div>
    </div>
  );
}
