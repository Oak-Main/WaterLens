import Link from "next/link";
import type { ReactNode } from "react";

// -----------------------------------------------------------------------------
// Shared design-system primitives (see DESIGN.md). Import these everywhere;
// do not re-implement surfaces, badges, or buttons.
// -----------------------------------------------------------------------------

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-content px-6", className)}>
      {children}
    </div>
  );
}

type SectionTone = "base" | "sunken" | "inverse";
type SectionDensity = "tight" | "default" | "loose";

const sectionToneMap: Record<SectionTone, string> = {
  base: "bg-surface-base",
  sunken: "bg-surface-sunken",
  inverse: "on-dark bg-brand-950 text-brand-100",
};

const sectionDensityMap: Record<SectionDensity, string> = {
  tight: "py-10 sm:py-14",
  default: "py-14 sm:py-20",
  loose: "py-20 sm:py-28",
};

export function Section({
  children,
  className,
  id,
  tone = "base",
  density = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: SectionTone;
  density?: SectionDensity;
}) {
  return (
    <section
      id={id}
      className={cx(sectionToneMap[tone], sectionDensityMap[density], className)}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "mb-3 text-eyebrow uppercase text-brand-600 dark:text-brand-300",
        className
      )}
    >
      {children}
    </p>
  );
}

/**
 * The eyebrow + heading + lede triplet, previously hand-written on ~20 pages
 * with drifting sizes and tracking.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  id,
  align = "left",
  tone = "base",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
  align?: "left" | "center";
  tone?: "base" | "inverse";
  className?: string;
}) {
  const inverse = tone === "inverse";
  return (
    <div
      className={cx(
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className
      )}
    >
      {eyebrow ? (
        <Eyebrow className={inverse ? "text-brand-300" : undefined}>{eyebrow}</Eyebrow>
      ) : null}
      <h2
        id={id}
        className={cx("text-title-1", inverse && "text-white dark:text-white")}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cx(
            "mt-4 text-lede",
            inverse ? "text-brand-100" : "text-ink-600 dark:text-ink-300"
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
  /** Only set when the whole card is genuinely a link/target. */
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cx(
        "rounded-2xl bg-surface-raised shadow-card ring-1 ring-ink-900/[0.055] dark:ring-white/10",
        interactive &&
          "transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {children}
    </Tag>
  );
}

type Tone = "brand" | "verdant" | "ink" | "caution";
const toneMap: Record<Tone, string> = {
  brand:
    "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-300/10 dark:text-brand-200 dark:border-brand-300/25",
  verdant:
    "bg-verdant-50 text-verdant-700 border-verdant-200 dark:bg-verdant-300/10 dark:text-verdant-200 dark:border-verdant-300/25",
  ink: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-white/10 dark:text-ink-200 dark:border-white/15",
  caution:
    "bg-caution-50 text-caution-800 border-caution-200 dark:bg-caution-300/10 dark:text-caution-200 dark:border-caution-300/25",
};

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  /** Pass severityChipClass() output to override the tone entirely. */
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className ? className : toneMap[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Pill({
  children,
  tone = "ink",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Thin-line glyph in a tinted tile. Size fixes the radius (concentricity). */
export function IconTile({
  children,
  size = "md",
  tone = "brand",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "verdant" | "ink";
}) {
  const sizes = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-11 w-11 rounded-xl",
    lg: "h-14 w-14 rounded-2xl",
  } as const;
  const tones = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-300/10 dark:text-brand-200",
    verdant:
      "bg-verdant-50 text-verdant-600 dark:bg-verdant-300/10 dark:text-verdant-200",
    ink: "bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200",
  } as const;
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center", sizes[size], tones[tone])}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function Stat({
  value,
  label,
  sub,
  size = "md",
  tone = "base",
}: {
  value: ReactNode;
  label: string;
  sub?: string;
  size?: "sm" | "md" | "lg";
  tone?: "base" | "inverse";
}) {
  const sizes = { sm: "text-xl", md: "text-3xl", lg: "text-4xl" } as const;
  const inverse = tone === "inverse";
  return (
    <div>
      <div
        className={cx(
          "font-mono font-semibold tabular-nums",
          sizes[size],
          inverse ? "text-white" : "text-ink-900 dark:text-white"
        )}
      >
        {value}
      </div>
      <div
        className={cx(
          "mt-1 text-sm font-medium",
          inverse ? "text-brand-100" : "text-ink-700 dark:text-ink-200"
        )}
      >
        {label}
      </div>
      {sub ? (
        <div
          className={cx(
            "mt-0.5 text-xs",
            inverse ? "text-brand-200/85" : "text-ink-500 dark:text-ink-400"
          )}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  /** Renders an <a target="_blank">. */
  external?: boolean;
  /** rel for external links; defaults to unpaid "noopener noreferrer". Pass the offer's rel. */
  rel?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "inverse";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  "aria-label"?: string;
};

const variantMap = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-e1 dark:bg-brand-500 dark:hover:bg-brand-400",
  secondary:
    "bg-surface-raised text-brand-700 border border-brand-200 hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100 dark:text-brand-200 dark:border-brand-300/30 dark:hover:bg-brand-300/10",
  ghost:
    "text-brand-700 hover:bg-brand-50 active:bg-brand-100 dark:text-brand-200 dark:hover:bg-white/10",
  inverse: "bg-white text-brand-800 hover:bg-brand-50 active:bg-brand-100 shadow-e1",
} as const;

const sizeMap = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-base",
} as const;

export function Button({
  children,
  href,
  external,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled,
  fullWidth,
  rel = "noopener noreferrer",
  ...rest
}: ButtonProps) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
    "transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out",
    "active:scale-[0.97] motion-reduce:active:scale-100",
    "disabled:opacity-50 disabled:pointer-events-none",
    sizeMap[size],
    variantMap[variant],
    fullWidth && "w-full",
    className
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel={rel}
          className={cls}
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

/**
 * Provenance tooltip (§13). The trigger is a real <button> so it is reachable by
 * keyboard AND by touch — a hover-only tooltip would put the definition out of
 * reach on the majority of traffic.
 */
export function Tooltip({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex cursor-help items-center border-b border-dotted border-ink-300 text-left font-[inherit] text-[inherit] dark:border-ink-500"
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-64 max-w-[min(16rem,80vw)] -translate-x-1/2 translate-y-1 rounded-lg border border-ink-200 bg-surface-raised p-3 text-left text-xs font-normal leading-relaxed text-ink-700 opacity-0 shadow-lift transition-[opacity,transform] duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:translate-y-0 dark:border-white/15 dark:text-ink-200"
      >
        {content}
      </span>
    </span>
  );
}
