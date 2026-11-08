import Link from "next/link";
import { PAID_OFFERS_ENABLED } from "@/lib/offers";
import { Button, Container } from "@/components/ui";
import { Logo } from "./Logo";
import { DISCLAIMER_MEDICAL } from "@/lib/constants";

const groups = [
  {
    title: "Product",
    links: [
      { href: "/#lookup", label: "Address lookup" },
      { href: "/pws", label: "Water systems" },
      { href: "/registry", label: "Filter Certification Registry" },
      { href: "/contaminants", label: "Contaminant glossary" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/about", label: "About" },
      { href: "/legal", label: "Legal & disclosures" },
    ],
  },
  {
    title: "Data sources",
    links: [
      { href: "/methodology#sources", label: "EPA SDWIS / Envirofacts" },
      { href: "/methodology#sources", label: "TEMM service boundaries" },
      { href: "/registry", label: "NSF / WQA certifications" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface-base">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              Address-level water quality intelligence — objective municipal data
              matched to independently certified filtration.
            </p>
            <Button href="/#lookup" variant="secondary" size="sm" className="mt-5">
              Check my water
            </Button>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                {g.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-600 transition-colors hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The FTC affiliate disclosure and the medical disclaimer live here, so
            they are set at text-sm on ink-600 — legible, not fine print. */}
        <div className="mt-12 border-t border-hairline pt-8">
          <p className="max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            {DISCLAIMER_MEDICAL}
          </p>
          <div className="mt-4 flex flex-col justify-between gap-2 text-sm leading-relaxed text-ink-600 sm:flex-row dark:text-ink-300">
            <span>© {new Date().getFullYear()} WaterQualityLens. All rights reserved.</span>
            <span className="max-w-xl">
              {PAID_OFFERS_ENABLED
                ? "Some hardware links are affiliate placements, disclosed before the links. Commercial ranking never overrides data."
                : "Hardware links go straight to the manufacturers and the lab-test link to SimpleLab; we earn nothing from them. Commercial ranking never overrides data."}
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
