import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";

import { getToken } from "../api/authUtils";
import {
  getSavedTrip,
  listSavedTrips,
  loadSavedTrips,
} from "../utils/tripStore";
import { savedTripUrl } from "../utils/tripUrl";
import type { SavedTrip } from "../types/trip";

/** Resolves legacy `/trip/<slug-or-id>` links into a real trip workspace URL. */
export default function OpenSavedTrip() {
  const { tripId } = useParams<{ tripId: string }>();
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("That trip link is incomplete.");
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        let trip: SavedTrip | null;

        if (getToken()) {
          trip = await getSavedTrip(tripId);
        } else {
          await loadSavedTrips();
          trip = listSavedTrips().find((item) => item.id === tripId) ?? null;
        }

        if (cancelled) return;

        const url = trip ? savedTripUrl(trip) : null;

        if (url) setTarget(url);
        else setError("This saved trip is missing the details needed to reopen it.");
      } catch {
        if (!cancelled) setError("Couldn't open that saved trip. Try again.");
      }
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (target) return <Navigate to={target} replace />;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[560px] px-4 py-24 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand">
          {error ? <MapPin className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </span>

        <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-navy">
          {error ? "Can't open this trip" : "Opening your saved trip…"}
        </h1>

        {error && <p className="mt-2 text-[13.5px] text-muted">{error}</p>}

        <Link
          to="/saved-trips"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-strong"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to saved trips
        </Link>
      </div>
    </div>
  );
}
