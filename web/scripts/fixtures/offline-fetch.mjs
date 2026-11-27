// This preload prevents external requests from the production smoke server.
// Only synthetic inputs reach the Census geocoder and EPA ECHO fixtures.
const fetchNormally = globalThis.fetch;
const SYSTEMS_BY_ZIP = {
  "07102": [
    { PWSId: "NJ0714001", PWSName: "Newark Water Department", StateCode: "NJ", PopulationServedCount: "2000" },
    { PWSId: "NJ0000001", PWSName: "Fixture system", StateCode: "NJ", PopulationServedCount: "1000" },
  ],
  "48503": [{ PWSId: "MI0002310", PWSName: "City of Flint", StateCode: "MI" }],
  "00001": [{ PWSId: "NJ0714001", PWSName: "Newark Water Department", ZipCodesServed: "07102" }],
  "00002": [{ PWSId: "NJ0714001", PWSName: "Newark Water Department" }],
};

globalThis.fetch = (input, init) => {
  const target = new URL(typeof input === "object" && "url" in input ? input.url : input);
  if (["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
    return fetchNormally(input, init);
  }
  if (target.hostname === "geocoding.geo.census.gov" &&
      target.searchParams.get("address") === "NEWARK QA GEOCODE FIXTURE") {
    return Promise.resolve(Response.json({
      result: {
        addressMatches: [{
          coordinates: { x: -74.1724, y: 40.7357 },
          matchedAddress: "NEWARK QA GEOCODE FIXTURE",
          addressComponents: { zip: "07102" },
        }],
      },
    }));
  }
  if (target.hostname === "echodata.epa.gov") {
    if (target.pathname.endsWith(".get_systems")) {
      const zip = target.searchParams.get("p_zip");
      if (!zip || target.searchParams.get("p_systyp") !== "CWS" ||
          target.searchParams.get("p_act") !== "Y") {
        throw new Error("Expected a ZIP, active status, and community system filter");
      }
      if (zip === "78701") return Promise.resolve(new Response(null, { status: 503 }));
      const matchCount = zip === "00002" ? 51 : (SYSTEMS_BY_ZIP[zip]?.length ?? 0);
      return Promise.resolve(Response.json({
        Results: { Message: "Success", QueryRows: String(matchCount), QueryID: zip },
      }));
    }
    if (target.pathname.endsWith(".get_qid")) {
      const zip = target.searchParams.get("qid");
      const systems = SYSTEMS_BY_ZIP[zip] ?? [];
      return Promise.resolve(Response.json({
        Results: {
          Message: "Working",
          QueryID: zip,
          WaterSystems: systems.map((system) => ({
            PWSActivityCode: "A",
            PWSTypeCode: "CWS",
            ZipCodesServed: zip,
            ...system,
          })),
        },
      }));
    }
  }
  return Promise.resolve(new Response(null, { status: 503 }));
};
