import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { Badge, Button } from "@/components/ui";
import { DISCLAIMER_AFFILIATE } from "@/lib/constants";
import { offerFor } from "@/lib/offers";
import { contaminantName } from "@/lib/data";
import { FORM_FACTOR_LABEL, standardLabel, usd } from "@/lib/format";
import type { DwellingType, FormFactor, RecommendedFilter } from "@/lib/types";
import { FormFactorGlyph } from "./FormFactorGlyph";

function VerifiedPartnerBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-verdant-200 bg-verdant-50 px-2.5 py-0.5 text-xs font-medium text-verdant-700 dark:border-verdant-300/25 dark:bg-verdant-300/10 dark:text-verdant-200">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3 5 6v5.2c0 4.3 3 8.2 7 9.3 4-1.1 7-5 7-9.3V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Certification verified
    </span>
  );
}

function neutralizesLine(codes: string[]): string {
  const names = codes.map(contaminantName);
  if (names.length <= 4) return names.join(", ");
  return `${names.slice(0, 4).join(", ")} +${names.length - 4} more`;
}

/** Why the engine put this form factor first, in one plain sentence. */
function fitRationale(form: FormFactor, dwelling: DwellingType): string | null {
  if (dwelling === "SINGLE_FAMILY") {
    if (form === "UNDERSINK_RO" || form === "WHOLE_HOUSE") {
      return "Plumbed-in systems are the strongest fit for a home you own.";
    }
    if (form === "COUNTERTOP_RO") return "No plumbing work, but still reverse-osmosis coverage.";
  }
  if (dwelling === "MULTI_FAMILY_RENTAL") {
    if (form === "PITCHER") return "Nothing to install — the right fit for a rental.";
    if (form === "COUNTERTOP_RO" || form === "FAUCET") {
      return "Removable, so it suits a rental without plumbing changes.";
    }
    if (form === "UNDERSINK_RO" || form === "WHOLE_HOUSE") {
      return "Full coverage, but it needs permission to install.";
    }
  }
  return null;
}

function FilterCard({
  filter,
  dwelling,
  top,
}: {
  filter: RecommendedFilter;
  dwelling: DwellingType;
  top: boolean;
}) {
  const standards = [...filter.certified_standards];
  const rationale = top ? fitRationale(filter.form_factor, dwelling) : null;
  const offer = offerFor(filter);

  return (
    <article
      className={`relative flex w-[19rem] shrink-0 snap-start flex-col rounded-2xl bg-surface-raised p-5 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 sm:w-auto sm:shrink ${
        top
          ? "ring-2 ring-verdant-300 dark:ring-verdant-300/40"
          : "ring-1 ring-ink-900/[0.055] dark:ring-white/10"
      }`}
    >
      {top ? (
        <span className="absolute -top-2.5 left-5 rounded-full bg-verdant-500 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-white">
          Best coverage match
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <FormFactorGlyph form={filter.form_factor} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {filter.brand}
            </p>
            <h3 className="mt-0.5 text-base font-semibold leading-snug text-ink-900 dark:text-white">
              {filter.model}
            </h3>
          </div>
        </div>
        <VerifiedPartnerBadge />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600 dark:text-ink-300">
        <span>{FORM_FACTOR_LABEL[filter.form_factor]}</span>
        <span aria-hidden="true" className="text-ink-400">
          •
        </span>
        <span className="font-mono font-semibold text-ink-900 dark:text-white">
          {usd(filter.price_usd)}
        </span>
      </div>

      {rationale ? (
        <p className="mt-3 rounded-lg bg-verdant-50 px-3 py-2 text-xs leading-relaxed text-verdant-800 dark:bg-verdant-300/10 dark:text-verdant-200">
          {rationale}
        </p>
      ) : null}

      {standards.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Certifications
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {standards.map((s) => (
              <Badge key={s} tone="verdant">
                {standardLabel(s)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {filter.neutralizes.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
          <span className="font-medium text-ink-800 dark:text-ink-100">Neutralizes:</span>{" "}
          {neutralizesLine(filter.neutralizes)}
        </p>
      ) : null}

      {filter.capacity_gallons != null ? (
        <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
          Rated capacity{" "}
          <span className="font-mono">{filter.capacity_gallons.toLocaleString("en-US")}</span>{" "}
          gallons
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        {offer ? (
          <Button
            href={offer.href}
            external
            rel={offer.rel}
            fullWidth
            size="sm"
            aria-label={`View the ${filter.brand} ${filter.model} on ${filter.brand}'s site (opens in a new tab)`}
          >
            View at {filter.brand}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function FilterCarousel({
  filters,
  dwelling = "UNKNOWN",
}: {
  filters: RecommendedFilter[];
  dwelling?: DwellingType;
}) {
  if (filters.length === 0) return null;
  const offers = filters.map(offerFor);

  // Two results in a 3-column grid left a dead column; size the grid to the
  // actual count so the commercial block never looks unfinished.
  const cols =
    filters.length === 1
      ? "sm:grid-cols-1 sm:max-w-md"
      : filters.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      aria-labelledby="filters-heading"
      id="filters"
      className="scroll-mt-32 rounded-2xl border-l-[3px] border-verdant-400 bg-brand-25 p-5 ring-1 ring-brand-200/70 sm:p-7 dark:bg-brand-300/[0.06] dark:ring-white/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-eyebrow uppercase text-ink-500 dark:text-ink-400">
              Recommended hardware
            </span>
            <Badge tone="verdant">Affiliate</Badge>
          </div>
          <h2 id="filters-heading" className="mt-1 text-title-1">
            Filters certified for these contaminants
          </h2>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        Each product below holds independently verified NSF/ANSI health certifications covering
        every contaminant flagged above. Ranking reflects certification coverage and fit for your
        dwelling, never commercial arrangement.
      </p>

      {offers.some(Boolean) && <AffiliateDisclosure paid={offers.some((offer) => offer?.paid)} />}
      <div
        className={`mt-6 grid grid-flow-col auto-cols-[19rem] grid-rows-1 gap-4 overflow-x-auto scroll-px-5 pb-2 snap-x sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible ${cols}`}
      >
        {filters.map((f, i) => (
          <FilterCard key={f.id} filter={f} dwelling={dwelling} top={i === 0 && filters.length > 1} />
        ))}
      </div>

      <p className="mt-6 border-t border-brand-200/70 pt-4 text-xs leading-relaxed text-ink-600 dark:border-white/10 dark:text-ink-300">
        {DISCLAIMER_AFFILIATE}
      </p>
    </section>
  );
}
