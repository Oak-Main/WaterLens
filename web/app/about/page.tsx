import type { Metadata } from "next";
import { PAID_OFFERS_ENABLED } from "@/lib/offers";
import { Container, Section, SectionHeading, Card, Eyebrow, Badge } from "@/components/ui";
import { Prose } from "@/components/institutional/Prose";
import {
  TableOfContents,
  type TocItem,
} from "@/components/institutional/TableOfContents";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export function generateMetadata(): Metadata {
  const title = "About";
  const description =
    "WaterQualityLens exists to close the trust gap between municipal water data and the people who drink it — an objective, vendor-agnostic auditor, not an alarmist advocacy group or a hardware vendor.";
  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      title: `${title} · WaterQualityLens`,
      description,
      type: "article",
      url: "/about",
    },
  };
}

const TOC: TocItem[] = [
  { id: "mission", label: "Our mission" },
  { id: "what-we-are", label: "What we are" },
  { id: "audiences", label: "Who we serve" },
  { id: "independence", label: "Editorial independence" },
];

const IS: string[] = [
  "An objective, vendor-agnostic auditor of public water data",
  "A faithful reader of what utilities already report to the EPA",
  "Transparent about confidence, provenance, and every recommendation",
];

const IS_NOT: string[] = [
  "A medical tool — we do not diagnose exposure or predict health outcomes",
  "An alarmist advocacy group trading on fear",
  "A hardware vendor — we sell no filters of our own",
];

const AUDIENCES: { group: string; who: string; need: string }[] = [
  {
    group: "Households making a decision",
    who: "Parents, expecting families, and renters",
    need: "A clear, non-alarmist read on what is in the water and which certified filter — if any — actually addresses it.",
  },
  {
    group: "Property professionals",
    who: "Homebuyers, realtors, and property managers",
    need: "Defensible, address-level documentation with provenance they can share and stand behind during a transaction.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <Section className="bg-hero bg-grid" density="tight">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "About" }]}
          />
          <div className="mt-6 max-w-3xl animate-fade-up">
            <Eyebrow>About</Eyebrow>
            <h1 className="text-display-1 text-ink-900 dark:text-white">
              Closing the trust gap between water data and the people who drink
              it
            </h1>
            <p className="mt-6 max-w-2xl text-lede text-ink-600 dark:text-ink-300">
              The information needed to understand your tap water already exists
              — it is just buried in federal databases, written for engineers,
              and surrounded by companies with something to sell. We translate
              that public record into a clear, honest answer, and we do it
              without selling you the hardware.
            </p>
          </div>
        </Container>
      </Section>

      <Section density="default">
        <Container>
          <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
            <TableOfContents items={TOC} className="mb-10 lg:mb-0" />

            <div className="min-w-0 space-y-16 lg:space-y-24">
              {/* Mission */}
              <section
                id="mission"
                aria-labelledby="mission-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Why we exist"
                  id="mission-h"
                  title="Our mission"
                />
                <Prose className="mt-6">
                  <p>
                    Utilities test their water and report the results to the EPA.
                    In principle, anyone can look those results up. In practice,
                    the data lives in systems most people will never open, in a
                    format that assumes you already understand maximum contaminant
                    levels, sampling regimes, and certification standards.
                  </p>
                  <p>
                    WaterQualityLens exists to close that gap. We take the same
                    public municipal data and present it plainly — every value
                    with its source, every uncertainty labeled, every
                    recommendation traceable to an independent certification. Our
                    measure of success is simple: you leave knowing more than you
                    did, and trusting that what you were told is exactly what the
                    record says.
                  </p>
                </Prose>
              </section>

              {/* What we are / are not */}
              <section
                id="what-we-are"
                aria-labelledby="what-we-are-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Boundaries"
                  id="what-we-are-h"
                  title="What we are — and what we are not"
                  lede="Objectivity is easier to claim than to keep. These boundaries are how we hold ourselves to it."
                />

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  <Card className="p-7">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-verdant-50 text-verdant-600 dark:bg-verdant-300/10 dark:text-verdant-200"
                        aria-hidden="true"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="m5 12.5 4.5 4.5L19 7"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <h3 className="text-title-2 text-ink-900 dark:text-white">
                        We are
                      </h3>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {IS.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm leading-relaxed text-ink-700 dark:text-ink-200"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verdant-500 dark:bg-verdant-300"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-7">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200"
                        aria-hidden="true"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M7 12h10"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <h3 className="text-title-2 text-ink-900 dark:text-white">
                        We are not
                      </h3>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {IS_NOT.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm leading-relaxed text-ink-700 dark:text-ink-200"
                        >
                          <span
                            className="mt-[0.55rem] h-px w-2.5 shrink-0 bg-ink-400 dark:bg-white/40"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </section>

              {/* Audiences */}
              <section
                id="audiences"
                aria-labelledby="audiences-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Who we serve"
                  id="audiences-h"
                  title="Built for people making real decisions"
                  lede="Different people arrive with different stakes. The data is the same; what changes is why it matters."
                />

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {AUDIENCES.map((a) => (
                    <Card key={a.group} className="flex flex-col p-7">
                      <Badge tone="brand">{a.group}</Badge>
                      <h3 className="mt-4 text-title-2 text-ink-900 dark:text-white">
                        {a.who}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                        {a.need}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Editorial independence */}
              <section
                id="independence"
                aria-labelledby="independence-h"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Editorial independence"
                  id="independence-h"
                  title="Our commitment"
                />
                <Prose className="mt-6">
                  <p>
                    {PAID_OFFERS_ENABLED
                      ? "Some hardware and lab-test links are affiliate placements, and a notice appears before them. We keep that revenue from ever touching the science: a product can only appear after it has independently qualified on the relevant NSF/ANSI health certification for a detected contaminant. Commercial ranking never overrides the data."
                      : "Hardware and lab-test links go straight to the manufacturers today, and we earn nothing from them. If that changes, a notice will appear before any paid link. Either way, a product can only appear after it has independently qualified on the relevant NSF/ANSI health certification for a detected contaminant, and commercial ranking never overrides the data."}
                  </p>
                  <p>
                    Display advertising is restricted, and it never appears
                    between the address input and the data it returns. The path
                    from your question to the objective answer stays clear of
                    anything we are paid to show. If a recommendation would not
                    survive scrutiny on the certification alone, it does not run.
                  </p>
                </Prose>
              </section>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
