/**
 * Production smoke test: `next start` on 127.0.0.1 after `next build`.
 *
 * Normal-behaviour checks only (no exploit payloads, no external network):
 *   1. GET /                        -> 200 text/html
 *   2. GET /apple-icon, /opengraph-image -> 200 image/png (next/og ImageResponse routes)
 *   3. GET /_next/image?url=<png>   -> 200 image/*   (a raster file from public/, else the generated /apple-icon PNG)
 *
 * Usage: npm run build && npm run smoke:production   (exit 1 on any failure)
 */
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 90_000;
const REQUEST_TIMEOUT_MS = 30_000;
const RASTER = /\.(png|jpe?g|webp|avif|gif)$/i;

// Used as the /_next/image source when public/ has no raster image.
const FALLBACK_IMAGE_ROUTE = "/apple-icon";

// Extra routes that must answer 200 with the given content-type prefix.
const EXTRA_ROUTES = [
  { path: "/apple-icon", type: "image/png" },
  { path: "/opengraph-image", type: "image/png" },
];

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, HOST, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function findRasterImage(dir) {
  if (!existsSync(dir)) return null;
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isFile() && RASTER.test(e.name)) return full;
    if (e.isDirectory()) {
      const found = findRasterImage(full);
      if (found) return found;
    }
  }
  return null;
}

async function get(base, path, headers = {}) {
  const res = await fetch(base + path, { headers, redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = Buffer.from(await res.arrayBuffer());
  return { status: res.status, type: res.headers.get("content-type") ?? "", bytes: body.length };
}

const failures = [];
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
  if (!ok) failures.push(name);
}

async function main() {
  if (!existsSync(join(root, ".next", "BUILD_ID"))) {
    console.error("FAIL: no production build found (.next/BUILD_ID). Run `npm run build` first.");
    return 1;
  }
  const nextBin = createRequire(join(root, "package.json")).resolve("next/dist/bin/next");
  const port = await freePort();
  const base = `http://${HOST}:${port}`;

  const log = [];
  const child = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let exited = false;
  child.on("exit", () => { exited = true; });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (d) => { log.push(String(d)); if (log.length > 200) log.shift(); });
  }

  const stop = async () => {
    if (exited) return;
    child.kill();
    for (let i = 0; i < 50 && !exited; i++) await new Promise((r) => setTimeout(r, 100));
    if (!exited) {
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      else child.kill("SIGKILL");
    }
  };
  process.once("SIGINT", () => { stop().finally(() => process.exit(130)); });

  try {
    // Wait (bounded) for readiness
    const deadline = Date.now() + READY_TIMEOUT_MS;
    let ready = false;
    while (Date.now() < deadline && !exited) {
      try {
        await get(base, "/");
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    if (!ready) {
      console.error(`FAIL: next start did not become ready on ${base} (${exited ? "process exited" : "timeout"})`);
      console.error(log.join("").split("\n").slice(-40).join("\n"));
      return 1;
    }
    console.log(`next start ready on ${base}`);

    const home = await get(base, "/", { accept: "text/html" });
    check("GET /", home.status === 200 && home.type.includes("text/html"), `status=${home.status} type=${home.type} bytes=${home.bytes}`);

    for (const r of EXTRA_ROUTES) {
      const res = await get(base, r.path);
      check(`GET ${r.path}`, res.status === 200 && res.type.startsWith(r.type), `status=${res.status} type=${res.type} bytes=${res.bytes}`);
    }

    // Prefer a raster file from public/. This app has none, so fall back to the generated PNG route
    // /apple-icon (the optimizer fetches it internally); either way the sharp-backed optimizer runs.
    const image = findRasterImage(join(root, "public"));
    const urlPath = image ? "/" + relative(join(root, "public"), image).split(sep).join("/") : FALLBACK_IMAGE_ROUTE;
    const res = await get(base, `/_next/image?url=${encodeURIComponent(urlPath)}&w=640&q=75`, { accept: "image/webp" });
    check(`GET /_next/image (${urlPath})`, res.status === 200 && res.type.startsWith("image/") && res.bytes > 0, `status=${res.status} type=${res.type} bytes=${res.bytes}`);
  } catch (err) {
    failures.push("unexpected error");
    console.error(`FAIL: ${err.stack ?? err}`);
  } finally {
    await stop();
  }

  if (failures.length > 0) {
    console.error(`\nserver log (tail):\n${log.join("").split("\n").slice(-40).join("\n")}`);
    console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
    return 1;
  }
  console.log("OK: production smoke test passed");
  return 0;
}

process.exitCode = await main();
