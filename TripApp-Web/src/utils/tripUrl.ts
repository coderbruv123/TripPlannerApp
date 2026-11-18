import type { Destination, Origin, SavedTrip, TripPlan } from "../types/trip";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string | null): Date | undefined {
  if (!value) return undefined;

  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * The whole trip lives in the URL, which makes the page survive a
 * refresh and makes "share trip" a real link instead of a local state.
 */
export function buildTripUrl(plan: TripPlan): string {
  const params = new URLSearchParams();

  params.set("dest", plan.destination.name);
  params.set("country", plan.destination.country);
  params.set("dlat", String(plan.destination.latitude));
  params.set("dlng", String(plan.destination.longitude));

  params.set("origin", plan.origin.label);
  params.set("olat", String(plan.origin.latitude));
  params.set("olng", String(plan.origin.longitude));
  params.set("okind", plan.origin.kind);

  if (plan.dates?.from) params.set("from", toIsoDate(plan.dates.from));
  if (plan.dates?.to) params.set("to", toIsoDate(plan.dates.to));

  params.set("adults", String(plan.adults));
  params.set("children", String(plan.children));

  if (plan.budget?.trim()) params.set("budget", plan.budget.trim());
  if (plan.interests.length > 0) {
    params.set("interests", plan.interests.join(","));
  }

  return `/trip?${params.toString()}`;
}

export function parseTripParams(params: URLSearchParams): TripPlan | null {
  const name = params.get("dest");
  const dlat = Number(params.get("dlat"));
  const dlng = Number(params.get("dlng"));

  if (!name || !Number.isFinite(dlat) || !Number.isFinite(dlng)) {
    return null;
  }

  const destination: Destination = {
    name,
    country: params.get("country") ?? "",
    latitude: dlat,
    longitude: dlng,
  };

  const olat = Number(params.get("olat"));
  const olng = Number(params.get("olng"));

  if (!Number.isFinite(olat) || !Number.isFinite(olng)) {
    return null;
  }

  const origin: Origin = {
    label: params.get("origin") ?? "Starting point",
    latitude: olat,
    longitude: olng,
    kind: params.get("okind") === "geo" ? "geo" : "city",
  };

  const from = fromIsoDate(params.get("from"));
  const to = fromIsoDate(params.get("to"));

  return {
    destination,
    origin,
    dates: from || to ? { from, to } : undefined,
    adults: Math.max(1, toNumber(params.get("adults"), 2)),
    children: Math.max(0, toNumber(params.get("children"), 0)),
    budget: params.get("budget") ?? undefined,
    interests: (params.get("interests") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function numberFrom(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Build a real `/trip?...` link for a saved trip. Older rows can carry a
 * slug-like `url` that the router doesn't know, so we prefer the coordinates
 * stored on the row and only fall back to its URL's query string.
 * Returns null when the row has no usable coordinates (nothing we can reopen).
 */
export function savedTripUrl(trip: SavedTrip): string | null {
  let legacy: URLSearchParams | null = null;

  try {
    const marker = trip.url.indexOf("?");
    if (marker >= 0) legacy = new URLSearchParams(trip.url.slice(marker + 1));
  } catch {
    legacy = null;
  }

  const dlat =
    trip.destinationLat ?? numberFrom(legacy?.get("dlat")) ?? Number.NaN;
  const dlng =
    trip.destinationLng ?? numberFrom(legacy?.get("dlng")) ?? Number.NaN;
  const olat = trip.originLat ?? numberFrom(legacy?.get("olat")) ?? Number.NaN;
  const olng = trip.originLng ?? numberFrom(legacy?.get("olng")) ?? Number.NaN;

  if (![dlat, dlng, olat, olng].every(Number.isFinite)) return null;

  const params = new URLSearchParams();
  params.set("dest", trip.destinationName || trip.title || "Saved trip");
  params.set("country", trip.destinationCountry || trip.country || "");
  params.set("dlat", String(dlat));
  params.set("dlng", String(dlng));
  params.set("origin", trip.originLabel || legacy?.get("origin") || "Starting point");
  params.set("olat", String(olat));
  params.set("olng", String(olng));
  params.set("okind", legacy?.get("okind") === "geo" ? "geo" : "city");

  const from = trip.from?.slice(0, 10) ?? legacy?.get("from");
  const to = trip.to?.slice(0, 10) ?? legacy?.get("to");
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const adults = Math.max(1, trip.travelers || Number(legacy?.get("adults")) || 2);
  params.set("adults", String(adults));
  params.set("children", legacy?.get("children") ?? "0");

  if (trip.budget?.trim()) {
    params.set("budget", trip.budget.trim());
  } else if (legacy?.get("budget")) {
    params.set("budget", legacy.get("budget")!);
  }

  const interests = legacy?.get("interests");
  if (interests) params.set("interests", interests);

  // Lets the workspace resolve the account trip id directly, so the saved
  // budget breakdown loads even if the serialized URL differs slightly.
  if (trip.id) params.set("tripId", trip.id);

  return `/trip?${params.toString()}`;
}
