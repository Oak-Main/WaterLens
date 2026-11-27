import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import type { ReactNode } from "react";

function DatabaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * A service-area polygon with its vertices — deliberately not a map pin, so this
 * signal is not confused with the address field's locator glyph.
 */
function BoundaryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5 10 4l10 3.5-2 9.5-9 3-5-4.5V8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="20" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="9" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 14 5l2.4-.3.6 2.3 2 1.4-1 2.2 1 2.2-2 1.4-.6 2.3L14 19l-2 1.5L10 19l-2.4.3L7 17l-2-1.4 1-2.2-1-2.2 2-1.4.6-2.3L10 5l2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="m9.5 12 1.8 1.8L15 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4v16M7 20h10M4 8h16M4 8l-2 5a3 3 0 0 0 6 0L6 8m14 0-2 5a3 3 0 0 0 6 0l-2-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="4.5" r="1.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * Each signal carries its own data vintage. The hero no longer runs a trust row,
 * so this band is the page's only provenance surface above the fold — a bare
 * label without a vintage would be a claim rather than a citation.
 */
const SIGNALS: { icon: ReactNode; label: string; vintage: string }[] = [
  {
    icon: <DatabaseIcon />,
    label: "EPA system registry",
    vintage: "EPA ECHO Drinking Water System Search",
  },
  {
    icon: <BoundaryIcon />,
    label: "ZIP-based utility candidates",
    vintage: "Confirm the utility on your water bill",
  },
  {
    icon: <BadgeCheckIcon />,
    label: "Independent NSF/ANSI verification",
    vintage: "NSF · WQA · IAPMO · audited quarterly",
  },
  {
    icon: <ScaleIcon />,
    label: "No fear-based ratings",
    vintage: "Federal MCLs · no proprietary scores",
  },
];

export function TrustStrip() {
  return (
    <Section tone="base" density="tight" className="border-y border-hairline">
      <Container>
        <Reveal>
          <ul
            aria-label="Data sources and standards"
            className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4"
          >
            {SIGNALS.map((s) => (
              <li
                key={s.label}
                className="flex items-start gap-3.5 lg:border-l lg:border-hairline lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
              >
                <span
                  className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300"
                  aria-hidden="true"
                >
                  {s.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug text-ink-800 dark:text-ink-100">
                    {s.label}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] leading-snug text-ink-500 dark:text-ink-400">
                    {s.vintage}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
