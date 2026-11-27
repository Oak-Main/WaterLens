import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, Container, Section } from "@/components/ui";
import { WaveDivider } from "@/components/graphics/WaveDivider";
import { CONTAMINANTS, FILTERS } from "@/lib/data";

import { PUBLIC_WATER_SYSTEMS } from "@/lib/public-water-systems";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 should never enter the index, but its outbound links are real routes
  // and are worth following.
  robots: { index: false, follow: true },
};

const references = [
  {
    href: "/contaminants",
    title: "Contaminant glossary",
    count: CONTAMINANTS.length,
    unit: "contaminants profiled",
    description:
      "What each regulated contaminant is, its federal limit, and the health basis the EPA set it on.",
  },
  {
    href: "/registry",
    title: "Filter Certification Registry",
    count: FILTERS.length,
    unit: "certified filters",
    description:
      "Independently certified filtration, listed by the NSF/ANSI standard each unit actually holds.",
  },
  {
    href: "/pws",
    title: "Water systems directory",
    count: PUBLIC_WATER_SYSTEMS.length,
    unit: "public water systems",
    description:
      "System identifiers and links to official water quality records.",
  },
];

export default function NotFound() {
  return (
    <>
      <Section className="bg-hero bg-grid pb-0" density="loose">
        <Container>
          <div className="mx-auto max-w-xl text-center animate-fade-up">
            <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-hairline bg-surface-raised text-brand-600 shadow-card dark:text-brand-300"
              aria-hidden="true"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle
                  cx="14"
                  cy="14"
                  r="9.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M14 9c2.1 2.4 3.3 4.3 3.3 6a3.3 3.3 0 1 1-6.6 0c0-1.7 1.2-3.6 3.3-6Z"
                  className="fill-verdant-600 dark:fill-verdant-300"
                />
                <path
                  d="m21 21 4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <p className="mt-8 text-eyebrow uppercase text-brand-600 dark:text-brand-300">
              404 — Page not found
            </p>
            <h1 className="mt-3 text-display-2 text-ink-900 dark:text-white">
              We couldn&rsquo;t resolve that page
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lede text-ink-600 dark:text-ink-300">
              The link may be outdated or the page may have moved. Your water data
              is still a single lookup away — start from your address, or head back
              to the homepage.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/#lookup" variant="primary">
                Check my water
              </Button>
              <Button href="/" variant="secondary">
                Back to homepage
              </Button>
            </div>
          </div>
        </Container>

        <WaveDivider className="mt-16 text-surface-sunken sm:mt-20" />
      </Section>

      <Section tone="sunken" density="default">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-title-1 text-ink-900 dark:text-white">
              Or start from a reference
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-600 dark:text-ink-300">
              Three catalogues sit behind every report. Each entry keeps its
              source, unit, and legal reference.
            </p>
          </div>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {references.map((r) => (
              <Card as="li" key={r.href} interactive>
                <Link
                  href={r.href}
                  className="flex h-full flex-col rounded-2xl p-6"
                >
                  <span className="font-mono text-2xl font-semibold tabular-nums text-ink-900 dark:text-white">
                    {r.count.toLocaleString("en-US")}
                  </span>
                  <span className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                    {r.unit}
                  </span>
                  <h3 className="mt-4 text-title-2 text-ink-900 dark:text-white">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {r.description}
                  </p>
                </Link>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
