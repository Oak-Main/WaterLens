import type { WaterSystem } from "./types";

const BASE = "https://echodata.epa.gov/echo/sdw_rest_services.";
const TIMEOUT = 7000;

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
  QueryID?: string;
  QueryRows?: string;
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

export async function fetchZipCandidates(zip: string): Promise<WaterSystem[]> {
  const signal = AbortSignal.timeout(TIMEOUT);
  try {
    const search = await echo("get_systems", { p_zip: zip, p_systyp: "CWS", p_act: "Y" }, signal);
    if (!search?.QueryID || !/^\d+$/.test(search.QueryID) || !(Number(search.QueryRows) > 0)) {
      return [];
    }

    // Use only validated records in the first page. The query can cover more
    // systems than are returned here, and ZIP coverage cannot prove service.
    const page = await echo("get_qid", { qid: search.QueryID, pageno: "1", qcolumns: COLUMNS }, signal);
    if (page?.QueryID !== search.QueryID || !Array.isArray(page.WaterSystems)) return [];
    const systems = new Map<string, WaterSystem>();
    for (const row of page.WaterSystems) {
      if (
        !row ||
        typeof row.PWSId !== "string" ||
        !/^[A-Z]{2}\d{7}$/.test(row.PWSId) ||
        typeof row.PWSName !== "string" ||
        !row.PWSName.trim() ||
        row.PWSTypeCode !== "CWS" ||
        row.PWSActivityCode !== "A" ||
        typeof row.ZipCodesServed !== "string" ||
        !row.ZipCodesServed.split(/[,;\s]+/).includes(zip)
      ) continue;

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
    return [...systems.values()].sort((a, b) => (b.population_served ?? 0) - (a.population_served ?? 0));
  } catch {
    return [];
  }
}
