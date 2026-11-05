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
  const links = [...hardware.matchAll(/<a\b[^>]*\bhref="https:\/\/affil\.waterqualitylens\.com\/[^"]+"[^>]*>/gi)];
  assert.ok(links.length, path + ": expected filter retailer links");
  assert.doesNotMatch(hardware, /\[\[COPY:/i, path + ": editorial placeholder");
  assert.match(hardware.slice(0, links[0].index), /<p\b[^>]*role="note"[^>]*>[^<]*may earn a commission[^<]*<\/p>/i,
    path + ": missing commission disclosure before the first filter link");
  for (const [tag] of links) {
    assert.match(tag, /\brel="[^"]*\bsponsored\b[^"]*"/i, path + ": missing sponsored rel");
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

  // Cover both the empty report and a report with recommendations from the
  // bundled Flint system. The latter renders the address-report filter carousel.
  const shortReport = "/results?address=QA&dwelling_type=MULTI_FAMILY_RENTAL";
  const flintReport = "/results?" + new URLSearchParams({ address: "Flint, MI 48503" });
  for (const [path, title] of [
    ["/contaminants/PB90", /<title>[^<]*Lead/i],
    ["/pws/MI0002360", /<title>[^<]*Flint/i],
    [shortReport, /<title>[^<]*Water report for QA/],
    [flintReport, /<title>[^<]*Water report for Flint/],
  ]) {
    const response = await fetch(`${origin}${path}`, {
      // Also check the complete HTML representation of the streamed report.
      headers: path === flintReport ? { "User-Agent": "Twitterbot/1.0" } : {},
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, 200, `${path}: migrated page should load`);
    const html = await response.text();
    assert.match(html, title, `${path}: async parameters should reach metadata`);
    if (path === shortReport) {
      assert.match(html, /Enter an address to see its water report/);
      assert.match(html, /value="QA"/);
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    } else {
      checkFilterLinks(html, path);
    }
    console.log(`PASS migrated page ${path}`);
  }
  // Chrome runs the scripts that assemble the streamed report into its final DOM.
  if (process.env.CHROME_BIN) {
    const profile = await mkdtemp(join(tmpdir(), "waterlens-report-"));
    try {
      const { stdout } = await promisify(execFile)(process.env.CHROME_BIN, [
        "--headless", "--no-first-run", "--disable-background-networking",
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
        "--user-data-dir=" + profile, "--virtual-time-budget=5000", "--dump-dom", origin + flintReport,
      ], { timeout: 30_000, maxBuffer: 4 * 1024 * 1024 });
      checkFilterLinks(stdout, "Flint address report in Chrome");
      console.log("PASS hydrated Flint address report in Chrome");
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
}
