import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Container, Eyebrow, Pill, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import {
  TableOfContents,
  type TocItem,
} from "@/components/institutional/TableOfContents";
import { CONTAMINANTS } from "@/lib/data";
import { usesActionLevel } from "@/lib/regulatory-reference";
import { formatUnit, formatValue } from "@/lib/format";
import type { ContaminantDefinition } from "@/lib/types";

const DESCRIPTION =
  "A plain-language reference for the drinking water contaminants tracked under the EPA Safe Drinking Water Act — legal limits (MCL), action levels, health goals (MCLG), units, and documented health effects for lead, PFAS, arsenic, nitrate, disinfection byproducts, and more.";

export const metadata: Metadata = {
  title: "Drinking Water Contaminant Glossary",
  description: DESCRIPTION,
  alternates: { canonical: "/contaminants" },
  openGraph: {
    title: "Drinking Water Contaminant Glossary · WaterQualityLens",
    description: DESCRIPTION,
    type: "website",
    url: "/contaminants",
  },
};

function firstSentence(text?: string): string {
  if (!text) return "";
  const match = text.match(/^[^.]*\./);
  return (match ? match[0] : text).trim();
}

function limitText(c: ContaminantDefinition): string {
  if (usesActionLevel(c.code)) return "Action level (90th percentile)";
  const unit = formatUnit(c.unit);
  if (c.mcl == null) return "No federal MCL";
  return `${formatValue(c.mcl, unit)} MCL`;
}

function goalText(c: ContaminantDefinition): string {
  const unit = formatUnit(c.unit);
  if (c.health_goal == null) return "—";
  return c.health_goal === 0 ? "0 (no safe level)" : formatValue(c.health_goal, unit);
}

function categorySlug(category: string): string {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export default function ContaminantsIndexPage() {
  // Group by category, preserving priority-first ordering within each group.
  const groups = new Map<string, ContaminantDefinition[]>();
  for (const c of CONTAMINANTS) {
    const arr = groups.get(c.category) ?? [];
    arr.push(c);
    groups.set(c.category, arr);
  }
  const ordered = [...groups.entries()].map(
    ([category, items]) =>
      [
        category,
        [...items].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9)),
      ] as const
  );

  const toc: TocItem[] = ordered.map(([category, items]) => ({
    id: categorySlug(category),
    label: `${category} (${items.length})`,
  }));

  return (
    <>
      <Section tone="sunken" density="tight" className="pb-10">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Contaminant glossary" }]}
          />

          <div className="mt-6 max-w-3xl animate-fade-up">
            <Eyebrow>Reference</Eyebrow>
            <h1 className="text-display-2 text-ink-900 dark:text-white">
              Drinking water contaminant glossary
            </h1>
            <p className="mt-5 text-lede text-ink-600 dark:text-ink-300">
              A plain-language reference for the contaminants regulated under the
              federal Safe Drinking Water Act. Each entry lists the contaminant&rsquo;s
              regulatory threshold, its health goal, the reporting unit, and what long-term
              exposure is associated with — sourced from EPA and state primacy-agency
              documentation.
            </p>
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
              {CONTAMINANTS.length} contaminants across {ordered.length} categories.
            </p>
          </div>

          <Card className="mt-8 max-w-3xl p-6">
            <h2 className="text-title-2 text-ink-900 dark:text-white">
              Legal limits, action levels, and health goals
            </h2>
            <dl className="mt-4 space-y-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">
                  MCL — Maximum Contaminant Level
                </dt>
                <dd>
                  The enforceable legal limit a utility may not exceed. It is set as
                  close to the health goal as is feasible given available treatment
                  technology and cost.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">
                  Action level — Lead and Copper Rule
                </dt>
                <dd>
                  When the 90th-percentile result from a water system&rsquo;s tap monitoring exceeds this threshold,
                  the system must take additional actions under the rule.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">
                  MCLG / health goal — Maximum Contaminant Level Goal
                </dt>
                <dd>
                  The non-enforceable level below which there is no known or expected
                  health risk. For carcinogens such as lead, arsenic, and several
                  PFAS, the health goal is <span className="font-mono">0</span> — meaning
                  no exposure is considered risk-free, even when a system is legally
                  compliant.
                </dd>
              </div>
            </dl>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:gap-12">
            <TableOfContents items={toc} className="lg:col-start-1" />

            <div className="space-y-14 lg:col-start-2">
              {ordered.map(([category, items]) => (
                <div key={category}>
                  <div className="flex flex-wrap items-center gap-3 border-b border-hairline pb-3">
                    <h2
                      id={categorySlug(category)}
                      className="scroll-mt-24 text-title-1 text-ink-900 dark:text-white"
                    >
                      {category}
                    </h2>
                    <span className="text-sm text-ink-500 dark:text-ink-400">
                      {items.length} contaminant{items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((c) => (
                      <Card as="li" key={c.code} interactive className="group">
                        <Link
                          href={`/contaminants/${c.code}`}
                          className="flex h-full flex-col rounded-2xl p-6 outline-none"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-title-2 text-ink-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-200">
                              {c.name}
                            </h3>
                            <Pill tone="ink">{c.code}</Pill>
                          </div>
                          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                            {firstSentence(c.health_effects)}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Badge tone="brand">{limitText(c)}</Badge>
                            <span className="text-xs text-ink-500 dark:text-ink-400">
                              Goal: {goalText(c)}
                            </span>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
