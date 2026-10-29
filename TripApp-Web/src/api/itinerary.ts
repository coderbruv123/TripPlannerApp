import api from "./axiosInstance";

// Itinerary stop entity (exported for use in components).

export interface ItineraryStop {
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
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/trips/saved/{savedTripId}/itinerary - all stops */
export async function fetchItineraryStops(tripId: string): Promise<ItineraryStop[]> {
  const response = await api.get<ItineraryStop[]>(
    `/trips/saved/${tripId}/itinerary`
  );
  return response.data ?? [];
}

/** GET /api/trips/saved/{savedTripId}/itinerary/day/{dayIndex} - day filtered */
export async function fetchDayStops(
  tripId: string,
  dayIndex: number
): Promise<ItineraryStop[]> {
  const response = await api.get<ItineraryStop[]>(
    `/trips/saved/${tripId}/itinerary/day/${dayIndex}`
  );
  return response.data ?? [];
}

/** POST /api/trips/saved/{savedTripId}/itinerary - add a stop */
export async function addItineraryStop(
  tripId: string,
  dto: {
    dayIndex: number;
    order: number;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    kind: string;
    plannedStart: string;
    plannedEnd: string;
    openingHours: string;
    notes: string;
  }
): Promise<ItineraryStop> {
  const response = await api.post<ItineraryStop>(
    `/trips/saved/${tripId}/itinerary`,
    dto
  );
  return response.data!;
}

/** PUT /api/trips/saved/{savedTripId}/itinerary/{stopId} - upsert a stop */
export async function upsertItineraryStop(
  tripId: string,
  stopId: string,
  dto: {
    dayIndex: number;
    order: number;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    kind: string;
    plannedStart: string;
    plannedEnd: string;
    openingHours: string;
    notes: string;
  }
): Promise<ItineraryStop> {
  const response = await api.put<ItineraryStop>(
    `/trips/saved/${tripId}/itinerary/${stopId}`,
    dto
  );
  return response.data!;
}

/** DELETE /api/trips/saved/{savedTripId}/itinerary/{stopId} - remove a stop */
export async function deleteItineraryStop(
  tripId: string,
  stopId: string
): Promise<void> {
  await api.delete(`/trips/saved/${tripId}/itinerary/${stopId}`);
}

/** POST /api/trips/saved/{savedTripId}/itinerary/reorder */
export async function reorderItineraryStops(
  tripId: string,
  orderedIds: string[]
): Promise<void> {
  await api.post(
    `/trips/saved/${tripId}/itinerary/reorder`,
    JSON.stringify({ orderedIds })
  );
}

/** POST /api/trips/saved/{savedTripId}/itinerary/clear */
export async function clearItineraryStops(tripId: string): Promise<void> {
  await api.post(`/trips/saved/${tripId}/itinerary/clear`);
}
