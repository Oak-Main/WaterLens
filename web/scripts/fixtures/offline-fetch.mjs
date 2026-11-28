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
  "00004": [{ PWSId: "NJ0000001", PWSName: "QA fixture with incomplete ZIP coverage", ZipCodesServed: undefined }],
};
const PAGED_SYSTEMS = [
  { PWSId: "NJ0000005", PWSName: "Smaller QA system", PopulationServedCount: "1000" },
  { PWSId: "NJ0000006", PWSName: "Larger QA system", PopulationServedCount: "2000" },
];
const unavailable = () => Promise.resolve(new Response(null, { status: 503 }));

function unexpectedEchoRequest(target) {
  console.error(`Unexpected offline ECHO request: ${target.pathname}${target.search}`);
  return unavailable();
}

function queryRows(zip) {
  if (zip === "00002") return 51;
  if (["00005", "00006", "00007", "00008"].includes(zip)) return 2;
  return SYSTEMS_BY_ZIP[zip]?.length ?? 0;
}

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
      if (!/^\d{5}$/.test(zip ?? "") || target.searchParams.get("p_systyp") !== "CWS" ||
          target.searchParams.get("p_act") !== "Y") {
        return unexpectedEchoRequest(target);
      }
      if (zip === "78701") return unavailable();
      return Promise.resolve(Response.json({
        Results: { Message: "Success", QueryRows: String(queryRows(zip)), QueryID: zip },
      }));
    }
    if (target.pathname.endsWith(".get_qid")) {
      const zip = target.searchParams.get("qid");
      const pageNumber = Number(target.searchParams.get("pageno"));
      const rowCount = queryRows(zip);
      const lastPage = zip === "00002" ? 5 : ["00005", "00006", "00007", "00008"].includes(zip) ? 2 : 1;
      if (!rowCount || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > lastPage ||
          target.searchParams.get("qcolumns") !== "1,2,4,5,6,10,12,14,15") {
        return unexpectedEchoRequest(target);
      }
      if (zip === "00006" && pageNumber === 2) return unavailable();
      const echoedPage = zip === "00007" ? 1 : pageNumber;
      let systems = SYSTEMS_BY_ZIP[zip] ?? [];
      if (zip === "00002") {
        systems = [{ PWSId: `NJ00000${String(pageNumber).padStart(2, "0")}`, PWSName: `Capped QA system ${pageNumber}` }];
      } else if (lastPage === 2) {
        const system = PAGED_SYSTEMS[echoedPage - 1];
        systems = zip === "00008" && pageNumber === 2 ? [{ ...system, ZipCodesServed: undefined }] : [system];
      }
      return Promise.resolve(Response.json({
        Results: {
          Message: "Working",
          PageNo: String(echoedPage),
          QueryID: zip,
          QueryRows: String(rowCount),
          WaterSystems: systems.map((system) => ({
            PWSActivityCode: "A",
            PWSTypeCode: "CWS",
            ZipCodesServed: zip,
            ...system,
          })),
        },
      }));
    }
    return unexpectedEchoRequest(target);
  }
  return unavailable();
};
