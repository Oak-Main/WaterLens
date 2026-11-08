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
import { TierExplainer } from "@/components/institutional/TierExplainer";
import {
  TableOfContents,
  type TocItem,
} from "@/components/institutional/TableOfContents";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export function generateMetadata(): Metadata {
  const title = "Methodology";
  const description =
    "Exactly how WaterQualityLens resolves an address to its public water system, sources contaminant data from EPA SDWIS, and matches only genuinely certified filters to each hazard.";
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
    role: "Utility-reported contaminant occurrence, violations, and system inventory, retrieved via the Envirofacts REST API.",
    license: "US Government public domain",
    tone: "brand",
  },
  {
    name: "EPA community water system service-area boundaries",
    role: "The July 2024 release of explicit utility service-area polygons used for Tier 1 point-in-polygon resolution.",
    license: "US Government public domain",
    tone: "brand",
  },
  {
    name: "SimpleLab TEMM spatial layers",
    role: "Tiered Explicit, Match, Model layers that augment boundary coverage for Tier 2 proxy and Tier 3 modeled matches.",
    license: "MIT License (open source)",
    tone: "verdant",
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
              system, read its public record, and match only hardware that is
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
                  lede="The supplier that serves your tap is a geographic fact, not a ZIP code. We geocode the address and test it against real utility service-area geometry using the three-tier TEMM approach — Tiered Explicit, Match, Model."
                />

                <Prose className="mt-6">
                  <p>
                    First we attempt an <strong>explicit boundary</strong> match:
                    a point-in-polygon test that checks whether the geocoded
                    coordinate falls inside a published EPA service-area polygon.
                    When it does, the serving public water system (PWS) is known
                    with certainty. When no polygon covers the point, we fall back
                    to a <strong>matched proxy</strong> — the most probable system
                    inferred from TEMM layers and corroborating identifiers — and,
                    only as a last resort, to a <strong>modeled radius</strong>{" "}
                    that infers the likely supplier from nearby systems.
                  </p>
                  <p>
                    Each outcome carries an explicit confidence score, and that
                    score is surfaced in the report rather than hidden. We would
                    rather tell you a match is uncertain than present a
                    precise-looking answer we cannot stand behind.
                  </p>
                </Prose>

                <div className="mt-10">
                  <TierExplainer />
                </div>

                {/*
                  The one sanctioned amber surface: the Tier-3 mapping-ambiguity
                  banner. Marked additionally by a left rule and a glyph so the
                  signal never rests on hue alone.
                */}
                <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-caution-200 border-l-4 border-l-caution-400 bg-caution-50 p-6 shadow-e1 sm:flex-row sm:items-start dark:border-caution-300/25 dark:border-l-caution-300 dark:bg-caution-300/10">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-caution-100 text-caution-700 dark:bg-caution-300/15 dark:text-caution-200"
                    aria-hidden="true"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 8.5v4.5M12 16h.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <p className="text-sm leading-relaxed text-caution-900 dark:text-caution-100">
                    <strong className="font-semibold">
                      A Tier 3 modeled match
                    </strong>{" "}
                    is the one case where the map itself is uncertain. Those
                    reports open with an amber banner recommending a physical lab
                    test and asking you to confirm the utility name printed on
                    your water bill.
                  </p>
                </div>
              </section>

              {/* 02 — Data sourcing & freshness */}
              <section id="data" aria-labelledby="data-h" className="scroll-mt-24">
                <SectionHeading
                  eyebrow={<StepLabel n="02">Data sourcing</StepLabel>}
                  id="data-h"
                  title="Where the contaminant data comes from"
                  lede="We do not test water or generate our own measurements. We faithfully report what your utility has already submitted to the federal government — with its origin attached to every value."
                />

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <Prose>
                    <p>
                      Occurrence data is drawn from the{" "}
                      <strong>
                        EPA Safe Drinking Water Information System (SDWIS)
                      </strong>{" "}
                      through the Envirofacts REST API — a US Government
                      public-domain source. We ingest updates on a weekly cadence
                      so newly published sampling results and violation records
                      appear without long lags.
                    </p>
                    <p>
                      Provenance is a first-class requirement, not a footnote.
                      Every contaminant value in a report carries the four facts
                      you need to judge it for yourself:
                    </p>
                    <ul>
                      <li>
                        <strong>Sample date</strong> — when the measurement was
                        taken.
                      </li>
                      <li>
                        <strong>Testing agency</strong> — who reported it.
                      </li>
                      <li>
                        <strong>Unit</strong> — the measured concentration and its
                        units.
                      </li>
                      <li>
                        <strong>Legal MCL</strong> — the federal maximum
                        contaminant level for context.
                      </li>
                    </ul>
                    <p>
                      A number without its source is not information we are
                      willing to show. Where a utility has reported nothing for a
                      contaminant, we say so plainly rather than implying absence
                      is proof of safety.
                    </p>
                  </Prose>

                  <div className="flex flex-col gap-4">
                    <Card className="p-6">
                      <h3 className="text-title-2 text-ink-900 dark:text-white">
                        Ingestion at a glance
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
                            Envirofacts REST API
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-ink-600 dark:text-ink-300">
                            Refresh cadence
                          </dt>
                          <dd className="text-right">
                            <Pill tone="verdant">Weekly</Pill>
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-ink-600 dark:text-ink-300">
                            Per-value provenance
                          </dt>
                          <dd className="text-right">
                            <Pill tone="brand">Always shown</Pill>
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
                  Address-to-system mapping uses the July 2024 EPA community water
                  system service-area boundaries, augmented by SimpleLab&rsquo;s
                  open-source TEMM layers. Certification data is curated from the
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
