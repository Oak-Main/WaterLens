import {
  Detection,
  DwellingType,
  Env,
  Filter,
  FormFactor,
  NsfStandard,
  RecommendedFilter,
} from "../types";
import {
  HEALTH_STANDARDS,
  MAX_RECOMMENDATIONS,
  isHealthStandard,
} from "../config/constants";
import { publicAffiliateUrl } from "../lib/offers";

// -----------------------------------------------------------------------------
// Constrained set-cover recommendation engine (§12).
//
// Let D = the set of detected contaminants exceeding health guidelines.
// Let F = curated filtration SKUs, each with verified certifications C_f, where
//         each certification maps to a set of neutralized contaminants N_c.
//
// A SKU qualifies iff the detected hazard set is a perfect subset of its verified
// neutralization capability:
//
//         D  ⊆  ⋃_{c ∈ C_f} N_c
//
// Only HEALTH standards (53/58/401) may satisfy a hazard. NSF 42 (aesthetic) and
// NSF 372 (lead-free materials) are isolated and can never satisfy a health
// contaminant. Retired P473 is ignored. "Artificial precision is strictly
// prohibited": if a SKU is not verified for a specific compound, it cannot be
// credited with neutralizing it.
// -----------------------------------------------------------------------------

interface ClaimRow {
  filter_id: number;
  standard: NsfStandard;
  contaminant_code: string;
}

/** Form-factor fit heuristic (§12) keyed by dwelling type. */
function formFactorFit(form: FormFactor, dwelling: DwellingType): number {
  if (dwelling === "MULTI_FAMILY_RENTAL") {
    // Renters: non-installed point-of-use gravity/faucet units preferred.
    if (form === "PITCHER") return 1.0;
    if (form === "FAUCET" || form === "COUNTERTOP_RO") return 0.7;
    if (form === "UNDERSINK_RO") return 0.3;
    if (form === "WHOLE_HOUSE") return 0.05; // impractical for a rental unit
    return 0.5;
  }
  if (dwelling === "SINGLE_FAMILY") {
    // Owners: installed under-sink RO / whole-house preferred for durability.
    if (form === "UNDERSINK_RO") return 1.0;
    if (form === "WHOLE_HOUSE") return 0.85;
    if (form === "COUNTERTOP_RO") return 0.7;
    if (form === "PITCHER" || form === "FAUCET") return 0.5;
    return 0.5;
  }
  return 0.6; // UNKNOWN — neutral
}

/**
 * The neutralization capability set N(f) for a SKU: the union of contaminant
 * codes it is *verified* to reduce under a HEALTH standard.
 */
export function neutralizationSet(
  claims: ClaimRow[]
): { codes: Set<string>; standards: Set<NsfStandard> } {
  const codes = new Set<string>();
  const standards = new Set<NsfStandard>();
  for (const claim of claims) {
    if (!isHealthStandard(claim.standard)) continue; // isolate 42/372/P473
    codes.add(claim.contaminant_code);
    standards.add(claim.standard);
  }
  return { codes, standards };
}

/** True when D ⊆ N(f). Empty D is trivially covered. */
export function isFullCover(
  hazards: Set<string>,
  neutralized: Set<string>
): boolean {
  for (const h of hazards) {
    if (!neutralized.has(h)) return false;
  }
  return true;
}

/**
 * Load every verified health-standard claim for the candidate SKUs in one query,
 * grouped by filter id.
 */
async function loadClaims(
  env: Env,
  filterIds: number[]
): Promise<Map<number, ClaimRow[]>> {
  const grouped = new Map<number, ClaimRow[]>();
  if (filterIds.length === 0) return grouped;

  const placeholders = filterIds.map((_, i) => `?${i + 1}`).join(",");
  const { results } = await env.DB.prepare(
    `SELECT filter_id, standard, contaminant_code
       FROM filter_claims
      WHERE verified = 1
        AND standard IN ('${HEALTH_STANDARDS.join("','")}')
        AND filter_id IN (${placeholders})`
  )
    .bind(...filterIds)
    .all<ClaimRow>();

  for (const row of results ?? []) {
    const arr = grouped.get(row.filter_id) ?? [];
    arr.push(row);
    grouped.set(row.filter_id, arr);
  }
  return grouped;
}

/**
 * Run the constrained set-cover match.
 *
 * @param detections contaminants for the PWS (already computed exceedances)
 * @param dwelling   dwelling type used only for ranking, never for eligibility
 */
export async function matchFilters(
  env: Env,
  detections: Detection[],
  dwelling: DwellingType
): Promise<RecommendedFilter[]> {
  // D = detected contaminants exceeding health guidelines.
  const hazards = new Set(
    detections.filter((d) => d.exceeds_health_goal).map((d) => d.code)
  );

  // With no health-goal exceedances there is nothing to remediate.
  if (hazards.size === 0) return [];

  // Candidate SKUs: active filters that hold >=1 verified health claim for at
  // least one detected hazard (cheap pre-filter before the subset test).
  const hazardList = [...hazards];
  const inClause = hazardList.map((_, i) => `?${i + 1}`).join(",");
  const { results: candidates } = await env.DB.prepare(
    `SELECT DISTINCT f.id, f.brand, f.model, f.sku, f.form_factor,
            f.price_usd, f.capacity_gallons, f.affiliate_url, f.active
       FROM filters f
       JOIN filter_claims fc ON fc.filter_id = f.id
      WHERE f.active = 1
        AND fc.verified = 1
        AND fc.standard IN ('${HEALTH_STANDARDS.join("','")}')
        AND fc.contaminant_code IN (${inClause})`
  )
    .bind(...hazardList)
    .all<Filter>();

  const filters = candidates ?? [];
  const claimsByFilter = await loadClaims(
    env,
    filters.map((f) => f.id)
  );

  const recommended: RecommendedFilter[] = [];
  for (const f of filters) {
    const claims = claimsByFilter.get(f.id) ?? [];
    const { codes, standards } = neutralizationSet(claims);

    // Enforce the set-cover constraint: D ⊆ N(f). Partial SKUs are eliminated.
    if (!isFullCover(hazards, codes)) continue;

    const neutralizes = hazardList.filter((h) => codes.has(h));
    const fit = formFactorFit(f.form_factor, dwelling);
    // Score: form-factor fit dominates; cheaper full-cover SKUs break ties.
    const pricePenalty = f.price_usd ? Math.min(0.3, f.price_usd / 4000) : 0;
    const score = Number((fit + 0.5 + neutralizes.length * 0.05 - pricePenalty).toFixed(4));

    recommended.push({
      id: f.id,
      brand: f.brand,
      model: f.model,
      sku: f.sku,
      form_factor: f.form_factor,
      price_usd: f.price_usd,
      capacity_gallons: f.capacity_gallons,
      affiliate_url: publicAffiliateUrl(f.affiliate_url),
      certified_standards: [...standards].sort(),
      neutralizes,
      full_coverage: true,
      score,
    });
  }

  recommended.sort((a, b) => b.score - a.score);
  return recommended.slice(0, MAX_RECOMMENDATIONS);
}
