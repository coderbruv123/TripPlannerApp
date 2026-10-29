/* Shared trip domain types. Mirrors the shapes returned by
   /api/Destinations, /api/trips/search. */

export type Destination = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type Origin = {
  label: string;
  latitude: number;
  longitude: number;
  kind: "geo" | "city";
};

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type RouteOption = {
  type: string;
  name: string;
  available: boolean;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  estimatedPrice?: number | null;
  provider?: string | null;
  geometry?: string | null;
  message?: string | null;
};

export type FlightOption = {
  available: boolean;
  airline?: string | null;
  duration?: number | null;
  estimatedPrice?: number | null;
  message?: string | null;
};

export type TripSearchResult = {
  routes: RouteOption[];
  flight?: FlightOption | null;
};

export type TripPlan = {
  destination: Destination;
  origin: Origin;
  dates?: DateRange;
  adults: number;
  children: number;
  budget?: string;
  interests: string[];
};

export type AddedStop = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type ItineraryStop = {
  id: string;
  dayIndex: number;
  order: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  kind: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  openingHours: string | null;
  notes: string | null;
};

export type SavedTrip = {
  id: string;
  title: string;
  country: string;
  from?: string;
  to?: string;
  travelers: number;
  budget?: string;
  url: string;
  savedAt: string;
};
