import { PAID_OFFER_HOSTS } from "../config/constants";

// -----------------------------------------------------------------------------
// Paid-link rule shared by every API response, mirroring web/lib/offers.ts:
// a stored affiliate_url is a paid link only when it is https and its hostname
// is listed in PAID_OFFER_HOSTS. The web never renders any other affiliate_url,
// so the API does not return one either; otherwise its disclaimer could not
// truthfully describe the links it returns.
// -----------------------------------------------------------------------------

/** True only for an https URL whose hostname is listed in `paidHosts` (same rule as web/lib/offers.ts). */
export function isPaidAffiliateUrl(url: string | null | undefined, paidHosts: readonly string[] = PAID_OFFER_HOSTS): boolean {
  if (!url) return false;
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    host = u.hostname.toLowerCase();
  } catch {
    return false;
  }
  return paidHosts.some((listed) => listed.toLowerCase() === host);
}

/** The affiliate_url an API response may carry: the stored URL when it is a paid link, otherwise null. */
export function publicAffiliateUrl(url: string | null | undefined, paidHosts: readonly string[] = PAID_OFFER_HOSTS): string | null {
  return url && isPaidAffiliateUrl(url, paidHosts) ? url : null;
}
