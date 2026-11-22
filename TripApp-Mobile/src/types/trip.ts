export type Destination = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  type?: string | null;
  kind?: string | null;
  code?: string | null;
  iata?: string | null;
  iataCode?: string | null;
};

export type Origin = {
  label: string;
  latitude: number;
  longitude: number;
  kind: 'geo' | 'city' | 'airport';
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
  segments?: RouteSegment[];
};

export type FlightOption = {
  available: boolean;
  airline?: string | null;
  duration?: number | null;
  durationMinutes?: number | null;
  estimatedPrice?: number | null;
  message?: string | null;
  estimated?: boolean;
};

export type TripSearchResult = {
  routes: RouteOption[];
  flight?: FlightOption | null;
};
