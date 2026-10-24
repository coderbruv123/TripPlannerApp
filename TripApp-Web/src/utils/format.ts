import type { DateRange } from "../types/trip";

export function formatDuration(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return "Time unavailable";
  }

  const total = Math.max(1, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

export function formatDistance(km?: number | null): string {
  if (km === null || km === undefined || !Number.isFinite(km)) {
    return "Distance unavailable";
  }

  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Prices arrive as nullable decimals. Render what we actually know:
 * null means the provider gave us no fare — never "From $".
 */
export function formatPrice(
  value?: number | null,
  options: { prefix?: string } = {}
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Fare unavailable";
  }

  if (value === 0) return "Free";

  const rounded =
    value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/0$/, "");

  return `${options.prefix ?? "$"}${rounded}`;
}

export function formatDay(value?: Date | null): string {
  if (!value) return "Date not set";

  return value.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatRange(range?: DateRange): string {
  const from = range?.from;
  const to = range?.to;

  if (!from) return "Add dates";

  const start = from.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  if (!to) return `${start} → …`;

  const end = to.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return `${start} – ${end}`;
}

export function countNights(range?: DateRange): number {
  if (!range?.from || !range?.to) return 0;

  const ms = range.to.getTime() - range.from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function travellersLabel(adults: number, children: number): string {
  const parts = [`${adults} ${adults === 1 ? "adult" : "adults"}`];

  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "child" : "children"}`);
  }

  return parts.join(", ");
}

/** Date range for a saved trip, where dates are stored as YYYY-MM-DD. */
export function formatSavedRange(from?: string, to?: string): string {
  if (!from) return "Dates not set";

  const start = new Date(`${from}T00:00:00`);
  const end = to ? new Date(`${to}T00:00:00`) : null;
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}
