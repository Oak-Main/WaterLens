import "server-only";
import {
  DISCLAIMER_AFFILIATE,
  DISCLAIMER_MEDICAL,
  DISCLAIMER_PLUMBING,
  ENGINE_VERSION,
  MatchTier,
} from "./constants";
import { fetchZipCandidates } from "./epa-echo";
import { geocode } from "./geocode";
import type { DwellingType, LookupResult } from "./types";

export async function runLookup(
  address: string,
  dwelling: DwellingType = "UNKNOWN"
): Promise<LookupResult> {
  const zipOnly = /^\d{5}(?:-\d{4})?$/.test(address);
  const geo = zipOnly ? null : await geocode(address);
  const zip = geo?.zip?.match(/^\d{5}$/)?.[0] ?? address.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  const candidates = zip ? await fetchZipCandidates(zip) : [];

  // A registry ZIP association suggests candidates. It cannot confirm service.
  const utility = candidates[0] ?? null;

  return {
    query: {
      address,
      normalized_address: geo?.matched_address ?? null,
      dwelling_type: dwelling,
    },
    coordinate: geo?.coordinate ?? null,
    match: {
      pwsid: utility?.pwsid ?? null,
      tier: utility ? MatchTier.MATCHED : MatchTier.NONE,
      confidence: 0,
      tierLabel: utility ? "ZIP registry candidate" : "Unmatched",
      requiresLabTestWarning: true,
    },
    utility,
    // The public report has no verified samples or complete violation window.
    detected_contaminants: [],
    history: [],
    service_boundary: null,
    active_violations: [],
    recommended_filters: [],
    nitrate_warning: null,
    multi_system_warning: candidates.length > 1,
    multi_system_count: candidates.length,
    data_freshness: { sdwis_fetched_at: null, generated_at: new Date().toISOString() },
    disclaimers: [
      "Verified measurements and violation records are unavailable in this lookup.",
      DISCLAIMER_MEDICAL,
      DISCLAIMER_PLUMBING,
      DISCLAIMER_AFFILIATE,
    ],
    meta: {
      cache_hit: false,
      engine_version: ENGINE_VERSION,
      resolution: utility ? "ZIP_REGISTRY" : "NONE",
    },
  };
}
