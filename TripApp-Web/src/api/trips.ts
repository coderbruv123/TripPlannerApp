import api from "./axiosInstance";

import type { Origin, Destination, TripSearchResult } from "../types/trip";

export async function searchTrips(
  origin: Pick<Origin, "latitude" | "longitude"> & { label?: string },
  destination: Pick<Destination, "latitude" | "longitude"> & { name?: string }
): Promise<TripSearchResult> {
  const response = await api.post<TripSearchResult>("/trips/search", {
    originLat: origin.latitude,
    originLng: origin.longitude,
    // Display labels help the backend label segment endpoints; ignored if unknown.
    originName: origin.label,
    destinationName: destination.name,
    destinationLat: destination.latitude,
    destinationLng: destination.longitude,
  });

  const routes = Array.isArray(response.data?.routes)
    ? response.data.routes.map((route) => ({
        ...route,
        segments: Array.isArray(route.segments) ? route.segments : undefined,
      }))
    : [];

  return {
    routes,
    flight: response.data?.flight ?? null,
  };
}
