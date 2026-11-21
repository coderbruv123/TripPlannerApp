import type { DateRange, RouteOption } from "../types/trip";

function ymd(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function routeKind(route: RouteOption): "flight" | "transit" | "driving" | "walking" | "cycling" {
  const key = `${route.type} ${route.name}`.toLowerCase();

  if (key.includes("flight") || key.includes("plane") || key.includes("fly")) return "flight";
  if (key.includes("walk") || key.includes("foot")) return "walking";
  if (key.includes("cycl") || key.includes("bike")) return "cycling";
  if (key.includes("train") || key.includes("rail") || key.includes("bus") || key.includes("coach") || key.includes("transit")) {
    return "transit";
  }

  return "driving";
}

function datePhrase(dates?: DateRange): string {
  if (!dates?.from) return "";

  const from = ymd(dates.from);

  if (dates.to && dates.to.getTime() !== dates.from.getTime()) {
    return ` departing ${from} returning ${ymd(dates.to)}`;
  }

  return ` on ${from}`;
}

/** External search/directions links (no live booking/pricing). */
export function routeSearchUrl(input: {
  route: RouteOption;
  originLabel: string;
  destinationLabel: string;
  dates?: DateRange;
}): string {
  const { route, originLabel, destinationLabel, dates } = input;
  const kind = routeKind(route);
  const origin = encodeURIComponent(originLabel);
  const destination = encodeURIComponent(destinationLabel);

  if (kind === "flight") {
    const query = `Flights from ${originLabel} to ${destinationLabel}${datePhrase(dates)}`;
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&hl=en&curr=USD`;
  }

  if (kind === "transit") {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`;
  }

  if (kind === "walking") {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  }

  if (kind === "cycling") {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=bicycling`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

export function routeSearchLabel(route: RouteOption): string {
  const kind = routeKind(route);

  if (kind === "flight") return "Search flights";
  if (kind === "transit") return "View transit";
  if (kind === "walking") return "View walking route";
  if (kind === "cycling") return "View cycling route";

  return "View driving route";
}

export function flightSearchUrl(input: {
  originLabel: string;
  destinationLabel: string;
  dates?: DateRange;
}): string {
  const query = `Flights from ${input.originLabel} to ${input.destinationLabel}${datePhrase(input.dates)}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&hl=en&curr=USD`;
}

export function staysSearchUrl(input: {
  destinationLabel: string;
  dates?: DateRange;
}): string {
  const query = `Hotels in ${input.destinationLabel}${datePhrase(input.dates)}`;
  return `https://www.google.com/travel/search?q=${encodeURIComponent(query)}`;
}
