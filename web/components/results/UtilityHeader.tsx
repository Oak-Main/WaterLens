import Link from "next/link";
import { Pill } from "@/components/ui";
import { formatDate, slugPwsid } from "@/lib/format";
import { epaWaterSystemUrl, publicWaterSystem } from "@/lib/public-water-systems";
import type { WaterSystem } from "@/lib/types";

function primarySourceLabel(code: string | null): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c === "SW" || c === "SWP") return "Surface water";
  if (c === "GW" || c === "GWP") return "Groundwater";
  if (c === "GU") return "Groundwater under surface influence";
  return code;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-100">
        {children}
      </dd>
    </div>
  );
}

export function UtilityHeader({
  utility,
  freshness,
}: {
  utility: WaterSystem;
  freshness: { sdwis_fetched_at: string | null; generated_at: string };
}) {
  const place = [utility.county ? `${utility.county} County` : null, utility.state]
    .filter(Boolean)
    .join(", ");
  const source = primarySourceLabel(utility.primary_source);
  const profile = publicWaterSystem(utility.pwsid);

  return (
    <header className="animate-fade-up" aria-labelledby="utility-heading">
      <p className="text-eyebrow uppercase text-brand-600 dark:text-brand-300">
        Potential water system
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        {/* The page <h1> is the verdict banner; this is the section heading
            beneath it, kept at display weight visually. */}
        <h2 id="utility-heading" className="text-title-1 text-ink-900 dark:text-white">
          {utility.name}
        </h2>
        <Link
          href={profile ? `/pws/${slugPwsid(utility.pwsid)}` : epaWaterSystemUrl(utility.pwsid)}
          className="inline-flex rounded-md"
          aria-label={`View information for water system ${utility.pwsid}`}
        >
          <Pill tone="brand">{utility.pwsid}</Pill>
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {place ? <Field label="Location">{place}</Field> : null}
        {utility.population_served != null ? (
          <Field label="Population served">
            <span className="font-mono">{utility.population_served.toLocaleString("en-US")}</span>
          </Field>
        ) : null}
        {source ? <Field label="Primary source">{source}</Field> : null}
        {freshness.sdwis_fetched_at ? (
          <Field label="Utility data as of">{formatDate(freshness.sdwis_fetched_at)}</Field>
        ) : <Field label="Identity source">EPA ECHO ZIP registry</Field>}
      </dl>
    </header>
  );
}
