import {
  DwellingType,
  Env,
  LookupResult,
  MatchTier,
  SpatialMatch,
} from "../types";
import {
  DISCLAIMER_AFFILIATE,
  DISCLAIMER_UNPAID_LINKS,
  DISCLAIMER_MEDICAL,
  DISCLAIMER_PLUMBING,
  DISCLAIMER_TIER3,
  ENGINE_VERSION,
  NITRATE_CODES,
  NITRATE_WARNING,
} from "../config/constants";
import { cacheKeys, getJson, putJson, ttl } from "../lib/cache";
import { geocode } from "../lib/geocode";
import { resolvePws } from "./spatial";
import { fetchPwsidsForZip, getSdwisProfile } from "./sdwis";
import { matchFilters } from "./setcover";

// -----------------------------------------------------------------------------
// End-to-end address lookup orchestration (§3 workflow, §22 output contract):
//
//   address -> geocode C(lat,lon) -> TEMM resolve PWSID -> SDWIS profile ->
//   set-cover filter match -> unified JSON payload.
//
// A ZIP fallback (SDWA_GEOGRAPHIC_AREAS registry) covers addresses that fail to
// geocode, and a direct `?zip=` entry point exists for coarse lookups. The whole
// payload is cached in KV keyed by (normalized query, dwelling type) so repeated
// neighborhood lookups avoid redundant spatial + Envirofacts work (§15).
// -----------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

// The affiliate disclaimer is stated only when a recommended filter actually carries a paid link.
export function buildDisclaimers(tier: MatchTier, filters: { affiliate_url: string | null }[] = []): string[] {
  const paid = filters.some((f) => Boolean(f.affiliate_url));
  const out = [DISCLAIMER_MEDICAL, DISCLAIMER_PLUMBING, paid ? DISCLAIMER_AFFILIATE : DISCLAIMER_UNPAID_LINKS];
  if (tier === MatchTier.MODELED || tier === MatchTier.NONE) {
    out.splice(1, 0, DISCLAIMER_TIER3);
  }
  return out;
}

/** Emit the nitrate/nitrite warning only when one is actually detected. */
function nitrateWarning(
  detections: { code: string; exceeds_health_goal: boolean }[]
): string | null {
  const hit = detections.some(
    (d) => NITRATE_CODES.has(d.code) && d.exceeds_health_goal
  );
  return hit ? NITRATE_WARNING : null;
}

function emptyResult(
  query: LookupResult["query"],
  coordinate: LookupResult["coordinate"],
  match: SpatialMatch,
  resolution: LookupResult["meta"]["resolution"]
): LookupResult {
  return {
    query,
    coordinate,
    match,
    utility: null,
    detected_contaminants: [],
    active_violations: [],
    recommended_filters: [],
    nitrate_warning: null,
    multi_system_warning: false,
    multi_system_count: 0,
    data_freshness: { sdwis_fetched_at: null, generated_at: nowIso() },
    disclaimers: buildDisclaimers(match.tier),
    meta: { cache_hit: false, engine_version: ENGINE_VERSION, resolution },
  };
}

const NO_MATCH: SpatialMatch = {
  pwsid: null,
  tier: MatchTier.NONE,
  confidence: 0,
  tierLabel: "Unmatched",
  requiresLabTestWarning: true,
};

/**
 * Materialize the full report for a resolved PWSID.
 */
async function buildReport(
  env: Env,
  query: LookupResult["query"],
  coordinate: LookupResult["coordinate"],
  match: SpatialMatch,
  dwelling: DwellingType,
  resolution: LookupResult["meta"]["resolution"],
  multiSystemCount: number
): Promise<LookupResult> {
  const profile = await getSdwisProfile(env, match.pwsid!);
  const recommended = await matchFilters(env, profile.detections, dwelling);
  const exceedances = profile.detections
    .filter((d) => d.exceeds_health_goal)
    .sort((a, b) => (b.mcl_ratio ?? 0) - (a.mcl_ratio ?? 0));

  return {
    query,
    coordinate,
    match,
    utility: profile.utility,
    detected_contaminants: exceedances,
    active_violations: profile.violations,
    recommended_filters: recommended,
    nitrate_warning: nitrateWarning(exceedances),
    multi_system_warning: multiSystemCount > 1,
    multi_system_count: multiSystemCount,
    data_freshness: {
      sdwis_fetched_at: profile.fetched_at,
      generated_at: nowIso(),
    },
    disclaimers: buildDisclaimers(match.tier, recommended),
    meta: { cache_hit: false, engine_version: ENGINE_VERSION, resolution },
  };
}

export interface LookupOptions {
  dwelling?: DwellingType;
  /** Bypass the KV cache (admin/debug — `?nocache=1`). */
  noCache?: boolean;
}

export async function runLookup(
  env: Env,
  address: string,
  opts: LookupOptions = {}
): Promise<LookupResult> {
  const dwelling = opts.dwelling ?? "UNKNOWN";
  const cacheKey = cacheKeys.lookup(address, dwelling);

  if (!opts.noCache) {
    const cached = await getJson<LookupResult>(env, cacheKey);
    if (cached) return { ...cached, meta: { ...cached.meta, cache_hit: true } };
  }

  // 1. Geocode.
  const geo = await geocode(env, address);
  if (!geo) {
    // Geocode failure -> attempt ZIP registry fallback if the input contains one.
    const zip = extractZip(address);
    if (zip) return runZipLookup(env, zip, opts);
    return emptyResult(
      { address, normalized_address: null, dwelling_type: dwelling },
      null,
      NO_MATCH,
      "NONE"
    );
  }

  // 2. TEMM spatial resolve.
  const match = await resolvePws(env, geo);
  const query = {
    address,
    normalized_address: geo.matched_address,
    dwelling_type: dwelling,
  };

  if (!match.pwsid) {
    const result = emptyResult(query, geo.coordinate, match, "TEMM");
    await putJson(env, cacheKey, result, ttl(env, "lookup"));
    return result;
  }

  // 3-5. Build the full report (single, high-confidence TEMM match).
  const result = await buildReport(
    env,
    query,
    geo.coordinate,
    match,
    dwelling,
    "TEMM",
    1
  );
  await putJson(env, cacheKey, result, ttl(env, "lookup"));
  return result;
}

/**
 * Coarse ZIP lookup via the SDWA_GEOGRAPHIC_AREAS registry. A ZIP can cross
 * several utilities, so the highest-population system is reported and
 * `multi_system_warning` is raised when more than one is found.
 */
export async function runZipLookup(
  env: Env,
  zip: string,
  opts: LookupOptions = {}
): Promise<LookupResult> {
  const dwelling = opts.dwelling ?? "UNKNOWN";
  const cacheKey = cacheKeys.lookup(`zip:${zip}`, dwelling);

  if (!opts.noCache) {
    const cached = await getJson<LookupResult>(env, cacheKey);
    if (cached) return { ...cached, meta: { ...cached.meta, cache_hit: true } };
  }

  const query = {
    address: zip,
    normalized_address: `ZIP ${zip}`,
    dwelling_type: dwelling,
  };

  const pwsids = await fetchPwsidsForZip(env, zip);
  if (pwsids.length === 0) {
    const result = emptyResult(query, null, NO_MATCH, "NONE");
    await putJson(env, cacheKey, result, ttl(env, "lookup"));
    return result;
  }

  // Pick the largest system by population as the representative one.
  const primary = await pickLargestSystem(env, pwsids);
  const match: SpatialMatch = {
    pwsid: primary,
    // ZIP registry mappings are official EPA records but not address-precise.
    tier: MatchTier.MATCHED,
    confidence: 0.85,
    tierLabel: "ZIP Registry (multi-system possible)",
    requiresLabTestWarning: pwsids.length > 1,
  };

  const result = await buildReport(
    env,
    query,
    null,
    match,
    dwelling,
    "ZIP_REGISTRY",
    pwsids.length
  );
  await putJson(env, cacheKey, result, ttl(env, "lookup"));
  return result;
}

/** Choose the PWSID serving the largest population (best default for a ZIP). */
async function pickLargestSystem(env: Env, pwsids: string[]): Promise<string> {
  const placeholders = pwsids.map((_, i) => `?${i + 1}`).join(",");
  const row = await env.DB.prepare(
    `SELECT pwsid FROM water_systems
      WHERE pwsid IN (${placeholders})
      ORDER BY COALESCE(population_served, 0) DESC
      LIMIT 1`
  )
    .bind(...pwsids)
    .first<{ pwsid: string }>();
  return row?.pwsid ?? pwsids[0];
}

/** Extract a 5-digit ZIP from a free-text address, if present. */
export function extractZip(address: string): string | null {
  const m = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return m ? m[1] : null;
}
