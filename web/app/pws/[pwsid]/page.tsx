import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Card, Container, Eyebrow, Section, SectionHeading, Stat } from "@/components/ui";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { DISCLAIMER_PLUMBING } from "@/lib/constants";
import { epaWaterSystemUrl, PUBLIC_WATER_SYSTEMS, publicWaterSystem } from "@/lib/public-water-systems";

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_WATER_SYSTEMS.map(({ pwsid }) => ({ pwsid }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ pwsid: string }> }
): Promise<Metadata> {
  const system = publicWaterSystem((await params).pwsid);
  if (!system) {
    return { title: "Water system not found", robots: { index: false, follow: true } };
  }

  const title = `${system.name} (${system.pwsid})`;
  const description = `Official record links for ${system.name}. Verified measurements and violation records are unavailable on Tap to Glass.`;
  const url = `/pws/${system.pwsid}`;
  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { canonical: url },
    robots: { index: false, follow: true },
  };
}

export default async function PwsPage({ params }: { params: Promise<{ pwsid: string }> }) {
  const system = publicWaterSystem((await params).pwsid);
  if (!system) notFound();

  return (
    <>
      <Section tone="sunken" density="default" className="pb-10">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Water systems", href: "/pws" },
              { label: system.name },
            ]}
          />
          <div className="mt-6 animate-fade-up">
            <Eyebrow>Public water system</Eyebrow>
            <h1 className="text-display-2">{system.name}</h1>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <dt className="sr-only">PWSID</dt>
              <dd><Stat value={<span className="text-2xl">{system.pwsid}</span>} label="EPA system ID" /></dd>
            </div>
            <div>
              <dt className="sr-only">Location</dt>
              <dd><Stat value={<span className="text-2xl">{system.state}</span>} label="State" /></dd>
            </div>
          </dl>
        </Container>
      </Section>

      <Section id="contaminants" density="default">
        <Container>
          <SectionHeading
            title="Verified water quality records unavailable"
            lede="Tap to Glass has no verified measurements, sampling trends, or violation records to display for this system. Check the official records for results, compliance history, and current notices."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={epaWaterSystemUrl(system.pwsid)} variant="primary" size="md">EPA system record</Button>
            <Button href={system.registryUrl} variant="secondary" size="md">Official system information</Button>
            <Button href={system.reportsUrl} variant="secondary" size="md">Utility water quality reports</Button>
          </div>
        </Container>
      </Section>

      <Section id="plumbing" tone="sunken" density="tight">
        <Container>
          <Card className="p-6">
            <h2 className="text-title-2">A note on your home’s plumbing</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {DISCLAIMER_PLUMBING}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/methodology" variant="ghost" size="sm">How we source the data <span aria-hidden="true">→</span></Button>
              <Button href="/pws" variant="ghost" size="sm">All water systems <span aria-hidden="true">→</span></Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
