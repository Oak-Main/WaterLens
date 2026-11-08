import { MatchTier, NsfStandard } from "../types";

/** Engine version stamped onto every lookup payload for cache-busting/debugging. */
export const ENGINE_VERSION = "1.0.0";

// -----------------------------------------------------------------------------
// TEMM confidence constants — verbatim from §12 Algorithm & Equation Specs.
// -----------------------------------------------------------------------------
export const TIER_CONFIDENCE: Record<MatchTier, number> = {
  [MatchTier.EXPLICIT]: 1.0, // Tier 1 — explicit verified polygon
  [MatchTier.MATCHED]: 0.85, // Tier 2 — TIGER place proxy
  [MatchTier.MODELED]: 0.5, // Tier 3 — modeled centroid radius
  [MatchTier.NONE]: 0.0,
};

export const TIER_LABEL: Record<MatchTier, string> = {
  [MatchTier.EXPLICIT]: "Explicit Boundary",
  [MatchTier.MATCHED]: "Matched Proxy",
  [MatchTier.MODELED]: "Modeled Radius",
  [MatchTier.NONE]: "Unmatched",
};

// -----------------------------------------------------------------------------
// Certification policy (§2, §3, §5, §14, §22).
//
// Health standards are the ONLY standards permitted to back a contaminant
// remediation claim. NSF/ANSI 42 (aesthetic) and 372 (lead-free materials) are
// strictly isolated from health claims. P473 was retired in 2022 and absorbed
// into 53/58 — legacy packaging citing it is treated as obsolete and never used
// to satisfy a health match.
// -----------------------------------------------------------------------------
export const HEALTH_STANDARDS: readonly NsfStandard[] = ["53", "58", "401"] as const;

export const NON_HEALTH_STANDARDS: readonly NsfStandard[] = ["42", "372"] as const;

/** Retired standards that must never be used to satisfy a health remediation match. */
export const OBSOLETE_STANDARDS: readonly NsfStandard[] = ["P473"] as const;

export function isHealthStandard(standard: NsfStandard): boolean {
  return HEALTH_STANDARDS.includes(standard);
}

// -----------------------------------------------------------------------------
// Persistent, non-dismissible disclaimers (§13 UX & Trust Blueprint).
// -----------------------------------------------------------------------------
export const DISCLAIMER_MEDICAL =
  "This tool aggregates municipal engineering data and hardware certifications. " +
  "It does not diagnose exposure risks, predict toxicological outcomes, or offer medical advice.";

export const DISCLAIMER_TIER3 =
  "The supplying utility for this address was resolved using a modeled radius (low confidence). " +
  "Confirm the utility name printed on your water bill, and consider a physical Tap Score lab test for absolute certainty.";

export const DISCLAIMER_PLUMBING =
  "Utility data is aggregated at the water-system level and cannot account for plumbing-specific " +
  "contamination such as legacy household lead service lines. A point-of-use lab test is the only " +
  "way to verify contamination introduced by your home's plumbing.";

/**
 * Hostnames whose affiliate_url counts as a paid link. Mirrors PAID_OFFER_HOSTS in
 * web/lib/offers.ts: keep both empty until a program is approved for this site and its
 * destination has been verified, and change them together. A non-null affiliate_url on
 * any other host is not treated as paid, so the commission notice cannot appear for it.
 */
export const PAID_OFFER_HOSTS: readonly string[] = [];

/** Used only when at least one recommended filter carries a paid link (its host is in PAID_OFFER_HOSTS). */
export const DISCLAIMER_AFFILIATE =
  "Some recommended hardware links are affiliate placements. Products are surfaced solely because they " +
  "hold independently verified NSF/ANSI health certifications for the detected contaminants; " +
  "commercial rankings never override objective scientific data.";

/** Used when no recommended filter carries a paid link (the default while PAID_OFFER_HOSTS is empty). */
export const DISCLAIMER_UNPAID_LINKS =
  "No recommended hardware in this report carries an affiliate link. Products are surfaced solely because they " +
  "hold independently verified NSF/ANSI health certifications for the detected contaminants.";

// -----------------------------------------------------------------------------
// SDWIS / Envirofacts — SDWA table names (§10, §22).
// -----------------------------------------------------------------------------
export const SDWA_TABLES = {
  WATER_SYSTEM: "SDWA_PUB_WATER_SYSTEMS",
  VIOLATIONS: "SDWA_VIOLATIONS_ENFORCEMENT",
  LCR_SAMPLES: "SDWA_LCR_SAMPLES",
  GEOGRAPHIC_AREAS: "SDWA_GEOGRAPHIC_AREAS",
} as const;

/** SDWIS violation categories that are health-based (drive alerts & banners). */
export const HEALTH_BASED_VIOLATION_CATEGORIES = new Set([
  "MCL",
  "MRDL",
  "TT",
  "Maximum Contaminant Level Violation",
  "Treatment Technique Violation",
]);

/** Number of SKUs surfaced in the results carousel (§11 — "3 to 5"). */
export const MIN_RECOMMENDATIONS = 3;
export const MAX_RECOMMENDATIONS = 5;

// -----------------------------------------------------------------------------
// Nitrate / nitrite policy.
//
// Carbon-based media (NSF/ANSI 42 and 53) do NOT remove nitrate or nitrite —
// only reverse osmosis (NSF/ANSI 58) or ion exchange does. The set-cover engine
// already enforces this structurally (no carbon SKU holds a 58 nitrate claim),
// but we surface an explicit consumer warning whenever these are detected.
// -----------------------------------------------------------------------------
export const NITRATE_CODES = new Set(["1040", "1041"]); // Nitrate (as N), Nitrite

export const NITRATE_WARNING =
  "Nitrate/nitrite cannot be removed by standard carbon-based pitcher, faucet, or " +
  "under-sink filters (NSF/ANSI 42 or 53). Only reverse-osmosis systems certified to " +
  "NSF/ANSI 58 (or specific ion-exchange systems) are effective. Standard carbon filters " +
  "will NOT protect against this contaminant.";
