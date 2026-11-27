import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Container,
  Section,
  SectionHeading,
  Card,
  Eyebrow,
  Badge,
  Pill,
} from "@/components/ui";
import { Prose } from "@/components/institutional/Prose";
import {
  TableOfContents,
  type TocItem,
} from "@/components/institutional/TableOfContents";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export function generateMetadata(): Metadata {
  const title = "Methodology";
  const description =
    "How Tap to Glass uses the EPA ZIP registry, links to official water quality records, and presents filter certifications.";
  return {
    title,
    description,
    alternates: { canonical: "/methodology" },
    openGraph: {
      title: `${title} · WaterQualityLens`,
      description,
      type: "article",
      url: "/methodology",
    },
  };
}

const TOC: TocItem[] = [
  { id: "resolution", label: "01 · Address resolution" },
  { id: "data", label: "02 · Data sourcing" },
  { id: "matching", label: "03 · Filter matching" },
  { id: "sources", label: "04 · Data & licensing" },
];

const SOURCES: {
  name: string;
  role: string;
  license: string;
  tone: "brand" | "verdant" | "ink";
}[] = [
  {
    name: "EPA Safe Drinking Water Information System (SDWIS)",
    role: "Public system identities and ZIP associations via the EPA ECHO Drinking Water System Search. SDWIS also provides official compliance records.",
    license: "US Government public domain",
    tone: "brand",
  },
  {
    name: "NSF/ANSI, WQA, and IAPMO certification registries",
    role: "Independent product certifications that back the filter database — curated and quarterly-audited against the source registries.",
    license: "Curated from public certification listings",
    tone: "verdant",
  },
];

const STANDARDS: {
  code: string;
  label: string;
  health: "health" | "aesthetic" | "material" | "retired";
  note: string;
}[] = [
  {
    code: "NSF 53",
    label: "Health effects",
    health: "health",
    note: "Lead, VOCs, chromium, and (post-2022) PFAS. Satisfies a health hazard.",
  },
  {
    code: "NSF 58",
    label: "Reverse osmosis",
    health: "health",
    note: "Dissolved inorganics, arsenic, nitrate, and total PFAS. The only class that satisfies nitrate.",
  },
  {
    code: "NSF 401",
    label: "Emerging compounds",
    health: "health",
    note: "Trace pharmaceuticals and emerging contaminants. Satisfies a health hazard.",
  },
  {
    code: "NSF 42",
    label: "Aesthetic",
    health: "aesthetic",
    note: "Taste, odor, and chlorine — not a health claim. Isolated from hazard matching.",
  },
  {
    code: "NSF 372",
    label: "Lead-free materials",
    health: "material",
    note: "Certifies the device is made of lead-free materials — not that it removes lead.",
  },
  {
    code: "P473",
    label: "Retired 2022",
    health: "retired",
    note: "Folded into NSF 53 and 58; never treated as a standalone qualification.",
  },
];

function healthBadge(kind: (typeof STANDARDS)[number]["health"]) {
  switch (kind) {
    case "health":
      return <Badge tone="verdant">Qualifies</Badge>;
    case "aesthetic":
      return <Badge tone="ink">Aesthetic only</Badge>;
    case "material":
      return <Badge tone="ink">Materials only</Badge>;
    case "retired":
      return <Badge tone="ink">Retired</Badge>;
  }
}

/**
 * All four parts of the document carry a number, so the sequence never breaks
 * halfway down the page. Sits inside <Eyebrow>, which supplies the tracking.
 */
function StepLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="font-mono text-ink-500 dark:text-ink-400">{n}</span>
      <span aria-hidden="true" className="h-px w-5 bg-ink-300 dark:bg-white/25" />
      <span>{children}</span>
    </span>
  );
}

export default function MethodologyPage() {
  return (
    <>
      {/* Hero */}
      <Section className="bg-hero bg-grid" density="tight">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Methodology" }]}
          />
          <div className="mt-6 max-w-3xl animate-fade-up">
            <Eyebrow>Methodology</Eyebrow>
            <h1 className="text-display-1 text-ink-900 dark:text-white">
              How we turn a street address into a defensible answer
            </h1>
            <p className="mt-6 max-w-2xl text-lede text-ink-600 dark:text-ink-300">
              WaterQualityLens is an auditor, not an advocate. Every result is
              produced by the same deterministic pipeline: resolve the water
              system candidate, find its public record, and look up hardware that is
              independently certified for the specific hazards found. This page
              documents each step and the confidence we attach to it.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Badge tone="brand">Point-in-polygon resolution</Badge>
              <Badge tone="verdant">Full data provenance</Badge>
              <Badge tone="ink">Constrained set-cover matching</Badge>
            </div>
          </div>
        </Container>
      </Section>

      <Section density="default">
        <Container>
          <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
            <TableOfContents items={TOC} className="mb-10 lg:mb-0" />

            <div className="min-w-0 space-y-16 lg:space-y-24">
              {/* 01 — Address to PWS */}
              <section
                id="resolution"
                aria-labelledby="resolution-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow={<StepLabel n="01">Address resolution</StepLabel>}
                  id="resolution-h"
                  title="Resolving your address to a water system"
                  lede="The EPA ZIP registry provides potential water systems. Confirm your supplier on your water bill."
                />

                <Prose className="mt-6">
                  <p>
                    The lookup uses a ZIP code from the address or the Census geocoder.
                    If the registry returns multiple systems, the lookup shows one
                    candidate based on the population figures in the retrieved records.
                    Confirm the supplier for your address with your water bill.
                  </p>
                </Prose>
              </section>

              {/* 02 — Data sourcing & freshness */}
              <section id="data" aria-labelledby="data-h" className="scroll-mt-24">
                <SectionHeading
                  eyebrow={<StepLabel n="02">Data sourcing</StepLabel>}
                  id="data-h"
                  title="Where the contaminant data comes from"
                  lede="Tap to Glass provides utility identities and links to official water records. Verified measurements and violation records are currently unavailable here."
                />

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <Prose>
                    <p>
                      Consult the EPA Safe Drinking Water Information System (SDWIS),
                      your state regulator, or your utility for monitoring and compliance records.
                      Check each record&rsquo;s system ID, sample date, testing agency, units,
                      and applicable regulatory threshold. Lead and copper use action levels
                      for system-level 90th-percentile tap monitoring under the EPA Lead and
                      Copper Rule.
                    </p>
                  </Prose>

                  <div className="flex flex-col gap-4">
                    <Card className="p-6">
                      <h3 className="text-title-2 text-ink-900 dark:text-white">
                        Registry lookup at a glance
                      </h3>
                      <dl className="mt-4 space-y-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-ink-600 dark:text-ink-300">
                            Primary source
                          </dt>
                          <dd className="text-right text-sm font-medium text-ink-900 dark:text-white">
                            EPA SDWIS
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-ink-600 dark:text-ink-300">
                            Access
                          </dt>
                          <dd className="text-right text-sm font-medium text-ink-900 dark:text-white">
                            EPA ECHO Drinking Water System Search
                          </dd>
                        </div>
                      </dl>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                        Utility data is aggregated at the water-system level. It
                        cannot see the plumbing inside your home — a legacy lead
                        service line, for example. Where that limitation matters,
                        we say so and point to a point-of-use lab test.
                      </p>
                    </Card>
                  </div>
                </div>
              </section>

              {/* 03 — Filter matching */}
              <section
                id="matching"
                aria-labelledby="matching-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow={<StepLabel n="03">Filter matching</StepLabel>}
                  id="matching-h"
                  title="Matching filters to hazards, honestly"
                  lede="Recommending hardware is a coverage problem, not a marketing one. We solve a constrained set-cover: find the smallest set of genuinely certified products that addresses every health hazard in your report — and eliminate anything that only appears to help."
                />

                <Prose className="mt-6">
                  <p>
                    The constraints are strict, and they are what make the answer
                    trustworthy:
                  </p>
                  <ul>
                    <li>
                      Only <strong>NSF/ANSI 53, 58, and 401</strong>{" "}
                      certifications can satisfy a health hazard. A product must
                      carry a relevant health-effects certification to be eligible
                      at all.
                    </li>
                    <li>
                      <strong>NSF 42, NSF 372, and the retired P473</strong> are
                      isolated from hazard matching. Aesthetic, materials, and
                      obsolete certifications never count toward removing a
                      contaminant.
                    </li>
                    <li>
                      <strong>Nitrate is reverse-osmosis only.</strong>{" "}
                      Carbon-based pitcher, faucet, and under-sink filters cannot
                      remove it; only NSF 58 (or specific ion-exchange) systems
                      qualify.
                    </li>
                    <li>
                      <strong>Partial matches are eliminated.</strong> A product
                      that covers some but not all of your hazards is not offered
                      as if it were a complete solution.
                    </li>
                  </ul>
                  <p>
                    The result is a short, defensible set of options in which the
                    recommendation follows the data. Commercial considerations
                    never reorder scientific fit; a product link, paid or not,
                    earns its place only after the product has qualified on the
                    certification.
                  </p>
                </Prose>

                <div
                  className="mt-10 overflow-x-auto"
                  tabIndex={0}
                  role="region"
                  aria-label="Certification standards and how each is treated in filter matching, scrollable"
                >
                  <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      How each certification standard is treated in filter
                      matching
                    </caption>
                    <thead>
                      <tr className="border-b-2 border-ink-200 dark:border-white/15">
                        <th
                          scope="col"
                          className="py-3 pr-4 font-semibold text-ink-900 dark:text-white"
                        >
                          Standard
                        </th>
                        <th
                          scope="col"
                          className="py-3 pr-4 font-semibold text-ink-900 dark:text-white"
                        >
                          Scope
                        </th>
                        <th
                          scope="col"
                          className="py-3 pr-4 font-semibold text-ink-900 dark:text-white"
                        >
                          Treatment
                        </th>
                        <th
                          scope="col"
                          className="py-3 font-semibold text-ink-900 dark:text-white"
                        >
                          What it means
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {STANDARDS.map((s) => (
                        <tr key={s.code} className="border-b border-hairline align-top">
                          <td className="py-4 pr-4">
                            <Pill tone={s.health === "health" ? "verdant" : "ink"}>
                              {s.code}
                            </Pill>
                          </td>
                          <td className="py-4 pr-4 text-ink-700 dark:text-ink-200">
                            {s.label}
                          </td>
                          <td className="py-4 pr-4">{healthBadge(s.health)}</td>
                          <td className="py-4 text-ink-600 dark:text-ink-300">
                            {s.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 04 — Data & licensing */}
              <section
                id="sources"
                aria-labelledby="sources-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow={<StepLabel n="04">Data &amp; licensing</StepLabel>}
                  id="sources-h"
                  title="The sources behind every report"
                  lede="We build on public, auditable data and open standards. Here is exactly what powers the product and how each source is licensed."
                />

                <ul className="mt-10 grid gap-4 md:grid-cols-2">
                  {SOURCES.map((src) => (
                    <Card as="li" key={src.name} className="flex flex-col p-6">
                      <h3 className="text-title-2 text-ink-900 dark:text-white">
                        {src.name}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                        {src.role}
                      </p>
                      <div className="mt-5">
                        <Badge tone={src.tone}>{src.license}</Badge>
                      </div>
                    </Card>
                  ))}
                </ul>

                <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                  The registry lookup uses EPA ZIP associations. Certification data is curated from the
                  NSF/ANSI, WQA, and IAPMO registries and audited quarterly. We
                  report municipal engineering data only; WaterQualityLens is not
                  a medical device.
                </p>
              </section>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
