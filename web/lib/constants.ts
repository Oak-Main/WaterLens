// Policy constants shared across the web app — mirrors the backend (§12–§14).

import { PAID_OFFERS_ENABLED } from "./offers";

export const ENGINE_VERSION = "1.0.0";

export enum MatchTier {
  EXPLICIT = "TIER_1_EXPLICIT",
  MATCHED = "TIER_2_MATCHED",
  MODELED = "TIER_3_MODELED",
  NONE = "NONE",
}

export const TIER_CONFIDENCE: Record<MatchTier, number> = {
  [MatchTier.EXPLICIT]: 1.0,
  [MatchTier.MATCHED]: 0.85,
  [MatchTier.MODELED]: 0.5,
  [MatchTier.NONE]: 0.0,
};

export const TIER_LABEL: Record<MatchTier, string> = {
  [MatchTier.EXPLICIT]: "Explicit Boundary",
  [MatchTier.MATCHED]: "Matched Proxy",
  [MatchTier.MODELED]: "Modeled Radius",
  [MatchTier.NONE]: "Unmatched",
};

export const HEALTH_STANDARDS = ["53", "58", "401"] as const;
export const NON_HEALTH_STANDARDS = ["42", "372"] as const;
export const OBSOLETE_STANDARDS = ["P473"] as const;

export const MIN_RECOMMENDATIONS = 3;
export const MAX_RECOMMENDATIONS = 5;

export const NITRATE_CODES = new Set(["1040", "1041"]);

export const MODEL_RADIUS_KM = 15;

// Disclaimers (§13) --------------------------------------------------------
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

export const DISCLAIMER_AFFILIATE = PAID_OFFERS_ENABLED
  ? "Some recommended hardware links are affiliate placements. Products are surfaced solely because they " +
    "hold independently verified NSF/ANSI health certifications for the detected contaminants; " +
    "commercial rankings never override objective scientific data."
  : "Recommended hardware links go directly to the manufacturers and the lab-test link to SimpleLab's Tap Score; WaterQualityLens earns " +
    "nothing from them. Products are surfaced solely because they hold independently verified NSF/ANSI " +
    "health certifications for the detected contaminants.";

export const NITRATE_WARNING =
  "Nitrate/nitrite cannot be removed by standard carbon-based pitcher, faucet, or under-sink " +
  "filters (NSF/ANSI 42 or 53). Only reverse-osmosis systems certified to NSF/ANSI 58 (or specific " +
  "ion-exchange systems) are effective. Standard carbon filters will NOT protect against this contaminant.";
