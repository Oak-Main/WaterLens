# WaterQualityLens — Design System (read before building any page)

The brand is **clinical objectivity** (Build Plan §13). We are the calm, credible
auditor — the opposite of alarmist advocacy sites. Every screen must feel like a
precision instrument, not a scare campaign.

## Non-negotiables (§13, §14)

- **Palette:** muted blues (`brand`), calm teal/green (`verdant`), slate grays
  (`ink`). Amber (`caution`) ONLY for regulatory-threshold reference and the
  Tier-3 mapping-ambiguity banner — and that banner is additionally marked by a
  left rule and a glyph so the signal never depends on hue alone.
  **Never** use alarmist red/black or skull/toxic iconography.
- **Every data point shows provenance.** A contaminant value must surface its
  sample date, testing agency, unit, and the legal MCL. No naked numbers. This
  holds at every breakpoint — a wide table that amputates its provenance columns
  on mobile is a violation, not a tradeoff.
- **Product links are visually delineated** from objective data — distinct
  bounding box, and the disclosure notice sits before the first link. The notice,
  badge, `rel` and legal copy follow `PAID_OFFER_HOSTS` in `lib/offers.ts`: unpaid
  links get the notice "These links go directly to the manufacturers. WaterQualityLens
  earns no commission from them." and the footer and legal copy say they carry no
  affiliate tracking; a paid link gets the commission
  notice and `rel="sponsored"`. "Certification verified" describes the NSF/ANSI
  record, never a commercial relationship. Commercial ranking never precedes
  scientific data.
- **Persistent disclaimers**: the medical-claims disclaimer is always reachable;
  Tier-3 matches show the lab-test recommendation banner.
- **No medical claims** anywhere in copy. We report engineering + certification
  data; we do not diagnose exposure or predict health outcomes.
- **Absence of data is never reported as absence of contamination.** The
  ZIP-registry path holds no sample results; it gets its own empty state that
  says so.

## Theming

Light and dark are both first-class. Surfaces resolve through CSS custom
properties defined once in `app/globals.css`, and Tailwind exposes them as
tokens. **Use the semantic tokens, never a hardcoded surface hex or `bg-white`:**

| Use | Token |
|---|---|
| Page canvas | `bg-surface-base` |
| Recessed band | `bg-surface-sunken` (or `<Section tone="sunken">`) |
| Card / raised | `bg-surface-raised` |
| Hairline border | `border-hairline` |
| Inverse band | `<Section tone="inverse">` + `on-dark` for focus rings |

Text needs an explicit dark counterpart: `text-ink-900 dark:text-white`,
`text-ink-600 dark:text-ink-300`, `text-ink-500 dark:text-ink-400`.

The theme is stamped on `<html data-theme>` before first paint by a bootstrap
script in `app/layout.tsx`. It **always** writes the attribute — resolving from
`localStorage` then `prefers-color-scheme` — because Tailwind's `dark:` variants
key off that attribute; leaving it unset would theme the CSS variables while
every `dark:` utility stayed inert.

## Visual language

- **Type scale** — use the named steps, do not hand-write sizes:
  `text-display-1` (page hero), `text-display-2` (entity h1), `text-title-1`
  (section h2), `text-title-2` (card h3), `text-lede`, `text-eyebrow`.
  Display steps are fluid (`clamp`) and optically tracked.
- **Rhythm:** `<Section density="tight|default|loose">`. Do not hand-write
  section padding — two adjacent hardcoded sections produce 192px voids.
- **Surfaces:** `<Card>` — `rounded-2xl bg-surface-raised shadow-card ring-1`.
  A `ring` at ~5.5% alpha reads more cleanly than a light border. Use
  `interactive` only when the whole card is genuinely a link; a hover lift on a
  non-clickable card is a phantom affordance.
- **Elevation:** `shadow-e1 → shadow-card → shadow-lift → shadow-overlay`.
- **Motion:** restrained. `<Reveal>` for one fade-and-rise per block on scroll,
  `.stagger` for sibling entrance, press states via `active:scale-[0.97]`.
  Everything sits above a global `prefers-reduced-motion` floor. No bounce, no
  parallax gimmicks.
- **Iconography:** thin line icons only, inline SVG (no icon font, no CDN).
- **Graphics:** self-contained inline SVG or CSS only. No remote images, no
  chart libraries. `HeroPlate`, `ServiceAreaMap`, `Sparkline`, `TrendLine` and
  `WaveDivider` are the established vocabulary.

## Accessibility contract (WCAG 2.2 AA)

- **`ink-500` is the lightest permitted text colour**, and only on white or
  `ink-50`. `ink-400` and lighter are border/decoration values — never text.
  (In dark mode `dark:text-ink-300/400` is light-on-dark and is fine.)
- Every `overflow-x-auto` container needs `tabIndex={0} role="region"` and an
  `aria-label`, or keyboard users cannot scroll it.
- Focus rings follow the element's own radius and re-colour on inverse bands via
  `--ring-offset`; never force a radius or a white halo.
- Semantic landmarks, one `<h1>` per page, no skipped heading levels.
- Decorative SVG `aria-hidden`; meaningful SVG `role="img"` + `aria-label`.
- Never encode meaning in colour alone — add a text or glyph qualifier.
- New-tab links state it in their accessible name.
- Async state announces through a live region.

## Shared building blocks (import from `@/components/ui`)

`Container, Section, SectionHeading, Card, Badge, Pill, IconTile, Stat, Tooltip,
Button, Eyebrow` — use these; do not re-implement. `Button` supports
`variant="primary|secondary|ghost|inverse"`, `size="sm|md|lg"`, `external`,
`fullWidth`. `Badge` accepts `tone`, or a `className` override for severity.

Site chrome: `Breadcrumbs` (emits BreadcrumbList JSON-LD from the same array),
`TableOfContents` (sticky rail ≥lg, chip rail below), `WaveDivider`, `Reveal`.

## Severity presentation

Escalation is carried by **weight and inversion, never hue**. Import from
`@/lib/format` and use on every page so the same fact never renders two ways:

```tsx
<Badge className={severityChipClass(d)}>{severityLabel(d)}</Badge>
```

| Level | Treatment |
|---|---|
| Within limits | `verdant` outline chip |
| Above health goal | `brand` tinted outline chip |
| Above federal limit | solid inverted `brand-800` chip |

## Confidence tiers (map to color, never alarm)

| Tier | Label | Tone |
|---|---|---|
| 1 Explicit | "Explicit Boundary" | `verdant` (high confidence) |
| 2 Matched | "Matched Proxy" | `brand` |
| 3 Modeled | "Modeled Radius" | `caution` + left rule + lab-test banner |

## Voice

Plain, exact, unhurried. "Your utility reported lead at 27 µg/L on May 15, 2026 —
above the 15 µg/L federal action level." Never "TOXIC!" Never emoji in product UI.
