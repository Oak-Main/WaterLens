/**
 * Outbound product links: filter recommendations and the Tap Score lab test.
 *
 * TapToGlass has no approved affiliate program, and the former redirect host
 * affil.waterqualitylens.com does not resolve (NXDOMAIN, checked 2026-11-08), so
 * every recommendation links straight to its manufacturer and earns nothing.
 *
 * A paid destination is used only when its hostname is listed in PAID_OFFER_HOSTS.
 * Keep the list empty until a program is approved for this site and its destination
 * has been verified. The on-page disclosure, the rel attribute and the legal copy all
 * read this one list, so they cannot disagree with the links that actually ship.
 */
export const PAID_OFFER_HOSTS: readonly string[] = [];

export const PAID_OFFERS_ENABLED = PAID_OFFER_HOSTS.length > 0;

/** SimpleLab's Tap Score home page (direct, unpaid). */
export const TAP_SCORE_URL = "https://mytapscore.com/";

export const UNPAID_REL = "noopener noreferrer";
export const PAID_REL = "sponsored noopener noreferrer";

export interface Offer {
  href: string;
  paid: boolean;
  rel: string;
}

function httpsHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function isPaidUrl(url: string | null | undefined): boolean {
  const host = httpsHost(url);
  return host !== null && PAID_OFFER_HOSTS.some((listed) => listed.toLowerCase() === host);
}

/** Visible button text. A paid link may go to a retailer, so it does not name the maker's site. */
export function offerLinkText(offer: Offer, brand: string): string {
  return offer.paid ? "View offer" : `View at ${brand}`;
}

/** Accessible name: starts with the visible text so voice control can target it (WCAG 2.5.3). */
export function offerAriaLabel(offer: Offer, brand: string, model: string): string {
  return `${offerLinkText(offer, brand)}: ${brand} ${model} (opens in a new tab)`;
}

/** The link a recommendation renders: a verified paid destination, else the maker's site. */
export function offerFor(item: { affiliate_url: string | null; maker_url: string | null }): Offer | null {
  if (item.affiliate_url && isPaidUrl(item.affiliate_url)) {
    return { href: item.affiliate_url, paid: true, rel: PAID_REL };
  }
  if (item.maker_url && httpsHost(item.maker_url)) {
    return { href: item.maker_url, paid: false, rel: UNPAID_REL };
  }
  return null;
}

export const LAB_TEST_OFFER: Offer = { href: TAP_SCORE_URL, paid: false, rel: UNPAID_REL };
