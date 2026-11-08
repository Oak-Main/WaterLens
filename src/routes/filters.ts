import { Env } from "../types";
import { json } from "../lib/http";
import { publicAffiliateUrl } from "../lib/offers";

// -----------------------------------------------------------------------------
// GET /api/filters                 -> Filter Certification Registry (§9 asset)
// GET /api/filters?deceptive=1     -> SKUs that hold ONLY 42/372 (no health cert)
//
// The registry is the platform's primary linkable data asset and defensive moat
// (§9, §10): it exposes exactly which SKUs hold which independently verified NSF
// certifications, and flags products that market non-health standards (42/372)
// while lacking any health standard (53/58/401) — the deceptive-marketing case
// described in the memo (Pureline / Glacier Fresh conflating 372 with 53).
// -----------------------------------------------------------------------------

interface FilterRow {
  id: number;
  brand: string;
  model: string;
  sku: string;
  form_factor: string;
  price_usd: number | null;
  capacity_gallons: number | null;
  affiliate_url: string | null;
  active: number;
}

export async function handleFilterRegistry(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const deceptiveOnly = url.searchParams.get("deceptive") === "1";

  const { results: filters } = await env.DB.prepare(
    `SELECT id, brand, model, sku, form_factor, price_usd, capacity_gallons, affiliate_url, active
       FROM filters ORDER BY brand, model`
  ).all<FilterRow>();

  const { results: claims } = await env.DB.prepare(
    `SELECT filter_id, standard, contaminant_code, certifier, verified FROM filter_claims`
  ).all<{
    filter_id: number;
    standard: string;
    contaminant_code: string;
    certifier: string;
    verified: number;
  }>();

  const byFilter = new Map<number, typeof claims>();
  for (const c of claims ?? []) {
    const arr = byFilter.get(c.filter_id) ?? [];
    arr.push(c);
    byFilter.set(c.filter_id, arr);
  }

  const health = new Set(["53", "58", "401"]);
  const registry = (filters ?? []).map((f) => {
    const fc = byFilter.get(f.id) ?? [];
    const standards = [...new Set(fc.filter((c) => c.verified).map((c) => c.standard))];
    const hasHealth = standards.some((s) => health.has(s));
    const marketsNonHealthOnly =
      !hasHealth && standards.some((s) => s === "42" || s === "372");
    return {
      ...f,
      affiliate_url: publicAffiliateUrl(f.affiliate_url),
      standards: standards.sort(),
      health_certified: hasHealth,
      // Flag the deceptive pattern: markets 42/372 but holds no health cert.
      deceptive_marketing_risk: marketsNonHealthOnly,
      claims: fc.map((c) => ({
        standard: c.standard,
        contaminant_code: c.contaminant_code,
        certifier: c.certifier,
        verified: Boolean(c.verified),
      })),
    };
  });

  const payload = deceptiveOnly
    ? registry.filter((r) => r.deceptive_marketing_risk)
    : registry;

  return json({ count: payload.length, filters: payload });
}
