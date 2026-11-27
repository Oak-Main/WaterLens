import { Container, Section, Card, Badge, IconTile, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import type { ReactNode } from "react";

function PinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-6.5-5.7-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.3 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6M9 8.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

type Step = {
  n: string;
  title: ReactNode;
  body: ReactNode;
  icon: ReactNode;
  tag: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Enter your address",
    icon: <PinIcon />,
    tag: "ZIP registry",
    body: (
      <>
        We use the EPA ZIP registry to suggest a potential water system. Confirm the utility name on your water bill.
      </>
    ),
  },
  {
    n: "02",
    title: "Find official water quality records",
    icon: <ReportIcon />,
    tag: "Official sources",
    body: (
      <>
        Follow the links to the EPA and utility records for monitoring and compliance information.
      </>
    ),
  },
  {
    n: "03",
    title: "Browse certified filters",
    icon: <FilterIcon />,
    tag: "SKU-level",
    body: (
      <>
        The filter registry lists independent NSF/ANSI certifications by product and contaminant.
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="sunken">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="From an address to official sources"
            lede="Look up a potential system, consult the official record, and explore filter certifications."
          />
        </Reveal>

        <Reveal delay={80}>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <Card as="li" key={step.n} className="flex flex-col p-7">
                <div className="flex items-center justify-between">
                  <IconTile>{step.icon}</IconTile>
                  <span className="font-mono text-sm font-semibold text-ink-500 dark:text-ink-400">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-title-2 text-ink-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  {step.body}
                </p>
                <div className="mt-5">
                  <Badge tone="brand">{step.tag}</Badge>
                </div>
              </Card>
            ))}
          </ol>
        </Reveal>
      </Container>
    </Section>
  );
}
