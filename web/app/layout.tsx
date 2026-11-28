import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_NAME, SITE_URL } from "@/lib/site";
const SITE_DESC =
  "Look up a potential water system, find official water records, and browse independent filter certifications.";

// Self-hosted variable faces (files committed under app/fonts). No CDN, no
// network at build or runtime, and the type is the same on every platform.
const sans = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const mono = localFont({
  src: "./fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WaterQualityLens — Public water system records",
    template: "%s · WaterQualityLens",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "tap water quality",
    "NSF 53 filter",
    "NSF 58 reverse osmosis",
    "PFAS water filter",
    "lead water filter",
    "EPA SDWIS",
    "water contaminants by address",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "WaterQualityLens — Public water system records",
    description: SITE_DESC,
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1720" },
  ],
  width: "device-width",
  initialScale: 1,
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/results?address={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

// Resolves the theme before first paint, so a dark-mode visitor never sees a
// white flash. It ALWAYS stamps data-theme — Tailwind's `dark:` variants key off
// that attribute, so leaving it unset for OS-preference users would theme the
// CSS variables while leaving every `dark:` utility inert.
// It also marks the document as scripted, which is what gates the scroll-reveal
// start state (see .js .wql-reveal in globals.css): with no JS the sections must
// render visible rather than waiting for an observer that will never run.
const THEME_BOOTSTRAP = `(function(){var d=document.documentElement;d.classList.add("js");try{var s=localStorage.getItem("wql-theme");var t=(s==="dark"||s==="light")?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");d.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* GA4 aggregate analytics (GSC Ops BATCH-1 native tag) — CSP in next.config.mjs admits the gtag loader + GA endpoints */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-K5NKYS08G7" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-K5NKYS08G7');`}</Script>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
