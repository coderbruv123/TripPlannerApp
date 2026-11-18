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

export type RouteSegment = {
  type?: string;
  name?: string;
  from?: string | null;
  to?: string | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  geometry?: string | null;
  message?: string | null;
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
  /** Rome2Rio-style leg breakdown when provided by the search backend. */
  segments?: RouteSegment[];
};

export type FlightOption = {
  available: boolean;
  airline?: string | null;
  duration?: number | null;
  /** Backend convenience field; preferred over `duration` when present. */
  durationMinutes?: number | null;
  estimatedPrice?: number | null;
  message?: string | null;
  /** True when values are heuristic estimates, not live fares/schedules. */
  estimated?: boolean;
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

/** Budget breakdown for a saved trip (per-category allocation). */
export type BudgetCategory =
  | "Transport"
  | "Stay"
  | "Food"
  | "Activities"
  | "Shopping"
  | "Other";

/** Fixed category list, shared with the backend. */
export const BUDGET_CATEGORIES: BudgetCategory[] = [
  "Transport",
  "Stay",
  "Food",
  "Activities",
  "Shopping",
  "Other",
];

/** A single planned amount for a category. */
export interface BudgetEntry {
  category: BudgetCategory;
  amount: number;
}

/** Budget breakdown returned by GET /api/trips/{tripId}/budget. */
export interface TripBudget {
  tripId: string;
  categories: Record<BudgetCategory, number>;
}

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

  /** Identity baked into the row so the trip reopens without its URL. */
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  originLabel?: string;
  destinationName?: string;
  destinationCountry?: string;
};
