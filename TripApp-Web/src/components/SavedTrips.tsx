import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Trash2 } from "lucide-react";

import { listSavedTrips, removeSavedTrip } from "../utils/tripStore";
import { formatSavedRange, travellersLabel } from "../utils/format";
import type { SavedTrip } from "../types/trip";

export default function SavedTrips() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    setTrips(listSavedTrips());
  }, []);

  return (
    <section id="trips" className="mx-auto max-w-[1320px] scroll-mt-24 px-4 py-10 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[21px] font-bold tracking-[-0.02em] text-navy">
            Saved trips
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Stored in this browser. The link re-opens the trip with the same dates,
            travelers and budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-muted">
            {trips.length} saved
          </span>

          <Link
            to="/saved-trips"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-strong"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-line bg-surface px-5 py-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
            <MapPin className="h-5 w-5" />
          </span>

          <p className="mt-3 text-[13.5px] font-semibold text-ink">
            Nothing saved yet
          </p>

          <p className="mx-auto mt-1 max-w-[46ch] text-[12.5px] text-muted">
            Plan a trip above, then hit Save in the trip workspace — it shows up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.slice(0, 6).map((trip) => (
            <article
              key={trip.id}
              className="group flex flex-col rounded-[18px] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-100"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand-50 text-[11px] font-extrabold text-brand-strong">
                  {trip.title.slice(0, 2).toUpperCase()}
                </span>

                <button
                  type="button"
                  onClick={() => setTrips(removeSavedTrip(trip.id))}
                  aria-label={`Remove ${trip.title}`}
                  className="rounded-md p-1.5 text-faint opacity-0 transition hover:bg-danger-50 hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <h3 className="mt-3 text-[14.5px] font-bold text-ink">{trip.title}</h3>
              <p className="text-[12px] text-muted">{trip.country}</p>

              <dl className="mt-3 space-y-1.5 text-[12px] text-body">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-faint" />
                  {formatSavedRange(trip.from, trip.to)}
                </div>

                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-faint" />
                  {travellersLabel(trip.travelers, 0)}
                  {trip.budget ? ` · $${trip.budget} budget` : ""}
                </div>
              </dl>

              <Link
                to={trip.url}
                className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-strong hover:underline"
              >
                Open trip
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
