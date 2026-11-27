import { Coordinate } from "./types";

// US Census Bureau geocoder — public domain, no key. Returns coordinates and
// the TIGER geographies used for proxy resolution.

export interface GeocodeResult {
  coordinate: Coordinate;
  matched_address: string;
  place_name: string | null;
  state_fips: string | null;
  zip: string | null;
}

interface CensusMatch {
  coordinates: { x: number; y: number };
  matchedAddress: string;
  addressComponents?: { zip?: string };
  geographies?: Record<string, Array<Record<string, string>>>;
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  return geocodeCensus(address);
}

async function geocodeCensus(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "all",
    format: "json",
  });
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: { addressMatches?: CensusMatch[] } };
    const m = data.result?.addressMatches?.[0];
    if (!m || !Number.isFinite(m.coordinates?.x) || !Number.isFinite(m.coordinates?.y)) return null;
    const geos = m.geographies ?? {};
    const place = (geos["Incorporated Places"] ?? geos["Census Designated Places"] ?? [])[0];
    const state = (geos["States"] ?? [])[0];
    return {
      coordinate: { lat: m.coordinates.y, lon: m.coordinates.x },
      matched_address: m.matchedAddress,
      place_name: place?.NAME ?? null,
      state_fips: state?.STATE ?? null,
      zip: m.addressComponents?.zip ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
