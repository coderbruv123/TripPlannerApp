import { ArrowRight, CalendarDays, MapPinned, Wallet } from "lucide-react";

import { scrollToPlanner } from "../utils/scrollToPlanner";

export default function TripPlannerFeature() {
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
      <div
        className="overflow-hidden rounded-[24px]"
        style={{
          background:
            "radial-gradient(110% 90% at 85% 0%, #5EEAD4 0%, transparent 55%), linear-gradient(120deg, #0B3A46 0%, #0E5E5A 55%, #0B1B33 100%)",
        }}
      >
        <div className="grid items-center gap-8 p-7 lg:grid-cols-2 lg:p-12">
          <div className="text-white">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A7EFE4]">
              Smart Travel Planning
            </p>

            <h2 className="text-[clamp(1.6rem,3vw,2.15rem)] font-extrabold leading-tight tracking-[-0.02em]">
              Plan your perfect trip in minutes.
            </h2>

            <p className="mt-4 max-w-[46ch] text-[13.5px] leading-relaxed text-[#C7E6E1]">
              Create itineraries, manage your travel budget, discover attractions,
              and organize every destination in one place.
            </p>

            <button
              type="button"
              onClick={scrollToPlanner}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0B4F49] transition hover:bg-[#E7F7F4]"
            >
              Start Planning
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <CalendarDays className="mb-3 h-5 w-5 text-[#8FF5E2]" />
              <h3 className="text-[13.5px] font-bold text-white">Trip Itinerary</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#C7E6E1]">
                Organize every day of your journey with an easy planner.
              </p>
            </div>

            <div className="rounded-[14px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <Wallet className="mb-3 h-5 w-5 text-[#8FF5E2]" />
              <h3 className="text-[13.5px] font-bold text-white">Budget Tracker</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#C7E6E1]">
                Stay within budget by tracking expenses as you travel.
              </p>
            </div>

            <div className="rounded-[14px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <MapPinned className="mb-3 h-5 w-5 text-[#8FF5E2]" />
              <h3 className="text-[13.5px] font-bold text-white">Saved Places</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#C7E6E1]">
                Bookmark attractions, restaurants, and hidden gems.
              </p>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-white/15 bg-white/10">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80"
                alt="Travel"
                loading="lazy"
                width={600}
                height={400}
                className="h-full min-h-[120px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
