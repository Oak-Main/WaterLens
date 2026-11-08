import type { Metadata } from "next";
import { PAID_OFFERS_ENABLED } from "@/lib/offers";
import { Container, Section, SectionHeading, Card, Eyebrow, Badge } from "@/components/ui";
import { Prose } from "@/components/institutional/Prose";
import {
  TableOfContents,
  type TocItem,
} from "@/components/institutional/TableOfContents";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import {
  DISCLAIMER_MEDICAL,
  DISCLAIMER_PLUMBING,
  DISCLAIMER_TIER3,
  DISCLAIMER_AFFILIATE,
} from "@/lib/constants";

export function generateMetadata(): Metadata {
  const title = "Legal & disclosures";
  const description =
    "WaterQualityLens disclosures in plain language: our medical, plumbing-limitation, and mapping-confidence disclaimers, our FTC affiliate disclosure, and short Terms and Privacy summaries.";
  return {
    title,
    description,
    alternates: { canonical: "/legal" },
    openGraph: {
      title: `${title} · WaterQualityLens`,
      description,
      type: "article",
      url: "/legal",
    },
  };
}

const TOC: TocItem[] = [
  { id: "medical", label: "01 · Medical" },
  { id: "plumbing", label: "02 · Plumbing limits" },
  { id: "mapping", label: "03 · Mapping confidence" },
  { id: "affiliate", label: "04 · Affiliate disclosure" },
  { id: "terms", label: "Terms of use" },
  { id: "privacy", label: "Privacy" },
];

type Disclosure = {
  id: string;
  n: string;
  heading: string;
  tone: "brand" | "verdant" | "caution" | "ink";
  badge: string;
  text: string;
  context: string;
};

const DISCLOSURES: Disclosure[] = [
  {
    id: "medical",
    n: "01",
    heading: "Medical disclaimer",
    tone: "brand",
    badge: "Not medical advice",
    text: DISCLAIMER_MEDICAL,
    context:
      "We report engineering measurements and hardware certifications — not health verdicts. Nothing here diagnoses exposure or predicts a toxicological outcome. For questions about your health, consult a licensed medical professional.",
  },
  {
    id: "plumbing",
    n: "02",
    heading: "Plumbing-limitation disclaimer",
    tone: "brand",
    badge: "System-level data",
    text: DISCLAIMER_PLUMBING,
    context:
      "Utility data describes the water as it leaves the system, not as it arrives at your faucet. Contamination introduced by your home’s own pipes — a legacy lead service line, for instance — is invisible to system-level records. A point-of-use lab test is the only way to see it.",
  },
  {
    id: "mapping",
    n: "03",
    heading: "Mapping-confidence disclaimer",
    // The single sanctioned amber surface: the Tier-3 mapping-ambiguity
    // disclosure. Reinforced by the left rule and the tier label, never hue alone.
    tone: "caution",
    badge: "Tier 3 · Modeled",
    text: DISCLAIMER_TIER3,
    context:
      "When an address resolves only to a modeled radius, the underlying map is uncertain — so we say so. Confirm the utility name on your water bill, and consider a lab test before acting on a low-confidence match.",
  },
  {
    id: "affiliate",
    n: "04",
    heading: "FTC affiliate disclosure",
    tone: "verdant",
    badge: PAID_OFFERS_ENABLED ? "Paid links disclosed" : "No paid links",
    text: DISCLAIMER_AFFILIATE,
    context: PAID_OFFERS_ENABLED
      ? "Some hardware links are affiliate placements, and we may earn a commission. A notice appears before those links, and a product only appears after qualifying on the relevant NSF/ANSI health certification. Commercial ranking never reorders the science."
      : "We have no affiliate relationship with any filter maker or lab today. Hardware and lab-test links go straight to the manufacturer, and a product only appears after qualifying on the relevant NSF/ANSI health certification. If that changes, a notice will appear before any paid link.",
  },
];

function toneAccent(tone: Disclosure["tone"]): string {
  switch (tone) {
    case "brand":
      return "before:bg-brand-400";
    case "verdant":
      return "before:bg-verdant-400";
    case "caution":
      return "before:bg-caution-400";
    case "ink":
      return "before:bg-ink-400";
  }
}

export default function LegalPage() {
  return (
    <>
      {/* Hero */}
      <Section className="bg-hero bg-grid" density="tight">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Legal & disclosures" },
            ]}
          />
          <div className="mt-6 max-w-3xl animate-fade-up">
            <Eyebrow>Legal &amp; disclosures</Eyebrow>
            <h1 className="text-display-1 text-ink-900 dark:text-white">
              What we promise, and what we cannot
            </h1>
            <p className="mt-6 max-w-2xl text-lede text-ink-600 dark:text-ink-300">
              Transparency is part of the product, so our disclosures are written
              to be read — not buried. Each one below states the limit plainly and
              explains, in ordinary language, why it exists and what it means for
              you.
            </p>
          </div>
        </Container>
      </Section>

      <Section density="default">
        <Container>
          <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
            <TableOfContents items={TOC} className="mb-10 lg:mb-0" />

            <div className="min-w-0 space-y-16 lg:space-y-24">
              {/* Disclosures */}
              <section aria-labelledby="disclosures-h">
                <SectionHeading
                  eyebrow="Disclosures"
                  id="disclosures-h"
                  title="Disclaimers and disclosures"
                  lede="The four limits that govern everything we publish. Each is quoted verbatim, then explained in plain language."
                />

                <div className="mt-10 grid gap-6">
                  {DISCLOSURES.map((d) => (
                    <div key={d.id} id={d.id} className="scroll-mt-24">
                      <Card
                        as="article"
                        className={`relative overflow-hidden p-7 before:absolute before:inset-y-0 before:left-0 before:w-1 sm:p-8 ${toneAccent(
                          d.tone
                        )}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-ink-500 dark:text-ink-400">
                              {d.n}
                            </span>
                            <h3 className="text-title-2 text-ink-900 dark:text-white">
                              {d.heading}
                            </h3>
                          </div>
                          <Badge tone={d.tone}>{d.badge}</Badge>
                        </div>

                        <blockquote className="mt-5 border-l-2 border-ink-200 pl-4 text-base leading-relaxed text-ink-800 dark:border-white/15 dark:text-ink-100">
                          {d.text}
                        </blockquote>

                        <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                          {d.context}
                        </p>
                      </Card>
                    </div>
                  ))}
                </div>
              </section>

              {/* Terms summary */}
              <section
                id="terms"
                aria-labelledby="terms-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Terms of use"
                  id="terms-h"
                  title="In short"
                  lede="A plain-language summary. It describes how the service is meant to be used and does not replace formal terms."
                />
                <Prose className="mt-6">
                  <p>
                    WaterQualityLens is an informational tool. It aggregates
                    public municipal water data and independent product
                    certifications to help you understand your water and your
                    filtration options. It is provided <strong>as is</strong>, for
                    general information, and does not constitute professional,
                    legal, or medical advice.
                  </p>
                  <ul>
                    <li>
                      Use the service for personal, non-commercial research and
                      decision-making about water quality and filtration.
                    </li>
                    <li>
                      Verify anything consequential — especially a low-confidence
                      match — against your water bill and, where appropriate, a
                      laboratory test.
                    </li>
                    <li>
                      Data is sourced from third parties and public records; we
                      present it faithfully but cannot guarantee it is complete or
                      free of the source&rsquo;s own errors.
                    </li>
                  </ul>
                </Prose>
              </section>

              {/* Privacy summary */}
              <section
                id="privacy"
                aria-labelledby="privacy-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Privacy"
                  id="privacy-h"
                  title="Anonymous by default"
                  lede="A plain-language summary of how we treat your data."
                />
                <Prose className="mt-6">
                  <p>
                    The core lookup is designed to be used{" "}
                    <strong>anonymously</strong>. You do not need an account to
                    check an address, and we do not require you to create one to
                    see your results.
                  </p>
                  <ul>
                    <li>
                      <strong>No accounts for the core tool.</strong> Looking up
                      an address does not create a profile tied to your identity.
                    </li>
                    <li>
                      <strong>Address handling.</strong> An address is used to
                      resolve the serving water system and return your report; it
                      is not sold.
                    </li>
                    <li>
                      <strong>Outbound product links.</strong> When you follow a
                      manufacturer or lab link, the destination site operates
                      under its own privacy practices, not ours.
                    </li>
                  </ul>
                </Prose>
              </section>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
