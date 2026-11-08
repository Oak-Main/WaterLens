import { describe, expect, it } from "vitest";
import m0001 from "../migrations/0001_schema.sql?raw";
import m0002 from "../migrations/0002_reference_data.sql?raw";
import m0003 from "../migrations/0003_enrichment.sql?raw";
import m0004 from "../migrations/0004_unresolved_affiliate_urls.sql?raw";
import { buildDisclaimers } from "../src/services/lookup";
import { isPaidAffiliateUrl, publicAffiliateUrl } from "../src/lib/offers";
import { matchFilters } from "../src/services/setcover";
import { handleContaminant } from "../src/routes/entities";
import { handleFilterRegistry } from "../src/routes/filters";
import { DISCLAIMER_AFFILIATE, DISCLAIMER_UNPAID_LINKS, PAID_OFFER_HOSTS } from "../src/config/constants";
import { Detection, Env, MatchTier } from "../src/types";

// node:sqlite (Node 22.13+) runs the same SQL D1 would, in memory.
function sqlite(): any {
  const node = globalThis as unknown as { process: { getBuiltinModule(name: string): any } };
  const { DatabaseSync } = node.process.getBuiltinModule("node:sqlite");
  return new DatabaseSync(":memory:");
}

/** The slice of D1's API the routes use (prepare -> bind -> all/first), backed by node:sqlite. */
function d1Env(db: any): Env {
  const stmt = (sql: string, args: unknown[] = []): any => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => db.prepare(sql).run(...args),
  });
  return { DB: { prepare: (sql: string) => stmt(sql) } } as unknown as Env;
}

const UNLISTED = "https://partner.example/kept";

function migratedDb(): any {
  const db = sqlite();
  for (const sql of [m0001, m0002, m0003]) db.exec(sql);
  db.prepare("UPDATE filters SET affiliate_url = ?1 WHERE id = 1").run(UNLISTED);
  db.exec(m0004);
  return db;
}

const lead: Detection = {
  code: "PB90", name: "Lead", category: "Metal", value: 27, unit: "ug/L", mcl: 15, health_goal: 0,
  mcl_ratio: 1.8, exceeds_mcl: true, exceeds_health_goal: true, sample_date: null, sampling_agency: null, source: "test",
};

describe("affiliate disclaimer follows the links that ship", () => {
  it("states the unpaid wording when no recommended filter has a paid link", () => {
    const out = buildDisclaimers(MatchTier.EXPLICIT, [{ affiliate_url: null }, { affiliate_url: null }]);
    expect(out).toContain(DISCLAIMER_UNPAID_LINKS);
    expect(out).not.toContain(DISCLAIMER_AFFILIATE);
  });
  it("states the unpaid wording when there are no recommendations at all", () => {
    expect(buildDisclaimers(MatchTier.NONE)).toContain(DISCLAIMER_UNPAID_LINKS);
  });
  it("keeps the unpaid wording for an affiliate_url whose host is not in PAID_OFFER_HOSTS", () => {
    expect(PAID_OFFER_HOSTS).toEqual([]);
    const out = buildDisclaimers(MatchTier.EXPLICIT, [{ affiliate_url: null }, { affiliate_url: "https://partner.example/x" }]);
    expect(out).toContain(DISCLAIMER_UNPAID_LINKS);
    expect(out).not.toContain(DISCLAIMER_AFFILIATE);
  });
  it("states the affiliate wording only when a recommended filter's host is listed as paid", () => {
    const hosts = ["partner.example"];
    const out = buildDisclaimers(MatchTier.EXPLICIT, [{ affiliate_url: null }, { affiliate_url: "https://partner.example/x" }], hosts);
    expect(out).toContain(DISCLAIMER_AFFILIATE);
    expect(out).not.toContain(DISCLAIMER_UNPAID_LINKS);
  });
  it("applies the same host rule as web/lib/offers.ts", () => {
    const hosts = ["partner.example"];
    expect(isPaidAffiliateUrl("https://PARTNER.example/x", hosts)).toBe(true);
    expect(isPaidAffiliateUrl("http://partner.example/x", hosts)).toBe(false);
    expect(isPaidAffiliateUrl("https://partner.example.evil.test/x", hosts)).toBe(false);
    expect(isPaidAffiliateUrl("not a url", hosts)).toBe(false);
    expect(isPaidAffiliateUrl(null, hosts)).toBe(false);
    expect(publicAffiliateUrl("https://partner.example/x", hosts)).toBe("https://partner.example/x");
    expect(publicAffiliateUrl("https://partner.example/x")).toBeNull();
  });
});

describe("migration 0004 clears the non-resolving redirect URLs", () => {
  it("applies 0001..0004 in order and leaves no filter pointing at affil.waterqualitylens.com", () => {
    const db = sqlite();
    for (const sql of [m0001, m0002, m0003]) db.exec(sql);
    const before = db.prepare("SELECT COUNT(*) AS n FROM filters WHERE affiliate_url LIKE 'https://affil.waterqualitylens.com/%'").get() as { n: number };
    expect(before.n).toBeGreaterThan(0);
    db.prepare("UPDATE filters SET affiliate_url = ?1 WHERE id = 1").run(UNLISTED);
    db.exec(m0004);
    const after = db.prepare("SELECT COUNT(*) AS n FROM filters WHERE affiliate_url LIKE '%waterqualitylens.com%'").get() as { n: number };
    expect(after.n).toBe(0);
    const kept = db.prepare("SELECT affiliate_url FROM filters WHERE id = 1").get() as { affiliate_url: string };
    expect(kept.affiliate_url).toBe(UNLISTED);
  });
});

describe("API responses never carry an affiliate_url the web would not render", () => {
  // Row 1 keeps a stored URL on a host that is not in PAID_OFFER_HOSTS (empty), so every response must null it.
  it("set-cover recommendations", async () => {
    const recs = await matchFilters(d1Env(migratedDb()), [lead], "SINGLE_FAMILY");
    expect(recs.some((r) => r.id === 1)).toBe(true);
    expect(recs.every((r) => r.affiliate_url === null)).toBe(true);
    expect(buildDisclaimers(MatchTier.EXPLICIT, recs)).toContain(DISCLAIMER_UNPAID_LINKS);
  });
  it("contaminant page filters", async () => {
    const res = await handleContaminant(new Request("https://api.test/contaminants/PB90"), d1Env(migratedDb()), { code: "PB90" });
    const body = (await res.json()) as { verified_filters: { id: number; affiliate_url: string | null }[] };
    expect(body.verified_filters.some((f) => f.id === 1)).toBe(true);
    expect(body.verified_filters.every((f) => f.affiliate_url === null)).toBe(true);
  });
  it("filter registry", async () => {
    const res = await handleFilterRegistry(new Request("https://api.test/filters"), d1Env(migratedDb()));
    const body = (await res.json()) as { filters: { id: number; affiliate_url: string | null }[] };
    expect(body.filters.length).toBeGreaterThan(0);
    expect(body.filters.every((f) => f.affiliate_url === null)).toBe(true);
  });
});
