import type { Metadata } from "next";
import AddressSearch from "@/components/AddressSearch";
import { Container, Section } from "@/components/ui";
import { ConfidenceBanner } from "@/components/results/ConfidenceBanner";
import { ContaminantMatrix } from "@/components/results/ContaminantMatrix";
import { Disclaimers } from "@/components/results/Disclaimers";
import { EmptyState } from "@/components/results/EmptyState";
import { FilterCarousel } from "@/components/results/FilterCarousel";
import { NitrateNotice } from "@/components/results/NitrateNotice";
import { ReportActions } from "@/components/results/ReportActions";
import { ReportNav } from "@/components/results/ReportNav";
import { ServiceAreaMap } from "@/components/results/ServiceAreaMap";
import { UtilityHeader } from "@/components/results/UtilityHeader";
import { VerdictBanner } from "@/components/results/VerdictBanner";
import { ViolationsList } from "@/components/results/ViolationsList";
import { MatchTier } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { runLookup } from "@/lib/lookup";
import type { DwellingType } from "@/lib/types";

const MIN_ADDRESS_LENGTH = 5;

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseDwelling(value: string | string[] | undefined): DwellingType {
  const v = firstParam(value);
  if (v === "SINGLE_FAMILY" || v === "MULTI_FAMILY_RENTAL" || v === "UNKNOWN") return v;
  return "UNKNOWN";
}

export async function generateMetadata(
  props: {
    searchParams?: Promise<SearchParams>;
  }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const address = firstParam(searchParams?.address).trim();
  const title = address ? `Water report for ${address}` : "Water report";
  return {
    title,
    description: "Look up a potential water system and find official records.",
    // The results page is dynamic and address-specific; keep it out of the index.
    robots: { index: false, follow: false },
  };
}

export default async function ResultsPage(
  props: {
    searchParams?: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const address = firstParam(searchParams?.address).trim();
  const dwelling = parseDwelling(searchParams?.dwelling_type);

  // --- State 0: no / too-short address — friendly prompt. -------------------
  if (address.length < MIN_ADDRESS_LENGTH) {
    return (
      <Section tone="sunken" density="loose">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow uppercase text-brand-600 dark:text-brand-300">
              Water report
            </p>
            <h1 className="mt-3 text-display-2">Enter an address to see its water report</h1>
            <p className="mx-auto mt-4 max-w-xl text-lede text-ink-600 dark:text-ink-300">
              Lookup can suggest a system where the EPA ZIP registry has coverage. The water systems directory links to official records.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl">
            <AddressSearch variant="compact" initialAddress={address} initialDwelling={dwelling} />
          </div>
        </Container>
      </Section>
    );
  }

  const result = await runLookup(address, dwelling);
  const matched = result.utility != null && result.match.tier !== MatchTier.NONE;
  const hasExceedances = result.detected_contaminants.length > 0;
  const noSamples = result.meta.resolution === "ZIP_REGISTRY";
  const displayAddress = result.query.normalized_address ?? result.query.address;

  if (!matched || !result.utility) {
    return (
      <Section tone="sunken">
        <Container>
          <div className="mb-8 border-b border-hairline pb-8">
            <p className="text-eyebrow uppercase text-ink-500 dark:text-ink-400">Report for</p>
            <h1 className="mt-1 truncate text-title-1">{displayAddress}</h1>
            <div className="mt-5 max-w-xl" data-print-hide>
              <AddressSearch
                variant="compact"
                initialAddress={result.query.address}
                initialDwelling={result.query.dwelling_type}
              />
            </div>
          </div>
          <div className="space-y-10">
            <EmptyState variant="no-match" registryStatus={result.meta.registry_status} />
            <Disclaimers disclaimers={result.disclaimers} />
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <div className="bg-surface-sunken">
      {/* The answer, first. */}
      <Container className="pt-6 sm:pt-8">
        <VerdictBanner result={result} address={displayAddress} />
      </Container>

      <ReportNav
        utilityName={result.utility.name}
        pwsid={result.utility.pwsid}
        exceedances={result.detected_contaminants.length}
        violations={result.active_violations.length}
        filters={result.recommended_filters.length}
      />

      <Section density="tight">
        <Container>
          <div
            className="mb-8 flex flex-col gap-4 border-b border-hairline pb-8 sm:flex-row sm:items-end sm:justify-between"
            data-print-hide
          >
            <div className="min-w-0">
              <p className="text-eyebrow uppercase text-ink-500 dark:text-ink-400">Report for</p>
              <p className="mt-1 truncate text-base font-medium text-ink-800 dark:text-ink-100">
                {displayAddress}
              </p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                Generated {formatDate(result.data_freshness.generated_at)} · engine{" "}
                {result.meta.engine_version}
              </p>
            </div>
            <ReportActions />
          </div>

          <div className="space-y-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              <div className="space-y-6">
                <UtilityHeader utility={result.utility} freshness={result.data_freshness} />
                <ConfidenceBanner
                  match={result.match}
                  multiSystemWarning={result.multi_system_warning}
                />
              </div>
              {result.service_boundary ? (
                <ServiceAreaMap
                  boundary={result.service_boundary}
                  point={result.coordinate}
                  utilityName={result.utility.name}
                />
              ) : null}
            </div>

            {hasExceedances ? (
              <>
                <NitrateNotice warning={result.nitrate_warning} />
                <ContaminantMatrix
                  detections={result.detected_contaminants}
                  history={result.history}
                  violations={result.active_violations}
                  generatedAt={result.data_freshness.generated_at}
                />
              </>
            ) : (
              <EmptyState
                variant={noSamples ? "no-samples" : "clean"}
                utilityName={result.utility.name}
                pwsid={result.utility.pwsid}
              />
            )}

            {!noSamples ? <ViolationsList violations={result.active_violations} /> : null}

            {/* Commercial hardware always follows the objective data (§13). */}
            {!noSamples ? (
              <FilterCarousel
                filters={result.recommended_filters}
                dwelling={result.query.dwelling_type}
              />
            ) : null}

            <Disclaimers disclaimers={result.disclaimers} />
          </div>
        </Container>
      </Section>
    </div>
  );
}
