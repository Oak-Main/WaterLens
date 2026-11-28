import type { WaterSystem } from "./types";

const BASE = "https://echodata.epa.gov/echo/sdw_rest_services.";
const TIMEOUT = 7000;
const MAX_PAGES = 5;

// ECHO column IDs from sdw_rest_services.metadata. Request identity and coverage
// fields only. Compliance metrics are not a substitute for violation records.
const COLUMNS = "1,2,4,5,6,10,12,14,15";

interface EchoSystem {
  PWSId?: string;
  PWSName?: string;
  StateCode?: string;
  ZipCodesServed?: string;
  CountiesServed?: string;
  PopulationServedCount?: string;
  PWSTypeCode?: string;
  PrimarySourceCode?: string;
  PWSActivityCode?: string;
}

interface EchoResults {
  Error?: unknown;
  Message?: string;
  QueryID?: string;
  QueryRows?: string;
  PageNo?: string;
  WaterSystems?: EchoSystem[];
}

async function echo(
  method: "get_systems" | "get_qid",
  filters: Record<string, string>,
  signal: AbortSignal
): Promise<EchoResults | null> {
  const params = new URLSearchParams({ output: "JSON", ...filters });
  const res = await fetch(`${BASE}${method}?${params}`, {
    headers: { accept: "application/json" },
    signal,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const { Results } = (await res.json()) as { Results?: EchoResults };
  return Results && !Results.Error ? Results : null;
}

type ZipRegistryResult = {
  status: "candidates" | "no_candidates" | "unverified" | "unavailable";
  systems: WaterSystem[];
};

const UNVERIFIED: ZipRegistryResult = { status: "unverified", systems: [] };
const UNAVAILABLE: ZipRegistryResult = { status: "unavailable", systems: [] };

export async function fetchZipCandidates(zip: string): Promise<ZipRegistryResult> {
  const signal = AbortSignal.timeout(TIMEOUT);
  try {
    const search = await echo("get_systems", { p_zip: zip, p_systyp: "CWS", p_act: "Y" }, signal);
    if (!search) return UNAVAILABLE;
    if (search.Message !== "Success" || typeof search.QueryRows !== "string" || !/^\d+$/.test(search.QueryRows)) {
      return UNVERIFIED;
    }
    const expectedRows = Number(search.QueryRows);
    if (!Number.isSafeInteger(expectedRows)) return UNVERIFIED;
    if (expectedRows === 0) return { status: "no_candidates", systems: [] };
    if (!search.QueryID || !/^\d+$/.test(search.QueryID)) return UNVERIFIED;

    // Only promote candidates when unique, ZIP-validated records account for
    // the full query under one time budget. A partial set cannot rank systems.
    const systems = new Map<string, WaterSystem>();
    for (let pageNumber = 1; pageNumber <= MAX_PAGES && systems.size < expectedRows; pageNumber++) {
      const page = await echo("get_qid", {
        qid: search.QueryID,
        pageno: String(pageNumber),
        qcolumns: COLUMNS,
      }, signal);
      if (!page) return UNAVAILABLE;
      if (
        page.Message !== "Working" ||
        page.QueryID !== search.QueryID ||
        page.QueryRows !== search.QueryRows ||
        page.PageNo !== String(pageNumber) ||
        !Array.isArray(page.WaterSystems) ||
        page.WaterSystems.length === 0 ||
        systems.size + page.WaterSystems.length > expectedRows
      ) return UNVERIFIED;

      for (const row of page.WaterSystems) {
        if (
          !row ||
          typeof row.PWSId !== "string" ||
          !/^[A-Z]{2}\d{7}$/.test(row.PWSId) ||
          systems.has(row.PWSId) ||
          typeof row.PWSName !== "string" ||
          !row.PWSName.trim() ||
          row.PWSTypeCode !== "CWS" ||
          row.PWSActivityCode !== "A" ||
          typeof row.ZipCodesServed !== "string" ||
          !row.ZipCodesServed.split(/[,;\s]+/).includes(zip)
        ) return UNVERIFIED;

        const population = row.PopulationServedCount?.trim();
        systems.set(row.PWSId, {
          pwsid: row.PWSId,
          name: row.PWSName.trim(),
          state: row.StateCode ?? null,
          county: row.CountiesServed ?? null,
          population_served: population && /^\d+$/.test(population) ? Number(population) : null,
          pws_type: row.PWSTypeCode,
          primary_source: row.PrimarySourceCode ?? null,
        });
      }
    }
    if (systems.size !== expectedRows) return UNVERIFIED;
    return {
      status: "candidates",
      systems: [...systems.values()].sort((a, b) => (b.population_served ?? 0) - (a.population_served ?? 0)),
    };
  } catch {
    return UNAVAILABLE;
  }
}
