import type { Destination, Origin, TripPlan } from "../types/trip";

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
