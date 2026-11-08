import { Env } from "../types";
import { error, json } from "../lib/http";
import { getSdwisProfile } from "../services/sdwis";
import { matchFilters } from "../services/setcover";
import { publicAffiliateUrl } from "../lib/offers";

// -----------------------------------------------------------------------------
// Programmatic entity endpoints backing the SEO architecture (§9).
//
//   GET /api/pws/:pwsid            -> full utility profile + recommendations
//   GET /api/contaminants          -> contaminant glossary
//   GET /api/contaminants/:code    -> single contaminant entity
//   GET /api/filters               -> filter certification registry
//
// The PWS endpoint also exposes the programmatic quality gate (§9): a page is
// index-eligible only if it has recent detections, historical trend data, and at
// least three verified filter matches. `indexable` is emitted for the frontend
// to set the noindex meta tag accordingly.
// -----------------------------------------------------------------------------

export async function handlePws(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const pwsid = params.pwsid.toUpperCase();
  const profile = await getSdwisProfile(env, pwsid);

  if (!profile.utility) {
    return error("Public water system not found", 404, "PWS_NOT_FOUND");
  }

  const exceedances = profile.detections.filter((d) => d.exceeds_health_goal);
  const recommended = await matchFilters(env, profile.detections, "UNKNOWN");

  // Historical trend series for time-series trend lines (§9 quality gate).
  const { results: trend } = await env.DB.prepare(
    `SELECT contaminant_code, value, unit, sample_date
       FROM detection_history
      WHERE pwsid = ?1
      ORDER BY sample_date ASC
      LIMIT 500`
  )
    .bind(pwsid)
    .all();

  const history = trend ?? [];
  const indexable =
    exceedances.length > 0 && history.length > 0 && recommended.length >= 3;

  return json({
    utility: profile.utility,
    detected_contaminants: exceedances,
    active_violations: profile.violations,
    recommended_filters: recommended,
    history,
    data_freshness: { sdwis_fetched_at: profile.fetched_at },
    seo: { indexable },
  });
}

export async function handleContaminantList(_req: Request, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT code, name, category, mcl, health_goal, unit FROM contaminants ORDER BY name`
  ).all();
  return json({ contaminants: results ?? [] });
}

export async function handleContaminant(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const code = params.code.toUpperCase();
  const def = await env.DB.prepare(
    `SELECT code, name, category, mcl, health_goal, unit, description
       FROM contaminants WHERE code = ?1 OR upper(name) = ?1`
  )
    .bind(code)
    .first();
  if (!def) return error("Contaminant not found", 404, "CONTAMINANT_NOT_FOUND");

  // Filters verified to reduce this contaminant under a health standard.
  const { results: filters } = await env.DB.prepare(
    `SELECT DISTINCT f.id, f.brand, f.model, f.sku, f.form_factor, f.price_usd, f.affiliate_url
       FROM filters f
       JOIN filter_claims fc ON fc.filter_id = f.id
      WHERE f.active = 1 AND fc.verified = 1
        AND fc.standard IN ('53','58','401')
        AND fc.contaminant_code = (SELECT code FROM contaminants WHERE code = ?1 OR upper(name) = ?1)`
  )
    .bind(code)
    .all<Record<string, unknown> & { affiliate_url: string | null }>();

  const verified = (filters ?? []).map((f) => ({ ...f, affiliate_url: publicAffiliateUrl(f.affiliate_url) }));
  return json({ contaminant: def, verified_filters: verified });
}
