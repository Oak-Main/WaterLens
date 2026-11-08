import { MatchTier } from "./constants";

export type NsfStandard = "42" | "53" | "58" | "401" | "372" | "P473";

export type FormFactor =
  | "PITCHER"
  | "FAUCET"
  | "COUNTERTOP_RO"
  | "UNDERSINK_RO"
  | "WHOLE_HOUSE"
  | "REFRIGERATOR";

export type DwellingType = "SINGLE_FAMILY" | "MULTI_FAMILY_RENTAL" | "UNKNOWN";

export interface Coordinate {
  lat: number;
  lon: number;
}

export type Ring = [number, number][];
export interface Polygon {
  rings: Ring[];
}

export interface SpatialMatch {
  pwsid: string | null;
  tier: MatchTier;
  confidence: number;
  tierLabel: string;
  distanceKm?: number;
  requiresLabTestWarning: boolean;
}

export interface WaterSystem {
  pwsid: string;
  name: string;
  state: string | null;
  county: string | null;
  population_served: number | null;
  pws_type: string | null;
  primary_source: string | null;
}

export interface ContaminantDefinition {
  code: string;
  name: string;
  category: string;
  mcl: number | null;
  health_goal: number | null;
  unit: string;
  health_effects?: string;
  priority?: number;
  description?: string;
}

export interface Detection {
  code: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  mcl: number | null;
  health_goal: number | null;
  mcl_ratio: number | null;
  exceeds_mcl: boolean;
  exceeds_health_goal: boolean;
  sample_date: string | null;
  sampling_agency: string | null;
  source: string;
  health_effects?: string;
}

export interface Violation {
  pwsid: string;
  violation_id: string;
  contaminant_code: string | null;
  violation_code: string | null;
  violation_category: string | null;
  is_health_based: boolean;
  begin_date: string | null;
  status: string | null;
}

export interface Filter {
  id: number;
  brand: string;
  model: string;
  sku: string;
  form_factor: FormFactor;
  price_usd: number | null;
  capacity_gallons: number | null;
  affiliate_url: string | null;
  /** Manufacturer page, linked unpaid when no verified paid destination exists. */
  maker_url: string | null;
  active: number;
}

export interface FilterClaim {
  filter_id: number;
  standard: NsfStandard;
  contaminant_code: string;
  certifier: string;
  verified: number;
}

export interface RecommendedFilter {
  id: number;
  brand: string;
  model: string;
  sku: string;
  form_factor: FormFactor;
  price_usd: number | null;
  capacity_gallons: number | null;
  affiliate_url: string | null;
  maker_url: string | null;
  certified_standards: NsfStandard[];
  neutralizes: string[];
  full_coverage: boolean;
  score: number;
}

export interface HistoryPoint {
  code: string;
  value: number;
  unit: string;
  sample_date: string;
}

export interface LookupResult {
  query: {
    address: string;
    normalized_address: string | null;
    dwelling_type: DwellingType;
  };
  coordinate: Coordinate | null;
  match: SpatialMatch;
  utility: WaterSystem | null;
  detected_contaminants: Detection[];
  /** Prior samples for the detected contaminants, oldest first. */
  history: HistoryPoint[];
  /** The resolved system's service-area polygon, when we hold one. */
  service_boundary: Polygon | null;
  active_violations: Violation[];
  recommended_filters: RecommendedFilter[];
  nitrate_warning: string | null;
  multi_system_warning: boolean;
  multi_system_count: number;
  data_freshness: { sdwis_fetched_at: string | null; generated_at: string };
  disclaimers: string[];
  meta: {
    cache_hit: boolean;
    engine_version: string;
    resolution: "TEMM" | "ZIP_REGISTRY" | "NONE";
  };
}
