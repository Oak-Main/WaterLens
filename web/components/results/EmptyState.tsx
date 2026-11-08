import { Button } from "@/components/ui";
import { LAB_TEST_OFFER } from "@/lib/offers";

const LAB_TEST = LAB_TEST_OFFER;

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 12 2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5L14 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13.7 3.2v4.3h4.4M9 13h6M9 16.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * `clean`      — we hold sample results and none exceeded a limit.
 * `no-samples` — we hold only the registry record; absence of results is NOT
 *                evidence of absence, and the copy must not imply otherwise.
 * `no-match`   — no system resolved for the address at all.
 */
export type EmptyVariant = "clean" | "no-samples" | "no-match";

export function EmptyState({
  variant,
  utilityName,
}: {
  variant: EmptyVariant;
  utilityName?: string | null;
}) {
  const tone =
    variant === "clean"
      ? "bg-verdant-50 text-verdant-600 dark:bg-verdant-300/10 dark:text-verdant-200"
      : "bg-brand-50 text-brand-600 dark:bg-brand-300/10 dark:text-brand-200";

  const name = utilityName ? (
    <span className="font-medium text-ink-800 dark:text-ink-100">{utilityName}</span>
  ) : (
    "This system"
  );

  return (
    <div className="rounded-2xl bg-surface-raised p-8 text-center shadow-card ring-1 ring-ink-900/[0.055] sm:p-12 dark:ring-white/10">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${tone}`}>
        {variant === "clean" ? (
          <CheckIcon />
        ) : variant === "no-samples" ? (
          <DocumentIcon />
        ) : (
          <SearchIcon />
        )}
      </div>

      <h2 className="mx-auto mt-6 max-w-xl text-title-1">
        {variant === "clean"
          ? "No reported contaminant exceedances"
          : variant === "no-samples"
            ? "No sample-level results published for this system"
            : "We couldn't confirm your water system"}
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-600 dark:text-ink-300">
        {variant === "clean" ? (
          <>
            {name} has no contaminants on record above a federal limit or health-based goal in
            the most recent reporting we could retrieve. This reflects utility-level monitoring
            only.
          </>
        ) : variant === "no-samples" ? (
          <>
            We have {name}&rsquo;s EPA registry record and its violation history, but not its
            sample-level laboratory results. That is a gap in what has been published — it is not
            a finding that the water is clean, and no conclusion either way should be drawn from
            this screen.
          </>
        ) : (
          <>
            We couldn&rsquo;t match this address to a public water system in our coverage or the
            EPA registry. Confirm the utility name printed on your most recent water bill, then
            search again. A point-of-use lab test is the most reliable way to learn what is in
            your tap.
          </>
        )}
      </p>

      {variant !== "no-match" ? (
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          Utility data cannot detect contamination introduced by your home&rsquo;s own plumbing,
          such as a legacy lead service line. If you want certainty for your specific tap, a lab
          test is the only way to verify it.
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button href={LAB_TEST.href} rel={LAB_TEST.rel} external aria-label="Order a Tap Score lab test (opens in a new tab)">
          Order a Tap Score lab test
        </Button>
        {variant === "no-match" ? (
          <Button href="/" variant="secondary">
            Search a different address
          </Button>
        ) : null}
      </div>
    </div>
  );
}
