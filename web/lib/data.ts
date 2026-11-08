import {
  ContaminantDefinition,
  Filter,
  FilterClaim,
  NsfStandard,
  Polygon,
  WaterSystem,
} from "./types";

// -----------------------------------------------------------------------------
// Curated dataset ported from the backend migrations (0002/0003) and demo seed.
// This makes the site fully functional standalone; addresses outside the demo
// boundaries fall back to the live EPA Envirofacts registry (see envirofacts.ts).
// -----------------------------------------------------------------------------

export const CONTAMINANTS: ContaminantDefinition[] = [
  { code: "PB90", name: "Lead", category: "Metal", mcl: 15, health_goal: 0, unit: "ug/L", priority: 1,
    health_effects: "Delays in physical and mental development in infants and children; kidney problems and high blood pressure in adults. No safe exposure level (MCLG = 0)." },
  { code: "CU90", name: "Copper", category: "Metal", mcl: 1.3, health_goal: 1.3, unit: "mg/L", priority: 2,
    health_effects: "Short-term gastrointestinal distress; long-term liver or kidney damage above the action level." },
  { code: "CR6", name: "Hexavalent Chromium", category: "Metal", mcl: 10, health_goal: 0.02, unit: "ug/L", priority: 1,
    health_effects: "Known human carcinogen linked to stomach, lung, and nasal cancers with long-term ingestion. California PHG is 0.02 ug/L." },
  { code: "1020", name: "Total Chromium", category: "Metal", mcl: 100, health_goal: 100, unit: "ug/L", priority: 2,
    health_effects: "Allergic dermatitis in sensitive individuals; total chromium includes carcinogenic hexavalent and trivalent forms." },
  { code: "1005", name: "Arsenic", category: "Metal", mcl: 10, health_goal: 0, unit: "ug/L", priority: 1,
    health_effects: "Skin damage and circulatory problems; long-term exposure increases bladder, lung, and skin cancer risk (MCLG = 0)." },
  { code: "1040", name: "Nitrate", category: "Inorganic", mcl: 10, health_goal: 10, unit: "mg/L", priority: 1,
    health_effects: "Causes methemoglobinemia (\"blue-baby syndrome\") in infants under 6 months. Carbon filters do NOT remove nitrate — reverse osmosis (NSF 58) only." },
  { code: "1041", name: "Nitrite", category: "Inorganic", mcl: 1, health_goal: 1, unit: "mg/L", priority: 1,
    health_effects: "Causes methemoglobinemia in infants; acutely dangerous. Removed only by reverse osmosis (NSF 58), not carbon filters." },
  { code: "1010", name: "Barium", category: "Metal", mcl: 2, health_goal: 2, unit: "mg/L", priority: 2,
    health_effects: "Increases blood pressure at elevated levels." },
  { code: "1015", name: "Cadmium", category: "Metal", mcl: 0.005, health_goal: 0.005, unit: "mg/L", priority: 2,
    health_effects: "Kidney damage with long-term exposure; can leach from galvanized pipe and fittings." },
  { code: "1035", name: "Mercury (inorganic)", category: "Metal", mcl: 0.002, health_goal: 0.002, unit: "mg/L", priority: 2,
    health_effects: "Kidney damage and nervous-system effects above the MCL." },
  { code: "PFOA", name: "PFOA", category: "PFAS", mcl: 4, health_goal: 0, unit: "ng/L", priority: 1,
    health_effects: "Cancer, thyroid disease, immune and developmental effects. A persistent \"forever chemical\" (MCLG = 0)." },
  { code: "PFOS", name: "PFOS", category: "PFAS", mcl: 4, health_goal: 0, unit: "ng/L", priority: 1,
    health_effects: "Liver and thyroid harm, immune suppression, increased cancer risk. A persistent \"forever chemical\" (MCLG = 0)." },
  { code: "GENX", name: "GenX (HFPO-DA)", category: "PFAS", mcl: 10, health_goal: 10, unit: "ng/L", priority: 1,
    health_effects: "Developmental toxicity, liver damage, and immune disruption. Next-generation PFAS replacing PFOA." },
  { code: "PFHXS", name: "PFHxS", category: "PFAS", mcl: 10, health_goal: 10, unit: "ng/L", priority: 1,
    health_effects: "Thyroid and immune effects; regulated under the EPA PFAS hazard-index mixture rule." },
  { code: "PFNA", name: "PFNA", category: "PFAS", mcl: 10, health_goal: 10, unit: "ng/L", priority: 1,
    health_effects: "Liver toxicity and developmental effects; regulated under the EPA PFAS hazard-index mixture rule." },
  { code: "6590", name: "PFBS", category: "PFAS", mcl: null, health_goal: 0, unit: "ng/L", priority: 2,
    health_effects: "Thyroid effects; part of the PFAS mixture hazard-index rule." },
  { code: "2950", name: "Total Trihalomethanes", category: "DBP", mcl: 80, health_goal: 0, unit: "ug/L", priority: 2,
    health_effects: "Long-term exposure increases bladder-cancer risk; disinfection byproduct of chlorination." },
  { code: "2456", name: "Haloacetic Acids (HAA5)", category: "DBP", mcl: 60, health_goal: 0, unit: "ug/L", priority: 2,
    health_effects: "Increased cancer risk with long-term exposure; disinfection byproduct of chlorination." },
  { code: "2990", name: "Benzene", category: "VOC", mcl: 5, health_goal: 0, unit: "ug/L", priority: 1,
    health_effects: "Anemia and decreased blood platelets; long-term exposure raises leukemia risk (MCLG = 0)." },
  { code: "2984", name: "Trichloroethylene", category: "VOC", mcl: 5, health_goal: 0, unit: "ug/L", priority: 2,
    health_effects: "Liver damage and increased cancer risk; industrial degreaser (MCLG = 0)." },
  { code: "2987", name: "Tetrachloroethylene", category: "VOC", mcl: 5, health_goal: 0, unit: "ug/L", priority: 2,
    health_effects: "Liver problems and increased cancer risk; dry-cleaning and industrial solvent (MCLG = 0)." },
  { code: "2050", name: "Atrazine", category: "Pesticide", mcl: 3, health_goal: 3, unit: "ug/L", priority: 2,
    health_effects: "Cardiovascular or reproductive effects; agricultural herbicide common in the Midwest." },
  { code: "4006", name: "Uranium", category: "Radionuclide", mcl: 30, health_goal: 0, unit: "ug/L", priority: 2,
    health_effects: "Increased cancer risk and kidney toxicity with long-term exposure (MCLG = 0)." },
  { code: "4010", name: "Combined Radium 226/228", category: "Radionuclide", mcl: 5, health_goal: 0, unit: "pCi/L", priority: 2,
    health_effects: "Increased cancer risk with long-term exposure to radioactivity (MCLG = 0)." },
  { code: "1925", name: "Fluoride", category: "Inorganic", mcl: 4, health_goal: 4, unit: "mg/L", priority: 3,
    health_effects: "Dental and skeletal fluorosis with long-term exposure above the MCL; secondary standard is 2 mg/L." },
  { code: "3100", name: "Total Coliform", category: "Microbiological", mcl: 0, health_goal: 0, unit: "MPN", priority: 1,
    health_effects: "Indicates possible sewage or animal-waste contamination and potential pathogens." },
  { code: "3014", name: "E. coli", category: "Microbiological", mcl: 0, health_goal: 0, unit: "MPN", priority: 1,
    health_effects: "Indicates fecal contamination; can cause severe GI illness, dangerous for vulnerable groups." },
];

export const CERTIFICATIONS: Record<NsfStandard, { description: string; is_health: boolean; is_obsolete: boolean }> = {
  "42": { description: "Aesthetic effects: chlorine, taste, odor, particulates. No health-contaminant protection.", is_health: false, is_obsolete: false },
  "53": { description: "Health effects: lead, VOCs, cysts, chromium, and (post-P473) PFAS reduction.", is_health: true, is_obsolete: false },
  "58": { description: "Reverse osmosis: dissolved inorganics, arsenic, hexavalent chromium, and total PFAS.", is_health: true, is_obsolete: false },
  "401": { description: "Emerging/incidental compounds: pharmaceuticals and select trace contaminants.", is_health: true, is_obsolete: false },
  "372": { description: "Lead-free materials (manufacturing content only). Not a water-treatment claim.", is_health: false, is_obsolete: false },
  "P473": { description: "Retired 2022 PFOA/PFOS standard; absorbed into NSF/ANSI 53 and 58.", is_health: false, is_obsolete: true },
};

// affiliate_url stays null: no program is confirmed for this site and the former redirect
// host did not resolve in checks on 2026-11-08. maker_url is the manufacturer's own product page where one was verified (HTTP 200,
// same model, 2026-11-08), otherwise the manufacturer's home page. See lib/offers.ts.
export const FILTERS: Filter[] = [
  { id: 1, brand: "ZeroWater", model: "5-Stage Ready-Pour Pitcher", sku: "ZW-ZD010RP", form_factor: "PITCHER", price_usd: 39.99, capacity_gallons: 25, affiliate_url: null, maker_url: "https://zerowater.com/", active: 1 },
  { id: 2, brand: "Frizzlife", model: "M800 Under-Sink Reverse Osmosis", sku: "FZ-M800", form_factor: "UNDERSINK_RO", price_usd: 399, capacity_gallons: 1100, affiliate_url: null, maker_url: "https://www.frizzlife.com/products/m800", active: 1 },
  { id: 3, brand: "AquaTru", model: "Classic Countertop RO", sku: "AT-CLASSIC", form_factor: "COUNTERTOP_RO", price_usd: 449, capacity_gallons: 600, affiliate_url: null, maker_url: "https://aquatru.com/products/countertop-reverse-osmosis-water-purifier", active: 1 },
  { id: 4, brand: "Clearly Filtered", model: "Affinity Filtered Water Pitcher", sku: "CF-AFFINITY", form_factor: "PITCHER", price_usd: 90, capacity_gallons: 100, affiliate_url: null, maker_url: "https://clearlyfiltered.com/", active: 1 },
  { id: 5, brand: "Brita", model: "Standard Everyday Pitcher (OB03)", sku: "BR-OB03", form_factor: "PITCHER", price_usd: 29.99, capacity_gallons: 40, affiliate_url: null, maker_url: "https://www.brita.com/", active: 1 },
  { id: 6, brand: "Brita", model: "Elite Pitcher (OB06)", sku: "BR-OB06", form_factor: "PITCHER", price_usd: 39.99, capacity_gallons: 120, affiliate_url: null, maker_url: "https://www.brita.com/", active: 1 },
  { id: 7, brand: "Pureline", model: "Universal Replacement Cartridge", sku: "PL-UNIV01", form_factor: "REFRIGERATOR", price_usd: 19.99, capacity_gallons: 200, affiliate_url: null, maker_url: "https://purelinefilters.com/", active: 1 },
  { id: 8, brand: "Waterdrop", model: "G3P800 Under-Sink RO", sku: "WD-G3P800", form_factor: "UNDERSINK_RO", price_usd: 549, capacity_gallons: 1000, affiliate_url: null, maker_url: "https://www.waterdropfilter.com/", active: 1 },
  { id: 9, brand: "LifeStraw", model: "Home Water Filter Pitcher", sku: "LS-HOME7", form_factor: "PITCHER", price_usd: 59.99, capacity_gallons: 40, affiliate_url: null, maker_url: "https://lifestraw.com/", active: 1 },
  { id: 10, brand: "Epic Water", model: "Pure Filter Pitcher", sku: "EP-PURE10", form_factor: "PITCHER", price_usd: 69.95, capacity_gallons: 150, affiliate_url: null, maker_url: "https://www.epicwaterfilters.com/", active: 1 },
  { id: 11, brand: "SpringWell", model: "CF1 Whole House Filter", sku: "SW-CF1", form_factor: "WHOLE_HOUSE", price_usd: 1000, capacity_gallons: 1000000, affiliate_url: null, maker_url: "https://www.springwellwater.com/", active: 1 },
];

const c = (filter_id: number, standard: NsfStandard, contaminant_code: string, certifier = "NSF"): FilterClaim =>
  ({ filter_id, standard, contaminant_code, certifier, verified: 1 });

export const FILTER_CLAIMS: FilterClaim[] = [
  // 1 ZeroWater
  c(1, "42", "2950"), c(1, "53", "PB90"), c(1, "53", "CR6"), c(1, "53", "1020"),
  c(1, "53", "PFOA", "IAPMO"), c(1, "53", "PFOS", "IAPMO"), c(1, "53", "1035"),
  // 2 Frizzlife M800 RO
  c(2, "58", "PB90"), c(2, "58", "CR6"), c(2, "58", "1020"), c(2, "58", "1005"),
  c(2, "58", "PFOA"), c(2, "58", "PFOS"), c(2, "58", "GENX"), c(2, "58", "PFHXS"),
  c(2, "58", "PFNA"), c(2, "58", "1040"), c(2, "58", "4006"), c(2, "58", "4010"),
  c(2, "58", "1925"), c(2, "58", "1041"), c(2, "58", "1010"), c(2, "58", "1015"),
  c(2, "58", "1035"), c(2, "58", "6590"),
  // 3 AquaTru
  c(3, "42", "2950"), c(3, "53", "PB90"), c(3, "53", "CR6"), c(3, "58", "1005"),
  c(3, "58", "PFOA"), c(3, "58", "PFOS"), c(3, "58", "1040"), c(3, "58", "1925"),
  c(3, "401", "2984"), c(3, "53", "2950"), c(3, "58", "1041"), c(3, "58", "1015"),
  c(3, "58", "1035"),
  // 4 Clearly Filtered
  c(4, "53", "PB90", "WQA"), c(4, "53", "CR6", "WQA"), c(4, "53", "1020", "WQA"),
  c(4, "58", "PFOA", "WQA"), c(4, "58", "PFOS", "WQA"), c(4, "58", "1005", "WQA"),
  c(4, "58", "1925", "WQA"), c(4, "401", "2984", "WQA"), c(4, "401", "2050", "WQA"),
  // 5 Brita Standard — NSF 42 only
  c(5, "42", "2950"),
  // 6 Brita Elite
  c(6, "42", "2950"), c(6, "53", "PB90"), c(6, "53", "2990"), c(6, "53", "CU90"),
  c(6, "53", "1015"), c(6, "53", "1035"),
  // 7 Pureline — 42 + 372 only (deceptive archetype)
  c(7, "42", "2950"), c(7, "372", "PB90"),
  // 8 Waterdrop G3P800 RO
  c(8, "58", "PB90"), c(8, "58", "CR6"), c(8, "58", "1005"), c(8, "58", "PFOA"),
  c(8, "58", "PFOS"), c(8, "58", "GENX"), c(8, "58", "1040"), c(8, "58", "4006"),
  c(8, "58", "1925"), c(8, "53", "2950"), c(8, "401", "2984"), c(8, "58", "1041"),
  c(8, "58", "1010"), c(8, "58", "1015"), c(8, "58", "1035"), c(8, "58", "6590"),
  // 9 LifeStraw
  c(9, "53", "PB90"), c(9, "53", "PFOA", "IAPMO"), c(9, "53", "PFOS", "IAPMO"),
  c(9, "401", "2050"),
  // 10 Epic Pure
  c(10, "53", "PB90", "WQA"), c(10, "53", "CR6", "WQA"), c(10, "53", "1020", "WQA"),
  c(10, "401", "2984", "WQA"), c(10, "401", "2987", "WQA"),
  // 11 SpringWell CF1 — NSF 42 only
  c(11, "42", "2950"),
];

// --- Demo systems (§16 marquee municipalities) ------------------------------

export interface DemoSystem {
  system: WaterSystem;
  boundary: Polygon;
  centroid: { lat: number; lon: number; radiusKm: number };
  detections: Array<{ code: string; value: number; unit: string; sample_date: string; agency: string }>;
  violations: Array<{
    violation_id: string; contaminant_code: string; violation_category: string;
    is_health_based: boolean; begin_date: string; status: string;
  }>;
  history: Array<{ code: string; value: number; unit: string; sample_date: string }>;
}

export const DEMO_SYSTEMS: DemoSystem[] = [
  {
    system: { pwsid: "MI0002360", name: "City of Flint", state: "MI", county: "Genesee", population_served: 95000, pws_type: "CWS", primary_source: "SW" },
    boundary: { rings: [[[-83.78, 42.95], [-83.6, 42.95], [-83.6, 43.08], [-83.78, 43.08], [-83.78, 42.95]]] },
    centroid: { lat: 43.0125, lon: -83.6875, radiusKm: 12 },
    detections: [
      { code: "PB90", value: 27, unit: "ug/L", sample_date: "2026-05-15", agency: "MI EGLE" },
      { code: "CU90", value: 1.1, unit: "mg/L", sample_date: "2026-05-15", agency: "MI EGLE" },
      { code: "2950", value: 62, unit: "ug/L", sample_date: "2026-04-10", agency: "MI EGLE" },
    ],
    violations: [
      { violation_id: "MI-2026-0012", contaminant_code: "PB90", violation_category: "MCL", is_health_based: true, begin_date: "2026-05-20", status: "Unaddressed" },
    ],
    history: [
      { code: "PB90", value: 21, unit: "ug/L", sample_date: "2025-11-01" },
      { code: "PB90", value: 24, unit: "ug/L", sample_date: "2026-02-01" },
      { code: "PB90", value: 27, unit: "ug/L", sample_date: "2026-05-15" },
    ],
  },
  {
    system: { pwsid: "NJ0714001", name: "Newark Water Department", state: "NJ", county: "Essex", population_served: 285000, pws_type: "CWS", primary_source: "SW" },
    boundary: { rings: [[[-74.25, 40.68], [-74.1, 40.68], [-74.1, 40.79], [-74.25, 40.79], [-74.25, 40.68]]] },
    centroid: { lat: 40.7357, lon: -74.1724, radiusKm: 10 },
    detections: [
      { code: "PB90", value: 48, unit: "ug/L", sample_date: "2026-06-01", agency: "NJ DEP" },
      { code: "PFOA", value: 9, unit: "ng/L", sample_date: "2026-06-01", agency: "NJ DEP" },
      { code: "CR6", value: 6, unit: "ug/L", sample_date: "2026-06-01", agency: "NJ DEP" },
    ],
    violations: [
      { violation_id: "NJ-2026-0044", contaminant_code: "PB90", violation_category: "MCL", is_health_based: true, begin_date: "2026-06-05", status: "Unaddressed" },
      { violation_id: "NJ-2026-0045", contaminant_code: "PFOA", violation_category: "MCL", is_health_based: true, begin_date: "2026-06-05", status: "Unaddressed" },
    ],
    history: [
      { code: "PB90", value: 52, unit: "ug/L", sample_date: "2025-12-01" },
      { code: "PB90", value: 50, unit: "ug/L", sample_date: "2026-03-01" },
      { code: "PB90", value: 48, unit: "ug/L", sample_date: "2026-06-01" },
      { code: "PFOA", value: 11, unit: "ng/L", sample_date: "2025-12-01" },
      { code: "PFOA", value: 9, unit: "ng/L", sample_date: "2026-06-01" },
    ],
  },
  {
    system: { pwsid: "TX0610001", name: "Clear Springs Water District", state: "TX", county: "Travis", population_served: 42000, pws_type: "CWS", primary_source: "GW" },
    boundary: { rings: [[[-97.83, 30.2], [-97.66, 30.2], [-97.66, 30.34], [-97.83, 30.34], [-97.83, 30.2]]] },
    centroid: { lat: 30.2672, lon: -97.7431, radiusKm: 15 },
    detections: [
      { code: "1040", value: 3.2, unit: "mg/L", sample_date: "2026-05-20", agency: "TCEQ" },
    ],
    violations: [],
    history: [
      { code: "1040", value: 3.0, unit: "mg/L", sample_date: "2025-12-01" },
      { code: "1040", value: 3.2, unit: "mg/L", sample_date: "2026-05-20" },
    ],
  },
];

// Lookups -------------------------------------------------------------------
export const CONTAMINANT_BY_CODE = new Map(CONTAMINANTS.map((x) => [x.code, x]));
export const FILTER_BY_ID = new Map(FILTERS.map((f) => [f.id, f]));
export const DEMO_BY_PWSID = new Map(DEMO_SYSTEMS.map((d) => [d.system.pwsid, d]));

export function contaminantName(code: string): string {
  return CONTAMINANT_BY_CODE.get(code)?.name ?? code;
}
