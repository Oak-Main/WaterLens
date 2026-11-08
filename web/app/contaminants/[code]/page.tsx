import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { offerFor } from "@/lib/offers";
import {
  Badge,
  Button,
  Card,
  Container,
  Eyebrow,
  Pill,
  Section,
  SectionHeading,
  Stat,
  Tooltip,
} from "@/components/ui";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Prose } from "@/components/institutional/Prose";
import { WaveDivider } from "@/components/graphics/WaveDivider";
import {
  CERTIFICATIONS,
  CONTAMINANTS,
  CONTAMINANT_BY_CODE,
  DEMO_SYSTEMS,
  FILTER_BY_ID,
  FILTER_CLAIMS,
} from "@/lib/data";
import { demoProfile } from "@/lib/lookup";
import {
  HEALTH_STANDARDS,
  NITRATE_CODES,
  NITRATE_WARNING,
  NON_HEALTH_STANDARDS,
} from "@/lib/constants";
import {
  FORM_FACTOR_LABEL,
  formatDate,
  formatRatio,
  formatUnit,
  formatValue,
  severityChipClass,
  severityLabel,
  standardLabel,
  usd,
} from "@/lib/format";
import type {
  ContaminantDefinition,
  Detection,
  Filter,
  NsfStandard,
  WaterSystem,
} from "@/lib/types";

export const dynamicParams = false;

const HEALTH = new Set<string>(HEALTH_STANDARDS);

/** Dark-mode overrides for the Prose primitive's light-mode ink values. */
const PROSE_DARK =
  "dark:text-ink-300 dark:[&_strong]:text-ink-100 dark:[&_h3]:text-white dark:[&_a]:text-brand-200 dark:[&_a]:decoration-brand-300/40 dark:[&_code]:bg-white/10 dark:[&_code]:text-ink-100";

export function generateStaticParams() {
  return CONTAMINANTS.map((c) => ({ code: c.code }));
}

interface VerifiedFilter {
  filter: Filter;
  standards: NsfStandard[];
  certifiers: string[];
}

/** Filters holding a verified HEALTH-standard claim for this contaminant. */
function verifiedFiltersFor(code: string): VerifiedFilter[] {
  const byFilter = new Map<number, { standards: Set<NsfStandard>; certifiers: Set<string> }>();
  for (const claim of FILTER_CLAIMS) {
    if (claim.contaminant_code !== code || !claim.verified) continue;
    if (!HEALTH.has(claim.standard)) continue;
    const entry = byFilter.get(claim.filter_id) ?? {
      standards: new Set<NsfStandard>(),
      certifiers: new Set<string>(),
    };
    entry.standards.add(claim.standard);
    entry.certifiers.add(claim.certifier);
    byFilter.set(claim.filter_id, entry);
  }

  const out: VerifiedFilter[] = [];
  for (const [filterId, entry] of byFilter) {
    const filter = FILTER_BY_ID.get(filterId);
    if (!filter || !filter.active) continue;
    out.push({
      filter,
      standards: [...entry.standards].sort(),
      certifiers: [...entry.certifiers].sort(),
    });
  }
  // Broadest certification first, then price ascending.
  return out.sort(
    (a, b) =>
      b.standards.length - a.standards.length ||
      (a.filter.price_usd ?? Infinity) - (b.filter.price_usd ?? Infinity)
  );
}

/**
 * How many ACTIVE registry products carry a verified claim for this
 * contaminant under each NSF/ANSI standard — health and non-health alike, so
 * the aesthetic/materials-only cases can be named explicitly.
 */
function claimCountsByStandard(code: string): Map<NsfStandard, number> {
  const byStandard = new Map<NsfStandard, Set<number>>();
  for (const claim of FILTER_CLAIMS) {
    if (claim.contaminant_code !== code || !claim.verified) continue;
    const filter = FILTER_BY_ID.get(claim.filter_id);
    if (!filter || !filter.active) continue;
    const set = byStandard.get(claim.standard) ?? new Set<number>();
    set.add(filter.id);
    byStandard.set(claim.standard, set);
  }
  return new Map([...byStandard].map(([s, ids]) => [s, ids.size]));
}

interface SystemMention {
  system: WaterSystem;
  detection: Detection;
}

/** Demo-profile systems whose reported sample set contains this contaminant. */
function systemsReporting(code: string): SystemMention[] {
  const out: SystemMention[] = [];
  for (const demo of DEMO_SYSTEMS) {
    const profile = demoProfile(demo.system.pwsid);
    if (!profile) continue;
    const detection = profile.detections.find((d) => d.code === code);
    if (!detection) continue;
    out.push({ system: profile.utility, detection });
  }
  return out.sort(
    (a, b) =>
      Number(b.detection.exceeds_mcl) - Number(a.detection.exceeds_mcl) ||
      (b.detection.mcl_ratio ?? 0) - (a.detection.mcl_ratio ?? 0)
  );
}

function unitLabel(c: ContaminantDefinition): string {
  return formatUnit(c.unit);
}

function limitValue(c: ContaminantDefinition): string | null {
  if (c.mcl == null) return null;
  return c.mcl === 0 ? "0" : formatValue(c.mcl, unitLabel(c));
}

function goalValue(c: ContaminantDefinition): string | null {
  if (c.health_goal == null) return null;
  return c.health_goal === 0 ? "0" : formatValue(c.health_goal, unitLabel(c));
}

export async function generateMetadata(
  props: {
    params: Promise<{ code: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const c = CONTAMINANT_BY_CODE.get(params.code.toUpperCase());
  if (!c) {
    return { title: "Contaminant not found", robots: { index: false, follow: true } };
  }
  const unit = unitLabel(c);
  const limit =
    c.mcl != null ? `federal MCL ${formatValue(c.mcl, unit)}` : "no federal MCL set";
  const description = `${c.name} in drinking water — ${limit}, health goal ${
    c.health_goal === 0 ? "0 (no safe level)" : c.health_goal != null ? formatValue(c.health_goal, unit) : "not set"
  }, and the NSF/ANSI-certified filters independently verified to reduce it.`;

  // Title carries the query-intent tail — GSC (Sep 2026) demand arrives as
  // "benzene mcl" (#9), "hexavalent chromium water filter" (#92), "arsenic
  // limits in drinking water" (#84) — and the page's own MCL/certification/
  // filter sections ground every term. `absolute` keeps the full string in
  // the SERP budget instead of stacking the layout brand suffix.
  return {
    title: { absolute: `${c.name} in Drinking Water — MCL & Certified Filters` },
    description,
    alternates: { canonical: `/contaminants/${c.code}` },
    openGraph: {
      title: `${c.name} in Drinking Water · WaterQualityLens`,
      description,
      type: "article",
      url: `/contaminants/${c.code}`,
    },
  };
}

// --- Section (a): the regulatory narrative, built from the record ------------

function RegulationCopy({ c }: { c: ContaminantDefinition }) {
  const unit = unitLabel(c);
  const mcl = limitValue(c);
  const goal = goalValue(c);
  const hasGap = c.mcl != null && c.health_goal != null && c.mcl !== c.health_goal;
  const paragraphs: ReactNode[] = [];

  if (c.mcl == null) {
    paragraphs.push(
      <p key="no-mcl">
        <strong>{c.name} carries no enforceable federal MCL.</strong> Nothing in the
        federal Safe Drinking Water Act currently obliges a system to keep{" "}
        {c.name} below a specific number, so a reported value cannot be
        &ldquo;over the limit&rdquo; in the federal sense.{" "}
        {goal != null ? (
          <>
            The health goal on record is <code>{goal}</code>, and a goal is advisory: it carries no compliance obligation and no
            violation follows from exceeding it.
          </>
        ) : (
          <>No federal health goal is on record either.</>
        )}{" "}
        Individual states may set their own enforceable limits, and monitoring may
        still be required under other programs.
      </p>
    );
  } else if (hasGap) {
    paragraphs.push(
      <p key="two-numbers">
        Two different numbers govern {c.name}, and they are not interchangeable. The{" "}
        <strong>Maximum Contaminant Level (MCL)</strong> is <code>{mcl}</code> — the
        enforceable ceiling. A system reporting above it is in violation and owes its
        customers notification and corrective action. The{" "}
        <strong>health goal (MCLG)</strong> is <code>{goal}</code> and is{" "}
        <strong>not</strong> enforceable.
      </p>
    );
    paragraphs.push(
      c.health_goal === 0 ? (
        <p key="gap">
          The health goal is zero. EPA sets a goal of zero when it has not identified
          a level at which the contaminant is known or expected to be free of the
          effects the standard was written to address. Zero is not attainable as an
          enforceable standard with available treatment technology and cost, so the
          MCL was set at <code>{mcl}</code> instead — the level EPA judged feasible.{" "}
          <strong>
            The practical consequence: a utility can report {c.name} anywhere between
            zero and {mcl} and be fully compliant while still sitting above the health
            goal.
          </strong>{" "}
          &ldquo;No violation&rdquo; and &ldquo;at the goal&rdquo; are different
          statements about the same water.
        </p>
      ) : (
        <p key="gap">
          The gap between <code>{goal}</code> and <code>{mcl}</code> is the distance
          between what the health-effects record points to and what treatment
          technology and cost make enforceable. Inside that band a result is above
          the health goal and below the legal limit at the same time, and is reported
          as compliant. Where the health goal on record comes from a state
          public-health goal rather than the federal MCLG, the health-effects note
          below says so.
        </p>
      )
    );
  } else if (c.mcl === 0) {
    paragraphs.push(
      <p key="zero">
        For {c.name} both the enforceable limit and the health goal are{" "}
        <code>0</code>. There is no permissible band:{" "}
        <strong>any confirmed detection is, by definition, an exceedance</strong>,
        which is why {c.category.toLowerCase()} results are reported as
        present/absent rather than as a concentration to be compared against a
        threshold.
      </p>
    );
  } else {
    paragraphs.push(
      <p key="equal">
        For {c.name} the enforceable limit and the health goal are the same number,{" "}
        <code>{mcl}</code>. EPA set the{" "}
        <strong>Maximum Contaminant Level (MCL)</strong> at the{" "}
        <strong>health goal (MCLG)</strong>, so there is no feasibility gap here:
        meeting the legal limit also means meeting the health-based goal. A value
        above <code>{mcl}</code> is both an exceedance of the goal and a violation of
        the enforceable standard.
      </p>
    );
  }

  paragraphs.push(
    <p key="unit">
      Results are reported in <code>{unit}</code>. A laboratory result and the limits
      above are only comparable when both are expressed in that same unit — a value
      in a different unit will be off by orders of magnitude. WaterQualityLens groups{" "}
      {c.name} under <strong>{c.category}</strong> for navigation; the grouping is
      ours, the limits are the regulator&rsquo;s.
    </p>
  );

  return <>{paragraphs}</>;
}

// --- Page -------------------------------------------------------------------

export default async function ContaminantPage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const c = CONTAMINANT_BY_CODE.get(params.code.toUpperCase());
  if (!c) notFound();

  const unit = unitLabel(c);
  const verified = verifiedFiltersFor(c.code);
  const isNitrate = NITRATE_CODES.has(c.code);
  const counts = claimCountsByStandard(c.code);
  const systems = systemsReporting(c.code);

  const standardsShown: NsfStandard[] = [
    ...(HEALTH_STANDARDS as readonly NsfStandard[]),
    ...(NON_HEALTH_STANDARDS as readonly NsfStandard[]),
    ...(c.category === "PFAS" ? (["P473"] as NsfStandard[]) : []),
  ];

  return (
    <>
      <Section tone="sunken" density="tight" className="pb-10">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Contaminant glossary", href: "/contaminants" },
              { label: c.name },
            ]}
          />

          <div className="mt-6 max-w-3xl animate-fade-up">
            <div className="flex items-center gap-3">
              <Eyebrow>{c.category}</Eyebrow>
              <Pill tone="ink">{c.code}</Pill>
            </div>
            <h1 className="text-display-2 text-ink-900 dark:text-white">
              {c.name}
            </h1>
            {c.health_effects ? (
              <div className="mt-5 border-l-2 border-ink-200 pl-4 dark:border-white/15">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  <Tooltip content="The health basis on which the EPA sets this contaminant's legal limit. Reported verbatim from the regulatory record — it is not a diagnosis or a prediction about any individual.">
                    EPA health-effects basis
                  </Tooltip>
                </p>
                <p className="mt-2 text-lede text-ink-600 dark:text-ink-300">
                  {c.health_effects}
                </p>
              </div>
            ) : null}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-6 rounded-2xl bg-surface-raised p-6 shadow-card ring-1 ring-ink-900/[0.055] sm:grid-cols-4 sm:p-8 dark:ring-white/10">
            <div>
              <dt className="sr-only">Maximum contaminant level</dt>
              <dd>
                <Stat
                  value={c.mcl != null ? formatValue(c.mcl, unit) : "None"}
                  label="Legal MCL"
                  sub="Enforceable federal limit"
                />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Health goal</dt>
              <dd>
                <Stat
                  value={
                    c.health_goal != null ? formatValue(c.health_goal, unit) : "—"
                  }
                  label="Health goal (MCLG)"
                  sub={c.health_goal === 0 ? "No safe exposure level" : "No known health risk"}
                />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Category</dt>
              <dd>
                <Stat value={<span className="text-2xl">{c.category}</span>} label="Category" />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Reporting unit</dt>
              <dd>
                <Stat value={<span className="text-2xl">{unit}</span>} label="Reporting unit" />
              </dd>
            </div>
          </dl>
        </Container>
      </Section>

      <WaveDivider flip className="-mt-px text-surface-sunken" />

      {isNitrate ? (
        <Section density="tight" className="pt-0 pb-0">
          <Container>
            <Card className="border border-brand-200 bg-brand-50 p-6 dark:border-brand-300/25 dark:bg-brand-300/10">
              <div className="flex items-center gap-2">
                <Badge className="border-transparent bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                  Reverse osmosis required
                </Badge>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-900 dark:text-brand-100">
                {NITRATE_WARNING}
              </p>
            </Card>
          </Container>
        </Section>
      ) : null}

      {/* (a) Regulation --------------------------------------------------- */}
      <Section id="regulation">
        <Container>
          <SectionHeading
            eyebrow="Regulatory basis"
            title={`How ${c.name} is regulated`}
            lede="What the enforceable limit actually obliges a utility to do, and how it differs from the health-based goal it is measured against."
            id="regulation-heading"
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-14">
            <Prose className={PROSE_DARK}>
              <RegulationCopy c={c} />
            </Prose>

            <Card className="h-fit p-6">
              <h3 className="text-title-2 text-ink-900 dark:text-white">
                The record for {c.name}
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Enforceable limit (MCL)", limitValue(c) ?? "None set federally"],
                  ["Health goal (MCLG)", goalValue(c) ?? "Not set"],
                  ["Reporting unit", unit],
                  ["Category", c.category],
                  ["Contaminant code", c.code],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="text-ink-600 dark:text-ink-300">{label}</dt>
                    <dd className="text-right font-mono font-medium text-ink-900 dark:text-white">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                Limits as published by EPA and state primacy agencies. This page
                reports regulatory and certification records; it does not assess
                anyone&rsquo;s exposure and makes no health prediction.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* (b) Certifications ------------------------------------------------ */}
      <Section id="certifications" tone="sunken">
        <Container>
          <SectionHeading
            eyebrow="Certification scope"
            title={`Which certifications actually remove ${c.name}`}
            lede={
              <>
                Only NSF/ANSI{" "}
                {HEALTH_STANDARDS.map((s, i) => (
                  <span key={s}>
                    {i > 0 ? (i === HEALTH_STANDARDS.length - 1 ? " and " : ", ") : ""}
                    {s}
                  </span>
                ))}{" "}
                are health-contaminant standards. A product certified only to
                Standard 42 (aesthetics) or 372 (lead-free materials) has{" "}
                <strong>not</strong> been verified to reduce {c.name}, however the box
                is worded.
              </>
            }
            id="certifications-heading"
          />

          <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {standardsShown.map((s) => {
              const meta = CERTIFICATIONS[s];
              const n = counts.get(s) ?? 0;
              const badge = meta.is_obsolete
                ? { text: "Retired standard", tone: "ink" as const }
                : meta.is_health
                  ? { text: "Counts — health standard", tone: "verdant" as const }
                  : { text: "Does not count — not a health standard", tone: "ink" as const };

              return (
                <Card as="li" key={s} className="flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-title-2 text-ink-900 dark:text-white">
                      {standardLabel(s)}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="font-mono text-2xl font-semibold tabular-nums text-ink-900 dark:text-white"
                    >
                      {n}
                    </span>
                  </div>

                  <div className="mt-3">
                    <Badge tone={badge.tone}>{badge.text}</Badge>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {meta.description}
                  </p>

                  <p className="mt-3 border-t border-hairline pt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {meta.is_obsolete ? (
                      <>
                        No current certification should rest on {standardLabel(s)}{" "}
                        alone. {n > 0
                          ? `${n} registry product${n === 1 ? "" : "s"} still reference${n === 1 ? "s" : ""} it for ${c.name}; treat that as a claim to re-verify under 53 or 58.`
                          : `No registry product references it for ${c.name}.`}
                      </>
                    ) : meta.is_health ? (
                      n > 0 ? (
                        <>
                          <strong>
                            {n} filter{n === 1 ? "" : "s"} in our registry
                          </strong>{" "}
                          hold{n === 1 ? "s" : ""} an independently verified{" "}
                          {standardLabel(s)} claim for {c.name}, listed below.
                        </>
                      ) : isNitrate && s === "53" ? (
                        <>
                          No filter in our registry holds a verified{" "}
                          {standardLabel(s)} claim for {c.name}, and Standard 53
                          covers carbon-based reduction, which does not remove{" "}
                          {c.name}.{" "}
                          <strong>
                            Reverse osmosis certified to NSF/ANSI 58 is the treatment
                            that applies here.
                          </strong>
                        </>
                      ) : (
                        <>
                          No filter in our registry holds a verified{" "}
                          {standardLabel(s)} claim for {c.name}. That means we hold no
                          certification record — not that the standard could never
                          cover it.
                        </>
                      )
                    ) : n > 0 ? (
                      <>
                        <strong>
                          {n} registry product{n === 1 ? "" : "s"} carr
                          {n === 1 ? "ies" : "y"} an {standardLabel(s)} claim
                          referencing {c.name}
                        </strong>{" "}
                        — and it still does not mean the product was verified to
                        reduce {c.name} from your water. Read it as a{" "}
                        {s === "372" ? "manufacturing-materials" : "taste-and-odour"}{" "}
                        claim only.
                      </>
                    ) : (
                      <>
                        No registry product lists {c.name} under {standardLabel(s)}.
                        It would not count as verification of {c.name} reduction in
                        any case.
                      </>
                    )}
                  </p>
                </Card>
              );
            })}
          </ul>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
            Counts are of active products in the WaterQualityLens filter registry
            holding a verified claim for contaminant code{" "}
            <span className="font-mono">{c.code}</span> under that standard, as
            recorded by the certifying body (NSF, WQA, or IAPMO). Certification is
            granted per contaminant, not per product: a filter certified to Standard
            53 for one contaminant is not thereby certified for {c.name}.
          </p>
        </Container>
      </Section>

      {/* (c) Systems reporting it ------------------------------------------ */}
      {systems.length > 0 ? (
        <Section id="systems">
          <Container>
            <SectionHeading
              eyebrow="Entity graph"
              title={`Systems reporting ${c.name}`}
              lede={`Water systems in our coverage whose most recent published sample set includes ${c.name}. Each value carries its sample date and the agency that reported it.`}
              id="systems-heading"
            />

            <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {systems.map(({ system, detection }) => {
                const ratio = formatRatio(detection.mcl_ratio);
                return (
                  <Card as="li" key={system.pwsid} interactive className="group">
                    <Link
                      href={`/pws/${system.pwsid}`}
                      className="flex h-full flex-col rounded-2xl p-6 outline-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-title-2 text-ink-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-200">
                          {system.name}
                        </h3>
                        <Pill tone="ink">{system.pwsid}</Pill>
                      </div>
                      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                        {[system.county ? `${system.county} County` : null, system.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>

                      <p className="mt-4 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-semibold tabular-nums text-ink-900 dark:text-white">
                          {formatValue(detection.value, formatUnit(detection.unit))}
                        </span>
                        {ratio && detection.exceeds_mcl ? (
                          <span className="text-sm text-ink-500 dark:text-ink-400">
                            {ratio} the federal limit
                          </span>
                        ) : null}
                      </p>

                      <div className="mt-3">
                        <Badge className={severityChipClass(detection)}>
                          {severityLabel(detection)}
                        </Badge>
                      </div>

                      <p className="mt-4 flex-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                        Sampled {formatDate(detection.sample_date)} · Reported by{" "}
                        {detection.sampling_agency ?? "the reporting utility"} · Source{" "}
                        {detection.source}
                      </p>
                      <span className="mt-4 text-sm font-medium text-brand-700 dark:text-brand-200">
                        View the full system record →
                      </span>
                    </Link>
                  </Card>
                );
              })}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Hardware — commercial placements, kept below the objective record -- */}
      <Section id="hardware" tone="sunken">
        <Container>
          <div className="rounded-3xl border border-hairline bg-surface-base p-6 shadow-card sm:p-10">
            <SectionHeading
              eyebrow="Certified reduction · commercial placements"
              title={`Filters verified to reduce ${c.name}`}
              lede={
                <>
                  These filters hold an independent NSF/ANSI <strong>health</strong>{" "}
                  certification (Standard 53, 58, or 401) specifically for {c.name}.
                  Certification against a health standard means an accredited lab
                  verified the filter reduces this contaminant — a materials-only
                  claim such as NSF 42 or 372 does not.
                </>
              }
              id="hardware-heading"
            />

            {verified.some(({ filter }) => offerFor(filter)) && (
              <AffiliateDisclosure paid={verified.some(({ filter }) => offerFor(filter)?.paid)} />
            )}
            {verified.length > 0 ? (
              <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {verified.map(({ filter, standards, certifiers }) => {
                  const offer = offerFor(filter);
                  return (
                  <Card as="li" key={filter.id} className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-brand-700 dark:text-brand-200">
                          {filter.brand}
                        </div>
                        <h3 className="text-title-2 text-ink-900 dark:text-white">
                          {filter.model}
                        </h3>
                      </div>
                      <Badge tone="verdant">Certification verified</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="ink">{filter.sku}</Pill>
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        {FORM_FACTOR_LABEL[filter.form_factor]}
                      </span>
                      <span className="font-mono text-sm font-semibold text-ink-900 dark:text-white">
                        {usd(filter.price_usd)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {standards.map((s) => (
                        <Badge key={s} tone="verdant">
                          {standardLabel(s)}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 flex-1 text-xs text-ink-500 dark:text-ink-400">
                      Certified by {certifiers.join(", ")}
                    </p>

                    {offer ? (
                      <div className="mt-5 pt-1">
                        <Button
                          href={offer.href}
                          external
                          rel={offer.rel}
                          variant="secondary"
                          fullWidth
                          aria-label={`View the ${filter.brand} ${filter.model} on ${filter.brand}'s site (opens in a new tab)`}
                        >
                          View at {filter.brand}
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                  );
                })}
              </ul>
            ) : (
              <Card className="mt-8 p-6">
                <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  No filter in our registry currently holds an independent NSF/ANSI
                  health certification specifically for {c.name}.{" "}
                  {isNitrate
                    ? "Reverse-osmosis systems certified to NSF/ANSI 58 are the appropriate treatment; see the registry for RO options."
                    : "For contaminants without a certified point-of-use option, treatment at the utility level or a physical lab test is the appropriate next step."}
                </p>
                <div className="mt-4">
                  <Button href="/registry" variant="secondary">
                    Browse the Filter Certification Registry →
                  </Button>
                </div>
              </Card>
            )}

            <p className="mt-8 max-w-3xl text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              Hardware links are affiliate placements marked &ldquo;Verified
              Partner.&rdquo; Products appear here solely because they hold an
              independently verified NSF/ANSI health certification for {c.name};
              commercial arrangements never affect this list.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
