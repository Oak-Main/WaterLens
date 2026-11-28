import { Container, Section, Stat, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { WaveDivider } from "@/components/graphics/WaveDivider";
import { CERTIFICATIONS, CONTAMINANTS, FILTERS, FILTER_CLAIMS } from "@/lib/data";
import type { ContaminantDefinition, NsfStandard } from "@/lib/types";

// -----------------------------------------------------------------------------
// Everything rendered here is derived from the shipped dataset at build time —
// no figure is hand-entered, so the panel cannot drift from the data it cites.
//
// Colour note: eight contaminant classes exceed what this palette can encode as
// distinct hues (the brand ramp yields five validated ordinal steps on the navy
// surface, and the house style bars alarm hues entirely). So class identity is
// carried by POSITION — one labelled, contiguous row per class — and the cell
// fill is reserved for a second, orthogonal fact: whether the EPA health goal
// for that contaminant is zero.
// -----------------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  Metal: "Metals",
  PFAS: "PFAS",
  Inorganic: "Inorganics",
  VOC: "VOCs",
  DBP: "DBPs",
  Radionuclide: "Radionuclides",
  Microbiological: "Microbial",
  Pesticide: "Pesticides",
};

type CategoryGroup = {
  category: string;
  label: string;
  items: ContaminantDefinition[];
};

const CATEGORY_GROUPS: CategoryGroup[] = (() => {
  const byCategory = new Map<string, ContaminantDefinition[]>();
  for (const c of CONTAMINANTS) {
    const bucket = byCategory.get(c.category);
    if (bucket) bucket.push(c);
    else byCategory.set(c.category, [c]);
  }
  return [...byCategory.entries()]
    .map(([category, items]) => ({
      category,
      label: CATEGORY_LABEL[category] ?? category,
      items,
    }))
    .sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
})();

const TOTAL = CONTAMINANTS.length;
const ZERO_GOAL = CONTAMINANTS.filter((c) => c.health_goal === 0).length;

/**
 * How much of the tracked set each standard reaches *under a health claim*.
 * NSF 42 (aesthetic) and NSF 372 (materials content) resolve to zero by
 * definition — which is the entire point of showing them on the same axis.
 */
const RAIL_NOTE: Record<string, string> = {
  "58": "Reverse osmosis — dissolved inorganics",
  "53": "Carbon block — health reduction",
  "401": "Emerging & incidental compounds",
  "42": "Aesthetic only — no health-removal claim",
  "372": "Materials only — no removal claim",
};

type Rail = {
  standard: NsfStandard;
  isHealth: boolean;
  covered: number;
  note: string;
};

const RAILS: Rail[] = (Object.keys(CERTIFICATIONS) as NsfStandard[])
  .filter((s) => !CERTIFICATIONS[s].is_obsolete)
  .map((standard) => {
    const codes = new Set(
      FILTER_CLAIMS.filter((c) => c.standard === standard).map((c) => c.contaminant_code)
    );
    const isHealth = CERTIFICATIONS[standard].is_health;
    return {
      standard,
      isHealth,
      covered: isHealth ? codes.size : 0,
      note: RAIL_NOTE[standard] ?? CERTIFICATIONS[standard].description,
    };
  })
  .sort((a, b) => b.covered - a.covered || Number(a.standard) - Number(b.standard));

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

/** One cell per tracked contaminant, grouped into a labelled row per class. */
function ContaminantMatrixFigure() {
  return (
    <figure className="flex h-full flex-col">
      <figcaption>
        <h3 className="text-title-2 text-white">
          <span className="font-mono tabular-nums">{TOTAL}</span> regulated
          contaminants tracked
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-brand-100">
          One cell per contaminant in the tracking set, grouped by class. A solid
          cell marks a contaminant whose EPA health goal (MCLG) is zero &mdash;{" "}
          <span className="font-mono tabular-nums">{ZERO_GOAL}</span> of{" "}
          <span className="font-mono tabular-nums">{TOTAL}</span> carry one.
        </p>
      </figcaption>

      <ul className="mt-6 flex-1 space-y-2.5">
        {CATEGORY_GROUPS.map((g) => (
          <li key={g.category} className="flex items-center gap-3">
            <span className="w-24 shrink-0 font-mono text-[10px] uppercase leading-tight tracking-wider text-brand-200 sm:w-28 sm:text-[11px]">
              {g.label}
            </span>
            <span className="flex flex-1 flex-wrap items-center gap-1" aria-hidden="true">
              {g.items.map((c) => (
                <span
                  key={c.code}
                  className={`h-2.5 w-2.5 rounded-full ${
                    c.health_goal === 0
                      ? "bg-brand-300"
                      : "border border-brand-300/60"
                  }`}
                />
              ))}
            </span>
            <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-white">
              {g.items.length}
            </span>
          </li>
        ))}
      </ul>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 font-mono text-[11px] text-brand-200">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-300" aria-hidden="true" />
          MCLG = 0 ({ZERO_GOAL})
        </li>
        <li className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full border border-brand-300/60"
            aria-hidden="true"
          />
          Numeric MCLG ({TOTAL - ZERO_GOAL})
        </li>
      </ul>
    </figure>
  );
}

/** Stacked rails — the "standards are not interchangeable" point, drawn. */
function StandardsFigure() {
  return (
    <figure className="flex h-full flex-col">
      <figcaption>
        <h3 className="text-title-2 text-white">
          <span className="font-mono tabular-nums">{RAILS.length}</span> NSF/ANSI
          standards audited
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-brand-100">
          How far each standard actually reaches across the tracked set, counting
          only contaminants a certified filter covers under a{" "}
          <em className="not-italic font-medium text-white">health</em> claim.
          Two of the five reach nothing.
        </p>
      </figcaption>

      <ul className="mt-6 flex-1 space-y-4">
        {RAILS.map((r) => (
          <li key={r.standard}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs font-semibold text-white">
                NSF/ANSI {r.standard}
              </span>
              <span className="font-mono text-xs tabular-nums text-brand-200">
                {r.covered} of {TOTAL}
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10"
              aria-hidden="true"
            >
              {r.covered > 0 ? (
                <div
                  className="h-full rounded-full bg-brand-300"
                  style={{ width: `${(r.covered / TOTAL) * 100}%` }}
                />
              ) : (
                // A measured zero, not missing data — the tick makes that visible.
                <div className="h-full w-0.5 rounded-full bg-brand-200/60" />
              )}
            </div>
            <p className="mt-1.5 text-xs leading-snug text-brand-200/85">{r.note}</p>
          </li>
        ))}
      </ul>

      <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-brand-200/85">
        Coverage reflects the certifications held by filters in our audited
        registry, not the full theoretical scope of each standard.
      </p>
    </figure>
  );
}

export function CoverageStats() {
  return (
    <>
      {/* Seam: the light section above spills into the dark band as a water line. */}
      <div className="bg-surface-base">
        <WaveDivider className="text-brand-950" />
      </div>

      <Section id="coverage" tone="inverse" density="loose" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <Container className="relative">
          <Reveal>
            <SectionHeading
              tone="inverse"
              eyebrow="Coverage & rigor"
              title="Grounded in public data and independent standards"
              lede="Explore federal contaminant references and the independent NSF/ANSI certifications listed in our filter registry."
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Panel>
                <ContaminantMatrixFigure />
              </Panel>
              <Panel>
                <StandardsFigure />
              </Panel>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-6 grid gap-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:grid-cols-2 sm:p-7">
              <Stat
                tone="inverse"
                value={`${FILTERS.length}`}
                label="Verified filter SKUs"
                sub="Certification checked per contaminant"
              />
              <Stat
                tone="inverse"
                value={`${RAILS.length}`}
                label="Certification standards listed"
                sub="Includes health, aesthetic, and materials standards"
              />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Seam: dark band resolving back down into the sunken section below. */}
      <div className="bg-surface-sunken">
        <WaveDivider className="text-brand-950" flip />
      </div>
    </>
  );
}
