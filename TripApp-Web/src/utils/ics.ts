import type { TripPlan } from "../types/trip";

function toIcsDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}${month}${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function escapeText(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/**
 * A minimal, valid calendar file: one all-day event per trip day.
 * Nothing invented — the summary and location are the trip itself.
 */
export function buildTripCalendar(plan: TripPlan): string {
  const start = plan.dates?.from ?? new Date();
  const end = plan.dates?.to ?? start;
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  );

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  const events = Array.from({ length: Math.min(days, 21) }, (_, index) => {
    const date = addDays(start, index);

    return [
      "BEGIN:VEVENT",
      `UID:tripplanner-${date.getTime()}-${index}@local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(date)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(date, 1))}`,
      `SUMMARY:${escapeText(`${plan.destination.name} · day ${index + 1}`)}`,
      `LOCATION:${escapeText(`${plan.destination.name}, ${plan.destination.country}`)}`,
      `DESCRIPTION:${escapeText(
        `${plan.adults} adults, ${plan.children} children · ${plan.interests.join(", ")}`
      )}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripPlanner//Trip//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadCalendar(plan: TripPlan): void {
  const blob = new Blob([buildTripCalendar(plan)], {
    type: "text/calendar;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${plan.destination.name.toLowerCase().replace(/\s+/g, "-")}.ics`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
