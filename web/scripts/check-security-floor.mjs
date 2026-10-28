/**
 * Security floor check for the INSTALLED dependency tree.
 *
 * Guards against regressing to a Next.js / sharp release that is exposed to
 *   GHSA-2464-fhr4-w9xw  Image Optimization API SVG RCE (glibc Linux)
 *   GHSA-p3m5-59mp-jv5r  App Router Server Actions DoS
 *   GHSA-673q-mjm6-r5xr  `use cache` typed-array RCE (16.x only)
 *
 * It reads what is actually installed in node_modules (not package.json), and
 * resolves sharp from next's own location, i.e. the copy next will load.
 *
 *   next 15.x  >= 15.5.28
 *   next 16.x  >= 16.4.1
 *   sharp      >= 0.35.5
 *
 * Usage: npm run check:security-floor   (exit 1 on any violation)
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT_FLOORS = { 15: [15, 5, 28], 16: [16, 4, 1] };
const SHARP_FLOOR = [0, 35, 5];

const fmt = (v) => v.join(".");

function parse(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(version);
  if (!m) throw new Error(`cannot parse version "${version}"`);
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null };
}

// true when `version` is strictly older than `floor` (a prerelease of the floor counts as older)
function isBelow(version, floor) {
  const { nums, pre } = parse(version);
  for (let i = 0; i < 3; i++) {
    if (nums[i] !== floor[i]) return nums[i] < floor[i];
  }
  return pre !== null;
}

// Locate a package's package.json even when its "exports" map hides it.
function findPackageJson(req, name) {
  try {
    return req.resolve(`${name}/package.json`);
  } catch (err) {
    if (err.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw err;
  }
  let dir = dirname(req.resolve(name));
  for (;;) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate) && JSON.parse(readFileSync(candidate, "utf8")).name === name) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`could not locate package.json for ${name}`);
    dir = parent;
  }
}

const problems = [];

let nextPkgPath;
try {
  nextPkgPath = createRequire(join(root, "package.json")).resolve("next/package.json");
} catch {
  console.error("FAIL: next is not installed (run `npm ci` first)");
  process.exit(1);
}
const nextVersion = JSON.parse(readFileSync(nextPkgPath, "utf8")).version;
const nextMajor = parse(nextVersion).nums[0];
console.log(`next  ${nextVersion}  (${nextPkgPath})`);

if (nextMajor < 15) {
  problems.push(`next ${nextVersion} is on an unsupported line (no fixed release known for ${nextMajor}.x; need 15.x >= ${fmt(NEXT_FLOORS[15])} or 16.x >= ${fmt(NEXT_FLOORS[16])})`);
} else if (NEXT_FLOORS[nextMajor]) {
  const floor = NEXT_FLOORS[nextMajor];
  if (isBelow(nextVersion, floor)) {
    problems.push(`next ${nextVersion} is below the fixed floor for ${nextMajor}.x (${fmt(floor)}): GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r${nextMajor === 16 ? ", GHSA-673q-mjm6-r5xr" : ""}`);
  }
}

// sharp, as seen from next (this is the copy next's image optimizer loads)
let sharpVersion = null;
try {
  const sharpPkgPath = findPackageJson(createRequire(nextPkgPath), "sharp");
  sharpVersion = JSON.parse(readFileSync(sharpPkgPath, "utf8")).version;
  console.log(`sharp ${sharpVersion}  (${sharpPkgPath}, resolved from next)`);
} catch (err) {
  problems.push(`sharp is not resolvable from next (${err.code ?? err.message}); install without --omit=optional so sharp >= ${fmt(SHARP_FLOOR)} is present`);
}
if (sharpVersion && isBelow(sharpVersion, SHARP_FLOOR)) {
  problems.push(`sharp ${sharpVersion} is below ${fmt(SHARP_FLOOR)} (required by GHSA-2464-fhr4-w9xw)`);
}

if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  process.exit(1);
}
console.log("OK: installed next and sharp meet the security floor");
