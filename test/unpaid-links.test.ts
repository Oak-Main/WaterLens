import { describe, expect, it } from "vitest";
import m0001 from "../migrations/0001_schema.sql?raw";
import m0002 from "../migrations/0002_reference_data.sql?raw";
import m0003 from "../migrations/0003_enrichment.sql?raw";
import m0004 from "../migrations/0004_unresolved_affiliate_urls.sql?raw";
import { buildDisclaimers } from "../src/services/lookup";
import { DISCLAIMER_AFFILIATE, DISCLAIMER_UNPAID_LINKS } from "../src/config/constants";
import { MatchTier } from "../src/types";

describe("affiliate disclaimer follows the links that ship", () => {
  it("states the unpaid wording when no recommended filter has a paid link", () => {
    const out = buildDisclaimers(MatchTier.EXPLICIT, [{ affiliate_url: null }, { affiliate_url: null }]);
    expect(out).toContain(DISCLAIMER_UNPAID_LINKS);
    expect(out).not.toContain(DISCLAIMER_AFFILIATE);
  });
  it("states the unpaid wording when there are no recommendations at all", () => {
    expect(buildDisclaimers(MatchTier.NONE)).toContain(DISCLAIMER_UNPAID_LINKS);
  });
  it("states the affiliate wording only when a recommended filter carries a paid link", () => {
    const out = buildDisclaimers(MatchTier.EXPLICIT, [{ affiliate_url: null }, { affiliate_url: "https://partner.example/x" }]);
    expect(out).toContain(DISCLAIMER_AFFILIATE);
    expect(out).not.toContain(DISCLAIMER_UNPAID_LINKS);
  });
});

describe("migration 0004 clears the non-resolving redirect URLs", () => {
  it("applies 0001..0004 in order and leaves no filter pointing at affil.waterqualitylens.com", () => {
    // node:sqlite (Node 22+) applies the same SQL D1 would, in memory.
    const node = globalThis as unknown as { process: { getBuiltinModule(name: string): any } };
    const { DatabaseSync } = node.process.getBuiltinModule("node:sqlite");
    const db = new DatabaseSync(":memory:");
    for (const sql of [m0001, m0002, m0003]) db.exec(sql);
    const before = db.prepare("SELECT COUNT(*) AS n FROM filters WHERE affiliate_url LIKE 'https://affil.waterqualitylens.com/%'").get() as { n: number };
    expect(before.n).toBeGreaterThan(0);
    db.prepare("UPDATE filters SET affiliate_url = 'https://partner.example/kept' WHERE id = 1").run();
    db.exec(m0004);
    const after = db.prepare("SELECT COUNT(*) AS n FROM filters WHERE affiliate_url LIKE '%waterqualitylens.com%'").get() as { n: number };
    expect(after.n).toBe(0);
    const kept = db.prepare("SELECT affiliate_url FROM filters WHERE id = 1").get() as { affiliate_url: string };
    expect(kept.affiliate_url).toBe("https://partner.example/kept");
  });
});
