// Registry identities with official references. They carry no measurements,
// compliance findings, sample dates, or service-area geometry.
export const PUBLIC_WATER_SYSTEMS = [
  {
    pwsid: "NJ0714001",
    name: "Newark Water Department",
    state: "NJ",
    registryUrl: "https://www.nj.gov/cgi-bin/dep/watersupply/pwsdetail.pl?id=0714001",
    reportsUrl: "https://water.newarknj.gov/waterquality",
  },
  {
    pwsid: "MI0002310",
    name: "City of Flint",
    state: "MI",
    registryUrl: "https://www.michigan.gov/egle/-/media/Project/Websites/egle/Documents/Programs/DWEHD/Community-Water-Supply/Contact-Information-Maps/community-water-supply-list.pdf?rev=e1e5a42a038a465ab022b6711a1c9c28",
    reportsUrl: "https://www.cityofflint.com/document_category/water-quality-report/",
  },
];

export function publicWaterSystem(pwsid: string) {
  return PUBLIC_WATER_SYSTEMS.find((system) => system.pwsid === pwsid.toUpperCase());
}

export function epaWaterSystemUrl(pwsid: string): string {
  return `https://sdwis.epa.gov/ords/sfdw_pub/f?p=SDWIS_FED_REPORTS_PUBLIC:PWS_SEARCH:::::PWSID:${encodeURIComponent(pwsid)}`;
}
