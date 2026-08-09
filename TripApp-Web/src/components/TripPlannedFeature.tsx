import {
  CalendarDays,
  Wallet,
  MapPinned,
  ArrowRight,
} from "lucide-react";

export default function TripPlannerFeature() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500">
        <div className="grid items-center gap-10 p-10 lg:grid-cols-2 lg:p-16">
          {/* Left */}
          <div className="text-white">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Smart Travel Planning
            </p>

            <h2 className="text-4xl font-bold leading-tight">
              Plan your perfect trip in minutes.
            </h2>

            <p className="mt-5 max-w-lg text-cyan-100">
              Create itineraries, manage your travel budget, discover
              attractions, and organize every destination in one place.
            </p>

            <button className="mt-8 flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-sky-700 transition hover:scale-105">
              Start Planning
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Right */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/15 p-6 backdrop-blur-md">
              <CalendarDays className="mb-4 h-8 w-8 text-white" />
              <h3 className="font-semibold text-white">
                Trip Itinerary
              </h3>
              <p className="mt-2 text-sm text-cyan-100">
                Organize every day of your journey with an easy planner.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-6 backdrop-blur-md">
              <Wallet className="mb-4 h-8 w-8 text-white" />
              <h3 className="font-semibold text-white">
                Budget Tracker
              </h3>
              <p className="mt-2 text-sm text-cyan-100">
                Stay within budget by tracking expenses as you travel.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-6 backdrop-blur-md">
              <MapPinned className="mb-4 h-8 w-8 text-white" />
              <h3 className="font-semibold text-white">
                Saved Places
              </h3>
              <p className="mt-2 text-sm text-cyan-100">
                Bookmark attractions, restaurants, and hidden gems.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-6 backdrop-blur-md">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80"
                alt="Travel"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}