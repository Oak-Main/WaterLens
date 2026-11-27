import type { Metadata } from "next";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  Container,
  Eyebrow,
  Pill,
  Section,
  SectionHeading,
} from "@/components/ui";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PUBLIC_WATER_SYSTEMS } from "@/lib/public-water-systems";
import { DISCLAIMER_PLUMBING } from "@/lib/constants";

const TITLE = "Water Systems Directory";
const DESCRIPTION =
  "Find public water system identifiers and links to official water quality records.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pws" },
  openGraph: {
    title: `${TITLE} · WaterQualityLens`,
    description: DESCRIPTION,
    url: "/pws",
    type: "website",
  },
};

function SystemCard({ entry }: { entry: (typeof PUBLIC_WATER_SYSTEMS)[number] }) {
  return (
    <Card as="li" interactive className="overflow-hidden">
      <Link
        href={`/pws/${entry.pwsid}`}
        className="flex h-full flex-col p-6 no-underline"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h3 className="text-title-2 text-ink-900 dark:text-white">{entry.name}</h3>
          <Pill tone="ink">{entry.pwsid}</Pill>
        </div>

        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
          {entry.state}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
          <Badge tone="ink">Verified records unavailable</Badge>
        </div>
        <span className="mt-4 text-sm font-semibold text-brand-700 dark:text-brand-200">
          View official sources
          <span aria-hidden="true"> →</span>
        </span>
      </Link>
    </Card>
  );
}

export default function PwsIndexPage() {
  return (
    <>
      <Section tone="sunken" density="default" className="pb-12">
        <Container>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Water systems" }]} />

          <div className="mt-6 max-w-3xl animate-fade-up">
            <Eyebrow>Directory</Eyebrow>
            <h1 className="text-display-2">Water systems</h1>
            <p className="mt-5 text-lede text-ink-600 dark:text-ink-300">
              Find a public water system by name or EPA system ID and follow links to its official records.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              Where EPA ZIP coverage is available, lookup can suggest a system. Confirm your supplier on your water bill.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/" variant="primary" size="md">
              Look up your address
            </Button>
            <Button href="/contaminants" variant="secondary" size="md">
              Contaminant glossary
            </Button>
          </div>
        </Container>
      </Section>

      <Section id="systems" density="default">
        <Container>
          <SectionHeading
            id="systems-heading"
            eyebrow="System references"
            title={`${PUBLIC_WATER_SYSTEMS.length} water systems`}
            lede="Verified measurements and violation records are currently unavailable on Tap to Glass."
          />

          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_WATER_SYSTEMS.map((entry) => (
              <SystemCard key={entry.pwsid} entry={entry} />
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="sunken" density="tight">
        <Container>
          <Card className="p-6">
            <h2 className="text-title-2">What this directory does not cover</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {DISCLAIMER_PLUMBING}
            </p>
            <div className="mt-4">
              <Button href="/methodology" variant="ghost" size="sm">
                How we source and grade this data
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
