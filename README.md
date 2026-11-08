# WaterQualityLens

A deterministic, address-level **Public Water System (PWS) lookup** and
**NSF/ANSI-verified filtration matching** backend, built exactly to the
*Strategic Evaluation and Build Plan: WaterQualityLens*.

The service accepts a US residential address and returns the supplying public
water system, the contaminants detected there that exceed public-health goals,
and the specific retail filter SKUs that are **independently certified to
neutralize those exact contaminants** — never brand-level or fear-based claims.

> This tool aggregates municipal engineering data and hardware certifications.
> It does **not** diagnose exposure risks, predict toxicological outcomes, or
> offer medical advice. (§13 non-dismissible disclaimer.)

---

## Architecture (§15, §22 — Cloudflare-native edge)

| Concern | Technology | Notes |
|---|---|---|
| API + orchestration | **Cloudflare Workers** | `src/index.ts` — `fetch` / `scheduled` / `queue` handlers |
| Primary datastore | **Cloudflare D1** (edge SQLite) | PWS boundaries, SDWIS data, curated SKU/cert moat |
| Cache | **Cloudflare KV** | geocode + full-lookup + SDWIS payload caching |
| Background jobs | **Cloudflare Queues** | asynchronous alert delivery |
| Scheduling | **Cron Triggers** | weekly SDWIS ingestion + daily alert scan |

The whole system is read-heavy and deterministic — no per-query LLM inference —
so it runs within Cloudflare's free tier at launch scale (§15).

```
address ──▶ geocode C(lat,lon) ──▶ TEMM 3-tier resolve PWSID ──▶ SDWIS profile
                                                                       │
        unified JSON  ◀── set-cover filter match (D ⊆ ⋃ N_c)  ◀───────┘
```

---

## The two core algorithms (§12)

### 1. TEMM deterministic spatial join (`src/services/spatial.ts`)

Strict, highest-fidelity-first hierarchy. The first tier that resolves wins, and
the numeric confidence is emitted verbatim to the UI to manage legal expectations.

| Tier | Test | Confidence | UI treatment |
|---|---|---|---|
| **1 — Explicit** | point ∈ verified utility service polygon | `1.0` | Explicit Boundary |
| **2 — Matched** | point ∈ TIGER place polygon matched to a utility proxy | `0.85` | Matched Proxy |
| **3 — Modeled** | Haversine `d` to nearest modeled centroid, `d < R_model` | `0.50` | Modeled Radius → **yellow warning banner + lab-test advice** |

### 2. Constrained set-cover recommendation (`src/services/setcover.ts`)

Let `D` = detected contaminants exceeding health guidelines and `N(f)` = the
union of contaminants a SKU is **verified** to reduce under a **health** standard.
A SKU qualifies **iff**:

```
D ⊆ ⋃_{c ∈ C_f} N_c
```

- Only **NSF/ANSI 53 / 58 / 401** may satisfy a hazard.
- **NSF/ANSI 42** (aesthetic) and **372** (lead-free materials) are isolated and
  can never satisfy a health contaminant. Retired **P473** is ignored.
- *Artificial precision is prohibited*: a SKU not verified for a specific
  compound is programmatically eliminated (partial matches never surface).
- Form-factor heuristics rank results (pitchers for multi-family rentals,
  under-sink RO for single-family homes) but never affect **eligibility**.

---

## API

| Method & path | Purpose |
|---|---|
| `POST /api/lookup` `{ address, zip?, dwelling_type?, nocache? }` | Primary MVP lookup → §22 output contract |
| `GET /api/lookup?address=…&nocache=1` | Same, via query string (`nocache=1` bypasses KV) |
| `GET /api/lookup?zip=48503` | Coarse ZIP fallback via SDWA_GEOGRAPHIC_AREAS registry |
| `GET /api/pws/:pwsid` | Programmatic PWS entity page data (+ SEO `indexable` gate, §9) |
| `GET /api/contaminants` / `GET /api/contaminants/:code` | Contaminant glossary entities |
| `GET /api/filters` / `?deceptive=1` | Filter Certification Registry; flags 42/372-only deceptive SKUs (§9) |
| `POST /api/auth/register` · `POST /api/auth/login` | V1 accounts |
| `GET/POST/DELETE /api/addresses` · `PUT /api/addresses/:id/alerts` | Saved addresses + alert opt-in (V1) |
| `GET /api/vault/report` · `POST /api/vault/lab-results[/import]` · `POST /api/vault/cartridges` | Premium Household Water Vault |
| `GET /api/health` · `POST /api/admin/ingest` · `POST /api/admin/alerts` | Ops |

### `POST /api/lookup` response shape (§22 output contract)

```jsonc
{
  "query": { "address": "...", "normalized_address": "...", "dwelling_type": "SINGLE_FAMILY" },
  "coordinate": { "lat": 43.0125, "lon": -83.6875 },
  "match": { "pwsid": "MI0002360", "tier": "TIER_1_EXPLICIT", "confidence": 1.0,
             "tierLabel": "Explicit Boundary", "requiresLabTestWarning": false },
  "utility": { "pwsid": "MI0002360", "name": "City of Flint", "state": "MI", ... },
  "detected_contaminants": [ { "code": "PB90", "name": "Lead", "value": 27, "unit": "ug/L",
                              "mcl": 15, "exceeds_health_goal": true, "sample_date": "2026-05-15", ... } ],
  "active_violations": [ ... ],
  "recommended_filters": [ { "brand": "Frizzlife", "model": "M800 Under-Sink RO",
                             "certified_standards": ["58"], "neutralizes": ["PB90"],
                             "full_coverage": true, "score": 1.55, "affiliate_url": "..." } ],
  "nitrate_warning": null,          // set to RO-only guidance when nitrate/nitrite detected
  "multi_system_warning": false,    // true when a ZIP/address maps to >1 water system
  "multi_system_count": 1,
  "data_freshness": { "sdwis_fetched_at": "2026-07-01T00:00:00Z", "generated_at": "..." },
  "disclaimers": [ "...medical...", "...plumbing...", "...affiliate..." ],
  "meta": { "cache_hit": false, "engine_version": "1.0.0", "resolution": "TEMM" }
}
```

---

## Data model (`migrations/`)

- **`0001_schema.sql`** — spatial (`pws_boundaries`, `pws_centroids`), municipal
  (`water_systems`, `contaminants`, `detections`, `detection_history`,
  `violations`), hardware (`filters`, `certifications`, `filter_claims`), plus
  users / saved addresses / alerts / premium vault / ingestion log.
- **`0002_reference_data.sql`** — the curated proprietary moat (§10): NSF
  standards, contaminant definitions with MCL/health goals, and SKU-level
  verified reduction **claims**.
- **`0003_enrichment.sql`** — contaminant health-effect narratives + priority,
  additional regulated contaminants (nitrite, barium, cadmium, mercury,
  coliform, E. coli, PFBS), their verified filter claims, and the
  `zip_pwsid_map` cache for the ZIP-registry fallback.
- **`seeds/demo.sql`** — local demo data incl. Flint MI & Newark NJ (§16).

Contaminant `mcl` / `health_goal` / detection `value` all share a **canonical
unit** per contaminant so exceedance math is apples-to-apples.

---

## Getting started

The backend toolchain needs **Node.js 22.13+ (22.x), 24.x or 26+**, as declared in
the root `package.json` `engines`: Vitest 5 requires `^22.12 || ^24 || >=26`,
Wrangler 4 requires `>=22`, and the migration test uses `node:sqlite`, which needs
no flag from 22.13. CI and Vercel use Node 24.

```bash
npm install

# 1. Create the D1 database & KV namespace, then paste their ids into wrangler.toml
wrangler d1 create waterlens
wrangler kv namespace create CACHE
wrangler queues create waterlens-alerts
wrangler queues create waterlens-alerts-dlq

# 2. Apply schema + curated reference data, then (optionally) demo data
npm run db:migrate:local
npm run db:seed:local        # Flint/Newark/Clear-Springs demo systems

# 3. Secrets (see .dev.vars.example)
cp .dev.vars.example .dev.vars   # for local dev

# 4. Run
npm run dev
curl 'http://localhost:8787/api/lookup?address=1600+Saginaw+St,+Flint,+MI'
```

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest — geo, set-cover, auth
npm run deploy      # wrangler deploy
```

### Web app and Vercel

The Next.js frontend is the separate package in `web/`. The repository-root
package is the Cloudflare Workers backend; Vercel builds the web package.

The `waterqualitylens` deployment contract is:

| Setting | Value |
|---|---|
| Root Directory | `web` |
| Framework Preset | Next.js |
| Node.js Version | `24.x` |
| Install Command | `npm ci`, in `web/` |
| Build Command | `npm run build`, in `web/` |
| Output Directory | Next.js default (`.next`); no custom override |

To reproduce the web build and its production smoke checks from the repository
root:

```bash
npm --prefix web ci
npm --prefix web run build
npm --prefix web run test:lookup-route
```

CI installs both lockfiles, tests and typechecks the backend, then builds the
web app and runs its production smoke suite. The smoke script starts and stops
a local Next.js production server and uses bundled data without external APIs.
Vercel settings changes, merges that trigger production builds, and production
deployment or promotion remain owner actions. For a failed preview, inspect the
first build error and compare its commit and settings with the latest successful
deployment before changing the root or command overrides.

### Data sources & licensing (§10)

- **SDWIS** contaminant/violation data via the EPA **Envirofacts** API — public
  domain; cached weekly into D1 rather than queried live per request (§18).
- **Spatial boundaries** from the July 2024 EPA release + SimpleLab **TEMM**
  layers (MIT license) — lawfully cached and repurposed.
- **NSF/WQA/IAPMO** certifications have no permissive bulk API, so `filter_claims`
  is a manually curated, quarterly-audited table — the platform's defensive moat.

---

## Operational guardrails

- Health-goal exceedance is computed against the published MCLG/PHG (falling back
  to the MCL when no distinct goal exists).
- Tier-3 modeled matches always attach the ambiguity banner + Tap Score lab-test
  disclaimer (§13).
- Affiliate SKUs that lose their health certification are excluded automatically
  the moment `filter_claims.verified` flips (§14).
- The Filter Certification Registry flags SKUs marketing 42/372 with **no** health
  certification — the deceptive-marketing pattern the memo targets (§5, §8, §9).
