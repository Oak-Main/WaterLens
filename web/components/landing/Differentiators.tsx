import { Container, Section, Card, Badge, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type Row = {
  dimension: string;
  ours: string;
  others: string;
};

const ROWS: Row[] = [
  {
    dimension: "Location precision",
    ours: "EPA ZIP registry with supplier confirmation on your water bill",
    others: "ZIP codes, which routinely span several different utilities",
  },
  {
    dimension: "How limits are set",
    ours: "EPA regulatory references and links to official water records",
    others: "Proprietary thresholds well below any regulatory standard",
  },
  {
    dimension: "Filter verification",
    ours: "SKU-level, independent NSF/ANSI certification for each contaminant",
    others: "Broad brand affiliate links, not verified per-contaminant SKUs",
  },
  {
    dimension: "Commercial incentive",
    ours: "Vendor-agnostic — we don’t manufacture or sell any filter",
    others: "Some diagnostic sites sell the very filter they recommend",
  },
];

export function Differentiators() {
  return (
    <Section id="why-different" tone="base">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Why we’re different"
            title="An auditor’s standard, not an advocacy pitch"
            lede="Most water-quality tools are built to alarm or to sell. We link to official water records and list independent filter certifications. Here is how that compares to the common approaches."
          />
        </Reveal>

        <Reveal delay={80}>
          {/* Comparison table (md and up) */}
          <div className="mt-10 hidden overflow-hidden rounded-2xl bg-surface-raised shadow-card ring-1 ring-ink-900/[0.055] md:block dark:ring-white/10">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                WaterQualityLens compared with common water-quality tools
              </caption>
              <thead>
                <tr className="border-b border-hairline bg-surface-sunken">
                  <th
                    scope="col"
                    className="w-1/4 px-6 py-4 text-sm font-semibold text-ink-700 dark:text-ink-200"
                  >
                    Dimension
                  </th>
                  <th scope="col" className="w-2/5 px-6 py-4">
                    <Badge tone="verdant">WaterQualityLens</Badge>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-sm font-semibold text-ink-500 dark:text-ink-400"
                  >
                    Common approaches
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.dimension}
                    className="border-b border-hairline align-top last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-6 py-5 text-sm font-medium text-ink-700 dark:text-ink-200"
                    >
                      {row.dimension}
                    </th>
                    <td className="px-6 py-5">
                      <div className="flex gap-2.5 text-sm text-ink-800 dark:text-ink-100">
                        <span className="mt-0.5 shrink-0 text-verdant-600 dark:text-verdant-300" aria-hidden="true">
                          <CheckIcon />
                        </span>
                        <span>{row.ours}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2.5 text-sm text-ink-500 dark:text-ink-400">
                        <span className="mt-0.5 shrink-0 text-ink-400 dark:text-ink-500" aria-hidden="true">
                          <DashIcon />
                        </span>
                        <span>{row.others}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards (mobile). No column headers here, so each side is
              named in text rather than left to the glyph alone. */}
          <div className="mt-8 grid gap-4 md:hidden">
            {ROWS.map((row) => (
              <Card key={row.dimension} className="p-5">
                <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {row.dimension}
                </p>
                <div className="mt-3 flex gap-2.5 text-sm text-ink-800 dark:text-ink-100">
                  <span className="mt-0.5 shrink-0 text-verdant-600 dark:text-verdant-300" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  <span>
                    <span className="sr-only">WaterQualityLens: </span>
                    {row.ours}
                  </span>
                </div>
                <div className="mt-2.5 flex gap-2.5 text-sm text-ink-500 dark:text-ink-400">
                  <span className="mt-0.5 shrink-0 text-ink-400 dark:text-ink-500" aria-hidden="true">
                    <DashIcon />
                  </span>
                  <span>
                    <span className="sr-only">Common approaches: </span>
                    {row.others}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
