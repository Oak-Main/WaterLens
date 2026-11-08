import type { Metadata } from "next";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  Stat,
} from "@/components/ui";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import {
  RegistryTable,
  StandardBadge,
  standardKind,
} from "@/components/entities/RegistryTable";
import { buildRegistry } from "@/lib/registry";
import { CERTIFICATIONS } from "@/lib/data";
import type { NsfStandard } from "@/lib/types";

const DESCRIPTION =
  "An independent registry of household water filters and the NSF/ANSI standards each one actually holds — distinguishing verified health-reduction certifications (53, 58, 401) from materials-only claims (42, 372) and the retired P473 PFAS standard.";

export const metadata: Metadata = {
  title: "Filter Certification Registry",
  description: DESCRIPTION,
  alternates: { canonical: "/registry" },
  openGraph: {
    title: "Filter Certification Registry · WaterQualityLens",
    description: DESCRIPTION,
    type: "website",
    url: "/registry",
  },
};

const STANDARD_ORDER: NsfStandard[] = ["42", "53", "58", "401", "372", "P473"];

/** Longer-form scope line for the explainer grid. */
function scopePhrase(s: NsfStandard): string {
  const info = CERTIFICATIONS[s];
  if (info.is_obsolete) return "Retired standard";
  return info.is_health
    ? "Health-related reduction"
    : "Materials / aesthetic — no health claim";
}

export default function RegistryPage() {
  const entries = buildRegistry();
  const healthCount = entries.filter((e) => e.healthCertified).length;
  const riskCount = entries.filter((e) => e.deceptiveMarketingRisk).length;

  return (
    <>
      <Section tone="sunken" density="tight" className="pb-10">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Filter Certification Registry" },
            ]}
          />

          <div className="mt-6 max-w-3xl animate-fade-up">
            <Eyebrow>Independent reference</Eyebrow>
            <h1 className="text-display-2">Filter Certification Registry</h1>
            <p className="mt-5 text-lede text-ink-600 dark:text-ink-300">
              Not every &ldquo;certified&rdquo; filter reduces contaminants. An
              NSF/ANSI certification is only as meaningful as the specific standard
              behind it — and some standards cover only taste or manufacturing
              materials, not health-related reduction. This registry lists every
              filter we track alongside the standards it has actually earned, so a
              materials-only claim can never read as a health claim.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <dt className="sr-only">Filters catalogued</dt>
              <dd>
                <Stat value={entries.length} label="Filters catalogued" />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Health-certified</dt>
              <dd>
                <Stat
                  value={healthCount}
                  label="Health-certified"
                  sub="Hold NSF/ANSI 53, 58, or 401"
                />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Materials-only</dt>
              <dd>
                <Stat
                  value={riskCount}
                  label="Materials-only"
                  sub="No verified health reduction"
                />
              </dd>
            </div>
          </dl>
        </Container>
      </Section>

      {/* Standards explainer */}
      <Section id="standards" density="default">
        <Container>
          <SectionHeading
            id="standards-heading"
            title="What each NSF/ANSI standard actually certifies"
            lede="The number after “NSF/ANSI” determines what a filter is verified to do. Two of these standards make no health claim at all."
          />

          <Reveal>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {STANDARD_ORDER.map((s) => (
                <Card as="li" key={s} className="flex flex-col p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StandardBadge standard={s} />
                    <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                      {scopePhrase(s)}
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {CERTIFICATIONS[s].description}
                  </p>
                </Card>
              ))}
            </ul>
          </Reveal>

          {/* Scope clarification. Marked by a left rule and a heading, not by an
              alarm hue — amber is reserved for mapping ambiguity. */}
          <Card className="mt-8 border-l-4 border-brand-600 p-6 dark:border-brand-300">
            <h3 className="text-title-2 text-ink-900 dark:text-white">
              How &ldquo;lead-free&rdquo; can mislead
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-700 dark:text-ink-200">
              A product can hold NSF/ANSI 42 (chlorine, taste, and odor) and NSF/ANSI
              372 (lead-free materials) without ever being tested to reduce a single
              health-related contaminant. NSF/ANSI 372 certifies only that the
              filter&rsquo;s own components contain negligible lead — it is a
              manufacturing-content standard, not a water-treatment claim. Rows below
              flagged &ldquo;materials-only&rdquo; hold these standards and no health
              standard; the label is a factual description of scope, not a judgment of
              the product.
            </p>
          </Card>
        </Container>
      </Section>

      {/* Registry table */}
      <Section id="registry" tone="sunken" density="default">
        <Container>
          <SectionHeading
            id="registry-heading"
            title="The registry"
            lede="Health-certified filters are listed first. Every standard badge prints its own scope, so nothing depends on reading a colour."
          />

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            A badge marked{" "}
            <span className="font-semibold text-ink-800 dark:text-ink-100">
              &ldquo;· {standardKind("53")}&rdquo;
            </span>{" "}
            is a health-reduction certification;{" "}
            <span className="font-semibold text-ink-800 dark:text-ink-100">
              &ldquo;· {standardKind("42")}&rdquo;
            </span>{" "}
            covers materials or aesthetics only and makes no health claim; and{" "}
            <span className="font-semibold text-ink-800 dark:text-ink-100">
              &ldquo;· {standardKind("P473")}&rdquo;
            </span>{" "}
            marks a withdrawn standard.
          </p>

          <div className="mt-8">
            <RegistryTable entries={entries} />
          </div>

          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            Certification data reflects manufacturer listings verified against the
            NSF, WQA, and IAPMO public certification databases. A filter&rsquo;s
            presence in this registry is not an endorsement, and outbound product
            links never affect how a product is described or ordered.
          </p>
        </Container>
      </Section>
    </>
  );
}
