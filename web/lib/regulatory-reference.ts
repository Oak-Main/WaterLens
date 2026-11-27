export const LEAD_AND_COPPER_RULE = "https://www.epa.gov/dwreginfo/lead-and-copper-rule";

export function usesActionLevel(code: string): boolean {
  return code === "PB90" || code === "CU90";
}
