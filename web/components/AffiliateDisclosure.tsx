/**
 * The notice placed before recommended product links. It states what the links
 * below it actually are: paid only when at least one renders a verified paid
 * destination (lib/offers.ts), otherwise direct and unpaid.
 */
export function AffiliateDisclosure({ paid }: { paid: boolean }) {
  return (
    <p
      role="note"
      data-linkguard="insert-disclosure"
      className="affiliate-disclosure mt-4 text-sm leading-relaxed text-ink-700 dark:text-ink-200"
    >
      {paid
        ? "WaterQualityLens may earn a commission if you buy a filter through these links."
        : "These links go directly to the manufacturers. WaterQualityLens earns no commission from them."}
    </p>
  );
}
