import { api } from './client';
import type { Destination, Origin, TripSearchResult } from '../types/trip';

export async function searchTrips(
  origin: Pick<Origin, 'latitude' | 'longitude'> & { label?: string },
  destination: Pick<Destination, 'latitude' | 'longitude'> & { name?: string },
): Promise<TripSearchResult> {
  const response = await api.post<TripSearchResult>('/trips/search', {
    originLat: origin.latitude,
    originLng: origin.longitude,
    originName: origin.label,
    destinationName: destination.name,
    destinationLat: destination.latitude,
    destinationLng: destination.longitude,
  });

  const routes = Array.isArray(response.data?.routes)
    ? response.data.routes.map((route) => ({ ...route, segments: Array.isArray(route.segments) ? route.segments : undefined }))
    : [];

  return { routes, flight: response.data?.flight ?? null };
}
