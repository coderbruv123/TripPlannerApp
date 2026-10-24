import { Check, Compass, MapPin, Route } from "lucide-react";

import PlannerCard from "./planner/PlannerCard";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-[1320px] items-start gap-10 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:gap-12 lg:pt-16">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
          <Compass className="h-3.5 w-3.5" />
          Plan a trip
        </span>

        <h1 className="mt-3 text-[clamp(2.2rem,4.2vw,3.25rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-navy">
          Where to next?
        </h1>

        <p className="mt-3 max-w-[46ch] text-[15.5px] leading-relaxed text-body">
          Pick a place, a few dates and a budget. We compare routes, keep the
          itinerary in one place, and say when a fare is missing instead of
          inventing one.
        </p>

        <PlannerCard />

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted">
          {["Free to plan", "No card needed", "Shareable trip links"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-brand" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Decorative art — no remote assets, so the hero never waits on a CDN */}
      <div className="relative hidden min-h-[470px] lg:block" aria-hidden="true">
        <div
          className="absolute inset-x-0 bottom-14 left-6 overflow-hidden rounded-[24px] shadow-[var(--shadow-float)]"
          style={{
            top: 0,
            background:
              "radial-gradient(120% 90% at 80% 0%, #7FD6C9 0%, transparent 55%), radial-gradient(90% 80% at 10% 100%, #0E9384 0%, transparent 60%), linear-gradient(160deg, #0B3A46 0%, #0E5E5A 45%, #0B1B33 100%)",
          }}
        >
          <div
            className="absolute right-12 top-11 h-20 w-20 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 40% 40%, #FFF1C9, #FFD98A 60%, rgba(255,217,138,0) 72%)",
            }}
          />

          <svg
            viewBox="0 0 600 300"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-1/2 w-full"
          >
            <path
              d="M0 230 L90 150 L160 195 L240 110 L330 190 L410 120 L500 185 L600 130 L600 300 L0 300 Z"
              fill="#0B3A46"
              opacity=".55"
            />
            <path
              d="M0 260 L80 205 L150 240 L250 175 L340 235 L430 180 L520 230 L600 195 L600 300 L0 300 Z"
              fill="#072A33"
              opacity=".85"
            />
            <path
              d="M0 285 L110 255 L210 275 L310 245 L420 272 L520 250 L600 268 L600 300 L0 300 Z"
              fill="#04161C"
            />
          </svg>

          <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[19px] font-bold tracking-[-0.02em]">
                One trip, one plan
              </p>
              <p className="text-[12.5px] text-[#C7E6E1]">
                Route · dates · travelers · budget
              </p>
            </div>

            <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              Live routes
            </span>
          </div>
        </div>

        <div className="absolute -left-4 bottom-24 w-[196px] rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-float)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
            Budget guardrails
          </p>

          <p className="mt-0.5 text-[15px] font-bold text-ink">
            Per traveler{" "}
            <span className="text-[11.5px] font-medium text-muted">split</span>
          </p>

          <div className="mt-2 flex h-6 items-end gap-1">
            {[10, 15, 12, 19, 17, 22, 24].map((height, index) => (
              <i
                key={index}
                className={`block w-1.5 rounded-sm ${
                  index < 5 ? "bg-brand-100" : "bg-line"
                }`}
                style={{ height }}
              />
            ))}
          </div>

          <p className="mt-1.5 text-[11.5px] font-semibold text-brand-strong">
            No surprise fares
          </p>
        </div>

        <div className="absolute -right-2 bottom-2 w-[184px] rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-float)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-faint">
            Getting there
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <Route className="h-4 w-4 text-brand" />

            <div>
              <p className="text-[13px] font-bold text-ink">Compare modes</p>
              <p className="text-[11px] text-muted">Time, distance, fare</p>
            </div>
          </div>
        </div>

        <div className="absolute right-10 top-6 flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-[var(--shadow-card)]">
          <MapPin className="h-3.5 w-3.5 text-brand" />
          Any city you can name
        </div>
      </div>
    </section>
  );
}
