import api from "./axiosInstance";

import type { Origin, Destination, TripSearchResult } from "../types/trip";

export async function searchTrips(
  origin: Pick<Origin, "latitude" | "longitude">,
  destination: Pick<Destination, "latitude" | "longitude">
): Promise<TripSearchResult> {
  const response = await api.post<TripSearchResult>("/trips/search", {
    originLat: origin.latitude,
    originLng: origin.longitude,
    destinationLat: destination.latitude,
    destinationLng: destination.longitude,
  });

  return {
    routes: Array.isArray(response.data?.routes) ? response.data.routes : [],
    flight: response.data?.flight ?? null,
  };
}
