import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  Stat,
  Tooltip,
} from "@/components/ui";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import {
  TableOfContents,
  type TocItem,
} from "@/components/institutional/TableOfContents";
import { TrendLine } from "@/components/entities/TrendLine";
import { demoProfile } from "@/lib/lookup";
import { matchFilters } from "@/lib/engine";
import { CONTAMINANT_BY_CODE, contaminantName, DEMO_SYSTEMS } from "@/lib/data";
import {
  FORM_FACTOR_LABEL,
  formatDate,
  formatUnit,
  formatValue,
  severityChipClass,
  severityLabel,
  standardLabel,
  usd,
} from "@/lib/format";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { offerAriaLabel, offerFor, offerLinkText } from "@/lib/offers";
import { DISCLAIMER_AFFILIATE, DISCLAIMER_PLUMBING } from "@/lib/constants";
import type { Detection, RecommendedFilter, Violation } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return DEMO_SYSTEMS.map((d) => ({ pwsid: d.system.pwsid }));
}

const SOURCE_LABEL: Record<string, string> = {
  SW: "Surface water",
  GW: "Groundwater",
  GU: "Groundwater under surface influence",
};

interface Assessment {
  exceedances: Detection[];
  recommendations: RecommendedFilter[];
  indexable: boolean;
}

function assess(profile: NonNullable<ReturnType<typeof demoProfile>>): Assessment {
  const exceedances = profile.detections.filter((d) => d.exceeds_mcl);
  const recommendations = matchFilters(profile.detections, "UNKNOWN");
  // Quality gate (§9): keep empty stubs out of the index, but let a genuine
  // entity page through. A system with at least one reported detection and a
  // multi-point sampling history is a real record worth crawling — the filter
  // catalogue is commercial inventory and must not decide indexability.
  // Mirrored in app/sitemap.ts; the two must stay in step.
  const indexable = profile.detections.length >= 1 && profile.history.length >= 2;
  return { exceedances, recommendations, indexable };
}

// --- Metadata ---------------------------------------------------------------

export async function generateMetadata(
  props: {
    params: Promise<{ pwsid: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const profile = demoProfile(params.pwsid.toUpperCase());
  if (!profile) {
    return { title: "Water system not found", robots: { index: false, follow: true } };
  }

  const u = profile.utility;
  const place = [u.county ? `${u.county} County` : null, u.state].filter(Boolean).join(", ");
  const { exceedances, indexable } = assess(profile);
  const headline = exceedances[0]
    ? `${exceedances[0].name} reported at ${formatValue(
        exceedances[0].value,
        formatUnit(exceedances[0].unit)
      )}`
    : "reported contaminant levels";

  const title = `${u.name} Water Quality (${u.pwsid})`;
  const description = `Contaminants reported by ${u.name}${
    place ? ` in ${place}` : ""
  } to the EPA — ${headline}, each with its sample date, testing agency, and legal limit, plus the specific NSF/ANSI-certified filters proven to reduce them.`;

  return {
    title,
    description,
    alternates: { canonical: `/pws/${u.pwsid}` },
    openGraph: { title: `${title} · WaterQualityLens`, description },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

// --- Local presentational pieces --------------------------------------------

/**
 * A contaminant name is always a route into its own reference page — but only
 * when we actually hold a definition for the code (the route is statically
 * generated from CONTAMINANTS, so an unknown code would 404).
 */
function ContaminantLink({
  code,
  name,
  className = "",
}: {
  code: string | null;
  name: string;
  className?: string;
}) {
  if (!code || !CONTAMINANT_BY_CODE.has(code)) {
    return <span className={className}>{name}</span>;
  }
  return (
    <Link
      href={`/contaminants/${code}`}
      className={`underline decoration-brand-300 decoration-1 underline-offset-4 transition-colors hover:text-brand-700 hover:decoration-brand-500 dark:decoration-brand-300/50 dark:hover:text-brand-200 ${className}`}
    >
      {name}
    </Link>
  );
}

function SeverityBadge({ d }: { d: Detection }) {
  return <Badge className={severityChipClass(d)}>{severityLabel(d)}</Badge>;
}

function ContaminantRow({ d }: { d: Detection }) {
  const unit = formatUnit(d.unit);
  return (
    <tr className="border-b border-hairline align-top last:border-0">
      <th scope="row" className="px-5 py-4 font-normal">
        <ContaminantLink
          code={d.code}
          name={d.name}
          className="font-semibold text-ink-900 dark:text-white"
        />
        <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{d.category}</div>
        {d.health_effects ? (
          <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            <Tooltip content={d.health_effects}>Health effects</Tooltip>
          </div>
        ) : null}
      </th>
      <td className="px-5 py-4">
        <div className="font-mono text-sm font-semibold text-ink-900 dark:text-white">
          {formatValue(d.value, unit)}
        </div>
        <div className="mt-1.5">
          <SeverityBadge d={d} />
        </div>
      </td>
      <td className="px-5 py-4 font-mono text-sm text-ink-700 dark:text-ink-200">
        {d.mcl != null ? formatValue(d.mcl, unit) : "No federal MCL"}
      </td>
      <td className="px-5 py-4 font-mono text-sm text-ink-700 dark:text-ink-200">
        {d.health_goal != null ? formatValue(d.health_goal, unit) : "—"}
      </td>
      <td className="px-5 py-4 text-sm text-ink-700 dark:text-ink-200">
        {formatDate(d.sample_date)}
      </td>
      <td className="px-5 py-4 text-sm text-ink-700 dark:text-ink-200">
        {d.sampling_agency ?? "—"}
        <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{d.source}</div>
      </td>
    </tr>
  );
}

/**
 * Below `md` the six-column provenance table cannot be shown without amputating
 * the columns that make a number citable, so the same record is restacked as a
 * card. Nothing is dropped: measured value, MCL, MCLG, sample date and agency
 * all travel with the reading.
 */
function ContaminantCard({ d }: { d: Detection }) {
  const unit = formatUnit(d.unit);
  const cells: Array<[string, string, boolean]> = [
    ["Reported value", formatValue(d.value, unit), true],
    ["Legal MCL", d.mcl != null ? formatValue(d.mcl, unit) : "No federal MCL", true],
    ["Health goal (MCLG)", d.health_goal != null ? formatValue(d.health_goal, unit) : "—", true],
    ["Sampled", formatDate(d.sample_date), false],
    ["Agency", d.sampling_agency ?? "—", false],
    ["Source record", d.source, false],
  ];

  return (
    <Card as="li" className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-title-2">
            <ContaminantLink code={d.code} name={d.name} />
          </h3>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{d.category}</p>
        </div>
        <SeverityBadge d={d} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hairline pt-4 text-sm">
        {cells.map(([label, value, mono]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {label}
            </dt>
            <dd
              className={`mt-0.5 text-ink-800 dark:text-ink-100 ${mono ? "font-mono" : ""}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {d.health_effects ? (
        <p className="mt-4 border-l-2 border-ink-200 pl-4 text-sm leading-relaxed text-ink-600 dark:border-white/15 dark:text-ink-300">
          {d.health_effects}
        </p>
      ) : null}
    </Card>
  );
}

function ViolationCard({ v }: { v: Violation }) {
  const name = v.contaminant_code ? contaminantName(v.contaminant_code) : "General compliance";
  return (
    <Card as="li" className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={v.is_health_based ? "brand" : "ink"}>
          {v.is_health_based ? "Health-based" : "Monitoring"}
        </Badge>
        {v.violation_category ? <Badge tone="ink">{v.violation_category}</Badge> : null}
        <Pill tone="ink">{v.violation_id}</Pill>
      </div>
      <h3 className="mt-3 text-title-2">
        <ContaminantLink code={v.contaminant_code} name={name} />
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-500 dark:text-ink-400">Began</dt>
          <dd className="font-medium text-ink-800 dark:text-ink-100">
            {formatDate(v.begin_date)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500 dark:text-ink-400">Status</dt>
          <dd className="font-medium text-ink-800 dark:text-ink-100">{v.status ?? "—"}</dd>
        </div>
      </dl>
    </Card>
  );
}

function RecommendationCard({ r }: { r: RecommendedFilter }) {
  const offer = offerFor(r);
  return (
    <Card as="li" className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-brand-700 dark:text-brand-200">
            {r.brand}
          </div>
          <h3 className="text-title-2">{r.model}</h3>
        </div>
        <Badge tone="verdant">Certification verified</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone="ink">{r.sku}</Pill>
        <span className="text-sm text-ink-600 dark:text-ink-300">
          {FORM_FACTOR_LABEL[r.form_factor]}
        </span>
        <span className="font-mono text-sm font-semibold text-ink-900 dark:text-white">
          {usd(r.price_usd)}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Certified to reduce
        </div>
        <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
          {r.neutralizes.map((c, i) => (
            <span key={c}>
              {i > 0 ? ", " : ""}
              <ContaminantLink code={c} name={contaminantName(c)} />
            </span>
          ))}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.certified_standards.map((s) => (
            <Badge key={s} tone="verdant">
              {standardLabel(s)}
            </Badge>
          ))}
        </div>
      </div>

      {offer ? (
        <div className="mt-5 pt-1">
          <Button
            href={offer.href}
            external
            rel={offer.rel}
            variant="secondary"
            fullWidth
            aria-label={offerAriaLabel(offer, r.brand, r.model)}
          >
            {offerLinkText(offer, r.brand)}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

// --- Page -------------------------------------------------------------------

export default async function PwsPage(props: { params: Promise<{ pwsid: string }> }) {
  const params = await props.params;
  const profile = demoProfile(params.pwsid.toUpperCase());
  if (!profile) notFound();

  const u = profile.utility;
  const { exceedances, recommendations } = assess(profile);
  const place = [u.county ? `${u.county} County` : null, u.state].filter(Boolean).join(", ");

  // History grouped by contaminant, latest-heavy series first.
  const historyByCode = new Map<string, typeof profile.history>();
  for (const h of profile.history) {
    const arr = historyByCode.get(h.code) ?? [];
    arr.push(h);
    historyByCode.set(h.code, arr);
  }
  const trends = [...historyByCode.entries()].sort((a, b) => b[1].length - a[1].length);

  const toc: TocItem[] = [
    { id: "contaminants", label: "Reported contaminants" },
    ...(trends.length > 0 ? [{ id: "trends", label: "Sampling trends" }] : []),
    ...(profile.violations.length > 0
      ? [{ id: "violations", label: "Active violations" }]
      : []),
    ...(recommendations.length > 0
      ? [{ id: "filters", label: "Certified filtration" }]
      : []),
    { id: "plumbing", label: "Home plumbing" },
  ];

  return (
    <>
      {/* Header */}
      <Section tone="sunken" density="default" className="pb-10">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Water systems", href: "/pws" },
              { label: u.name },
            ]}
          />

          <div className="mt-6 animate-fade-up">
            <Eyebrow>Public water system</Eyebrow>
            <h1 className="text-display-2">{u.name}</h1>
            <p className="mt-4 max-w-2xl text-lede text-ink-600 dark:text-ink-300">
              Contaminants this utility reported to the EPA Safe Drinking Water
              Information System, shown with full provenance — sample date, testing
              agency, unit, and the legal maximum contaminant level. Data reflects
              utility-level reporting and cannot detect contamination introduced by
              your home&rsquo;s own plumbing.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <dt className="sr-only">PWSID</dt>
              <dd>
                <Stat value={<span className="text-2xl">{u.pwsid}</span>} label="EPA system ID" />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Location</dt>
              <dd>
                <Stat value={<span className="text-2xl">{u.state ?? "—"}</span>} label={place || "Location"} />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Population served</dt>
              <dd>
                <Stat
                  value={u.population_served ? u.population_served.toLocaleString("en-US") : "—"}
                  label="Population served"
                />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Primary source</dt>
              <dd>
                <Stat
                  value={
                    <span className="text-2xl">
                      {u.primary_source ?? "—"}
                    </span>
                  }
                  label="Primary source"
                  sub={u.primary_source ? SOURCE_LABEL[u.primary_source] : undefined}
                />
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-xs text-ink-500 dark:text-ink-400">
            Data as of {formatDate(profile.fetched_at)} · Source: EPA SDWIS / state
            primacy agency
          </p>

          {toc.length >= 4 ? (
            <div className="mt-8 border-t border-hairline pt-6">
              <TableOfContents items={toc} />
            </div>
          ) : null}
        </Container>
      </Section>

      {/* Reported contaminants */}
      <Section id="contaminants" density="default">
        <Container>
          <SectionHeading
            title="Reported contaminants"
            lede={
              <>
                Every value is compared against its federal maximum contaminant level
                (MCL) — the enforceable legal limit — and its health goal (MCLG), the
                level at which no known health effects occur. Select a contaminant
                name for its full reference entry, or &ldquo;Health effects&rdquo; for
                the documented basis of its limit.
              </>
            }
          />

          {/* md+ : the full provenance table */}
          <div
            className="mt-8 hidden overflow-x-auto rounded-2xl border border-hairline shadow-card md:block"
            tabIndex={0}
            role="region"
            aria-label={`Reported contaminants for ${u.name} — scrollable table`}
          >
            <table className="w-full min-w-[52rem] border-collapse bg-surface-raised text-left">
              <caption className="sr-only">
                Contaminants reported by {u.name}, with measured value, legal MCL,
                health goal, sample date, and testing agency.
              </caption>
              <thead>
                <tr className="border-b border-hairline bg-surface-sunken">
                  {["Contaminant", "Reported value", "Legal MCL", "Health goal (MCLG)", "Sampled", "Agency"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {profile.detections.map((d) => (
                  <ContaminantRow key={d.code} d={d} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Below md : the same record, restacked so no column is cut off */}
          <ul className="mt-8 space-y-4 md:hidden">
            {profile.detections.map((d) => (
              <ContaminantCard key={d.code} d={d} />
            ))}
          </ul>

          {exceedances.length > 0 ? (
            <p className="mt-4 text-sm text-ink-600 dark:text-ink-300">
              {exceedances.length} contaminant{exceedances.length === 1 ? "" : "s"}{" "}
              exceeded the federal MCL in the most recent reporting period.
            </p>
          ) : (
            <p className="mt-4 text-sm text-ink-600 dark:text-ink-300">
              No reported contaminant exceeded its federal MCL in the most recent
              reporting period.
            </p>
          )}
        </Container>
      </Section>

      {/* Trends */}
      {trends.length > 0 ? (
        <Section id="trends" tone="sunken" density="default">
          <Container>
            <SectionHeading
              title="Sampling trends over time"
              lede="How reported concentrations have moved across recent sampling periods. The dashed reference line marks the federal MCL."
            />

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {trends.map(([code, series]) => {
                const def = CONTAMINANT_BY_CODE.get(code);
                const name = def?.name ?? code;
                const unit = series[0]?.unit ?? def?.unit ?? "";
                return (
                  <Card key={code} className="p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-title-2">
                        <ContaminantLink code={code} name={name} />
                      </h3>
                      <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                        {formatUnit(unit)}
                      </span>
                    </div>
                    <div className="mt-4">
                      <TrendLine
                        points={series.map((s) => ({
                          sample_date: s.sample_date,
                          value: s.value,
                        }))}
                        unit={unit}
                        label={name}
                        mcl={def?.mcl ?? null}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Active violations */}
      {profile.violations.length > 0 ? (
        <Section id="violations" density="default">
          <Container>
            <SectionHeading
              title="Active violations"
              lede="Formal violations this system has on record with its state primacy agency. Health-based violations concern contaminant levels; monitoring violations concern reporting or testing procedure."
            />
            <ul className="mt-8 grid gap-6 md:grid-cols-2">
              {profile.violations.map((v) => (
                <ViolationCard key={v.violation_id} v={v} />
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <Section id="filters" tone="sunken" density="default">
          <Container>
            <SectionHeading
              eyebrow="Certified filtration"
              title="Filters certified for these contaminants"
              lede="Each filter below holds independent NSF/ANSI health certification for every contaminant this system reported above its health goal. Products are surfaced by certification match, not commercial arrangement."
            />

            {recommendations.some((filter) => offerFor(filter)) && (
              <AffiliateDisclosure paid={recommendations.some((filter) => offerFor(filter)?.paid)} />
            )}
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((r) => (
                <RecommendationCard key={r.id} r={r} />
              ))}
            </ul>

            <p className="mt-8 max-w-3xl text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              {DISCLAIMER_AFFILIATE}
            </p>
          </Container>
        </Section>
      ) : null}

      {/* Plumbing disclaimer */}
      <Section id="plumbing" density="tight">
        <Container>
          <Card className="border border-brand-100 bg-brand-50/50 p-6 dark:border-brand-300/20 dark:bg-brand-300/[0.06]">
            <h2 className="text-title-2">A note on your home&rsquo;s plumbing</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {DISCLAIMER_PLUMBING}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/methodology" variant="ghost" size="sm">
                How we source and grade this data
                <span aria-hidden="true">→</span>
              </Button>
              <Button href="/pws" variant="ghost" size="sm">
                All water systems
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
