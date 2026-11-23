import { api } from './client';
import { isTransientServiceError, toTripSearchError } from './errors';
import type { Destination, Origin, TripSearchResult } from '../types/trip';

const SEARCH_RETRY_DELAY_MS = 800;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function searchTrips(
  origin: Pick<Origin, 'latitude' | 'longitude'> & { label?: string },
  destination: Pick<Destination, 'latitude' | 'longitude'> & { name?: string },
): Promise<TripSearchResult> {
  const payload = {
    originLat: origin.latitude,
    originLng: origin.longitude,
    originName: origin.label,
    destinationName: destination.name,
    destinationLat: destination.latitude,
    destinationLng: destination.longitude,
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await api.post<TripSearchResult>('/trips/search', payload);

      const routes = Array.isArray(response.data?.routes)
        ? response.data.routes.map((route) => ({
            ...route,
            segments: Array.isArray(route.segments) ? route.segments : undefined,
          }))
        : [];

      return { routes, flight: response.data?.flight ?? null };
    } catch (error) {
      if (attempt === 0 && isTransientServiceError(error)) {
        await delay(SEARCH_RETRY_DELAY_MS);
        continue;
      }
      throw toTripSearchError(error);
    }
  }

  throw new Error('Could not load trip results. Please try again.');
}
