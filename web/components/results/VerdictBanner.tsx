import { Container } from "@/components/ui";
import { formatRatio, formatUnit, formatValue } from "@/lib/format";
import type { Detection, LookupResult, Violation } from "@/lib/types";

// -----------------------------------------------------------------------------
// The answer, stated first.
//
// The user asked one question — "is something wrong with my water?" — and the
// report previously made them read the utility name, a confidence banner, and a
// paragraph of prose before the first status badge appeared, well below the fold.
// This states the finding immediately, in plain counts, with the worst offender
// quantified. Tone stays factual: it reports what the utility reported.
// -----------------------------------------------------------------------------

function headline(
  exceedMcl: number,
  goalOnly: number
): { title: string; kind: "exceed" | "goal" | "clear" } {
  if (exceedMcl > 0) {
    return {
      kind: "exceed",
      title: `${exceedMcl} contaminant${exceedMcl === 1 ? "" : "s"} above a federal legal limit`,
    };
  }
  if (goalOnly > 0) {
    return {
      kind: "goal",
      title: `${goalOnly} contaminant${goalOnly === 1 ? "" : "s"} above a health-based goal`,
    };
  }
  return { kind: "clear", title: "No reported exceedances" };
}

function Metric({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-brand-100">{label}</div>
      {sub ? <div className="mt-0.5 text-xs text-brand-200/80">{sub}</div> : null}
    </div>
  );
}

export function VerdictBanner({
  result,
  address,
}: {
  result: LookupResult;
  address: string;
}) {
  const detections: Detection[] = result.detected_contaminants;
  const exceedMcl = detections.filter((d) => d.exceeds_mcl);
  const goalOnly = detections.filter((d) => !d.exceeds_mcl && d.exceeds_health_goal);
  const healthViolations: Violation[] = result.active_violations.filter(
    (v) => v.is_health_based
  );

  const { title, kind } = headline(exceedMcl.length, goalOnly.length);

  // Worst offender = highest multiple of its federal limit.
  const worst = detections.reduce<Detection | null>((acc, d) => {
    if (d.mcl_ratio == null) return acc;
    if (!acc || (acc.mcl_ratio ?? 0) < d.mcl_ratio) return d;
    return acc;
  }, null);
  const worstRatio = formatRatio(worst?.mcl_ratio ?? null);

  const noSamples = result.meta.resolution === "ZIP_REGISTRY";

  return (
    <section
      aria-labelledby="verdict-heading"
      className="relative -mx-6 overflow-hidden bg-brand-950 px-6 py-10 sm:rounded-3xl sm:py-12"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(80% 70% at 85% 0%, rgba(43,118,166,0.45), transparent 62%)",
        }}
      />
      <Container className="relative !px-0">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-brand-200/80">
          Water report · {result.utility?.name ?? "Unmatched"}
        </p>
        <h1
          id="verdict-heading"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          {noSamples ? "Verified water quality records unavailable" : title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-100">
          {noSamples ? (
            <>
              The EPA ZIP registry returned a potential system for{" "}
              <span className="font-medium text-white">{address}</span>.
              Tap to Glass has no verified measurements or violation records to display.
            </>
          ) : kind === "clear" ? (
            <>
              For <span className="font-medium text-white">{address}</span>, this utility
              reported no contaminant above a federal limit or health-based goal in the
              samples we hold.
            </>
          ) : (
            <>
              For <span className="font-medium text-white">{address}</span>, as reported by
              the utility to the EPA. These are the utility&rsquo;s own published figures,
              not our measurements.
            </>
          )}
        </p>

        {!noSamples && detections.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-6 sm:grid-cols-4">
            <Metric
              value={String(exceedMcl.length)}
              label="Above federal limit"
              sub="Exceeds the legal MCL"
            />
            <Metric
              value={String(goalOnly.length)}
              label="Above health goal"
              sub="Within the legal limit"
            />
            <Metric
              value={String(healthViolations.length)}
              label="Open health violations"
              sub="On record with the EPA"
            />
            {worst && worstRatio ? (
              <Metric
                value={worstRatio}
                label={`${worst.name} vs. limit`}
                sub={`${formatValue(worst.value, formatUnit(worst.unit))} measured`}
              />
            ) : (
              <Metric
                value={String(result.recommended_filters.length)}
                label="Certified filters match"
                sub="Cover every flagged hazard"
              />
            )}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
