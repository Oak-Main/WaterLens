import {
  HEALTH_STANDARDS,
  MAX_RECOMMENDATIONS,
} from "./constants";
import {
  CONTAMINANT_BY_CODE,
  FILTERS,
  FILTER_CLAIMS,
} from "./data";
import {
  Detection,
  DwellingType,
  FormFactor,
  NsfStandard,
  RecommendedFilter,
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
