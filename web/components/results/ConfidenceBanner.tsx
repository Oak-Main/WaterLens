import { Badge, Button } from "@/components/ui";
import { LAB_TEST_OFFER } from "@/lib/offers";
import { DISCLAIMER_TIER3, MatchTier } from "@/lib/constants";
import { tierTone } from "@/lib/format";
import type { SpatialMatch } from "@/lib/types";

const LAB_TEST = LAB_TEST_OFFER;

type Tone = "verdant" | "brand" | "caution" | "ink";

const surface: Record<Tone, string> = {
  verdant:
    "border-verdant-200 bg-verdant-50 dark:border-verdant-300/25 dark:bg-verdant-300/10",
  brand: "border-brand-200 bg-brand-50 dark:border-brand-300/25 dark:bg-brand-300/10",
  caution:
    "border-caution-200 bg-caution-50 dark:border-caution-300/25 dark:bg-caution-300/10",
  ink: "border-ink-200 bg-ink-50 dark:border-white/15 dark:bg-white/5",
};

/**
 * The Tier-3 mapping-ambiguity banner is the one sanctioned amber surface
 * (DESIGN.md). Amber alone would carry the signal in hue, so the modeled case
 * additionally gets a 4px left rule and its own advisory glyph.
 */
const leftRule: Record<Tone, string> = {
  verdant: "",
  brand: "",
  caution: "border-l-4 border-l-caution-500 dark:border-l-caution-300",
  ink: "",
};

const accentText: Record<Tone, string> = {
  verdant: "text-verdant-700 dark:text-verdant-200",
  brand: "text-brand-700 dark:text-brand-200",
  caution: "text-caution-800 dark:text-caution-200",
  ink: "text-ink-700 dark:text-ink-200",
};

function TierIcon({ tone }: { tone: Tone }) {
  if (tone === "caution") {
    // Attention / advisory glyph (not alarm) for the modeled-radius case.
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="16.2" r="0.4" fill="currentColor" stroke="currentColor" strokeWidth="0.9" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v5.2c0 4.3 3 8.2 7 9.3 4-1.1 7-5 7-9.3V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function description(tier: MatchTier): string {
  switch (tier) {
    case MatchTier.EXPLICIT:
      return "This address falls inside the mapped service boundary of the water system below. This is our highest-confidence match.";
    case MatchTier.MATCHED:
      return "We matched this address to the water system below using the utility registry for its ZIP code. Confirm the utility name on your water bill if more than one system serves your area.";
    case MatchTier.MODELED:
      return "We could not place this address inside a mapped service boundary, so the supplying utility was estimated using a modeled radius. Treat the results below as directional.";
    default:
      return "We could not confirm which public water system supplies this address.";
  }
}

export function ConfidenceBanner({
  match,
  multiSystemWarning = false,
  multiSystemCount = 0,
}: {
  match: SpatialMatch;
  multiSystemWarning?: boolean;
  multiSystemCount?: number;
}) {
  const tone = tierTone(match.tier);
  const isModeled = match.tier === MatchTier.MODELED || match.tier === MatchTier.NONE;
  const confidencePct = Math.round(match.confidence * 100);

  return (
    <div
      className={`animate-fade-up rounded-2xl border p-5 sm:p-6 ${surface[tone]} ${leftRule[tone]}`}
      role="status"
      aria-label={`Match confidence: ${match.tierLabel}`}
    >
      <div className="flex items-start gap-4">
        <span className={`mt-0.5 shrink-0 ${accentText[tone]}`} aria-hidden="true">
          <TierIcon tone={tone} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className={`text-title-2 ${accentText[tone]}`}>{match.tierLabel}</h2>
            <Badge tone={tone}>{confidencePct}% confidence</Badge>
            {match.distanceKm != null ? (
              <span className="text-xs text-ink-500 dark:text-ink-400">
                ~{match.distanceKm.toFixed(1)} km from system center
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
            {description(match.tier)}
          </p>

          {isModeled ? (
            <div className="mt-4 rounded-xl border border-caution-200 bg-surface-raised/80 p-4 dark:border-caution-300/25 dark:bg-brand-950/40">
              <p className="text-sm leading-relaxed text-caution-900 dark:text-caution-100">
                {DISCLAIMER_TIER3}
              </p>
              <Button
                href={LAB_TEST.href}
                rel={LAB_TEST.rel}
                external
                size="md"
                className="mt-3"
                aria-label="Order a Tap Score lab test (opens in a new tab)"
              >
                Order a Tap Score lab test
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </div>
          ) : null}

          {multiSystemWarning ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              <span className="font-medium text-ink-800 dark:text-ink-100">
                {multiSystemCount > 1 ? `${multiSystemCount} water systems` : "Multiple water systems"}
              </span>{" "}
              are on record for this area. We are showing the largest by population served. Check the
              utility name printed on your water bill to confirm which one supplies your home.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
