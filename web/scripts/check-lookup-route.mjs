import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

function checkFilterLinks(html, path) {
  const hardware = html.match(/<section\b[^>]*\bid="(?:hardware|filters)"[^>]*>[\s\S]*?<\/section>/i)?.[0];
  assert.ok(hardware, path + ": missing hardware section");
  // The former redirect host affil.waterqualitylens.com did not resolve in checks on 2026-11-08; no link
  // anywhere on the page may use it (filter buttons and the Tap Score lab-test buttons alike).
  assert.doesNotMatch(html, /affil\.waterqualitylens\.com/i, path + ": link to the redirect host that did not resolve (2026-11-08)");
  assert.doesNotMatch(hardware, /\[\[COPY:/i, path + ": editorial placeholder");
  const links = [...hardware.matchAll(/<a\b[^>]*\baria-label="View at [^"]*\(opens in a new tab\)"[^>]*>/gi)];
  assert.ok(links.length, path + ": expected filter maker links");
  // No paid destination is configured (lib/offers.ts), so the notice and every link say unpaid.
  assert.match(hardware.slice(0, links[0].index), /<p\b[^>]*role="note"[^>]*>[^<]*earns no commission[^<]*<\/p>/i,
    path + ": missing unpaid-link notice before the first filter link");
  assert.doesNotMatch(hardware, /may earn a commission/i, path + ": commission wording with no paid destination");
  assert.doesNotMatch(hardware, />\s*Affiliate\s*</, path + ": Affiliate badge on unpaid links");
  assert.doesNotMatch(hardware, /Verified\s+Partner|affiliate placement|commercial placement/i, path + ": paid-placement wording on unpaid links");
  for (const [tag] of links) {
    assert.match(tag, /\bhref="https:\/\/[^"]+"/i, path + ": filter link must be https");
    assert.doesNotMatch(tag, /\brel="[^"]*\bsponsored\b/i, path + ": unpaid link marked sponsored");
    assert.match(tag, /\brel="[^"]*\bnoopener\b[^"]*"/i, path + ": missing noopener");
    assert.match(tag, /\btarget="_blank"/i, path + ": filter link should open a new tab");
  }
}

// Exercise the production server, including Next's slash normalization and
// query handling. Run `npm run build` first; no external services are contacted.
const webRoot = fileURLToPath(new URL("../", import.meta.url));
const reservation = createServer().listen(0, "127.0.0.1");
await once(reservation, "listening");
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const canonicalOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.taptoglass.com").replace(/\/$/, "");
const offlineFetch = new URL("./fixtures/offline-fetch.mjs", import.meta.url);
const server = spawn(process.execPath, ["--import", offlineFetch.href, "node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  cwd: webRoot,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });
let startupError;
server.on("error", (error) => { startupError = error; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`Next exited before readiness: ${output}`);
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(1500) })).ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, `Production server failed to become ready: ${output}`);

  for (const path of ["/check", "/check/", "/check?source=qa&value=a%2Fb&value=two", "/check/?source=qa"]) {
    const original = new URL(path, origin);
    let target = original;
    let compatibilityRedirect = false;
    for (let hop = 0; hop < 4; hop++) {
      const response = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(10000) });
      assert.ok([307, 308].includes(response.status), `${path}: expected a redirect, got ${response.status}`);
      assert.ok(response.headers.get("location"), `${path}: missing Location`);
      target = new URL(response.headers.get("location"), target);
      assert.equal(target.origin, origin, `${path}: redirect left this site`);
      assert.deepEqual([...target.searchParams], [...original.searchParams], `${path}: query values changed`);
      if (target.pathname === "/") {
        assert.equal(response.status, 307, `${path}: compatibility redirect should remain temporary`);
        assert.equal(target.hash, "#lookup");
        compatibilityRedirect = true;
        break;
      }
    }
    assert.ok(compatibilityRedirect, `${path}: did not reach the lookup anchor`);
    const landing = await fetch(target, { signal: AbortSignal.timeout(10000) });
    assert.equal(landing.status, 200);
    const html = await landing.text();
    assert.match(html, /id="lookup"/);
    assert.match(html, /aria-label="Water system address lookup"/);
    console.log(`PASS ${path} -> ${target.pathname}${target.search}${target.hash}`);
  }
  const missing = await fetch(`${origin}/check-missing-route`, { redirect: "manual", signal: AbortSignal.timeout(10000) });
  assert.equal(missing.status, 404, "Unrelated unknown paths must remain 404");
  console.log("PASS unrelated unknown route remains 404");

  const forbidden = /NJ-2026-004[45]|MI-2026-0012|Clear Springs Water District|July 1, 2026|2026-07-01|SDWIS_LCR|\bNo reported (?:contaminant|exceedance)|All reported values within federal limits/i;
  const reports = new Map([
    ["NEWARK QA GEOCODE FIXTURE", "NJ0714001"],
    ["FLINT QA 48503", "MI0002310"],
  ]);

  async function getHtml(path, expectedStatus = 200) {
    const response = await fetch(origin + path, {
      // Streamed reports use the crawler response so raw HTML includes metadata.
      headers: path.startsWith("/results?") ? { "User-Agent": "Twitterbot/1.0" } : {},
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, expectedStatus, path);
    const html = await response.text();
    assert.doesNotMatch(html, forbidden, path);
    return { html, response };
  }

  for (const [pwsid, name, official] of [
    ["NJ0714001", "Newark Water Department", "water.newarknj.gov/waterquality"],
    ["MI0002310", "City of Flint", "michigan.gov/egle/"],
  ]) {
    const path = "/pws/" + pwsid;
    const { html } = await getHtml(path);
    assert.ok(html.includes(name), path);
    assert.ok(html.includes(official), path);
    assert.match(html, /Verified water quality records unavailable/);
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.ok(html.includes(`rel="canonical" href="${canonicalOrigin}${path}"`), path);
    assert.doesNotMatch(html, /Above federal limit|Active violations|sampling-chart|Filters certified for these contaminants|Data as of/i, path);
  }

  for (const pwsid of ["MI0002360", "TX0610001"]) {
    const { html } = await getHtml("/pws/" + pwsid, 404);
    assert.match(html, /name="robots" content="noindex/);
  }

  const { html: directory } = await getHtml("/pws");
  assert.match(directory, /2 water systems/);
  assert.match(directory, /Verified records unavailable/);
  assert.doesNotMatch(directory, /MI0002360|TX0610001|above the federal limit|reported contaminant/i);
  const { html: sitemap } = await getHtml("/sitemap.xml");
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/pws\/[^<]+<\/loc>/);
  const directoryEntry = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)].find(
    ([entry]) => entry.includes(`<loc>${canonicalOrigin}/pws</loc>`),
  );
  assert.ok(directoryEntry);
  assert.doesNotMatch(directoryEntry[0], /<lastmod>/i);

  const { html: home } = await getHtml("/");
  assert.match(home, /Verified records unavailable/);
  assert.match(home, /The lookup uses your ZIP code, which can have several suppliers/);
  assert.doesNotMatch(home, /MI0002360|180% of MCL|27 µg\/L|data.*weekly refresh/i);
  assert.doesNotMatch(home, /TEMM service boundaries|address-level tap water quality intelligence|location precision|grade each address match|address-mapping confidence|3-tier|ZIP 48503|illustrative service area|wql-mains|wql-ping/i);
  const { html: methodology } = await getHtml("/methodology");
  assert.doesNotMatch(methodology, /Point-in-polygon resolution|TEMM service boundaries/i);

  for (const code of ["PB90", "CU90"]) {
    const path = "/contaminants/" + code;
    const { html } = await getHtml(path);
    assert.match(html, /<title>[^<]*Action Level/i);
    assert.match(html, /Action level \(90th percentile\)/i);
    assert.match(html, /90th-percentile tap monitoring result can trigger requirements/);
    assert.match(html, /epa\.gov\/dwreginfo\/lead-and-copper-rule/);
    assert.doesNotMatch(html, /Legal MCL|enforceable limit|Systems reporting|NJ0714001|MI0002310|15 µg\/L/i);
    checkFilterLinks(html, path);
  }
  const { html: contaminantDirectory } = await getHtml("/contaminants");
  assert.match(contaminantDirectory, /Action level — Lead and Copper Rule/);
  const { html: contaminantControl } = await getHtml("/contaminants/1005");
  assert.match(contaminantControl, /Legal MCL/);

  const shortReport = "/results?address=QA&dwelling_type=MULTI_FAMILY_RENTAL";
  const { html: shortHtml, response: shortResponse } = await getHtml(shortReport);
  assert.match(shortHtml, /<title>[^<]*Water report for QA/);
  assert.match(shortHtml, /Enter an address to see its water report/);
  assert.match(shortHtml, /value="QA"/);
  assert.match(shortHtml, /name="robots" content="noindex, nofollow"/);
  assert.equal(shortResponse.headers.get("x-robots-tag"), "noindex, nofollow");

  function checkCandidateHtml(html, pwsid) {
    assert.ok(html.includes(pwsid));
    assert.match(html, /Verified water quality records unavailable/);
    assert.match(html, /ZIP registry candidate/);
    assert.match(html, /EPA ECHO ZIP registry/);
    assert.doesNotMatch(html, forbidden);
    assert.doesNotMatch(html, /Utility data as of|Open health violations|% confidence|filters certified for your|supplying water system/i);
  }

  function checkUnavailablePayload(report) {
    for (const field of ["detected_contaminants", "history", "active_violations", "recommended_filters"]) {
      assert.deepEqual(report[field], [], field);
    }
    assert.equal(report.service_boundary, null);
    assert.equal(report.data_freshness.sdwis_fetched_at, null);
    assert.equal(report.match.confidence, 0);
    assert.match(report.disclaimers[0], /Verified measurements and violation records are unavailable/);
    assert.doesNotMatch(JSON.stringify(report), forbidden);
  }

  function reportPath(address) {
    return "/results?" + new URLSearchParams({ address });
  }

  for (const [address, pwsid] of reports) {
    const { html } = await getHtml(reportPath(address));
    checkCandidateHtml(html, pwsid);
    for (const method of ["GET", "POST"]) {
      const response = method === "GET"
        ? await fetch(origin + "/api/lookup?" + new URLSearchParams({ address }))
        : await fetch(origin + "/api/lookup", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
      assert.equal(response.status, 200);
      const report = await response.json();
      assert.equal(report.utility.pwsid, pwsid);
      assert.equal(report.meta.resolution, "ZIP_REGISTRY");
      assert.equal(report.meta.registry_status, "candidates");
      assert.equal(report.multi_system_warning, pwsid === "NJ0714001");
      assert.equal(report.multi_system_count, pwsid === "NJ0714001" ? 2 : 1);
      checkUnavailablePayload(report);
    }
  }

  const pagedResponse = await fetch(origin + "/api/lookup?address=00005");
  assert.equal(pagedResponse.status, 200);
  const pagedReport = await pagedResponse.json();
  assert.equal(pagedReport.utility?.pwsid, "NJ0000006", "the larger valid candidate is on page two");
  assert.equal(pagedReport.meta.registry_status, "candidates");
  assert.equal(pagedReport.multi_system_count, 2);
  assert.equal(pagedReport.multi_system_warning, true);
  checkUnavailablePayload(pagedReport);
  const { html: pagedHtml } = await getHtml(reportPath("00005"));
  checkCandidateHtml(pagedHtml, "NJ0000006");
  assert.match(pagedHtml, /The ZIP registry returned multiple potential systems/);

  // Empty, mismatched, capped and failed provider responses never present a
  // confirmed address match, violation count, or clean-water verdict.
  for (const [address, pwsid, status, count] of [
    ["QA FIXTURE 00003", null, "no_candidates", 0],
    ["QA FIXTURE 00001", null, "unverified", null],
    ["QA FIXTURE 00002", null, "unverified", null],
    ["QA FIXTURE 00004", null, "unverified", null],
    ["QA FIXTURE 00006", null, "unavailable", null],
    ["QA FIXTURE 00007", null, "unverified", null],
    ["QA FIXTURE 00008", null, "unverified", null],
    ["QA FIXTURE 78701", null, "unavailable", null],
    ["NEWARK QA WITH NO ZIP", null, "not_queried", null],
    ["07102 QA STREET WITHOUT ZIP", null, "not_queried", null],
    ["48503 QA STREET 07102-1234", "NJ0714001", "candidates", 2],
  ]) {
    const response = await fetch(origin + "/api/lookup?" + new URLSearchParams({ address }));
    assert.equal(response.status, 200);
    const report = await response.json();
    assert.equal(report.match.pwsid, pwsid);
    assert.equal(report.meta.registry_status, status);
    assert.equal(report.multi_system_count, count);
    checkUnavailablePayload(report);
    const { html } = await getHtml(reportPath(address));
    if (pwsid) checkCandidateHtml(html, pwsid);
    else assert.match(html, /We couldn(?:'|&#x27;)t confirm your water system/);
    if (status === "unverified") assert.match(html, /EPA ZIP coverage for this lookup is unverified/);
    if (status === "unavailable") assert.match(html, /EPA ZIP coverage is temporarily unavailable/);
  }
  console.log("PASS public records, directory, reference thresholds, sitemap, and offline lookups");

  // Exercise the final DOM of both streamed reports in a browser.
  if (process.env.CHROME_BIN) {
    const profile = await mkdtemp(join(tmpdir(), "waterlens-report-"));
    try {
      for (const [address, pwsid] of reports) {
        const { stdout } = await promisify(execFile)(process.env.CHROME_BIN, [
          "--headless", "--no-first-run", "--disable-background-networking",
          "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
          "--user-data-dir=" + profile, "--virtual-time-budget=5000", "--dump-dom", origin + reportPath(address),
        ], { timeout: 30_000, maxBuffer: 4 * 1024 * 1024 });
        checkCandidateHtml(stdout, pwsid);
      }
      console.log("PASS hydrated Newark and Flint registry results in Chrome");
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  }
} finally {
  if (server.pid && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
  }
  assert.doesNotMatch(output, /Unexpected offline ECHO request:/, output);
}
