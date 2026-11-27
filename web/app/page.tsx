import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Differentiators } from "@/components/landing/Differentiators";
import { CoverageStats } from "@/components/landing/CoverageStats";
import { EducationTeaser } from "@/components/landing/EducationTeaser";
import { ClosingCta } from "@/components/landing/ClosingCta";

export const metadata: Metadata = {
  title: "WaterQualityLens — What’s in your tap water, and what removes it",
  description:
    "Find a potential public water system through the EPA ZIP registry, follow links to official water records, and browse independent filter certifications.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "WaterQualityLens — Address-level tap water quality intelligence",
    description:
      "Find a potential public water system, official water records, and independent filter certifications.",
    url: "/",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does WaterQualityLens find my water system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We use the EPA ZIP registry to suggest a potential water system. Check your water bill to confirm which system serves the address.",
      },
    },
    {
      "@type": "Question",
      name: "Where does the contaminant data come from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "EPA SDWIS and local water utilities publish water quality records. Verified measurements and violation records are currently unavailable on Tap to Glass.",
      },
    },
    {
      "@type": "Question",
      name: "What does the filter registry show?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The filter registry lists filters by their independent NSF/ANSI certifications and the contaminants those certifications cover.",
      },
    },
    {
      "@type": "Question",
      name: "Does WaterQualityLens make medical claims?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. We report water-system engineering data and hardware certifications. We do not diagnose exposure, predict health outcomes, or provide medical advice.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/*
        Tonal cadence — the sections below the hero deliberately alternate their
        Section `tone` so the page never presents a flat run of identical bands:

          TrustStrip      base     (credibility rule under the hero)
          HowItWorks      sunken
          Differentiators base
          CoverageStats   inverse  (dark data band, wave seam either side)
          EducationTeaser sunken
          ClosingCta      inverse  (dark closing band, wave seam above)

        Reordering or re-toning these will collapse the rhythm — adjust the tones
        together, not one section in isolation.
      */}
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Differentiators />
      <CoverageStats />
      <EducationTeaser />
      <ClosingCta />
    </>
  );
}
