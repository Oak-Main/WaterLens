import AddressSearch from "@/components/AddressSearch";
import { Container, Eyebrow } from "@/components/ui";
import { HeroPlate } from "./HeroPlate";

const TRUST_CHIPS = [
  "EPA ZIP registry",
  "NSF/ANSI certified hardware only",
  "No account · no paywall",
];

export function Hero() {
  return (
    <section
      id="lookup"
      aria-labelledby="hero-heading"
      className="bg-hero hero-aura relative overflow-hidden scroll-mt-16"
    >
      <div className="bg-grid absolute inset-0" aria-hidden="true" />

      <Container className="relative py-8 sm:py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Copy + the primary action */}
          <div className="lg:col-span-6">
            <div className="stagger">
              <Eyebrow>Public water records</Eyebrow>

              <h1
                id="hero-heading"
                className="max-w-[20ch] text-display-1 text-ink-900 dark:text-white"
              >
                Find your water system
                <span className="block text-brand-600 dark:text-brand-300">
                  and its official records.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:mt-6 sm:text-lede dark:text-ink-300">
                Search by address or ZIP code. EPA registry coverage varies, so confirm your supplier on your water bill.
              </p>

              <div className="glow-brand mt-6 sm:mt-8">
                <AddressSearch variant="hero" align="start" />
              </div>

              <ul
                className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2"
                aria-label="Data sources and access"
              >
                {TRUST_CHIPS.map((chip, i) => (
                  <li key={chip} className="flex items-center gap-3">
                    {i > 0 ? (
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-full bg-ink-300 dark:bg-ink-600"
                      />
                    ) : null}
                    <span className="text-xs font-medium tracking-wide text-ink-500 dark:text-ink-400">
                      {chip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The signature plate */}
          <div className="animate-fade-up lg:col-span-6 lg:pl-6 [animation-delay:300ms]">
            <HeroPlate />
          </div>
        </div>
      </Container>
    </section>
  );
}
