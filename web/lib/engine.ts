import {
  HEALTH_STANDARDS,
  MatchTier,
  MAX_RECOMMENDATIONS,
  TIER_CONFIDENCE,
  TIER_LABEL,
} from "./constants";
import {
  CONTAMINANT_BY_CODE,
  DEMO_SYSTEMS,
  FILTERS,
  FILTER_CLAIMS,
} from "./data";
import { boundingBox, haversineKm, inBoundingBox, pointInPolygon } from "./geo";
import {
  Coordinate,
  Detection,
  DwellingType,
  FormFactor,
  NsfStandard,
  RecommendedFilter,
  SpatialMatch,
} from "./types";

const HEALTH = new Set<string>(HEALTH_STANDARDS);

// --- Detection math ---------------------------------------------------------

export function buildDetection(row: {
  code: string;
  value: number;
  unit: string;
  sample_date: string | null;
  agency?: string | null;
  source?: string;
}): Detection | null {
  const def = CONTAMINANT_BY_CODE.get(row.code);
  if (!def) return null;
  const exceeds_mcl = def.mcl != null && row.value > def.mcl;
  const goal = def.health_goal ?? def.mcl;
  const exceeds_health_goal = goal != null && row.value > goal;
  return {
    code: def.code,
    name: def.name,
    category: def.category,
    value: row.value,
    unit: row.unit || def.unit,
    mcl: def.mcl,
    health_goal: def.health_goal,
    mcl_ratio: def.mcl != null && def.mcl > 0 ? Number((row.value / def.mcl).toFixed(3)) : null,
    exceeds_mcl,
    exceeds_health_goal,
    sample_date: row.sample_date,
    sampling_agency: row.agency ?? null,
    source: row.source ?? "SDWIS",
    health_effects: def.health_effects,
  };
}

// --- TEMM spatial resolution (against bundled demo boundaries) --------------

export function resolveSpatial(point: Coordinate): SpatialMatch {
  // Tier 1 — explicit polygon.
  for (const d of DEMO_SYSTEMS) {
    if (
      inBoundingBox(point, boundingBox(d.boundary)) &&
      pointInPolygon(point, d.boundary)
    ) {
      return build(d.system.pwsid, MatchTier.EXPLICIT);
    }
  }
  // Tier 3 — nearest modeled centroid within radius (Tier 2 proxy handled by
  // the ZIP registry path upstream; bundled data has explicit polygons only).
  let best: { pwsid: string; d: number } | null = null;
  for (const d of DEMO_SYSTEMS) {
    const dist = haversineKm(point, { lat: d.centroid.lat, lon: d.centroid.lon });
    if (dist < d.centroid.radiusKm && (!best || dist < best.d)) {
      best = { pwsid: d.system.pwsid, d: dist };
    }
  }
  if (best) return build(best.pwsid, MatchTier.MODELED, Number(best.d.toFixed(3)));
  return {
    pwsid: null,
    tier: MatchTier.NONE,
    confidence: 0,
    tierLabel: TIER_LABEL[MatchTier.NONE],
    requiresLabTestWarning: true,
  };
}

function build(pwsid: string, tier: MatchTier, distanceKm?: number): SpatialMatch {
  return {
    pwsid,
    tier,
    confidence: TIER_CONFIDENCE[tier],
    tierLabel: TIER_LABEL[tier],
    distanceKm,
    requiresLabTestWarning: tier === MatchTier.MODELED,
  };
}

// --- Constrained set-cover filter match (D ⊆ ⋃ N_c) -------------------------

function formFactorFit(form: FormFactor, dwelling: DwellingType): number {
  if (dwelling === "MULTI_FAMILY_RENTAL") {
    if (form === "PITCHER") return 1.0;
    if (form === "FAUCET" || form === "COUNTERTOP_RO") return 0.7;
    if (form === "UNDERSINK_RO") return 0.3;
    if (form === "WHOLE_HOUSE") return 0.05;
    return 0.5;
  }
  if (dwelling === "SINGLE_FAMILY") {
    if (form === "UNDERSINK_RO") return 1.0;
    if (form === "WHOLE_HOUSE") return 0.85;
    if (form === "COUNTERTOP_RO") return 0.7;
    if (form === "PITCHER" || form === "FAUCET") return 0.5;
    return 0.5;
  }
  return 0.6;
}

/** Health-standard neutralization capability per filter id. */
function neutralizationByFilter(): Map<number, { codes: Set<string>; standards: Set<NsfStandard> }> {
  const map = new Map<number, { codes: Set<string>; standards: Set<NsfStandard> }>();
  for (const claim of FILTER_CLAIMS) {
    if (!claim.verified || !HEALTH.has(claim.standard)) continue;
    const entry = map.get(claim.filter_id) ?? { codes: new Set(), standards: new Set() };
    entry.codes.add(claim.contaminant_code);
    entry.standards.add(claim.standard);
    map.set(claim.filter_id, entry);
  }
  return map;
}

export function matchFilters(
  detections: Detection[],
  dwelling: DwellingType
): RecommendedFilter[] {
  const hazards = new Set(detections.filter((d) => d.exceeds_health_goal).map((d) => d.code));
  if (hazards.size === 0) return [];

  const hazardList = [...hazards];
  const neutralize = neutralizationByFilter();
  const out: RecommendedFilter[] = [];

  for (const f of FILTERS) {
    if (!f.active) continue;
    const cap = neutralize.get(f.id);
    if (!cap) continue;
    // D ⊆ N(f)
    if (!hazardList.every((h) => cap.codes.has(h))) continue;

    const fit = formFactorFit(f.form_factor, dwelling);
    const pricePenalty = f.price_usd ? Math.min(0.3, f.price_usd / 4000) : 0;
    const score = Number((fit + 0.5 + hazardList.length * 0.05 - pricePenalty).toFixed(4));
    out.push({
      id: f.id,
      brand: f.brand,
      model: f.model,
      sku: f.sku,
      form_factor: f.form_factor,
      price_usd: f.price_usd,
      capacity_gallons: f.capacity_gallons,
      affiliate_url: f.affiliate_url,
      maker_url: f.maker_url,
      certified_standards: [...cap.standards].sort(),
      neutralizes: hazardList.filter((h) => cap.codes.has(h)),
      full_coverage: true,
      score,
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, MAX_RECOMMENDATIONS);
}
